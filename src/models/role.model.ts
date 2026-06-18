import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  code: string;
  description?: string;
  companyId?: string;
  isSystemRole: boolean;
  permissions: {
    module: string;
    actions: string[];
  }[];
  status: 'active' | 'inactive';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    companyId: {
      type: String,
      ref: 'Company',
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    permissions: [
      {
        module: {
          type: String,
          required: true,
        },
        actions: {
          type: [String],
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    createdBy: {
      type: String,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoleSchema.index({ companyId: 1 });
RoleSchema.index({ status: 1 });

export default mongoose.model<IRole>('Role', RoleSchema);
