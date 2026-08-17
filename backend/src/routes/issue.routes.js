const express = require('express');
const {
  listIssues,
  getStats,
  getIssue,
  createIssue,
  updateIssue,
  assignIssue,
  moveIssueStatus,
  deleteIssue,
  addComment,
  toggleSubtask,
  reorderIssues,
  getActivity,
} = require('../controllers/issue.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../policies/permissions');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.ISSUE_READ), listIssues);
router.get('/stats', requirePermission(PERMISSIONS.ISSUE_READ), getStats);
router.patch('/reorder', requirePermission(PERMISSIONS.ISSUE_UPDATE), reorderIssues);
router.get('/:id', requirePermission(PERMISSIONS.ISSUE_READ), getIssue);
router.get('/:id/activity', requirePermission(PERMISSIONS.ISSUE_READ), getActivity);
router.post('/', requirePermission(PERMISSIONS.ISSUE_CREATE), createIssue);
router.patch('/:id', requirePermission(PERMISSIONS.ISSUE_UPDATE), updateIssue);
router.patch('/:id/assign', requirePermission(PERMISSIONS.ISSUE_UPDATE), assignIssue);
router.patch('/:id/status', requirePermission(PERMISSIONS.ISSUE_UPDATE), moveIssueStatus);
router.delete('/:id', requirePermission(PERMISSIONS.ISSUE_DELETE), deleteIssue);
router.post('/:id/comments', requirePermission(PERMISSIONS.ISSUE_UPDATE), addComment);
router.patch('/:id/subtasks/:subtaskId/toggle', requirePermission(PERMISSIONS.ISSUE_UPDATE), toggleSubtask);

module.exports = router;
