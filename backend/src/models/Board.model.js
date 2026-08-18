const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    status: { type: String, required: true },
    wipLimit: { type: Number, default: 0 }, // 0 = unlimited
    color: { type: String, default: '#3b82f6' },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
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
      required: true,
      default: 'Main Board',
    },
    type: {
      type: String,
      enum: ['KANBAN', 'SCRUM'],
      default: 'SCRUM',
    },
    columns: {
      type: [columnSchema],
      default: [
        { id: 'BACKLOG', title: 'Backlog', status: 'BACKLOG', wipLimit: 0, color: '#94a3b8' },
        { id: 'TODO', title: 'To Do', status: 'TODO', wipLimit: 0, color: '#60a5fa' },
        { id: 'IN_PROGRESS', title: 'In Progress', status: 'IN_PROGRESS', wipLimit: 5, color: '#3b82f6' },
        { id: 'IN_REVIEW', title: 'In Review', status: 'IN_REVIEW', wipLimit: 3, color: '#f59e0b' },
        { id: 'DONE', title: 'Done', status: 'DONE', wipLimit: 0, color: '#22c55e' },
      ],
    },
  },
  { timestamps: true }
);

boardSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    projectId: this.projectId?.toString(),
    projectKey: this.projectKey,
    name: this.name,
    type: this.type,
    columns: this.columns,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;
