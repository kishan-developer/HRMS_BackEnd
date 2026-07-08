import mongoose, { Schema, Document } from 'mongoose';

// Brochure Request Interface
export interface IBrochureRequest extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  message?: string;
  budget?: string;
  projectType: string;
  brochureType: string;
  brochureTitle: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
  createdAt: Date;
  updatedAt: Date;
}

// Brochure Request Schema
const BrochureRequestSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    budget: {
      type: String,
      trim: true,
    },
    projectType: {
      type: String,
      required: true,
      trim: true,
    },
    brochureType: {
      type: String,
      required: true,
      trim: true,
    },
    brochureTitle: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'],
      default: 'New',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BrochureRequestSchema.index({ status: 1 });
BrochureRequestSchema.index({ email: 1 });
BrochureRequestSchema.index({ createdAt: -1 });

export const BrochureRequest = mongoose.model<IBrochureRequest>('BrochureRequest', BrochureRequestSchema);
