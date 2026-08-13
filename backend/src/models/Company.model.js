const mongoose = require('mongoose');

const STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'ARCHIVED'];

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, 'Company code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Company email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'ACTIVE',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSupport: {
      type: Boolean,
      default: false,
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

companySchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    slug: this.slug,
    email: this.email,
    phone: this.phone,
    status: this.status,
    isActive: this.isActive,
    isSupport: this.isSupport,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
module.exports.STATUSES = STATUSES;
