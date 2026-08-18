const mongoose = require('mongoose');

const filterSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'companyId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Filter name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    query: {
      type: String,
      required: [true, 'Filter query is required'],
      trim: true,
    },
    owner: {
      id: String,
      name: String,
      email: String,
      avatar: String,
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'PROJECT', 'ORGANIZATION'],
      default: 'ORGANIZATION',
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
  },
  { timestamps: true }
);

filterSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    query: this.query,
    owner: this.owner,
    visibility: this.visibility,
    isFavorite: this.isFavorite,
    projectId: this.projectId?.toString() || null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Filter = mongoose.model('Filter', filterSchema);

module.exports = Filter;
