import { Request, Response, NextFunction } from 'express';
import { Role, Permission, RolePermission, UserPermission, APIPermission, PageAccess } from '../models/access-control.model';
import AuditLog from '../models/audit-log.model';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/user.model';
import Page from '../models/page.model';
import UserPermissionOverride from '../models/user-permission-override.model';

// ==================== ROLES ====================

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status } = req.query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    const roles = await Role.find(filter).sort({ priority: -1, name: 1 });

    return res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    return;
    next(error);
  }
};

export const getRoleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    const rolePermissions = await RolePermission.findOne({ roleId: role._id });

    return res.json({
      success: true,
      data: {
        ...role.toObject(),
        permissions: rolePermissions?.permissions || [],
      },
    });
  } catch (error) {
    return;
    next(error);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, description, priority, permissions } = req.body;
    const { userId } = (req as any);

    const existingRole = await Role.findOne({ code: code.toUpperCase() });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ROLE_ALREADY_EXISTS',
          message: 'Role with this code already exists',
        },
      });
    }

    const role = new Role({
      id: uuidv4(),
      name,
      code: code.toUpperCase(),
      description,
      priority: priority || 0,
      permissions: permissions || [],
      isActive: true,
      isSystem: false,
    });

    await role.save();

    if (permissions && permissions.length > 0) {
      await RolePermission.create({
        roleId: role._id.toString(),
        permissions,
      });
    }

    await AuditLog.create({
      userId,
      action: 'create',
      module: 'access-control',
      entityType: 'Role',
      entityId: role._id.toString(),
      description: `Created role: ${name}`,
    });

    return res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    return;
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, priority, permissions, isActive } = req.body;
    const { userId } = (req as any);

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CANNOT_MODIFY_SYSTEM_ROLE',
          message: 'Cannot modify system roles',
        },
      });
    }

    role.name = name || role.name;
    role.description = description !== undefined ? description : role.description;
    role.priority = priority !== undefined ? priority : role.priority;
    role.isActive = isActive !== undefined ? isActive : role.isActive;

    await role.save();

    if (permissions !== undefined) {
      await RolePermission.findOneAndUpdate(
        { roleId: role._id.toString() },
        { permissions },
        { upsert: true }
      );
    }

    await AuditLog.create({
      userId,
      action: 'update',
      module: 'access-control',
      entityType: 'Role',
      entityId: role._id.toString(),
      description: `Updated role: ${role.name}`,
    });

    return res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    return;
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId } = (req as any);

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SYSTEM_ROLE',
          message: 'Cannot delete system roles',
        },
      });
    }

    await Role.findByIdAndDelete(id);
    await RolePermission.findOneAndDelete({ roleId: id });

    await AuditLog.create({
      userId,
      action: 'delete',
      module: 'access-control',
      entityType: 'Role',
      entityId: id,
      description: `Deleted role: ${role.name}`,
    });

    return res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    return;
    next(error);
  }
};

export const cloneRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    const { userId } = (req as any);

    const sourceRole = await Role.findById(id);
    if (!sourceRole) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Source role not found',
        },
      });
    }

    const sourcePermissions = await RolePermission.findOne({ roleId: id });

    const newRole = new Role({
      id: uuidv4(),
      name: name || `${sourceRole.name} (Copy)`,
      code: code || `${sourceRole.code}_COPY`,
      description: sourceRole.description,
      priority: sourceRole.priority,
      isActive: true,
      isSystem: false,
    });

    await newRole.save();

    if (sourcePermissions) {
      await RolePermission.create({
        roleId: newRole._id.toString(),
        permissions: sourcePermissions.permissions,
      });
    }

    await AuditLog.create({
      userId,
      action: 'create',
      module: 'access-control',
      entityType: 'Role',
      entityId: newRole._id.toString(),
      description: `Cloned role from ${sourceRole.name} to ${newRole.name}`,
    });

    return res.status(201).json({
      success: true,
      data: newRole,
    });
  } catch (error) {
    return;
    next(error);
  }
};

// ==================== PERMISSIONS ====================

