const Release = require('../models/Release.model');
const Project = require('../models/Project.model');
const Issue = require('../models/Issue.model');
const AuditLog = require('../models/AuditLog.model');

async function listReleases(req, res) {
  try {
    const { projectId } = req.query;
    const filter = { companyId: req.user.companyId };
    if (projectId) filter.projectId = projectId;

    const releases = await Release.find(filter).sort({ releaseDate: 1, createdAt: -1 });

    const releasesWithStats = await Promise.all(
      releases.map(async (release) => {
        const issues = await Issue.find({
          fixVersionIds: release._id.toString(),
          companyId: req.user.companyId,
        });

        const completedCount = issues.filter((i) => i.status === 'DONE').length;
        const inProgressCount = issues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW').length;
        const todoCount = issues.filter((i) => i.status === 'TODO' || i.status === 'BACKLOG').length;

        const totalPoints = issues.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);
        const donePoints = issues
          .filter((i) => i.status === 'DONE')
          .reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);

        return {
          ...release.toSafeJSON(),
          issuesCount: issues.length,
          completedCount,
          inProgressCount,
          todoCount,
          totalPoints,
          donePoints,
          progress: issues.length > 0 ? Math.round((completedCount / issues.length) * 100) : 0,
        };
      })
    );

    return res.json({ success: true, data: releasesWithStats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createRelease(req, res) {
  try {
    const { projectId, name, description, startDate, releaseDate } = req.body;
    const project = await Project.findOne({ _id: projectId, companyId: req.user.companyId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const release = await Release.create({
      companyId: req.user.companyId,
      projectId: project._id,
      projectKey: project.key,
      name,
      description: description || '',
      startDate: startDate || null,
      releaseDate: releaseDate || null,
      status: 'UNRELEASED',
      createdBy: req.user._id,
    });

    await AuditLog.create({
      companyId: req.user.companyId,
      projectId: project._id,
      actor: { id: req.user._id, name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email },
      action: 'RELEASE_CREATED',
      objectType: 'Release',
      objectId: release._id.toString(),
      objectLabel: release.name,
    });

    return res.status(201).json({ success: true, data: release.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function updateRelease(req, res) {
  try {
    const { id } = req.params;
    const { name, description, startDate, releaseDate, status } = req.body;
    const release = await Release.findOne({ _id: id, companyId: req.user.companyId });
    if (!release) {
      return res.status(404).json({ success: false, message: 'Release not found' });
    }

    if (name) release.name = name;
    if (description !== undefined) release.description = description;
    if (startDate !== undefined) release.startDate = startDate;
    if (releaseDate !== undefined) release.releaseDate = releaseDate;
    if (status) release.status = status;

    await release.save();

    if (status === 'RELEASED') {
      await AuditLog.create({
        companyId: req.user.companyId,
        projectId: release.projectId,
        actor: { id: req.user._id, name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email },
        action: 'RELEASE_DEPLOYED',
        objectType: 'Release',
        objectId: release._id.toString(),
        objectLabel: release.name,
      });
    }

    return res.json({ success: true, data: release.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteRelease(req, res) {
  try {
    const { id } = req.params;
    const release = await Release.findOne({ _id: id, companyId: req.user.companyId });
    if (!release) {
      return res.status(404).json({ success: false, message: 'Release not found' });
    }

    await Issue.updateMany(
      { fixVersionIds: release._id.toString() },
      { $pull: { fixVersionIds: release._id.toString() } }
    );
    await Release.deleteOne({ _id: release._id });

    return res.json({ success: true, message: 'Release deleted successfully' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  listReleases,
  createRelease,
  updateRelease,
  deleteRelease,
};
