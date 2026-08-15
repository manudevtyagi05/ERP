const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const projectMemberService = require('../services/projectMember.service');

const listMembers = asyncHandler(async (req, res) => {
  const data = await projectMemberService.listMembers(req.company._id, req.params.id);
  return ApiResponse.success(res, { message: 'Project members retrieved', data });
});

const addMember = asyncHandler(async (req, res) => {
  // Accept both new projectRoles[] and legacy projectRole string
  const { userId, projectRoles, projectRole } = req.body;
  const data = await projectMemberService.addMember(
    req.company._id,
    req.params.id,
    { userId, projectRoles, projectRole },
    req.user._id
  );
  return ApiResponse.success(res, { statusCode: 201, message: 'Member added to project', data });
});

const updateMemberRole = asyncHandler(async (req, res) => {
  // Accept both new projectRoles[] and legacy projectRole string
  const { projectRoles, projectRole } = req.body;
  const data = await projectMemberService.updateMemberRoles(
    req.company._id,
    req.params.id,
    req.params.memberId,
    projectRoles || projectRole
  );
  return ApiResponse.success(res, { message: 'Member roles updated', data });
});

const removeMember = asyncHandler(async (req, res) => {
  await projectMemberService.removeMember(
    req.company._id,
    req.params.id,
    req.params.memberId
  );
  return ApiResponse.success(res, { message: 'Member removed from project' });
});

module.exports = { listMembers, addMember, updateMemberRole, removeMember };
