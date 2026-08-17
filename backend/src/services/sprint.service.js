const Sprint = require('../models/Sprint.model');
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

function progressFromIssues(issues) {
  const totalIssues = issues.length;
  const completedIssues = issues.filter((i) => i.status === 'DONE').length;
  const totalPoints = issues.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
  const completedPoints = issues
    .filter((i) => i.status === 'DONE')
    .reduce((acc, i) => acc + (i.storyPoints || 0), 0);

  return {
    totalIssues,
    completedIssues,
    totalPoints,
    completedPoints,
    progress: totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0,
  };
}

async function withProgress(companyId, sprint) {
  const issues = await Issue.find({ companyId, sprintId: sprint._id, deletedAt: null });
  return { ...sprint.toSafeJSON(), ...progressFromIssues(issues) };
}

async function getSprintOr404(companyId, projectId, sprintId) {
  const sprint = await Sprint.findOne({ _id: sprintId, companyId, projectId, deletedAt: null });
  if (!sprint) {
    throw new ApiError(404, 'Sprint not found');
  }
  return sprint;
}

async function listSprints(companyId, projectId) {
  await assertProjectExists(companyId, projectId);

  const sprints = await Sprint.find({ companyId, projectId, deletedAt: null }).sort({
    position: 1,
    createdAt: 1,
  });

  return Promise.all(sprints.map((s) => withProgress(companyId, s)));
}

async function createSprint(companyId, projectId, payload, userId) {
  await assertProjectExists(companyId, projectId);

  const count = await Sprint.countDocuments({ companyId, projectId, deletedAt: null });

  const sprint = await Sprint.create({
    companyId,
    projectId,
    name: payload.name.trim(),
    goal: payload.goal || '',
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    position: count,
    createdBy: userId,
  });

  return withProgress(companyId, sprint);
}

async function updateSprint(companyId, projectId, sprintId, payload, userId) {
  const sprint = await getSprintOr404(companyId, projectId, sprintId);
  if (sprint.status === 'COMPLETED') {
    throw new ApiError(400, 'Completed sprints cannot be edited');
  }

  if (payload.name) sprint.name = payload.name.trim();
  if (payload.goal !== undefined) sprint.goal = payload.goal;
  if (payload.startDate !== undefined) sprint.startDate = payload.startDate;
  if (payload.endDate !== undefined) sprint.endDate = payload.endDate;
  sprint.updatedBy = userId;

  await sprint.save();
  return withProgress(companyId, sprint);
}

async function deleteSprint(companyId, projectId, sprintId, userId) {
  const sprint = await getSprintOr404(companyId, projectId, sprintId);
  if (sprint.status === 'ACTIVE') {
    throw new ApiError(400, 'Complete the active sprint before deleting it');
  }

  sprint.deletedAt = new Date();
  sprint.updatedBy = userId;
  await sprint.save();

  // Unlink issues rather than leaving a dangling sprintId reference
  await Issue.updateMany(
    { companyId, sprintId: sprint._id, deletedAt: null },
    { $set: { sprintId: null } }
  );
}

async function startSprint(companyId, projectId, sprintId, payload, userId) {
  const sprint = await getSprintOr404(companyId, projectId, sprintId);
  if (sprint.status !== 'PLANNING') {
    throw new ApiError(400, 'Only a sprint in planning can be started');
  }

  const activeSprint = await Sprint.findOne({ companyId, projectId, status: 'ACTIVE', deletedAt: null });
  if (activeSprint) {
    throw new ApiError(400, `Sprint "${activeSprint.name}" is already active. Complete it first.`);
  }

  if (payload?.startDate) sprint.startDate = payload.startDate;
  if (payload?.endDate) sprint.endDate = payload.endDate;
  sprint.status = 'ACTIVE';
  sprint.startedAt = new Date();
  sprint.updatedBy = userId;

  await sprint.save();
  return withProgress(companyId, sprint);
}

async function completeSprint(companyId, projectId, sprintId, payload, user) {
  const sprint = await getSprintOr404(companyId, projectId, sprintId);
  if (sprint.status !== 'ACTIVE') {
    throw new ApiError(400, 'Only an active sprint can be completed');
  }

  const moveToSprintId = payload?.moveTo && payload.moveTo !== 'backlog' ? payload.moveTo : null;
  if (moveToSprintId) {
    await getSprintOr404(companyId, projectId, moveToSprintId);
  }

  const incompleteIssues = await Issue.find({
    companyId,
    sprintId: sprint._id,
    status: { $ne: 'DONE' },
    deletedAt: null,
  });

  const actor = {
    id: user._id.toString(),
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
  };

  await Promise.all(
    incompleteIssues.map((issue) => {
      issue.sprintId = moveToSprintId;
      issue.activity.push({
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'SPRINT_CHANGED',
        message: moveToSprintId
          ? 'Moved to the next sprint after sprint completion'
          : 'Moved back to the backlog after sprint completion',
        actor,
        createdAt: new Date().toISOString(),
      });
      return issue.save();
    })
  );

  sprint.status = 'COMPLETED';
  sprint.completedAt = new Date();
  sprint.updatedBy = user._id;
  await sprint.save();

  return withProgress(companyId, sprint);
}

async function getBacklog(companyId, projectId) {
  await assertProjectExists(companyId, projectId);

  const [sprints, issues] = await Promise.all([
    Sprint.find({ companyId, projectId, deletedAt: null, status: { $ne: 'COMPLETED' } }).sort({
      position: 1,
      createdAt: 1,
    }),
    Issue.find({ companyId, projectId, deletedAt: null }).sort({ backlogOrder: 1, createdAt: 1 }),
  ]);

  const issuesBySprintId = new Map();
  const backlogIssues = [];

  for (const issue of issues) {
    const safe = issue.toSafeJSON();
    const key = issue.sprintId ? issue.sprintId.toString() : null;
    if (key === null) {
      backlogIssues.push(safe);
      continue;
    }
    if (!issuesBySprintId.has(key)) issuesBySprintId.set(key, []);
    issuesBySprintId.get(key).push(safe);
  }

  return {
    sprints: sprints.map((sprint) => {
      const sprintIssues = issuesBySprintId.get(sprint._id.toString()) || [];
      return { ...sprint.toSafeJSON(), ...progressFromIssues(sprintIssues), issues: sprintIssues };
    }),
    backlog: backlogIssues,
  };
}

module.exports = {
  listSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
  getBacklog,
};
