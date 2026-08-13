const Project = require('../models/Project.model');
const Issue = require('../models/Issue.model');
const ApiError = require('../utils/ApiError');

async function listProjects(companyId, { search, filter } = {}) {
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

  const projects = await Project.find(query).sort({ updatedAt: -1 });

  // Compute live issue metrics for each project
  const projectStats = await Promise.all(
    projects.map(async (p) => {
      const issues = await Issue.find({
        companyId,
        projectId: p._id,
        deletedAt: null,
      });

      const totalIssues = issues.length;
      const completedIssues = issues.filter((i) => i.status === 'DONE').length;
      const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

      return {
        ...p.toSafeJSON(),
        totalIssues,
        completedIssues,
        progress,
      };
    })
  );

  return projectStats;
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

  const issues = await Issue.find({ companyId, projectId: project._id, deletedAt: null });
  const totalIssues = issues.length;
  const completedIssues = issues.filter((i) => i.status === 'DONE').length;
  const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  return {
    ...project.toSafeJSON(),
    totalIssues,
    completedIssues,
    progress,
  };
}

async function createProject(companyId, payload, user) {
  const key = payload.key.toUpperCase().trim();
  const existing = await Project.findOne({ companyId, key, deletedAt: null });
  if (existing) {
    throw new ApiError(409, `Project key prefix '${key}' is already in use.`);
  }

  const project = await Project.create({
    companyId,
    key,
    name: payload.name.trim(),
    category: payload.category || 'Software Architecture',
    description: payload.description || '',
    lead: payload.lead || `${user.firstName} ${user.lastName}`,
    leadEmail: payload.leadEmail || user.email,
    avatarBg: payload.avatarBg || '#2563eb',
    status: payload.status || 'Active',
    createdBy: user._id,
  });

  return {
    ...project.toSafeJSON(),
    totalIssues: 0,
    completedIssues: 0,
    progress: 0,
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
  if (payload.lead) project.lead = payload.lead;
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
