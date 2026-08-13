const mongoose = require('mongoose');
const Company = require('../models/Company.model');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');

async function createCompany({ companyName, companyCode, email, phone, admin }) {
  const code = String(companyCode).trim().toUpperCase();
  const adminEmail = String(admin.email).toLowerCase().trim();

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existingCompany = await Company.findOne({ code }).session(session);
    if (existingCompany) {
      throw new ApiError(409, `A company with code "${code}" already exists`);
    }

    const existingAdmin = await User.findOne({ email: adminEmail }).session(session);
    if (existingAdmin) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const [company] = await Company.create(
      [
        {
          name: companyName.trim(),
          code,
          slug: code.toLowerCase(),
          email: String(email).toLowerCase().trim(),
          phone: phone || null,
        },
      ],
      { session }
    );

    const [adminUser] = await User.create(
      [
        {
          companyId: company._id,
          firstName: admin.firstName.trim(),
          lastName: admin.lastName.trim(),
          email: adminEmail,
          password: admin.password,
          role: ROLES.ADMIN,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      companyId: company._id,
      companyCode: company.code,
      adminUserId: adminUser._id,
      status: company.status,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function getCompany(companyId) {
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, 'Company not found');
  return company.toSafeJSON();
}

async function listCompanies({ page = 1, limit = 20, status } = {}) {
  const filter = {};
  if (status) filter.status = status;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    Company.countDocuments(filter),
  ]);

  return {
    items: items.map((company) => company.toSafeJSON()),
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

async function updateCompany(companyId, patch) {
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const { name, email, phone } = patch;
  if (name !== undefined) company.name = name.trim();
  if (email !== undefined) company.email = email.toLowerCase().trim();
  if (phone !== undefined) company.phone = phone;

  await company.save();
  return company.toSafeJSON();
}

async function activateCompany(companyId) {
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  company.status = 'ACTIVE';
  company.isActive = true;
  await company.save();
  return company.toSafeJSON();
}

async function deactivateCompany(companyId) {
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  company.status = 'INACTIVE';
  company.isActive = false;
  await company.save();
  return company.toSafeJSON();
}

async function resetCompanyAdminPassword(companyId, newPassword) {
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  const admin = await User.findOne({ companyId: company._id, role: ROLES.ADMIN }).sort({ createdAt: 1 });
  if (!admin) throw new ApiError(404, 'This company has no admin account');

  admin.password = newPassword;
  await admin.save();

  return { adminUserId: admin._id };
}

async function setSupportFlag(companyId, isSupport) {
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, 'Company not found');

  company.isSupport = Boolean(isSupport);
  await company.save();
  return company.toSafeJSON();
}

module.exports = {
  createCompany,
  getCompany,
  listCompanies,
  updateCompany,
  activateCompany,
  deactivateCompany,
  resetCompanyAdminPassword,
  setSupportFlag,
};
