const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
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
    actor: {
      id: String,
      name: String,
      email: String,
      avatar: String,
    },
    action: {
      type: String, // 'PROJECT_CREATED', 'ISSUE_TRANSITIONED', 'SPRINT_STARTED', 'SPRINT_COMPLETED', 'PERMISSION_CHANGED', 'RULE_TRIGGERED', 'USER_INVITED'
      required: true,
      index: true,
    },
    objectType: {
      type: String, // 'Issue', 'Project', 'Sprint', 'User', 'AutomationRule', 'Release'
      required: true,
    },
    objectId: {
      type: String,
      default: '',
    },
    objectLabel: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  { timestamps: true }
);

auditLogSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    actor: this.actor,
    action: this.action,
    objectType: this.objectType,
    objectId: this.objectId,
    objectLabel: this.objectLabel,
    details: this.details,
    ipAddress: this.ipAddress,
    createdAt: this.createdAt,
  };
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
