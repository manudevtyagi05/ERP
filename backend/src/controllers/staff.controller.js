const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const staffService = require('../services/staff.service');

const createStaff = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, department } = req.body;
  const data = await staffService.createStaff(
    req.company._id,
    { firstName, lastName, email, password, role, department },
    req.user._id
  );

  return ApiResponse.success(res, { statusCode: 201, message: 'Staff member created', data });
});

const listStaff = asyncHandler(async (req, res) => {
  const { page, limit, role, isActive, search } = req.query;
  const { items, meta } = await staffService.listStaff(req.company._id, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    role,
    isActive: isActive === undefined ? undefined : isActive === 'true',
    search,
  });

  return ApiResponse.success(res, { message: 'Staff retrieved', data: items, meta });
});

const getStaff = asyncHandler(async (req, res) => {
  const data = await staffService.getStaffById(req.company._id, req.params.id);
  return ApiResponse.success(res, { message: 'Staff member retrieved', data });
});

const updateStaff = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, department } = req.body;
  const data = await staffService.updateStaff(
    req.company._id,
    req.params.id,
    { firstName, lastName, email, department },
    req.user._id
  );

  return ApiResponse.success(res, { message: 'Staff member updated', data });
});

const activateStaff = asyncHandler(async (req, res) => {
  const data = await staffService.activateStaff(req.company._id, req.params.id, req.user._id);
  return ApiResponse.success(res, { message: 'Staff member activated', data });
});

const deactivateStaff = asyncHandler(async (req, res) => {
  const data = await staffService.deactivateStaff(req.company._id, req.params.id, req.user._id);
  return ApiResponse.success(res, { message: 'Staff member deactivated', data });
});

const deleteStaff = asyncHandler(async (req, res) => {
  await staffService.deleteStaff(req.company._id, req.params.id, req.user._id);
  return ApiResponse.success(res, { message: 'Staff member deleted' });
});

const resetStaffPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  await staffService.resetStaffPassword(req.company._id, req.params.id, newPassword);
  return ApiResponse.success(res, { message: "Staff member's password has been reset" });
});

const changeStaffRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const data = await staffService.changeStaffRole(req.company._id, req.params.id, role, req.user._id);
  return ApiResponse.success(res, { message: 'Staff member role updated', data });
});

module.exports = {
  createStaff,
  listStaff,
  getStaff,
  updateStaff,
  activateStaff,
  deactivateStaff,
  deleteStaff,
  resetStaffPassword,
  changeStaffRole,
};
