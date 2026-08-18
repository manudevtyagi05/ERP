const Sprint = require('../models/Sprint.model');
const Project = require('../models/Project.model');
const Issue = require('../models/Issue.model');
const AuditLog = require('../models/AuditLog.model');

async function listSprints(req, res) {
  try {
    const { projectId, status } = req.query;
    const filter = { companyId: req.user.companyId };
    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;

    const sprints = await Sprint.find(filter).sort({ createdAt: 1 });
    return res.json({
      success: true,
      data: sprints.map((s) => s.toSafeJSON()),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createSprint(req, res) {
  try {
    const { projectId, name, goal, startDate, endDate } = req.body;
    const project = await Project.findOne({ _id: projectId, companyId: req.user.companyId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const sprint = await Sprint.create({
      companyId: req.user.companyId,
      projectId: project._id,
      projectKey: project.key,
      name,
      goal: goal || '',
      startDate: startDate || null,
      endDate: endDate || null,
      status: 'FUTURE',
      createdBy: req.user._id,
    });

    await AuditLog.create({
      companyId: req.user.companyId,
      projectId: project._id,
      actor: { id: req.user._id, name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email },
      action: 'SPRINT_CREATED',
      objectType: 'Sprint',
      objectId: sprint._id.toString(),
      objectLabel: sprint.name,
    });

    return res.status(201).json({ success: true, data: sprint.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function updateSprint(req, res) {
  try {
    const { id } = req.params;
    const { name, goal, startDate, endDate } = req.body;
    const sprint = await Sprint.findOne({ _id: id, companyId: req.user.companyId });
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }

    if (name) sprint.name = name;
    if (goal !== undefined) sprint.goal = goal;
    if (startDate !== undefined) sprint.startDate = startDate;
    if (endDate !== undefined) sprint.endDate = endDate;

    await sprint.save();
    return res.json({ success: true, data: sprint.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function startSprint(req, res) {
  try {
    const { id } = req.params;
    const { startDate, endDate, goal } = req.body;

    const sprint = await Sprint.findOne({ _id: id, companyId: req.user.companyId });
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }

    // Calculate story points planned
    const issues = await Issue.find({ sprintId: sprint._id, companyId: req.user.companyId });
    const plannedPoints = issues.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);

    sprint.status = 'ACTIVE';
    sprint.startDate = startDate || new Date();
    sprint.endDate = endDate || new Date(Date.now() + 14 * 86400000);
    if (goal) sprint.goal = goal;
    sprint.storyPointsPlanned = plannedPoints;
    await sprint.save();

    await AuditLog.create({
      companyId: req.user.companyId,
      projectId: sprint.projectId,
      actor: { id: req.user._id, name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email },
      action: 'SPRINT_STARTED',
      objectType: 'Sprint',
      objectId: sprint._id.toString(),
      objectLabel: sprint.name,
      details: { plannedPoints, issueCount: issues.length },
    });

    return res.json({ success: true, data: sprint.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function completeSprint(req, res) {
  try {
    const { id } = req.params;
    const { targetSprintId, moveToBacklog } = req.body;

    const sprint = await Sprint.findOne({ _id: id, companyId: req.user.companyId });
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }

    const issues = await Issue.find({ sprintId: sprint._id, companyId: req.user.companyId });
    const completedIssues = issues.filter((i) => i.status === 'DONE');
    const incompleteIssues = issues.filter((i) => i.status !== 'DONE');

    const donePoints = completedIssues.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);

    sprint.status = 'CLOSED';
    sprint.completedAt = new Date();
    sprint.storyPointsDone = donePoints;
    await sprint.save();

    // Roll incomplete issues over to target sprint or back to backlog
    if (incompleteIssues.length > 0) {
      const targetSprint = targetSprintId
        ? await Sprint.findOne({ _id: targetSprintId, companyId: req.user.companyId })
        : null;

      const newSprintId = targetSprint ? targetSprint._id : null;

      await Issue.updateMany(
        { _id: { $in: incompleteIssues.map((i) => i._id) } },
        { $set: { sprintId: newSprintId } }
      );
    }

    await AuditLog.create({
      companyId: req.user.companyId,
      projectId: sprint.projectId,
      actor: { id: req.user._id, name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email },
      action: 'SPRINT_COMPLETED',
      objectType: 'Sprint',
      objectId: sprint._id.toString(),
      objectLabel: sprint.name,
      details: {
        completedIssues: completedIssues.length,
        incompleteIssues: incompleteIssues.length,
        donePoints,
      },
    });

    return res.json({
      success: true,
      data: sprint.toSafeJSON(),
      message: `Sprint completed. ${completedIssues.length} issues resolved, ${incompleteIssues.length} issues moved.`,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteSprint(req, res) {
  try {
    const { id } = req.params;
    const sprint = await Sprint.findOne({ _id: id, companyId: req.user.companyId });
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }

    // Move associated issues to backlog
    await Issue.updateMany({ sprintId: sprint._id }, { $set: { sprintId: null } });
    await Sprint.deleteOne({ _id: sprint._id });

    return res.json({ success: true, message: 'Sprint deleted successfully' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function getBacklog(req, res) {
  try {
    const { id: projectId } = req.params;
    const project = await Project.findOne({ _id: projectId, companyId: req.user.companyId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const [sprints, issues] = await Promise.all([
      Sprint.find({ companyId: req.user.companyId, projectId, status: { $ne: 'CLOSED' } }).sort({ createdAt: 1 }),
      Issue.find({ companyId: req.user.companyId, projectId }).sort({ order: 1, createdAt: 1 }),
    ]);

    const issuesBySprintId = new Map();
    const backlogIssues = [];

    for (const issue of issues) {
      const safe = issue.toSafeJSON();
      const sprintIdStr = issue.sprintId ? issue.sprintId.toString() : null;
      if (!sprintIdStr) {
        backlogIssues.push(safe);
      } else {
        if (!issuesBySprintId.has(sprintIdStr)) issuesBySprintId.set(sprintIdStr, []);
        issuesBySprintId.get(sprintIdStr).push(safe);
      }
    }

    return res.json({
      success: true,
      data: {
        sprints: sprints.map((s) => ({
          ...s.toSafeJSON(),
          issues: issuesBySprintId.get(s._id.toString()) || [],
        })),
        backlog: backlogIssues,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  listSprints,
  createSprint,
  updateSprint,
  startSprint,
  completeSprint,
  deleteSprint,
  getBacklog,
};
