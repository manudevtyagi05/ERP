const mongoose = require('mongoose');

/**
 * Project-scoped responsibility roles.
 * Completely separate from company-level roles (ADMIN/SUPERVISOR/EMPLOYEE/SUPPORT).
 * A single ProjectMember may hold multiple project roles simultaneously.
 */
const PROJECT_ROLES = ['PROJECT_LEAD', 'DEVELOPER', 'QA', 'DEVOPS', 'PR_REVIEWER', 'VIEWER'];

/**
 * Legacy roles that existed in the old schema.
 * Kept for migration reference — NOT used in the new enum.
 */
const LEGACY_PROJECT_ROLES = ['OWNER', 'MANAGER', 'MEMBER', 'VIEWER'];

const projectMemberSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /**
     * Array of project-scoped responsibility roles.
     * One user may have multiple roles in the same project (e.g. PROJECT_LEAD + PR_REVIEWER).
     * Uniqueness is enforced at the (projectId, userId) level — NOT per role.
     */
    projectRoles: {
      type: [
        {
          type: String,
          enum: PROJECT_ROLES,
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// One record per user per project — roles are stored as an array on this record.
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
// Efficient lookups by company + project (list members)
projectMemberSchema.index({ companyId: 1, projectId: 1, isActive: 1 });
// Efficient lookups by company + user (My Projects / isProjectLead checks)
projectMemberSchema.index({ companyId: 1, userId: 1, isActive: 1 });

projectMemberSchema.methods.toSafeJSON = function toSafeJSON() {
  const roles = this.projectRoles || [];
  return {
    id: this._id.toString(),
    projectId: this.projectId.toString(),
    userId: this.userId.toString(),
    // New canonical field — full array of responsibilities
    projectRoles: roles,
    // Legacy backward-compat alias — first role in the array
    projectRole: roles.length > 0 ? roles[0] : 'VIEWER',
    isActive: this.isActive,
    joinedAt: this.createdAt,
  };
};

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);

module.exports = ProjectMember;
module.exports.PROJECT_ROLES = PROJECT_ROLES;
module.exports.LEGACY_PROJECT_ROLES = LEGACY_PROJECT_ROLES;
