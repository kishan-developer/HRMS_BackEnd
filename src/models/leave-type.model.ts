import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveType extends Document {
  name: string;
  code: string;
  description: string;
  daysAllowed: number;
  isPaid: boolean;
  requiresApproval: boolean;
  requiresDocument: boolean;
  carryForwardAllowed: boolean;
  maxCarryForwardDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leaveTypeSchema = new Schema<ILeaveType>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    daysAllowed: {
      type: Number,
      required: true,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    requiresDocument: {
      type: Boolean,
      default: false,
    },
    carryForwardAllowed: {
      type: Boolean,
      default: false,
    },
    maxCarryForwardDays: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveType = mongoose.model<ILeaveType>('LeaveType', leaveTypeSchema);
