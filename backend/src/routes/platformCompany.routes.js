const express = require('express');
const {
  createCompany,
  getCompany,
  listCompanies,
  updateCompany,
  activateCompany,
  deactivateCompany,
  resetAdminPassword,
  setSupportFlag,
} = require('../controllers/platformCompany.controller');
const {
  validateCreateCompany,
  validateUpdateCompany,
  validateResetPassword,
  validateSupportFlag,
} = require('../validators/platformCompany.validator');
const { requirePlatformKey } = require('../middleware/auth');

const router = express.Router();

router.use(requirePlatformKey);

router.post('/', validateCreateCompany, createCompany);
router.get('/', listCompanies);
router.get('/:companyId', getCompany);
router.patch('/:companyId', validateUpdateCompany, updateCompany);
router.patch('/:companyId/activate', activateCompany);
router.patch('/:companyId/deactivate', deactivateCompany);
router.post('/:companyId/password', validateResetPassword, resetAdminPassword);
router.patch('/:companyId/support', validateSupportFlag, setSupportFlag);

module.exports = router;
