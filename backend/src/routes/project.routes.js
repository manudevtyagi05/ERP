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
const { requireCompanyPermOrProjectRole } = require('../middleware/projectPermission');
const { PERMISSIONS } = require('../policies/permissions');

const router = express.Router();

router.use(authenticate);

// ── Project CRUD ────────────────────────────────────────────────────────────
router.get('/', requirePermission(PERMISSIONS.PROJECT_READ), listProjects);
router.get('/:id', requirePermission(PERMISSIONS.PROJECT_READ), getProject);
router.post('/', requirePermission(PERMISSIONS.PROJECT_CREATE), createProject);
router.patch('/:id', requirePermission(PERMISSIONS.PROJECT_UPDATE), updateProject);
router.patch('/:id/star', requirePermission(PERMISSIONS.PROJECT_READ), toggleStar);
router.delete('/:id', requirePermission(PERMISSIONS.PROJECT_DELETE), deleteProject);

// ── Project Members ──────────────────────────────────────────────────────────
// Read: anyone with PROJECT_READ company permission can list members
router.get('/:id/members', requirePermission(PERMISSIONS.PROJECT_READ), listMembers);

// Write: requires EITHER company-level PROJECT_UPDATE (ADMIN/SUPERVISOR)
//        OR      project-level PROJECT_LEAD role on THIS project.
// This allows an EMPLOYEE who is a PROJECT_LEAD to manage their own team
// without gaining any company-wide administrative permissions.
router.post(
  '/:id/members',
  requireCompanyPermOrProjectRole(PERMISSIONS.PROJECT_UPDATE, 'PROJECT_LEAD'),
  addMember
);
router.patch(
  '/:id/members/:memberId',
  requireCompanyPermOrProjectRole(PERMISSIONS.PROJECT_UPDATE, 'PROJECT_LEAD'),
  updateMemberRole
);
router.delete(
  '/:id/members/:memberId',
  requireCompanyPermOrProjectRole(PERMISSIONS.PROJECT_UPDATE, 'PROJECT_LEAD'),
  removeMember
);

// ── Milestones ───────────────────────────────────────────────────────────────
// Same pattern: ADMIN/SUPERVISOR OR PROJECT_LEAD
router.get('/:id/milestones', requirePermission(PERMISSIONS.PROJECT_READ), listMilestones);
router.post(
  '/:id/milestones',
  requireCompanyPermOrProjectRole(PERMISSIONS.PROJECT_UPDATE, 'PROJECT_LEAD'),
  createMilestone
);
router.patch(
  '/:id/milestones/:milestoneId',
  requireCompanyPermOrProjectRole(PERMISSIONS.PROJECT_UPDATE, 'PROJECT_LEAD'),
  updateMilestone
);
router.delete(
  '/:id/milestones/:milestoneId',
  requireCompanyPermOrProjectRole(PERMISSIONS.PROJECT_UPDATE, 'PROJECT_LEAD'),
  deleteMilestone
);

module.exports = router;
