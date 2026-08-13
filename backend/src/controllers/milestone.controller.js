const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const milestoneService = require('../services/milestone.service');

const listMilestones = asyncHandler(async (req, res) => {
  const data = await milestoneService.listMilestones(req.company._id, req.params.id);
  return ApiResponse.success(res, { message: 'Milestones retrieved', data });
});

const createMilestone = asyncHandler(async (req, res) => {
  const data = await milestoneService.createMilestone(req.company._id, req.params.id, req.body, req.user._id);
  return ApiResponse.success(res, { statusCode: 201, message: 'Milestone created', data });
});

const updateMilestone = asyncHandler(async (req, res) => {
  const data = await milestoneService.updateMilestone(
    req.company._id,
    req.params.id,
    req.params.milestoneId,
    req.body,
    req.user._id
  );
  return ApiResponse.success(res, { message: 'Milestone updated', data });
});

const deleteMilestone = asyncHandler(async (req, res) => {
  await milestoneService.deleteMilestone(req.company._id, req.params.id, req.params.milestoneId, req.user._id);
  return ApiResponse.success(res, { message: 'Milestone deleted' });
});

module.exports = { listMilestones, createMilestone, updateMilestone, deleteMilestone };
