const express = require('express');
const { login, getMe, logout, changePassword, updateNotificationPreferences, updateProfile } = require('../controllers/auth.controller');
const { validateLogin, validateChangePassword } = require('../validators/auth.validator');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);
router.patch('/me/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, validateChangePassword, changePassword);
router.patch('/me/notification-preferences', authenticate, updateNotificationPreferences);

module.exports = router;
