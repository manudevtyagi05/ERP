const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, company, token } = await authService.login({ email, password });

  return ApiResponse.success(res, {
    message: 'Login successful',
    data: { user, company, token },
  });
});

const getMe = asyncHandler(async (req, res) => {
  const { user, company } = await authService.getCurrentUser(req.user._id);
  return ApiResponse.success(res, {
    message: 'Current user',
    data: { user, company },
  });
});

const logout = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { message: 'Logged out successfully' });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword({ userId: req.user._id, currentPassword, newPassword });

  return ApiResponse.success(res, { message: 'Password changed successfully' });
});

const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const user = await authService.updateNotificationPreferences(req.user._id, req.body);
  return ApiResponse.success(res, { message: 'Notification preferences updated', data: { user } });
});

module.exports = { login, getMe, logout, changePassword, updateNotificationPreferences };
