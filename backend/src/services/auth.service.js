const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Company = require('../models/Company.model');
const ApiError = require('../utils/ApiError');
const { permissionsForRole } = require('../policies/permissions');

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), companyId: user.companyId.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const company = await Company.findById(user.companyId);
  if (!company || company.status !== 'ACTIVE') {
    throw new ApiError(401, 'Invalid email or password');
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user);
  return {
    user: { ...user.toSafeJSON(), permissions: permissionsForRole(user.role) },
    company: company.toSafeJSON(),
    token,
  };
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }

  const company = await Company.findById(user.companyId);
  if (!company || company.status !== 'ACTIVE') {
    throw new ApiError(401, 'User not found or inactive');
  }

  return {
    user: { ...user.toSafeJSON(), permissions: permissionsForRole(user.role) },
    company: {
      id: company._id,
      name: company.name,
      code: company.code,
    },
  };
}

async function updateNotificationPreferences(userId, preferences) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }

  const { assigned, statusChanged, comment } = preferences;
  if (assigned !== undefined) user.notificationPreferences.assigned = Boolean(assigned);
  if (statusChanged !== undefined) user.notificationPreferences.statusChanged = Boolean(statusChanged);
  if (comment !== undefined) user.notificationPreferences.comment = Boolean(comment);

  await user.save();
  return user.toSafeJSON();
}

async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }

  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
}

async function updateProfile(userId, { firstName, lastName, department }) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }

  if (firstName !== undefined && String(firstName).trim()) {
    user.firstName = String(firstName).trim();
  }
  if (lastName !== undefined && String(lastName).trim()) {
    user.lastName = String(lastName).trim();
  }
  if (department !== undefined) {
    user.department = department ? String(department).trim() : null;
  }

  await user.save();
  return {
    ...user.toSafeJSON(),
    permissions: permissionsForRole(user.role),
  };
}

module.exports = {
  login,
  getCurrentUser,
  changePassword,
  updateNotificationPreferences,
  updateProfile,
  signToken,
};
