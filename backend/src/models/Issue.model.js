const mongoose = require('mongoose');

const TYPES = ['Story', 'Bug', 'Task', 'Epic', 'Sub-task', 'Improvement', 'Feature'];
const STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES = ['HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST', 'CRITICAL'];

const subtaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    assignee: {
      id: String,
      name: String,
      email: String,
      avatar: String,
    },
    status: { type: String, default: 'TODO' },
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
    reactions: {
      type: Map,
      of: [String], // emoji key -> array of userIds
      default: {},
    },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: null },
  },
  { _id: false }
);

const workLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    author: {
      id: String,
      name: String,
      email: String,
      avatar: String,
    },
    timeSpent: { type: Number, required: true }, // in hours
    remainingEstimate: { type: Number, default: 0 },
    description: { type: String, trim: true, default: '' },
    date: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const issueLinkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    relationship: {
      type: String, // 'blocks', 'is blocked by', 'relates to', 'duplicates', 'is duplicated by', 'depends on'
      required: true,
    },
    targetIssueId: { type: String, default: '' },
    targetIssueKey: { type: String, required: true },
    targetIssueTitle: { type: String, default: '' },
    targetIssueStatus: { type: String, default: 'TODO' },
  },
  { _id: false }
);

const watcherSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    email: String,
    avatar: String,
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
  'SPRINT_CHANGED',
  'EPIC_CHANGED',
  'COMMENT_ADDED',
  'WORKLOG_ADDED',
  'LINK_ADDED',
  'SUBTASK_ADDED',
  'SUBTASK_UPDATED',
  'COMPLETED',
  'REOPENED',
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
      avatar: String,
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
      index: true,
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
      avatar: String,
    },
    storyPoints: {
      type: Number,
      default: 3,
    },
    dueDate: {
      type: String,
      default: () => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    },
    startDate: {
      type: String,
      default: null,
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
      index: true,
    },
    epicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Epic',
      default: null,
      index: true,
    },
    epic: {
      type: String,
      default: '',
    },
    componentIds: {
      type: [String],
      default: [],
    },
    fixVersionIds: {
      type: [String],
      default: [],
    },
    affectedVersionIds: {
      type: [String],
      default: [],
    },
    labels: {
      type: [String],
      default: [],
    },
    originalEstimate: {
      type: Number, // in hours
      default: 8,
    },
    remainingEstimate: {
      type: Number, // in hours
      default: 8,
    },
    timeSpent: {
      type: Number, // in hours
      default: 0,
    },
    workLogs: {
      type: [workLogSchema],
      default: [],
    },
    issueLinks: {
      type: [issueLinkSchema],
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
    watchers: {
      type: [watcherSchema],
      default: [],
    },
    votes: {
      type: [String], // user ids
      default: [],
    },
    activity: {
      type: [activitySchema],
      default: [],
    },
    devInfo: {
      branches: {
        type: [
          {
            name: String,
            url: String,
          },
        ],
        default: [],
      },
      pullRequests: {
        type: [
          {
            id: String,
            title: String,
            status: { type: String, default: 'OPEN' }, // 'OPEN', 'MERGED', 'DECLINED'
            url: String,
          },
        ],
        default: [],
      },
      buildStatus: {
        type: String,
        default: 'Passed',
      },
      deploymentStatus: {
        type: String,
        default: 'Production',
      },
    },
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
issueSchema.index({ companyId: 1, sprintId: 1 });

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
    startDate: this.startDate,
    sprintId: this.sprintId ? this.sprintId.toString() : null,
    epicId: this.epicId ? this.epicId.toString() : null,
    epic: this.epic,
    componentIds: this.componentIds || [],
    fixVersionIds: this.fixVersionIds || [],
    affectedVersionIds: this.affectedVersionIds || [],
    labels: this.labels || [],
    originalEstimate: this.originalEstimate || 0,
    remainingEstimate: this.remainingEstimate || 0,
    timeSpent: this.timeSpent || 0,
    workLogs: this.workLogs || [],
    issueLinks: this.issueLinks || [],
    subtasks: this.subtasks || [],
    comments: this.comments || [],
    watchers: this.watchers || [],
    votes: this.votes || [],
    activity: this.activity || [],
    devInfo: this.devInfo || {},
    customFields: this.customFields || {},
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
