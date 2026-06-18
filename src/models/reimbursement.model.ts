import mongoose, { Document, Schema } from 'mongoose';

export interface IReimbursement extends Document {
  employeeId: string;
  claimType: string;
  claimDate: Date;
  submittedOn: Date;
  amountClaimed: number;
  description?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Forwarded to Payroll' | 'Paid';
  allowedLimit?: number;
  timeline?: Array<{ date: Date; action: string; description: string; actor: string }>;
  payrollMonth?: string;
  payrollReferenceId?: string;
  documents?: Array<{ name: string; type: string; url: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const reimbursementSchema = new Schema<IReimbursement>(
  {
    employeeId: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    claimType: {
      type: String,
      required: true,
    },
    claimDate: {
      type: Date,
      required: true,
    },
    submittedOn: {
      type: Date,
      required: true,
    },
    amountClaimed: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Forwarded to Payroll', 'Paid'],
      default: 'Pending',
    },
    allowedLimit: {
      type: Number,
    },
    timeline: {
      type: Array,
      default: [],
    },
    payrollMonth: {
      type: String,
    },
    payrollReferenceId: {
      type: String,
    },
    documents: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Reimbursement = mongoose.model<IReimbursement>('Reimbursement', reimbursementSchema);
