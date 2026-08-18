const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLog.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', auditLogController.listAuditLogs);

module.exports = router;
