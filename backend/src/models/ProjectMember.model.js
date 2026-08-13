const mongoose = require('mongoose');

const PROJECT_ROLES = ['OWNER', 'MANAGER', 'MEMBER', 'VIEWER'];

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
    projectRole: {
      type: String,
      enum: PROJECT_ROLES,
      default: 'MEMBER',
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

projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

projectMemberSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    projectId: this.projectId.toString(),
    userId: this.userId.toString(),
    projectRole: this.projectRole,
    isActive: this.isActive,
    joinedAt: this.createdAt,
  };
};

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);

module.exports = ProjectMember;
module.exports.PROJECT_ROLES = PROJECT_ROLES;
