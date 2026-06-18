import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPermissionOverride extends Document {
  userId: string;
  grantedPageRoutes: string[];
  revokedPageRoutes: string[];
  grantedPermissionIds: string[];
  revokedPermissionIds: string[];
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
}

const UserPermissionOverrideSchema = new Schema<IUserPermissionOverride>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      unique: true,
    },
    grantedPageRoutes: [
      {
        type: String,
      },
    ],
    revokedPageRoutes: [
      {
        type: String,
      },
    ],
    grantedPermissionIds: [
      {
        type: String,
        ref: 'Permission',
      },
    ],
    revokedPermissionIds: [
      {
        type: String,
        ref: 'Permission',
      },
    ],
    updatedBy: {
      type: String,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUserPermissionOverride>('UserPermissionOverride', UserPermissionOverrideSchema);
