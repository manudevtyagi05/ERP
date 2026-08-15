const Project = require('../models/Project.model');
const Issue = require('../models/Issue.model');
const ProjectMember = require('../models/ProjectMember.model');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');

/**
 * Batch-fetch PROJECT_LEAD members for a set of project IDs in two queries.
 * Returns { [projectIdString]: [{ id, name, email, department }] }
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

/**
 * List all projects for the company.
 *
 * filter='my'      → projects where `userId` is an active ProjectMember (any role).
 * filter='starred' → starred projects only.
 *
 * Each project is enriched with:
 *   - totalIssues / completedIssues / progress   (live from Issue collection)
 *   - projectLeads: []                            (from ProjectMember with PROJECT_LEAD)
 *   - isMember: boolean                           (is the authenticated user a member?)
 */
async function listProjects(companyId, userId, { search, filter } = {}) {
  const query = { companyId, deletedAt: null };

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { key: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (filter === 'starred') {
    query.star = true;
  }

  // "My Projects": projects where the authenticated user is an active member (any role)
  if (filter === 'my' && userId) {
    const myProjectIds = await ProjectMember.distinct('projectId', {
      companyId,
      userId,
      isActive: true,
    });
    query._id = { $in: myProjectIds };
  }

  const projects = await Project.find(query).sort({ updatedAt: -1 });

  if (!projects.length) return [];

  const projectIds = projects.map((p) => p._id);

  // Run in parallel: issue stats + project leads + my membership set
  const [issueGroups, leadsByProject, myMemberSet] = await Promise.all([
    // Issue stats — one query per project (kept for consistency with original)
    Promise.all(
      projects.map(async (p) => {
        const issues = await Issue.find({
          companyId,
          projectId: p._id,
          deletedAt: null,
        }).select('status');
        const totalIssues = issues.length;
        const completedIssues = issues.filter((i) => i.status === 'DONE').length;
        const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
        return { projectId: p._id.toString(), totalIssues, completedIssues, progress };
      })
    ),
    // Batch project leads
    getLeadsByProjectIds(companyId, projectIds),
    // IDs of projects this user belongs to (for isMember flag on each project)
    userId
      ? ProjectMember.distinct('projectId', { companyId, userId, isActive: true })
      : Promise.resolve([]),
  ]);

  const statsById = new Map(issueGroups.map((s) => [s.projectId, s]));
  const myMemberIds = new Set(myMemberSet.map((id) => id.toString()));

  return projects.map((p) => {
    const pid = p._id.toString();
    const stats = statsById.get(pid) || { totalIssues: 0, completedIssues: 0, progress: 0 };
    return {
      ...p.toSafeJSON(),
      totalIssues: stats.totalIssues,
      completedIssues: stats.completedIssues,
      progress: stats.progress,
      // Authoritative multi-lead list (replaces single project.lead for authorization)
      projectLeads: leadsByProject[pid] || [],
      // Tells the frontend whether the current user is a member of this project
      isMember: myMemberIds.has(pid),
    };
  });
}

async function getProjectByIdOrKey(companyId, idOrKey) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrKey);
  const query = { companyId, deletedAt: null };
  if (isObjectId) {
    query._id = idOrKey;
  } else {
    query.key = idOrKey.toUpperCase();
  }

  const project = await Project.findOne(query);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const issues = await Issue.find({ companyId, projectId: project._id, deletedAt: null }).select('status');
  const totalIssues = issues.length;
  const completedIssues = issues.filter((i) => i.status === 'DONE').length;
  const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  const leadsByProject = await getLeadsByProjectIds(companyId, [project._id]);
  const projectLeads = leadsByProject[project._id.toString()] || [];

  return {
    ...project.toSafeJSON(),
    totalIssues,
    completedIssues,
    progress,
    projectLeads,
  };
}

/**
 * Create a new project.
 *
 * Legacy fields (lead, leadEmail, leadAvatar) are populated for backward compat.
 * Authoritative leadership is established through ProjectMember records.
 *
 * If `projectLeadIds` is provided, ProjectMember records with PROJECT_LEAD are created
 * for each. Otherwise, the creating user becomes the default PROJECT_LEAD.
 */
