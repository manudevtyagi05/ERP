const ProjectMember = require('../models/ProjectMember.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const { PROJECT_ROLES } = require('../models/ProjectMember.model');

/**
 * Legacy → new role mapping used for backward-compat on incoming API requests
 * and for the one-time data migration.
 *
 * IMPORTANT — MEMBER is mapped to VIEWER (not DEVELOPER).
 * We cannot safely assume that every MEMBER record is a developer.
 * Admins/leads can re-assign roles to correct values post-migration.
 */
const LEGACY_ROLE_MAP = {
  OWNER: 'PROJECT_LEAD',
  MANAGER: 'PROJECT_LEAD',
  VIEWER: 'VIEWER',
  MEMBER: 'VIEWER', // safe neutral default — do NOT assume DEVELOPER
};

/**
 * Normalises a roles input into a validated, deduplicated array of project roles.
 * Accepts:
 *   - undefined / null   → ['VIEWER']
 *   - string             → legacy single role, mapped through LEGACY_ROLE_MAP
 *   - string[]           → validated array of new role values
 */
function normalizeRoles(input) {
  if (!input) return ['VIEWER'];

  // Legacy single string (old projectRole field)
  if (typeof input === 'string') {
    const mapped = LEGACY_ROLE_MAP[input] || input;
    if (!PROJECT_ROLES.includes(mapped)) {
      throw new ApiError(422, 'Validation failed', {
        projectRoles: `Invalid project role: '${input}'`,
      });
    }
    return [mapped];
  }

  // Array input
  if (Array.isArray(input)) {
    if (input.length === 0) return ['VIEWER'];
    const invalid = input.filter((r) => !PROJECT_ROLES.includes(r));
    if (invalid.length > 0) {
      throw new ApiError(422, 'Validation failed', {
        projectRoles: `Invalid project roles: ${invalid.join(', ')}. Allowed: ${PROJECT_ROLES.join(', ')}`,
      });
    }
    return [...new Set(input)]; // deduplicate
  }

  return ['VIEWER'];
}

async function assertProjectExists(companyId, projectId) {
  const project = await Project.findOne({ _id: projectId, companyId, deletedAt: null });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
}

function toMemberJSON(member, user) {
  const projectRoles = member.projectRoles || [];
  return {
    id: member._id.toString(),
    projectId: member.projectId.toString(),
    // New canonical field
    projectRoles,
    // Legacy backward-compat alias — first role in the array
    projectRole: projectRoles.length > 0 ? projectRoles[0] : 'VIEWER',
    isActive: member.isActive,
    joinedAt: member.createdAt,
    user: user
      ? {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          department: user.department,
        }
      : null,
  };
}

async function listMembers(companyId, projectId) {
  await assertProjectExists(companyId, projectId);

  const members = await ProjectMember.find({ companyId, projectId, isActive: true }).sort({
    createdAt: 1,
  });
  const userIds = members.map((m) => m.userId);
  const users = await User.find({ _id: { $in: userIds } });
  const userById = new Map(users.map((u) => [u._id.toString(), u]));

  return members.map((m) => toMemberJSON(m, userById.get(m.userId.toString())));
}

/**
 * Add a member to a project.
 * Accepts new `projectRoles: string[]` or legacy `projectRole: string` — both are normalised.
 * Tenant isolation: userId is verified to belong to the same company as the project.
 */
async function addMember(companyId, projectId, { userId, projectRoles: rolesInput, projectRole }, addedBy) {
  await assertProjectExists(companyId, projectId);

  // Tenant check — user must belong to the same company
  const staff = await User.findOne({ _id: userId, companyId, deletedAt: null });
  if (!staff) {
    throw new ApiError(404, 'Staff member not found in your organisation');
  }

  // Resolve and validate roles (accepts both new array and legacy string)
  const projectRoles = normalizeRoles(rolesInput || projectRole);

  let member = await ProjectMember.findOne({ companyId, projectId, userId });
  if (member && member.isActive) {
    throw new ApiError(409, 'This person is already a member of the project');
  }

  if (member) {
    // Re-activate soft-removed member
    member.isActive = true;
    member.projectRoles = projectRoles;
    member.addedBy = addedBy;
    await member.save();
  } else {
    member = await ProjectMember.create({
      companyId,
      projectId,
      userId,
      projectRoles,
      addedBy,
    });
  }

  return toMemberJSON(member, staff);
}

/**
 * Update the project roles for an existing member.
 * Accepts new `projectRoles: string[]` or legacy `projectRole: string`.
 */
async function updateMemberRoles(companyId, projectId, memberId, rolesInput) {
  const member = await ProjectMember.findOne({
    _id: memberId,
    companyId,
    projectId,
    isActive: true,
  });
  if (!member) {
    throw new ApiError(404, 'Project member not found');
  }

  member.projectRoles = normalizeRoles(rolesInput);
  await member.save();

  const staff = await User.findById(member.userId);
  return toMemberJSON(member, staff);
}

async function removeMember(companyId, projectId, memberId) {
  const member = await ProjectMember.findOne({
    _id: memberId,
    companyId,
    projectId,
    isActive: true,
  });
  if (!member) {
    throw new ApiError(404, 'Project member not found');
  }

  member.isActive = false;
  await member.save();
}

/**
 * Returns true if the given user is an active PROJECT_LEAD of the specified project.
 * Used internally for authorization checks.
 */
async function isProjectLead(companyId, projectId, userId) {
  const member = await ProjectMember.findOne({
    companyId,
    projectId,
    userId,
    isActive: true,
    projectRoles: 'PROJECT_LEAD',
  });
  return Boolean(member);
}

/**
 * Batch-fetch project leads for multiple projects in two queries.
 * Returns a map: projectId (string) → array of { id, name, email, department }
 */
async function getLeadsByProjectIds(companyId, projectIds) {
  if (!projectIds || !projectIds.length) return {};

  const leadMembers = await ProjectMember.find({
    companyId,
    projectId: { $in: projectIds },
    projectRoles: 'PROJECT_LEAD',
    isActive: true,
  }).lean();

  if (!leadMembers.length) return {};

  const userIds = [...new Set(leadMembers.map((m) => m.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const result = {};
  for (const m of leadMembers) {
    const pid = m.projectId.toString();
    const u = userMap.get(m.userId.toString());
    if (u) {
      if (!result[pid]) result[pid] = [];
      result[pid].push({
        id: u._id.toString(),
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        department: u.department || null,
      });
    }
  }
  return result;
}

module.exports = {
  listMembers,
  addMember,
  updateMemberRoles,
  // Backward-compat alias — old callers passing a single projectRole string still work
  updateMemberRole: (companyId, projectId, memberId, projectRole) =>
    updateMemberRoles(companyId, projectId, memberId, projectRole),
  removeMember,
  isProjectLead,
  getLeadsByProjectIds,
};
