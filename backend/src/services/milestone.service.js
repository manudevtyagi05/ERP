const Milestone = require('../models/Milestone.model');
const Issue = require('../models/Issue.model');
const Project = require('../models/Project.model');
const ApiError = require('../utils/ApiError');

async function assertProjectExists(companyId, projectId) {
  const project = await Project.findOne({ _id: projectId, companyId, deletedAt: null });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
}

async function withProgress(companyId, milestone) {
  const issues = await Issue.find({ companyId, milestoneId: milestone._id, deletedAt: null });
  const totalIssues = issues.length;
  const completedIssues = issues.filter((i) => i.status === 'DONE').length;

  return {
    ...milestone.toSafeJSON(),
    totalIssues,
    completedIssues,
    progress: totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0,
  };
}

async function listMilestones(companyId, projectId) {
  await assertProjectExists(companyId, projectId);

  const milestones = await Milestone.find({ companyId, projectId, deletedAt: null }).sort({
    position: 1,
    dueDate: 1,
  });

  return Promise.all(milestones.map((m) => withProgress(companyId, m)));
}

async function createMilestone(companyId, projectId, payload, userId) {
  await assertProjectExists(companyId, projectId);

  const count = await Milestone.countDocuments({ companyId, projectId, deletedAt: null });

  const milestone = await Milestone.create({
    companyId,
    projectId,
    name: payload.name.trim(),
    description: payload.description || '',
    startDate: payload.startDate || null,
    dueDate: payload.dueDate || null,
    status: payload.status || 'PLANNED',
    position: count,
    createdBy: userId,
  });

  return withProgress(companyId, milestone);
}

async function updateMilestone(companyId, projectId, milestoneId, payload, userId) {
  const milestone = await Milestone.findOne({ _id: milestoneId, companyId, projectId, deletedAt: null });
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  if (payload.name) milestone.name = payload.name.trim();
  if (payload.description !== undefined) milestone.description = payload.description;
  if (payload.startDate !== undefined) milestone.startDate = payload.startDate;
  if (payload.dueDate !== undefined) milestone.dueDate = payload.dueDate;
  if (payload.status) milestone.status = payload.status;
  milestone.updatedBy = userId;

  await milestone.save();
  return withProgress(companyId, milestone);
}

async function deleteMilestone(companyId, projectId, milestoneId, userId) {
  const milestone = await Milestone.findOne({ _id: milestoneId, companyId, projectId, deletedAt: null });
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  milestone.deletedAt = new Date();
  milestone.updatedBy = userId;
  await milestone.save();

  // Unlink issues rather than leaving a dangling milestoneId reference
  await Issue.updateMany(
    { companyId, milestoneId: milestone._id, deletedAt: null },
    { $set: { milestoneId: null } }
  );
}

module.exports = { listMilestones, createMilestone, updateMilestone, deleteMilestone };
