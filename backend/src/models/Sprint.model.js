const mongoose = require('mongoose');

const SPRINT_STATUSES = ['PLANNING', 'ACTIVE', 'COMPLETED'];

const sprintSchema = new mongoose.Schema(
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
      required: [true, 'Sprint name is required'],
      trim: true,
      maxlength: 150,
    },
    goal: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: String,
      default: null,
    },
    endDate: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: SPRINT_STATUSES,
      default: 'PLANNING',
    },
    position: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
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

sprintSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    projectId: this.projectId.toString(),
    name: this.name,
    goal: this.goal,
    startDate: this.startDate,
    endDate: this.endDate,
    status: this.status,
    position: this.position,
    startedAt: this.startedAt,
    completedAt: this.completedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Sprint = mongoose.model('Sprint', sprintSchema);

module.exports = Sprint;
module.exports.SPRINT_STATUSES = SPRINT_STATUSES;
