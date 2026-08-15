const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const projectService = require('../services/project.service');

const listProjects = asyncHandler(async (req, res) => {
  const { search, filter } = req.query;
  // Pass authenticated user ID so the service can resolve "My Projects" by membership
  const data = await projectService.listProjects(req.company._id, req.user._id, { search, filter });
  return ApiResponse.success(res, { message: 'Projects retrieved', data });
});

const getProject = asyncHandler(async (req, res) => {
  const data = await projectService.getProjectByIdOrKey(req.company._id, req.params.id);
  return ApiResponse.success(res, { message: 'Project retrieved', data });
});

const createProject = asyncHandler(async (req, res) => {
  const data = await projectService.createProject(req.company._id, req.body, req.user);
  return ApiResponse.success(res, { statusCode: 201, message: 'Project created', data });
});

const updateProject = asyncHandler(async (req, res) => {
  const data = await projectService.updateProject(
    req.company._id,
    req.params.id,
    req.body,
    req.user._id
  );
  return ApiResponse.success(res, { message: 'Project updated', data });
});

const toggleStar = asyncHandler(async (req, res) => {
  const data = await projectService.toggleProjectStar(req.company._id, req.params.id);
  return ApiResponse.success(res, { message: 'Project star toggled', data });
});

const deleteProject = asyncHandler(async (req, res) => {
  const data = await projectService.deleteProject(
    req.company._id,
    req.params.id,
    req.user._id
  );
  return ApiResponse.success(res, { message: 'Project deleted', data });
});

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  toggleStar,
  deleteProject,
};
