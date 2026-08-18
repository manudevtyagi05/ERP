const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', dashboardController.listDashboards);
router.post('/', dashboardController.createDashboard);
router.put('/:id', dashboardController.updateDashboard);
router.delete('/:id', dashboardController.deleteDashboard);

module.exports = router;
