const ProjectMember = require('../models/ProjectMember.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');

async function assertProjectExists(companyId, projectId) {
  const project = await Project.findOne({ _id: projectId, companyId, deletedAt: null });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
}

function toMemberJSON(member, user) {
  return {
    id: member._id.toString(),
    projectId: member.projectId.toString(),
    projectRole: member.projectRole,
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

  const members = await ProjectMember.find({ companyId, projectId, isActive: true }).sort({ createdAt: 1 });
  const userIds = members.map((m) => m.userId);
  const users = await User.find({ _id: { $in: userIds } });
  const userById = new Map(users.map((u) => [u._id.toString(), u]));

  return members.map((m) => toMemberJSON(m, userById.get(m.userId.toString())));
}

async function addMember(companyId, projectId, { userId, projectRole }, addedBy) {
  await assertProjectExists(companyId, projectId);

  const staff = await User.findOne({ _id: userId, companyId, deletedAt: null });
  if (!staff) {
    throw new ApiError(404, 'Staff member not found');
  }

  let member = await ProjectMember.findOne({ companyId, projectId, userId });
  if (member && member.isActive) {
    throw new ApiError(409, 'This person is already a member of the project');
  }

  if (member) {
    member.isActive = true;
    member.projectRole = projectRole || member.projectRole;
    member.addedBy = addedBy;
    await member.save();
  } else {
    member = await ProjectMember.create({
      companyId,
      projectId,
      userId,
      projectRole: projectRole || 'MEMBER',
      addedBy,
    });
  }

  return toMemberJSON(member, staff);
}

async function updateMemberRole(companyId, projectId, memberId, projectRole) {
  const member = await ProjectMember.findOne({ _id: memberId, companyId, projectId, isActive: true });
  if (!member) {
    throw new ApiError(404, 'Project member not found');
  }

  member.projectRole = projectRole;
  await member.save();

  const staff = await User.findById(member.userId);
  return toMemberJSON(member, staff);
}

async function removeMember(companyId, projectId, memberId) {
  const member = await ProjectMember.findOne({ _id: memberId, companyId, projectId, isActive: true });
  if (!member) {
    throw new ApiError(404, 'Project member not found');
  }

  member.isActive = false;
  await member.save();
}

module.exports = { listMembers, addMember, updateMemberRole, removeMember };
