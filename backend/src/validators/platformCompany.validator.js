const ApiError = require('../utils/ApiError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCreateCompany(req, res, next) {
  const { companyName, companyCode, email, admin } = req.body;
  const errors = {};

  if (!companyName || !String(companyName).trim()) errors.companyName = 'Company name is required';
  if (!companyCode || !String(companyCode).trim()) errors.companyCode = 'Company code is required';
  if (!email || !EMAIL_RE.test(String(email).trim())) errors.email = 'A valid company email is required';

  if (!admin || typeof admin !== 'object') {
    errors.admin = 'Admin details are required';
  } else {
    if (!admin.firstName || !String(admin.firstName).trim()) errors['admin.firstName'] = 'Admin first name is required';
    if (!admin.lastName || !String(admin.lastName).trim()) errors['admin.lastName'] = 'Admin last name is required';
    if (!admin.email || !EMAIL_RE.test(String(admin.email).trim())) {
      errors['admin.email'] = 'A valid admin email is required';
    }
    if (!admin.password || String(admin.password).length < 8) {
      errors['admin.password'] = 'Admin password must be at least 8 characters';
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(new ApiError(422, 'Validation failed', errors));
  }

  next();
}

function validateUpdateCompany(req, res, next) {
  const { name, email } = req.body;
  const errors = {};

  if (name !== undefined && !String(name).trim()) errors.name = 'Company name cannot be empty';
  if (email !== undefined && !EMAIL_RE.test(String(email).trim())) errors.email = 'A valid email is required';

  if (Object.keys(errors).length > 0) {
    return next(new ApiError(422, 'Validation failed', errors));
  }

  next();
}

function validateResetPassword(req, res, next) {
  const { newPassword } = req.body;
  const errors = {};

  if (!newPassword || String(newPassword).length < 8) {
    errors.newPassword = 'New password must be at least 8 characters';
  }

  if (Object.keys(errors).length > 0) {
    return next(new ApiError(422, 'Validation failed', errors));
  }

  next();
}

function validateSupportFlag(req, res, next) {
  const { isSupport } = req.body;

  if (typeof isSupport !== 'boolean') {
    return next(new ApiError(422, 'Validation failed', { isSupport: 'isSupport must be a boolean' }));
  }

  next();
}

module.exports = {
  validateCreateCompany,
  validateUpdateCompany,
  validateResetPassword,
  validateSupportFlag,
};
