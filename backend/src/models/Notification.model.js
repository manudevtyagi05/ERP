const mongoose = require('mongoose');

const TYPES = ['ASSIGNED', 'REASSIGNED', 'STATUS_CHANGED', 'COMMENT'];

const notificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    issueKey: {
      type: String,
      default: null,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ companyId: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ companyId: 1, userId: 1, read: 1 });

notificationSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    type: this.type,
    title: this.title,
    message: this.message,
    issueId: this.issueId ? this.issueId.toString() : null,
    issueKey: this.issueKey,
    read: this.read,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
module.exports.NOTIFICATION_TYPES = TYPES;
