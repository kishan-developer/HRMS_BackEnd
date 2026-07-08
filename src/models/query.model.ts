import mongoose, { Schema, Document } from 'mongoose';

// Query/Lead Interface
export interface IQuery extends Document {
  queryId: string;
  clientName: string;
  email: string;
  phone: string;
  message: string;
  propertyInterest: string;
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Query Schema
const QuerySchema: Schema = new Schema(
  {
    queryId: {
      type: String,
      required: true,
      unique: true,
    },
    clientName: {
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
    message: {
      type: String,
      required: true,
    },
    propertyInterest: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'],
      default: 'New',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
QuerySchema.index({ status: 1 });
QuerySchema.index({ email: 1 });
QuerySchema.index({ createdAt: -1 });

export const Query = mongoose.model<IQuery>('Query', QuerySchema);
