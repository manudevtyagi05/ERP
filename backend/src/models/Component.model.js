const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema(
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
      required: [true, 'Component name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    lead: {
      id: String,
      name: String,
      email: String,
      avatar: String,
    },
    defaultAssignee: {
      id: String,
      name: String,
      email: String,
      avatar: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

componentSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    projectId: this.projectId?.toString(),
    projectKey: this.projectKey,
    name: this.name,
    description: this.description,
    lead: this.lead,
    defaultAssignee: this.defaultAssignee,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Component = mongoose.model('Component', componentSchema);

module.exports = Component;
