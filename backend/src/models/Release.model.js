const mongoose = require('mongoose');

const RELEASE_STATUSES = ['UNRELEASED', 'RELEASED', 'ARCHIVED'];

const releaseSchema = new mongoose.Schema(
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
      required: [true, 'Version name is required (e.g. v1.0.0)'],
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      default: null,
    },
    releaseDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: RELEASE_STATUSES,
      default: 'UNRELEASED',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

releaseSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    projectId: this.projectId?.toString(),
    projectKey: this.projectKey,
    name: this.name,
    description: this.description,
    startDate: this.startDate ? this.startDate.toISOString() : null,
    releaseDate: this.releaseDate ? this.releaseDate.toISOString() : null,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Release = mongoose.model('Release', releaseSchema);

module.exports = Release;
module.exports.RELEASE_STATUSES = RELEASE_STATUSES;
