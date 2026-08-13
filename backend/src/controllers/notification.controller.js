const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notification.service');

const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { items, meta } = await notificationService.listNotifications(req.company._id, req.user._id, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return ApiResponse.success(res, { message: 'Notifications retrieved', data: items, meta });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const data = await notificationService.getUnreadCount(req.company._id, req.user._id);
  return ApiResponse.success(res, { message: 'Unread notification count retrieved', data });
});

const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.company._id, req.user._id, req.params.id);
  return ApiResponse.success(res, { message: 'Notification marked as read' });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.company._id, req.user._id);
  return ApiResponse.success(res, { message: 'All notifications marked as read' });
});

module.exports = { listNotifications, getUnreadCount, markAsRead, markAllAsRead };
