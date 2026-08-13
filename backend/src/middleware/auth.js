const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const User = require('../models/User.model');
const Company = require('../models/Company.model');
const { permissionsForRole } = require('../policies/permissions');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired session');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid or expired session');
  }

  const company = await Company.findById(user.companyId);
  if (!company || company.status !== 'ACTIVE') {
    throw new ApiError(401, 'Invalid or expired session');
  }

  req.user = user;
  req.company = company;
  next();
});

function authorize(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

function requirePermission(...permissions) {
  return function (req, res, next) {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    const granted = permissionsForRole(req.user.role);
    const hasAll = permissions.every((permission) => granted.includes(permission));
    if (!hasAll) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

function requirePlatformKey(req, res, next) {
  const key = req.headers['x-platform-api-key'];
  const expected = process.env.PLATFORM_API_KEY;

  if (!expected || !key || key !== expected) {
    return next(new ApiError(401, 'Invalid or missing platform API key'));
  }
  next();
}

module.exports = { authenticate, authorize, requirePermission, requirePlatformKey };
