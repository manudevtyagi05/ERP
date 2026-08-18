const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const issueService = require('../services/issue.service');

const listIssues = asyncHandler(async (req, res) => {
  const data = await issueService.listIssues(req.company._id, req.user._id, req.query);
  return ApiResponse.success(res, { message: 'Issues retrieved', data });
});

const getStats = asyncHandler(async (req, res) => {
  const data = await issueService.getStats(req.company._id, req.user._id, req.query);
  return ApiResponse.success(res, { message: 'Issue statistics retrieved', data });
});

const getIssue = asyncHandler(async (req, res) => {
  const data = await issueService.getIssueByIdOrKey(req.company._id, req.params.id);
  return ApiResponse.success(res, { message: 'Issue retrieved', data });
});

const createIssue = asyncHandler(async (req, res) => {
  const data = await issueService.createIssue(req.company._id, req.body, req.user);
  return ApiResponse.success(res, { statusCode: 201, message: 'Issue created', data });
});

const updateIssue = asyncHandler(async (req, res) => {
  const data = await issueService.updateIssue(req.company._id, req.params.id, req.body, req.user);
  return ApiResponse.success(res, { message: 'Issue updated', data });
});

const assignIssue = asyncHandler(async (req, res) => {
  const { assigneeId } = req.body;
  const data = await issueService.assignIssue(req.company._id, req.params.id, assigneeId, req.user);
  return ApiResponse.success(res, { message: 'Issue assignment updated', data });
});

const moveIssueStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const data = await issueService.moveIssueStatus(req.company._id, req.params.id, status, req.user);
  return ApiResponse.success(res, { message: 'Issue status updated', data });
});

const deleteIssue = asyncHandler(async (req, res) => {
  const data = await issueService.deleteIssue(req.company._id, req.params.id, req.user);
  return ApiResponse.success(res, { message: 'Issue deleted', data });
});

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const data = await issueService.addComment(req.company._id, req.params.id, content, req.user);
  return ApiResponse.success(res, { message: 'Comment added', data });
});

const addReaction = asyncHandler(async (req, res) => {
  const { commentId, emoji } = req.body;
  const data = await issueService.addReaction(req.company._id, req.params.id, commentId, emoji, req.user);
  return ApiResponse.success(res, { message: 'Reaction updated', data });
});

const logWork = asyncHandler(async (req, res) => {
  const data = await issueService.logWork(req.company._id, req.params.id, req.body, req.user);
  return ApiResponse.success(res, { message: 'Work logged', data });
});

const linkIssue = asyncHandler(async (req, res) => {
  const data = await issueService.linkIssue(req.company._id, req.params.id, req.body, req.user);
  return ApiResponse.success(res, { message: 'Issue linked', data });
});

const deleteLink = asyncHandler(async (req, res) => {
  const { linkId } = req.params;
  const data = await issueService.deleteLink(req.company._id, req.params.id, linkId);
  return ApiResponse.success(res, { message: 'Link deleted', data });
});

const toggleWatcher = asyncHandler(async (req, res) => {
  const data = await issueService.toggleWatcher(req.company._id, req.params.id, req.user);
  return ApiResponse.success(res, { message: 'Watcher toggled', data });
});

const toggleVote = asyncHandler(async (req, res) => {
  const data = await issueService.toggleVote(req.company._id, req.params.id, req.user);
  return ApiResponse.success(res, { message: 'Vote toggled', data });
});

const addSubtask = asyncHandler(async (req, res) => {
  const data = await issueService.addSubtask(req.company._id, req.params.id, req.body, req.user);
  return ApiResponse.success(res, { message: 'Subtask added', data });
});

const toggleSubtask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;
  const data = await issueService.toggleSubtask(req.company._id, req.params.id, subtaskId);
  return ApiResponse.success(res, { message: 'Subtask toggled', data });
});

const deleteSubtask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;
  const data = await issueService.deleteSubtask(req.company._id, req.params.id, subtaskId);
  return ApiResponse.success(res, { message: 'Subtask deleted', data });
});

const getActivity = asyncHandler(async (req, res) => {
  const data = await issueService.getActivity(req.company._id, req.params.id);
  return ApiResponse.success(res, { message: 'Issue activity retrieved', data });
});

module.exports = {
  listIssues,
  getStats,
  getIssue,
  createIssue,
  updateIssue,
  assignIssue,
  moveIssueStatus,
  deleteIssue,
  addComment,
  addReaction,
  logWork,
  linkIssue,
  deleteLink,
  toggleWatcher,
  toggleVote,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  getActivity,
};
