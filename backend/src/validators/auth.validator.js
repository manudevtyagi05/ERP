const ApiError = require('../utils/ApiError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = {};

  if (!email || !EMAIL_RE.test(String(email).trim())) errors.email = 'A valid email is required';
  if (!password) errors.password = 'Password is required';

  if (Object.keys(errors).length > 0) {
    return next(new ApiError(422, 'Validation failed', errors));
  }

  next();
}

function validateChangePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  const errors = {};

  if (!currentPassword) errors.currentPassword = 'Current password is required';
  if (!newPassword || String(newPassword).length < 8) {
    errors.newPassword = 'New password must be at least 8 characters';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ApiError(422, 'Validation failed', errors));
  }

  next();
}

module.exports = { validateLogin, validateChangePassword };
