const mongoose = require('mongoose');

const STATUSES = ['Active', 'Planning', 'Completed', 'Archived'];

const projectSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'companyId is required'],
      index: true,
    },
    key: {
      type: String,
      required: [true, 'Project key prefix is required'],
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      trim: true,
      default: 'Software Architecture',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    lead: {
      type: String,
      trim: true,
      default: '',
    },
    leadEmail: {
      type: String,
      trim: true,
      default: '',
    },
    leadAvatar: {
      type: String,
      default: '',
    },
    avatarBg: {
      type: String,
      default: '#2563eb',
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'Active',
    },
    star: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

projectSchema.index({ companyId: 1, key: 1 }, { unique: true });

projectSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    key: this.key,
    name: this.name,
    category: this.category,
    description: this.description,
    lead: this.lead,
    leadEmail: this.leadEmail,
    leadAvatar: this.leadAvatar,
    avatarBg: this.avatarBg,
    status: this.status,
    star: this.star,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
module.exports.PROJECT_STATUSES = STATUSES;
