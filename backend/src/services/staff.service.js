const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');

const ROLE_VALUES = Object.values(ROLES);

async function createStaff(companyId, { firstName, lastName, email, password, role, department }, createdBy) {
  const normalizedEmail = String(email).toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    companyId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    password,
    role: role || ROLES.EMPLOYEE,
    department: department || null,
    createdBy,
  });

  return user.toSafeJSON();
}

async function listStaff(companyId, { page = 1, limit = 20, role, isActive, search } = {}) {
  const filter = { companyId, deletedAt: null };
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    User.countDocuments(filter),
  ]);

  return {
    items: items.map((user) => user.toSafeJSON()),
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

async function findActiveStaff(companyId, userId) {
  const user = await User.findOne({ _id: userId, companyId, deletedAt: null });
  if (!user) {
    throw new ApiError(404, 'Staff member not found');
  }
  return user;
}

async function getStaffById(companyId, userId) {
  const user = await findActiveStaff(companyId, userId);
  return user.toSafeJSON();
}

async function updateStaff(companyId, userId, patch, updatedBy) {
  const user = await findActiveStaff(companyId, userId);

  const { firstName, lastName, email, department } = patch;
  if (firstName !== undefined) user.firstName = firstName.trim();
  if (lastName !== undefined) user.lastName = lastName.trim();
  if (department !== undefined) user.department = department;
  if (email !== undefined) {
    const normalizedEmail = String(email).toLowerCase().trim();
    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        throw new ApiError(409, 'An account with this email already exists');
      }
      user.email = normalizedEmail;
    }
  }

  user.updatedBy = updatedBy;
  await user.save();
  return user.toSafeJSON();
}

async function activateStaff(companyId, userId, updatedBy) {
  const user = await findActiveStaff(companyId, userId);

  user.isActive = true;
  user.updatedBy = updatedBy;
  await user.save();
  return user.toSafeJSON();
}

async function deactivateStaff(companyId, userId, actingUserId) {
  if (String(userId) === String(actingUserId)) {
    throw new ApiError(409, 'You cannot deactivate your own account');
  }

  const user = await findActiveStaff(companyId, userId);

  user.isActive = false;
  user.updatedBy = actingUserId;
  await user.save();
  return user.toSafeJSON();
}

async function deleteStaff(companyId, userId, actingUserId) {
  if (String(userId) === String(actingUserId)) {
    throw new ApiError(409, 'You cannot delete your own account');
  }

  const user = await findActiveStaff(companyId, userId);

  user.isActive = false;
  user.deletedAt = new Date();
  user.updatedBy = actingUserId;
  await user.save();
}

async function resetStaffPassword(companyId, userId, newPassword) {
  const user = await findActiveStaff(companyId, userId);

  user.password = newPassword;
  await user.save();
}

async function changeStaffRole(companyId, userId, newRole, actingUserId) {
  if (String(userId) === String(actingUserId)) {
    throw new ApiError(409, 'You cannot change your own role');
  }
  if (!ROLE_VALUES.includes(newRole)) {
    throw new ApiError(422, 'Validation failed', { role: 'Invalid role' });
  }

  const user = await findActiveStaff(companyId, userId);

  user.role = newRole;
  user.updatedBy = actingUserId;
  await user.save();
  return user.toSafeJSON();
}

module.exports = {
  createStaff,
  listStaff,
  getStaffById,
  updateStaff,
  activateStaff,
  deactivateStaff,
  deleteStaff,
  resetStaffPassword,
  changeStaffRole,
};
