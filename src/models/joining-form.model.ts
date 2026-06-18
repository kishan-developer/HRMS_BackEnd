import mongoose, { Schema, Document } from 'mongoose';

export interface IJoiningForm extends Document {
  token: string;
  employeeName: string;
  email: string;
  departmentId: mongoose.Types.ObjectId;
  joiningDate: Date;
  status: 'pending' | 'submitted' | 'expired';
  expiresAt: Date;
  submittedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const joiningFormSchema = new Schema<IJoiningForm>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    submittedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for token lookup with status and expiry
joiningFormSchema.index({ token: 1, status: 1, expiresAt: 1 });

export const JoiningForm = mongoose.model<IJoiningForm>('JoiningForm', joiningFormSchema);
