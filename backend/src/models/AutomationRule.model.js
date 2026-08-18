const mongoose = require('mongoose');

const ruleLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    issueKey: { type: String, default: '' },
    status: { type: String, enum: ['SUCCESS', 'SKIPPED', 'FAILED'], default: 'SUCCESS' },
    message: { type: String, required: true },
  },
  { _id: false }
);

const automationRuleSchema = new mongoose.Schema(
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
      default: null,
    },
    projectKey: {
      type: String,
      default: 'GLOBAL',
    },
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    trigger: {
      type: {
        type: String, // 'ISSUE_CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'COMMENT_ADDED', 'SPRINT_STARTED'
        required: true,
      },
      config: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    conditions: {
      type: [
        {
          field: String, // 'priority', 'status', 'type', 'assignee'
          operator: String, // 'EQUALS', 'NOT_EQUALS', 'CONTAINS'
          value: mongoose.Schema.Types.Mixed,
        },
      ],
      default: [],
    },
    actions: {
      type: [
        {
          type: { type: String }, // 'ASSIGN_USER', 'CHANGE_STATUS', 'ADD_COMMENT', 'SET_PRIORITY', 'SEND_NOTIFICATION'
          config: mongoose.Schema.Types.Mixed,
        },
      ],
      default: [],
    },
    executionCount: {
      type: Number,
      default: 0,
    },
    lastExecutedAt: {
      type: Date,
      default: null,
    },
    logs: {
      type: [ruleLogSchema],
      default: [],
    },
  },
  { timestamps: true }
);

automationRuleSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    projectId: this.projectId?.toString() || null,
    projectKey: this.projectKey,
    name: this.name,
    description: this.description,
    enabled: this.enabled,
    trigger: this.trigger,
    conditions: this.conditions,
    actions: this.actions,
    executionCount: this.executionCount,
    lastExecutedAt: this.lastExecutedAt ? this.lastExecutedAt.toISOString() : null,
    logs: this.logs.slice(-20), // return recent 20 logs
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const AutomationRule = mongoose.model('AutomationRule', automationRuleSchema);

module.exports = AutomationRule;
