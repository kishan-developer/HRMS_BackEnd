import mongoose, { Document, Schema } from 'mongoose';

export interface IOvertime extends Document {
  employeeId: string;
  date: Date;
  actualHours: number;
  allowedHours: number;
  overtimeHours: number;
  otType: 'Weekday' | 'Weekend' | 'Holiday';
  reason?: string;
  attachmentUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  managerNote?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const overtimeSchema = new Schema<IOvertime>(
  {
    employeeId: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    date: {
      type: Date,
      required: true,
    },
    actualHours: {
      type: Number,
      required: true,
    },
    allowedHours: {
      type: Number,
      required: true,
    },
    overtimeHours: {
      type: Number,
      required: true,
    },
    otType: {
      type: String,
      required: true,
      enum: ['Weekday', 'Weekend', 'Holiday'],
    },
    reason: {
      type: String,
    },
    attachmentUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    approvedBy: {
      type: String,
      ref: 'Employee',
    },
    managerNote: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Overtime = mongoose.model<IOvertime>('Overtime', overtimeSchema);
