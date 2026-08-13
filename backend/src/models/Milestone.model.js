const mongoose = require('mongoose');

const MILESTONE_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];

const milestoneSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Milestone name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: String,
      default: null,
    },
    dueDate: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: MILESTONE_STATUSES,
      default: 'PLANNED',
    },
    position: {
      type: Number,
      default: 0,
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

milestoneSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    projectId: this.projectId.toString(),
    name: this.name,
    description: this.description,
    startDate: this.startDate,
    dueDate: this.dueDate,
    status: this.status,
    position: this.position,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Milestone = mongoose.model('Milestone', milestoneSchema);

module.exports = Milestone;
module.exports.MILESTONE_STATUSES = MILESTONE_STATUSES;
