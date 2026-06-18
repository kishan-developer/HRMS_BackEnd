import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  code: string;
  module: string;
  description?: string;
  category: 'view' | 'create' | 'update' | 'delete' | 'approve' | 'export' | 'import';
  isSystemPermission: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema: Schema = new Schema(
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
    module: {
      type: String,
      required: true,
      enum: [
        'employees',
        'attendance',
        'leave',
        'payroll',
        'recruitment',
        'performance',
        'assets',
        'training',
        'reports',
        'settings',
        'companies',
        'users',
        'roles',
        'notifications',
        'audit_logs',
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['view', 'create', 'update', 'delete', 'approve', 'export', 'import'],
      required: true,
    },
    isSystemPermission: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PermissionSchema.index({ code: 1 });
PermissionSchema.index({ module: 1 });
PermissionSchema.index({ category: 1 });

export default mongoose.model<IPermission>('Permission', PermissionSchema);
