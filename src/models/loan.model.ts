import mongoose, { Document, Schema } from 'mongoose';

export interface ILoan extends Document {
  employeeId: string;
  loanType: string;
  amount: number;
  interestRate?: number;
  tenureMonths: number;
  monthlyInstallment: number;
  startDate: Date;
  endDate: Date;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Completed' | 'Defaulted';
  purpose?: string;
  approvedBy?: string;
  approvedAt?: Date;
  remainingAmount: number;
  installmentsPaid: number;
  timeline?: Array<{ date: Date; action: string; description: string; actor: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    employeeId: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    loanType: {
      type: String,
      required: true,
      enum: ['Personal', 'Housing', 'Education', 'Medical', 'Emergency', 'Other'],
    },
    amount: {
      type: Number,
      required: true,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    tenureMonths: {
      type: Number,
      required: true,
    },
    monthlyInstallment: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Completed', 'Defaulted'],
      default: 'Pending',
    },
    purpose: {
      type: String,
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    remainingAmount: {
      type: Number,
      required: true,
    },
    installmentsPaid: {
      type: Number,
      default: 0,
    },
    timeline: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Loan = mongoose.model<ILoan>('Loan', loanSchema);
