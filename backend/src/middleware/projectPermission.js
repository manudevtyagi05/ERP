const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const ProjectMember = require('../models/ProjectMember.model');
const { permissionsForRole } = require('../policies/permissions');

/**
 * Combined middleware that grants access when either condition is true:
 *   (a) The authenticated user holds the specified company-level permission, OR
 *   (b) The authenticated user is an active ProjectMember of the target project
 *       with at least one of the specified project roles.
 *
 * The project ID is read from req.params.id.
 *
 * This separation is critical:
 *   - Company permission  = organization-wide authority (ADMIN/SUPERVISOR)
 *   - Project role        = project-scoped authority (e.g. PROJECT_LEAD)
 *
 * An EMPLOYEE with PROJECT_LEAD can manage their own project team without
 * gaining any company-wide permissions.
 *
 * @param {string}    companyPermission  e.g. 'PROJECT_UPDATE'
 * @param {...string} projectRoles       e.g. 'PROJECT_LEAD'
 */
function requireCompanyPermOrProjectRole(companyPermission, ...projectRoles) {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    // Path 1: company-level permission (ADMIN/SUPERVISOR)
    const granted = permissionsForRole(req.user.role);
    if (granted.includes(companyPermission)) {
      return next();
    }

    // Path 2: project-level role check
    if (!req.params.id) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }

    const member = await ProjectMember.findOne({
      companyId: req.company._id, // always use server-resolved company — never trust client
      projectId: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!member) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }

    const hasRequiredRole = member.projectRoles.some((r) => projectRoles.includes(r));
    if (!hasRequiredRole) {
      return next(
        new ApiError(403, 'You do not have the required project role to perform this action')
      );
    }

    return next();
  });
}

/**
 * Pure project-role check — does NOT fall back to a company permission.
 * ADMIN users always pass (company-wide override).
 *
 * @param {...string} roles
 */
function requireProjectRole(...roles) {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    // ADMIN has implicit project authority everywhere within their company
    if (req.user.role === 'ADMIN') return next();

    const member = await ProjectMember.findOne({
      companyId: req.company._id,
      projectId: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!member || !member.projectRoles.some((r) => roles.includes(r))) {
      return next(
        new ApiError(403, 'You do not have the required project role to perform this action')
      );
    }

    return next();
  });
}

module.exports = { requireCompanyPermOrProjectRole, requireProjectRole };
