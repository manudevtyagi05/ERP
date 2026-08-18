const mongoose = require('mongoose');

const EPIC_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

const epicSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'companyId is required'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'projectId is required'],
      index: true,
    },
    projectKey: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Epic name is required'],
      trim: true,
      maxlength: 120,
    },
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      default: '#7c3aed',
    },
    status: {
      type: String,
      enum: EPIC_STATUSES,
      default: 'TODO',
    },
    owner: {
      id: String,
      name: String,
      email: String,
      avatar: String,
    },
    startDate: {
      type: Date,
      default: null,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

epicSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    projectId: this.projectId?.toString(),
    projectKey: this.projectKey,
    name: this.name,
    summary: this.summary,
    description: this.description,
    color: this.color,
    status: this.status,
    owner: this.owner,
    startDate: this.startDate ? this.startDate.toISOString() : null,
    targetDate: this.targetDate ? this.targetDate.toISOString() : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Epic = mongoose.model('Epic', epicSchema);

module.exports = Epic;
module.exports.EPIC_STATUSES = EPIC_STATUSES;
