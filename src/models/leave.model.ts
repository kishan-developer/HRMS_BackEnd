import mongoose, { Document, Schema } from 'mongoose';

export interface ILeave extends Document {
  employeeId: string;
  leaveType: 'Sick Leave' | 'Casual Leave' | 'Earned Leave' | 'Maternity Leave' | 'Paternity Leave' | 'Unpaid Leave';
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancel Requested';
  attachmentUrl?: string;
  approvedBy?: string;
  approvedAt?: Date;
  managerNotes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    employeeId: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    leaveType: {
      type: String,
      required: true,
      enum: ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave'],
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancel Requested'],
      default: 'Pending',
    },
    attachmentUrl: {
      type: String,
    },
    approvedBy: {
      type: String,
      ref: 'Employee',
    },
    approvedAt: {
      type: Date,
    },
    managerNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Leave = mongoose.model<ILeave>('Leave', leaveSchema);
