const express = require('express');
const {
  listProjects,
  getProject,
  createProject,
  updateProject,
  toggleStar,
  deleteProject,
} = require('../controllers/project.controller');
const {
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
} = require('../controllers/projectMember.controller');
const {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} = require('../controllers/milestone.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../policies/permissions');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.PROJECT_READ), listProjects);
router.get('/:id', requirePermission(PERMISSIONS.PROJECT_READ), getProject);
router.post('/', requirePermission(PERMISSIONS.PROJECT_CREATE), createProject);
router.patch('/:id', requirePermission(PERMISSIONS.PROJECT_UPDATE), updateProject);
router.patch('/:id/star', requirePermission(PERMISSIONS.PROJECT_READ), toggleStar);
router.delete('/:id', requirePermission(PERMISSIONS.PROJECT_DELETE), deleteProject);

router.get('/:id/members', requirePermission(PERMISSIONS.PROJECT_READ), listMembers);
router.post('/:id/members', requirePermission(PERMISSIONS.PROJECT_UPDATE), addMember);
router.patch('/:id/members/:memberId', requirePermission(PERMISSIONS.PROJECT_UPDATE), updateMemberRole);
router.delete('/:id/members/:memberId', requirePermission(PERMISSIONS.PROJECT_UPDATE), removeMember);

router.get('/:id/milestones', requirePermission(PERMISSIONS.PROJECT_READ), listMilestones);
router.post('/:id/milestones', requirePermission(PERMISSIONS.PROJECT_UPDATE), createMilestone);
router.patch('/:id/milestones/:milestoneId', requirePermission(PERMISSIONS.PROJECT_UPDATE), updateMilestone);
router.delete('/:id/milestones/:milestoneId', requirePermission(PERMISSIONS.PROJECT_UPDATE), deleteMilestone);

module.exports = router;
