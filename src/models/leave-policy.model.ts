import mongoose, { Document, Schema } from 'mongoose';

export interface ILeavePolicy extends Document {
  casualLeaveDays: number;
  sickLeaveDays: number;
  earnedLeaveDays: number;
  maternityLeaveDays: number;
  paternityLeaveDays: number;
  unpaidLeaveDays: number;
  carryForwardEnabled: boolean;
  leaveEncashmentEnabled: boolean;
  sandwichLeaveRule: boolean;
  maxCarryForwardDays: number;
  minServiceForEncashment: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leavePolicySchema = new Schema<ILeavePolicy>(
  {
    casualLeaveDays: {
      type: Number,
      default: 12,
    },
    sickLeaveDays: {
      type: Number,
      default: 8,
    },
    earnedLeaveDays: {
      type: Number,
      default: 15,
    },
    maternityLeaveDays: {
      type: Number,
      default: 180,
    },
    paternityLeaveDays: {
      type: Number,
      default: 15,
    },
    unpaidLeaveDays: {
      type: Number,
      default: 0,
    },
    carryForwardEnabled: {
      type: Boolean,
      default: true,
    },
    leaveEncashmentEnabled: {
      type: Boolean,
      default: true,
    },
    sandwichLeaveRule: {
      type: Boolean,
      default: false,
    },
    maxCarryForwardDays: {
      type: Number,
      default: 15,
    },
    minServiceForEncashment: {
      type: Number,
      default: 240,
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

export const LeavePolicy = mongoose.model<ILeavePolicy>('LeavePolicy', leavePolicySchema);
