import mongoose, { Document, Schema } from 'mongoose';

// Permission interface
export interface IPermission extends Document {
  module: string;
  action: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Role interface
export interface IRole extends Document {
  name: string;
  code: string;
  description?: string;
  priority: number;
  isActive: boolean;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Role Permissions interface
export interface IRolePermission extends Document {
  roleId: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// User Permission Override interface
export interface IUserPermission extends Document {
  userId: string;
  override: boolean;
  allow: string[];
  deny: string[];
  companyId?: string;
  branchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Permission interface
export interface IAPIPermission extends Document {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  roles: string[];
  rateLimit?: number;
  ipWhitelist?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Page Access interface
export interface IPageAccess extends Document {
  route: string;
  name: string;
  category: string;
  allowedRoles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Permission Schema
const permissionSchema = new Schema<IPermission>(
  {
    module: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      required: true,
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'import', 'manage'],
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

// Compound index for module + action
permissionSchema.index({ module: 1, action: 1 }, { unique: true });

// Role Schema
const roleSchema = new Schema<IRole>(
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
    },
    description: {
      type: String,
    },
    priority: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    permissions: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Role Permission Schema
const rolePermissionSchema = new Schema<IRolePermission>(
  {
    roleId: {
      type: String,
      required: true,
      unique: true,
    },
    permissions: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// User Permission Schema
const userPermissionSchema = new Schema<IUserPermission>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    override: {
      type: Boolean,
      default: false,
    },
    allow: [
      {
        type: String,
      },
    ],
    deny: [
      {
        type: String,
      },
    ],
    companyId: {
      type: String,
    },
    branchId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// API Permission Schema
const apiPermissionSchema = new Schema<IAPIPermission>(
  {
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    roles: [
      {
        type: String,
      },
    ],
    rateLimit: {
      type: Number,
      default: 100, // requests per minute
    },
    ipWhitelist: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for endpoint + method
apiPermissionSchema.index({ endpoint: 1, method: 1 }, { unique: true });

// Page Access Schema
const pageAccessSchema = new Schema<IPageAccess>(
  {
    route: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    allowedRoles: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Export models
export const Permission = mongoose.models.Permission || mongoose.model<IPermission>('Permission', permissionSchema);
export const Role = mongoose.models.Role || mongoose.model<IRole>('Role', roleSchema);
export const RolePermission = mongoose.models.RolePermission || mongoose.model<IRolePermission>('RolePermission', rolePermissionSchema);
export const UserPermission = mongoose.models.UserPermission || mongoose.model<IUserPermission>('UserPermission', userPermissionSchema);
export const APIPermission = mongoose.models.APIPermission || mongoose.model<IAPIPermission>('APIPermission', apiPermissionSchema);
export const PageAccess = mongoose.models.PageAccess || mongoose.model<IPageAccess>('PageAccess', pageAccessSchema);
