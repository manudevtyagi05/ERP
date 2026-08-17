const mongoose = require('mongoose');

const TYPES = ['Story', 'Bug', 'Task', 'Epic'];
const STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const subtaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    author: {
      id: String,
      name: String,
      email: String,
      avatar: String,
    },
    content: { type: String, required: true, trim: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const ACTIVITY_TYPES = [
  'CREATED',
  'ASSIGNED',
  'REASSIGNED',
  'UNASSIGNED',
  'STATUS_CHANGED',
  'PRIORITY_CHANGED',
  'DUE_DATE_CHANGED',
  'TITLE_CHANGED',
  'DESCRIPTION_CHANGED',
  'MILESTONE_CHANGED',
  'COMMENT_ADDED',
  'COMPLETED',
  'REOPENED',
  'SPRINT_CHANGED',
];

const activitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    message: { type: String, required: true, trim: true },
    fromValue: { type: String, default: null },
    toValue: { type: String, default: null },
    actor: {
      id: String,
      name: String,
      email: String,
    },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
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
    projectName: {
      type: String,
      trim: true,
      default: '',
    },
    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    issueNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Issue summary/title is required'],
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: TYPES,
      default: 'Task',
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'TODO',
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'MEDIUM',
    },
    assignee: {
      id: String,
      name: String,
      email: String,
      avatar: String,
      role: String,
      department: String,
    },
    reporter: {
      id: String,
      name: String,
      email: String,
    },
    storyPoints: {
      type: Number,
      default: 3,
    },
    dueDate: {
      type: String,
      default: () => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    },
    epic: {
      type: String,
      default: '',
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
      index: true,
    },
    backlogOrder: {
      type: Number,
      default: 0,
    },
    labels: {
      type: [String],
      default: [],
    },
    subtasks: {
      type: [subtaskSchema],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    activity: {
      type: [activitySchema],
      default: [],
    },
    assignedAt: {
      type: Date,
      default: null,
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

issueSchema.index({ companyId: 1, key: 1 }, { unique: true });
issueSchema.index({ companyId: 1, status: 1 });
issueSchema.index({ companyId: 1, projectKey: 1 });

issueSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    key: this.key,
    issueNumber: this.issueNumber,
    title: this.title,
    description: this.description,
    projectId: this.projectId?.toString(),
    projectKey: this.projectKey,
    projectName: this.projectName,
    type: this.type,
    status: this.status,
    priority: this.priority,
    assignee: this.assignee,
    reporter: this.reporter,
    storyPoints: this.storyPoints,
    dueDate: this.dueDate,
    epic: this.epic,
    milestoneId: this.milestoneId ? this.milestoneId.toString() : null,
    sprintId: this.sprintId ? this.sprintId.toString() : null,
    backlogOrder: this.backlogOrder,
    labels: this.labels,
    subtasks: this.subtasks,
    comments: this.comments,
    activity: this.activity,
    createdBy: this.createdBy ? this.createdBy.toString() : null,
    assignedAt: this.assignedAt,
    startedAt: this.startedAt,
    completedAt: this.completedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
module.exports.ISSUE_TYPES = TYPES;
module.exports.ISSUE_STATUSES = STATUSES;
module.exports.ISSUE_PRIORITIES = PRIORITIES;
module.exports.ISSUE_ACTIVITY_TYPES = ACTIVITY_TYPES;
