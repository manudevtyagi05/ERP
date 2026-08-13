const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');

const ROLE_VALUES = Object.values(ROLES);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCreateStaff(req, res, next) {
  const { firstName, lastName, email, password, role } = req.body;
  const errors = {};

  if (!firstName || !String(firstName).trim()) errors.firstName = 'First name is required';
  if (!lastName || !String(lastName).trim()) errors.lastName = 'Last name is required';
  if (!email || !EMAIL_RE.test(String(email).trim())) errors.email = 'A valid email is required';
  if (!password || String(password).length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (role !== undefined && !ROLE_VALUES.includes(role)) {
    errors.role = `Role must be one of: ${ROLE_VALUES.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return next(new ApiError(422, 'Validation failed', errors));
  }

  next();
}

function validateUpdateStaff(req, res, next) {
  const { firstName, lastName, email } = req.body;
  const errors = {};

  if (firstName !== undefined && !String(firstName).trim()) errors.firstName = 'First name cannot be empty';
  if (lastName !== undefined && !String(lastName).trim()) errors.lastName = 'Last name cannot be empty';
  if (email !== undefined && !EMAIL_RE.test(String(email).trim())) errors.email = 'A valid email is required';

  if (Object.keys(errors).length > 0) {
    return next(new ApiError(422, 'Validation failed', errors));
  }

  next();
}

function validateResetPassword(req, res, next) {
  const { newPassword } = req.body;

  if (!newPassword || String(newPassword).length < 8) {
    return next(new ApiError(422, 'Validation failed', { newPassword: 'New password must be at least 8 characters' }));
  }

  next();
}

function validateChangeRole(req, res, next) {
  const { role } = req.body;

  if (!role || !ROLE_VALUES.includes(role)) {
    return next(new ApiError(422, 'Validation failed', { role: `Role must be one of: ${ROLE_VALUES.join(', ')}` }));
  }

  next();
}

module.exports = {
  validateCreateStaff,
  validateUpdateStaff,
  validateResetPassword,
  validateChangeRole,
};
