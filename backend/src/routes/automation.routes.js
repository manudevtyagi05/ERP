const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automation.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', automationController.listRules);
router.post('/', automationController.createRule);
router.put('/:id', automationController.updateRule);
router.post('/:id/toggle', automationController.toggleRule);
router.post('/:id/test', automationController.testExecuteRule);
router.delete('/:id', automationController.deleteRule);

module.exports = router;
