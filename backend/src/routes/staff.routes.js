const express = require('express');
const {
  createStaff,
  listStaff,
  getStaff,
  updateStaff,
  activateStaff,
  deactivateStaff,
  deleteStaff,
  resetStaffPassword,
  changeStaffRole,
} = require('../controllers/staff.controller');
const {
  validateCreateStaff,
  validateUpdateStaff,
  validateResetPassword,
  validateChangeRole,
} = require('../validators/staff.validator');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../policies/permissions');

const router = express.Router();

router.use(authenticate);

router.post('/', requirePermission(PERMISSIONS.USER_CREATE), validateCreateStaff, createStaff);
router.get('/', requirePermission(PERMISSIONS.USER_READ), listStaff);
router.get('/:id', requirePermission(PERMISSIONS.USER_READ), getStaff);
router.patch('/:id', requirePermission(PERMISSIONS.USER_UPDATE), validateUpdateStaff, updateStaff);
router.delete('/:id', requirePermission(PERMISSIONS.USER_DELETE), deleteStaff);

router.patch('/:id/activate', requirePermission(PERMISSIONS.USER_ACTIVATE), activateStaff);
router.patch('/:id/deactivate', requirePermission(PERMISSIONS.USER_DEACTIVATE), deactivateStaff);
router.post('/:id/reset-password', requirePermission(PERMISSIONS.USER_UPDATE), validateResetPassword, resetStaffPassword);
router.patch('/:id/role', requirePermission(PERMISSIONS.USER_UPDATE), validateChangeRole, changeStaffRole);

module.exports = router;
