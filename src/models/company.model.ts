import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  logo?: string;
  website?: string;
  industry: string;
  size: string;
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'expired';
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  maxEmployees: number;
  maxBranches: number;
  status: 'active' | 'inactive' | 'suspended';
  settings: {
    timezone: string;
    currency: string;
    dateFormat: string;
    language: string;
  };
  adminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    zipCode: {
      type: String,
      required: true,
    },

    logo: {
      type: String,
      default: '',
    },

    website: {
      type: String,
      default: '',
    },

    industry: {
      type: String,
      required: true,
    },

    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      required: true,
    },

    subscriptionPlan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'starter',
    },

    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'trial', 'expired'],
      default: 'trial',
    },

    subscriptionStartDate: {
      type: Date,
      default: Date.now,
    },

    subscriptionEndDate: {
      type: Date,
      required: true,
    },

    maxEmployees: {
      type: Number,
      default: 10,
      min: 1,
    },

    maxBranches: {
      type: Number,
      default: 1,
      min: 1,
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },

    settings: {
      timezone: {
        type: String,
        default: 'Asia/Kolkata',
      },

      currency: {
        type: String,
        default: 'INR',
      },

      dateFormat: {
        type: String,
        default: 'DD/MM/YYYY',
      },

      language: {
        type: String,
        default: 'en',
      },
    },

    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Additional indexes only for non-unique search fields
CompanySchema.index({ status: 1 });
CompanySchema.index({ subscriptionStatus: 1 });
CompanySchema.index({ name: 1 });
CompanySchema.index({ city: 1 });
CompanySchema.index({ createdAt: -1 });

export default mongoose.models.Company ||
  mongoose.model<ICompany>('Company', CompanySchema);