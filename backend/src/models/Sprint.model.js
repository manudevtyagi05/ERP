const mongoose = require('mongoose');

const SPRINT_STATUSES = ['FUTURE', 'ACTIVE', 'CLOSED'];

const sprintSchema = new mongoose.Schema(
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
      required: [true, 'Sprint name is required'],
      trim: true,
      maxlength: 100,
    },
    goal: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: SPRINT_STATUSES,
      default: 'FUTURE',
      index: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    storyPointsPlanned: {
      type: Number,
      default: 0,
    },
    storyPointsDone: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

sprintSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    projectId: this.projectId?.toString(),
    projectKey: this.projectKey,
    name: this.name,
    goal: this.goal,
    status: this.status,
    startDate: this.startDate ? this.startDate.toISOString() : null,
    endDate: this.endDate ? this.endDate.toISOString() : null,
    completedAt: this.completedAt ? this.completedAt.toISOString() : null,
    storyPointsPlanned: this.storyPointsPlanned,
    storyPointsDone: this.storyPointsDone,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Sprint = mongoose.model('Sprint', sprintSchema);

module.exports = Sprint;
module.exports.SPRINT_STATUSES = SPRINT_STATUSES;
