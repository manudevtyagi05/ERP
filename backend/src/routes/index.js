const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const platformCompanyRoutes = require('./platformCompany.routes');
const staffRoutes = require('./staff.routes');
const projectRoutes = require('./project.routes');
const issueRoutes = require('./issue.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/platform/companies', platformCompanyRoutes);
router.use('/staff', staffRoutes);
router.use('/projects', projectRoutes);
router.use('/issues', issueRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
