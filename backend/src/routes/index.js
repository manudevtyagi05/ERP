const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const platformCompanyRoutes = require('./platformCompany.routes');
const staffRoutes = require('./staff.routes');
const projectRoutes = require('./project.routes');
const issueRoutes = require('./issue.routes');
const notificationRoutes = require('./notification.routes');
const sprintRoutes = require('./sprint.routes');
const epicRoutes = require('./epic.routes');
const releaseRoutes = require('./release.routes');
const componentRoutes = require('./component.routes');
const boardRoutes = require('./board.routes');
const filterRoutes = require('./filter.routes');
const dashboardRoutes = require('./dashboard.routes');
const automationRoutes = require('./automation.routes');
const auditLogRoutes = require('./auditLog.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/platform/companies', platformCompanyRoutes);
router.use('/staff', staffRoutes);
router.use('/projects', projectRoutes);
router.use('/issues', issueRoutes);
router.use('/notifications', notificationRoutes);
router.use('/sprints', sprintRoutes);
router.use('/epics', epicRoutes);
router.use('/releases', releaseRoutes);
router.use('/components', componentRoutes);
router.use('/boards', boardRoutes);
router.use('/filters', filterRoutes);
router.use('/dashboards', dashboardRoutes);
router.use('/automation', automationRoutes);
router.use('/audit-logs', auditLogRoutes);

module.exports = router;
