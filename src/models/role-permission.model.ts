import mongoose, { Schema, Document } from 'mongoose';

export interface IRolePermission extends Document {
  roleId: string;
  pageIds: string[];
  permissionIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RolePermissionSchema = new Schema<IRolePermission>(
  {
    roleId: {
      type: String,
      required: true,
      ref: 'Role',
    },
    pageIds: [
      {
        type: String,
        ref: 'Page',
      },
    ],
    permissionIds: [
      {
        type: String,
        ref: 'Permission',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
RolePermissionSchema.index({ roleId: 1 }, { unique: true });

export default mongoose.model<IRolePermission>('RolePermission', RolePermissionSchema);
