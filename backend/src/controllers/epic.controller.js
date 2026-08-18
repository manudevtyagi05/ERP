const Epic = require('../models/Epic.model');
const Project = require('../models/Project.model');
const Issue = require('../models/Issue.model');
const AuditLog = require('../models/AuditLog.model');

async function listEpics(req, res) {
  try {
    const { projectId } = req.query;
    const filter = { companyId: req.user.companyId };
    if (projectId) filter.projectId = projectId;

    const epics = await Epic.find(filter).sort({ createdAt: -1 });

    // Populate issue progress for each epic
    const epicsWithStats = await Promise.all(
      epics.map(async (epic) => {
        const issues = await Issue.find({ epicId: epic._id, companyId: req.user.companyId });
        const completedCount = issues.filter((i) => i.status === 'DONE').length;
        const totalPoints = issues.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);
        const completedPoints = issues
          .filter((i) => i.status === 'DONE')
          .reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);

        return {
          ...epic.toSafeJSON(),
          issueCount: issues.length,
          completedIssueCount: completedCount,
          totalPoints,
          completedPoints,
          progress: issues.length > 0 ? Math.round((completedCount / issues.length) * 100) : 0,
        };
      })
    );

    return res.json({ success: true, data: epicsWithStats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createEpic(req, res) {
  try {
    const { projectId, name, summary, description, color, startDate, targetDate, owner } = req.body;
    const project = await Project.findOne({ _id: projectId, companyId: req.user.companyId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const epic = await Epic.create({
      companyId: req.user.companyId,
      projectId: project._id,
      projectKey: project.key,
      name,
      summary: summary || name,
      description: description || '',
      color: color || '#7c3aed',
      startDate: startDate || null,
      targetDate: targetDate || null,
      owner: owner || {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
      },
      createdBy: req.user._id,
    });

    await AuditLog.create({
      companyId: req.user.companyId,
      projectId: project._id,
      actor: { id: req.user._id, name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email },
      action: 'EPIC_CREATED',
      objectType: 'Epic',
      objectId: epic._id.toString(),
      objectLabel: epic.name,
    });

    return res.status(201).json({ success: true, data: epic.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function updateEpic(req, res) {
  try {
    const { id } = req.params;
    const { name, summary, description, color, status, startDate, targetDate, owner } = req.body;
    const epic = await Epic.findOne({ _id: id, companyId: req.user.companyId });
    if (!epic) {
      return res.status(404).json({ success: false, message: 'Epic not found' });
    }

    if (name) epic.name = name;
    if (summary !== undefined) epic.summary = summary;
    if (description !== undefined) epic.description = description;
    if (color) epic.color = color;
    if (status) epic.status = status;
    if (startDate !== undefined) epic.startDate = startDate;
    if (targetDate !== undefined) epic.targetDate = targetDate;
    if (owner) epic.owner = owner;

    await epic.save();
    return res.json({ success: true, data: epic.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteEpic(req, res) {
  try {
    const { id } = req.params;
    const epic = await Epic.findOne({ _id: id, companyId: req.user.companyId });
    if (!epic) {
      return res.status(404).json({ success: false, message: 'Epic not found' });
    }

    await Issue.updateMany({ epicId: epic._id }, { $set: { epicId: null, epic: '' } });
    await Epic.deleteOne({ _id: epic._id });

    return res.json({ success: true, message: 'Epic deleted successfully' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  listEpics,
  createEpic,
  updateEpic,
  deleteEpic,
};
