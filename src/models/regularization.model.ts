import mongoose, { Document, Schema } from 'mongoose';

export interface IRegularization extends Document {
  employeeId: string;
  date: Date;
  issueType: 'Late Check-in' | 'Early Check-out' | 'Missing Punch';
  punchType: 'Punch In' | 'Punch Out';
  requestedTime: string;
  reason?: string;
  attachmentUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  managerNote?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const regularizationSchema = new Schema<IRegularization>(
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
    issueType: {
      type: String,
      required: true,
      enum: ['Late Check-in', 'Early Check-out', 'Missing Punch'],
    },
    punchType: {
      type: String,
      required: true,
      enum: ['Punch In', 'Punch Out'],
    },
    requestedTime: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    attachmentUrl: {
      type: String,
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

export const Regularization = mongoose.model<IRegularization>('Regularization', regularizationSchema);