export const getPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { module, category } = req.query;
    const filter: any = {};

    if (module) {
      filter.module = module;
    }

    if (category) {
      filter.category = category;
    }

    const permissions = await Permission.find(filter).sort({ module: 1, action: 1 });

    const grouped = permissions.reduce((acc: any, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});

    return res.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    return;
    next(error);
  }
};

export const updateRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    const { userId } = (req as any);

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    await RolePermission.findOneAndUpdate(
      { roleId: id },
      { permissions },
      { upsert: true }
    );

    await AuditLog.create({
      userId,
      action: 'update',
      module: 'access-control',
      entityType: 'RolePermission',
      entityId: id,
      description: `Updated permissions for role: ${role.name}`,
    });

    return res.json({
      success: true,
      message: 'Permissions updated successfully',
    });
  } catch (error) {
    return;
    next(error);
  }
};

// ==================== USER ACCESS ====================

export const getUserAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const userPermissions = await UserPermission.findOne({ userId });

    return res.json({
      success: true,
      data: userPermissions || { override: false, allow: [], deny: [] },
    });
  } catch (error) {
    return;
    next(error);
  }
};

export const updateUserAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { override, allow, deny, companyId, branchId } = req.body;
    const { userId: adminId } = (req as any);

    const userPermissions = await UserPermission.findOneAndUpdate(
      { userId },
      { override, allow, deny, companyId, branchId },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      userId: adminId,
      action: 'update',
      module: 'access-control',
      entityType: 'UserPermission',
      entityId: userId,
      description: `Updated access override for user: ${userId}`,
    });

    return res.json({
      success: true,
      data: userPermissions,
    });
  } catch (error) {
    return;
    next(error);
  }
};

export const getUsersWithAccess = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: any = { override: true };

    const userPermissions = await UserPermission.find(filter);

    return res.json({
      success: true,
      data: userPermissions,
    });
  } catch (error) {
    return;
    next(error);
  }
};

// ==================== API PERMISSIONS ====================

export const getAPIPermissions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const apiPermissions = await APIPermission.find().sort({ endpoint: 1 });

    return res.json({
      success: true,
      data: apiPermissions,
    });
  } catch (error) {
    return;
    next(error);
  }
};

export const updateAPIPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { roles, rateLimit, ipWhitelist, isActive } = req.body;
    const { userId } = (req as any);

    const apiPermission = await APIPermission.findByIdAndUpdate(
      id,
      { roles, rateLimit, ipWhitelist, isActive },
      { new: true }
    );

    if (!apiPermission) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'API_PERMISSION_NOT_FOUND',
          message: 'API permission not found',
        },
      });
    }

    await AuditLog.create({
      userId,
      action: 'update',
      module: 'access-control',
      entityType: 'APIPermission',
      entityId: id,
      description: `Updated API permission for: ${apiPermission.endpoint}`,
    });

    return res.json({
      success: true,
      data: apiPermission,
    });
  } catch (error) {
    return;
    next(error);
  }
};

// ==================== PAGE ACCESS ====================

export const getPageAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    const pageAccess = await PageAccess.find(filter).sort({ category: 1, name: 1 });

    return res.json({
      success: true,
      data: pageAccess,
    });
  } catch (error) {
    return;
    next(error);
  }
};

export const updatePageAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { allowedRoles, isActive } = req.body;
    const { userId } = (req as any);

    const pageAccess = await PageAccess.findByIdAndUpdate(
      id,
      { allowedRoles, isActive },
      { new: true }
    );

    if (!pageAccess) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAGE_ACCESS_NOT_FOUND',
          message: 'Page access not found',
        },
      });
    }

    await AuditLog.create({
      userId,
      action: 'update',
      module: 'access-control',
      entityType: 'PageAccess',
      entityId: id,
      description: `Updated page access for: ${pageAccess.route}`,
    });

    return res.json({
      success: true,
      data: pageAccess,
    });
  } catch (error) {
    return;
    next(error);
  }
};

// ==================== AUDIT LOGS ====================

