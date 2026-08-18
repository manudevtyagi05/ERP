const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issue.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', issueController.listIssues);
router.get('/stats', issueController.getStats);
router.get('/:id', issueController.getIssue);
router.post('/', issueController.createIssue);
router.put('/:id', issueController.updateIssue);
router.delete('/:id', issueController.deleteIssue);

router.post('/:id/assign', issueController.assignIssue);
router.post('/:id/status', issueController.moveIssueStatus);
router.post('/:id/comments', issueController.addComment);
router.post('/:id/comments/reaction', issueController.addReaction);
router.post('/:id/worklog', issueController.logWork);
router.post('/:id/links', issueController.linkIssue);
router.delete('/:id/links/:linkId', issueController.deleteLink);
router.post('/:id/watchers', issueController.toggleWatcher);
router.post('/:id/votes', issueController.toggleVote);
router.post('/:id/subtasks', issueController.addSubtask);
router.post('/:id/subtasks/:subtaskId/toggle', issueController.toggleSubtask);
router.delete('/:id/subtasks/:subtaskId', issueController.deleteSubtask);
router.get('/:id/activity', issueController.getActivity);

module.exports = router;
