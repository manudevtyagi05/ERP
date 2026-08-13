const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const platformCompanyService = require('../services/platformCompany.service');

const createCompany = asyncHandler(async (req, res) => {
  const { companyName, companyCode, email, phone, admin } = req.body;
  const data = await platformCompanyService.createCompany({ companyName, companyCode, email, phone, admin });

  return ApiResponse.success(res, {
    statusCode: 201,
    message: 'Company created successfully',
    data,
  });
});

const getCompany = asyncHandler(async (req, res) => {
  const data = await platformCompanyService.getCompany(req.params.companyId);
  return ApiResponse.success(res, { message: 'Company retrieved', data });
});

const listCompanies = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const { items, meta } = await platformCompanyService.listCompanies({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    status,
  });

  return ApiResponse.success(res, { message: 'Companies retrieved', data: items, meta });
});

const updateCompany = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const data = await platformCompanyService.updateCompany(req.params.companyId, { name, email, phone });
  return ApiResponse.success(res, { message: 'Company updated', data });
});

const activateCompany = asyncHandler(async (req, res) => {
  const data = await platformCompanyService.activateCompany(req.params.companyId);
  return ApiResponse.success(res, { message: 'Company activated', data });
});

const deactivateCompany = asyncHandler(async (req, res) => {
  const data = await platformCompanyService.deactivateCompany(req.params.companyId);
  return ApiResponse.success(res, { message: 'Company deactivated', data });
});

const resetAdminPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const data = await platformCompanyService.resetCompanyAdminPassword(req.params.companyId, newPassword);
  return ApiResponse.success(res, { message: "Company admin's password has been reset", data });
});

const setSupportFlag = asyncHandler(async (req, res) => {
  const { isSupport } = req.body;
  const data = await platformCompanyService.setSupportFlag(req.params.companyId, isSupport);
  return ApiResponse.success(res, { message: 'Company support flag updated', data });
});

module.exports = {
  createCompany,
  getCompany,
  listCompanies,
  updateCompany,
  activateCompany,
  deactivateCompany,
  resetAdminPassword,
  setSupportFlag,
};