async function createProject(companyId, payload, user) {
  const key = payload.key.toUpperCase().trim();
  const existing = await Project.findOne({ companyId, key, deletedAt: null });
  if (existing) {
    throw new ApiError(409, `Project key prefix '${key}' is already in use.`);
  }

  // Determine legacy display fields from the first selected lead or creator
  let primaryLeadName = `${user.firstName} ${user.lastName}`;
  let primaryLeadEmail = user.email;
  let primaryLeadAvatar = payload.leadAvatar || '';

  const leadIds = [];

  if (payload.projectLeadIds && payload.projectLeadIds.length > 0) {
    // Validate that all provided lead IDs belong to this company
    const leadUsers = await User.find({
      _id: { $in: payload.projectLeadIds },
      companyId,
      deletedAt: null,
    });
    for (const lu of leadUsers) {
      leadIds.push(lu._id);
    }
    if (leadUsers.length > 0) {
      primaryLeadName = `${leadUsers[0].firstName} ${leadUsers[0].lastName}`;
      primaryLeadEmail = leadUsers[0].email;
    }
  } else if (payload.lead && payload.leadEmail) {
    // Legacy single-lead path: look up by email if possible, else use creator
    const leadUser = await User.findOne({ email: payload.leadEmail, companyId, deletedAt: null });
    if (leadUser) leadIds.push(leadUser._id);
    else leadIds.push(user._id);
    primaryLeadName = payload.lead;
    primaryLeadEmail = payload.leadEmail;
  } else {
    // Default: creator is the project lead
    leadIds.push(user._id);
  }

  const project = await Project.create({
    companyId,
    key,
    name: payload.name.trim(),
    category: payload.category || 'Software Architecture',
    description: payload.description || '',
    // Legacy display fields — kept for backward compat with existing frontend
    lead: primaryLeadName,
    leadEmail: primaryLeadEmail,
    leadAvatar: primaryLeadAvatar,
    avatarBg: payload.avatarBg || '#2563eb',
    status: payload.status || 'Active',
    createdBy: user._id,
  });

  // Create authoritative ProjectMember records for each project lead
  for (const leadId of leadIds) {
    const existingMember = await ProjectMember.findOne({
      companyId,
      projectId: project._id,
      userId: leadId,
    });
    if (!existingMember) {
      await ProjectMember.create({
        companyId,
        projectId: project._id,
        userId: leadId,
        projectRoles: ['PROJECT_LEAD'],
        addedBy: user._id,
      });
    } else if (!existingMember.projectRoles.includes('PROJECT_LEAD')) {
      existingMember.projectRoles = [...existingMember.projectRoles, 'PROJECT_LEAD'];
      existingMember.isActive = true;
      await existingMember.save();
    }
  }

  const leadsByProject = await getLeadsByProjectIds(companyId, [project._id]);

  return {
    ...project.toSafeJSON(),
    totalIssues: 0,
    completedIssues: 0,
    progress: 0,
    projectLeads: leadsByProject[project._id.toString()] || [],
    isMember: true, // creator is always a member
  };
}

async function updateProject(companyId, id, payload, userId) {
  const project = await Project.findOne({ _id: id, companyId, deletedAt: null });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (payload.name) project.name = payload.name.trim();
  if (payload.category) project.category = payload.category;
  if (payload.description !== undefined) project.description = payload.description;
  // Legacy lead fields — still updatable for backward compat
  if (payload.lead) project.lead = payload.lead;
  if (payload.leadEmail) project.leadEmail = payload.leadEmail;
  if (payload.status) project.status = payload.status;
  project.updatedBy = userId;

  await project.save();
  return getProjectByIdOrKey(companyId, id);
}

async function toggleProjectStar(companyId, id) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const query = { companyId, deletedAt: null };
  if (isObjectId) query._id = id;
  else query.key = id.toUpperCase();

  const project = await Project.findOne(query);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  project.star = !project.star;
  await project.save();
  return project.toSafeJSON();
}

async function deleteProject(companyId, id, userId) {
  const project = await Project.findOne({ _id: id, companyId, deletedAt: null });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  project.deletedAt = new Date();
  project.updatedBy = userId;
  await project.save();

  // Soft delete issues
  await Issue.updateMany(
    { companyId, projectId: project._id, deletedAt: null },
    { deletedAt: new Date(), updatedBy: userId }
  );

  return { message: 'Project deleted' };
}

module.exports = {
  listProjects,
  getProjectByIdOrKey,
  createProject,
  updateProject,
  toggleProjectStar,
  deleteProject,
};
