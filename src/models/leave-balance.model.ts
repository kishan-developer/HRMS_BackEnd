import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveBalance extends Document {
  userId: string;
  employeeId: string;
  year: number;
  casualLeave: number;
  sickLeave: number;
  earnedLeave: number;
  maternityLeave: number;
  paternityLeave: number;
  unpaidLeave: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    employeeId: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    year: {
      type: Number,
      required: true,
    },
    casualLeave: {
      type: Number,
      default: 12,
    },
    sickLeave: {
      type: Number,
      default: 8,
    },
    earnedLeave: {
      type: Number,
      default: 15,
    },
    maternityLeave: {
      type: Number,
      default: 180,
    },
    paternityLeave: {
      type: Number,
      default: 15,
    },
    unpaidLeave: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

export const LeaveBalance = mongoose.model<ILeaveBalance>('LeaveBalance', leaveBalanceSchema);
