const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const sprintService = require('../services/sprint.service');

const listSprints = asyncHandler(async (req, res) => {
  const data = await sprintService.listSprints(req.company._id, req.params.id);
  return ApiResponse.success(res, { message: 'Sprints retrieved', data });
});

const createSprint = asyncHandler(async (req, res) => {
  const data = await sprintService.createSprint(req.company._id, req.params.id, req.body, req.user._id);
  return ApiResponse.success(res, { statusCode: 201, message: 'Sprint created', data });
});

const updateSprint = asyncHandler(async (req, res) => {
  const data = await sprintService.updateSprint(
    req.company._id,
    req.params.id,
    req.params.sprintId,
    req.body,
    req.user._id
  );
  return ApiResponse.success(res, { message: 'Sprint updated', data });
});

const deleteSprint = asyncHandler(async (req, res) => {
  await sprintService.deleteSprint(req.company._id, req.params.id, req.params.sprintId, req.user._id);
  return ApiResponse.success(res, { message: 'Sprint deleted' });
});

const startSprint = asyncHandler(async (req, res) => {
  const data = await sprintService.startSprint(
    req.company._id,
    req.params.id,
    req.params.sprintId,
    req.body,
    req.user._id
  );
  return ApiResponse.success(res, { message: 'Sprint started', data });
});

const completeSprint = asyncHandler(async (req, res) => {
  const data = await sprintService.completeSprint(
    req.company._id,
    req.params.id,
    req.params.sprintId,
    req.body,
    req.user
  );
  return ApiResponse.success(res, { message: 'Sprint completed', data });
});

const getBacklog = asyncHandler(async (req, res) => {
  const data = await sprintService.getBacklog(req.company._id, req.params.id);
  return ApiResponse.success(res, { message: 'Backlog retrieved', data });
});

module.exports = {
  listSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
  getBacklog,
};