export const getAccessAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, module, action } = req.query;
    const filter: any = {};

    if (module) {
      filter.module = { $regex: module, $options: 'i' };
    }

    if (action) {
      filter.action = action;
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return;
    next(error);
  }
};

// ==================== STATISTICS ====================

export const getAccessControlStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalRoles = await Role.countDocuments({ isActive: true });
    const totalPermissions = await Permission.countDocuments({ isActive: true });
    const activeUsers = await UserPermission.countDocuments({ override: false });
    const restrictedUsers = await UserPermission.countDocuments({ override: true });
    const totalModules = await Permission.distinct('module');

    return res.json({
      success: true,
      data: {
        totalRoles,
        totalPermissions,
        activeUsers,
        restrictedUsers,
        totalModules: totalModules.length,
      },
    });
  } catch (error) {
    return;
    next(error);
  }
};

// ==================== ACCESS CONTROL UI ENDPOINTS ====================

// Get all roles with user counts for the top section
export const getRolesWithCounts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await Role.find().lean();
    
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ role: role.code as any });
        return {
          ...role,
          userCount,
        };
      })
    );

    return res.json({
      success: true,
      data: rolesWithCounts,
    });
  } catch (error) {
    return next(error);
  }
};

// Get users by role for the user list table
export const getUsersByRole = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleCode } = _req.params;
    
    const users = await User.find({ role: roleCode } as any)
      .select('_id email role isActive lastLogin employeeDetails')
      .lean();

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    return next(error);
  }
};

// Get all pages for the Pages Access tab
export const getPages = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pages = await Page.find().lean();
    
    return res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    return next(error);
  }
};

// Get all permissions for the permission modal
export const getAllPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const filter: any = {};
    if (category) {
      filter.category = category;
    }
    
    const permissions = await Permission.find(filter).lean();
    
    return res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    return next(error);
  }
};

// Save user permission overrides
export const saveUserPermissionOverrides = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, grantedPageIds, revokedPageIds, grantedPermissionIds, revokedPermissionIds } = req.body;
    
    await UserPermissionOverride.findOneAndUpdate(
      { userId },
      {
        userId,
        grantedPageRoutes: grantedPageIds || [],
        revokedPageRoutes: revokedPageIds || [],
        grantedPermissionIds: grantedPermissionIds || [],
        revokedPermissionIds: revokedPermissionIds || [],
        updatedBy: (req as any).userId || userId,
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'User permissions updated successfully',
    });
  } catch (error) {
    return next(error);
  }
};

// Get user permissions for sidebar
export const getUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    // Get user role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get role permissions
    const rolePermissions = await RolePermission.findOne({ roleId: user.role });
    
    // Get user overrides
    const userOverrides = await UserPermissionOverride.findOne({ userId });

    // Get all pages to map IDs to routes
    const allPages = await Page.find().lean();
    const pageIdToRouteMap = new Map(allPages.map(p => [p._id.toString(), p.route]));

    // Combine permissions and convert to routes
    const grantedPageIds = new Set([
      ...(rolePermissions?.pageIds || []),
      ...(userOverrides?.grantedPageRoutes || []),
    ]);

    (userOverrides?.revokedPageRoutes || []).forEach(id => grantedPageIds.delete(id));

    // Convert page IDs to routes
    const grantedRoutes = Array.from(grantedPageIds)
      .map(id => {
        // If it's already a route string, return it
        if (typeof id === 'string' && id.startsWith('/dashboard')) {
          return id;
        }
        // Otherwise try to map from page ID
        return pageIdToRouteMap.get(id);
      })
      .filter(Boolean) as string[];

    const grantedPermissionIds = new Set([
      ...(rolePermissions?.permissionIds || []),
      ...(userOverrides?.grantedPermissionIds || []),
    ]);

    (userOverrides?.revokedPermissionIds || []).forEach(id => grantedPermissionIds.delete(id));

    return res.json({
      success: true,
      data: {
        pageIds: Array.from(grantedPageIds),
        routes: grantedRoutes,
        permissionIds: Array.from(grantedPermissionIds),
      },
    });
  } catch (error) {
    return next(error);
  }
};
