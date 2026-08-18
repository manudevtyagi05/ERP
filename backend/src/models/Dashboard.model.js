const mongoose = require('mongoose');

const widgetSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true }, // e.g. 'ASSIGNED_TO_ME', 'BURNDOWN', 'VELOCITY', 'CREATED_VS_RESOLVED', 'STATUS_PIE', 'ACTIVITY_STREAM', 'RELEASE_PROGRESS'
    title: { type: String, required: true },
    colSpan: { type: Number, default: 12 }, // out of 24 cols in Antd Grid
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const dashboardSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'companyId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Dashboard name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    owner: {
      id: String,
      name: String,
      email: String,
      avatar: String,
    },
    widgets: {
      type: [widgetSchema],
      default: [
        { id: 'w1', type: 'STATS_KPIS', title: 'Key Performance Indicators', colSpan: 24, config: {} },
        { id: 'w2', type: 'ASSIGNED_TO_ME', title: 'Assigned to Me', colSpan: 12, config: { limit: 5 } },
        { id: 'w3', type: 'STATUS_PIE', title: 'Issue Status Breakdown', colSpan: 12, config: {} },
        { id: 'w4', type: 'SPRINT_BURNDOWN', title: 'Active Sprint Health & Burndown', colSpan: 12, config: {} },
        { id: 'w5', type: 'ACTIVITY_STREAM', title: 'Recent Activity Stream', colSpan: 12, config: { limit: 6 } },
      ],
    },
  },
  { timestamps: true }
);

dashboardSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    isDefault: this.isDefault,
    owner: this.owner,
    widgets: this.widgets,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

module.exports = Dashboard;
