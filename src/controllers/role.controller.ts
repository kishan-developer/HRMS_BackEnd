import { Request, Response, NextFunction } from 'express';
import Role from '../models/role.model';
import { User } from '../models/user.model';
import AuditLog from '../models/audit-log.model';
import { v4 as uuidv4 } from 'uuid';

// Get all roles with filters
export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      companyId,
      isSystemRole,
      search,
    } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (companyId) query.companyId = companyId;
    if (isSystemRole !== undefined) query.isSystemRole = isSystemRole;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [roles, total] = await Promise.all([
      Role.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Role.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        roles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Get system roles
export const getSystemRoles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await Role.find({ isSystemRole: true }).lean();

    return res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Get role by ID
export const getRoleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id).lean();

    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found',
        },
      });
    }

    // Get user count with this role
    const userCount = await User.countDocuments({ role: role.code as any });

    return res.json({
      success: true,
      data: {
        ...role,
        userCount,
      },
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Create new role
export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, description, companyId, permissions } = req.body;
    const userId = (req as any).user?.id;

    // Check if role code already exists
    const existingCode = await Role.findOne({ code });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ROLE_CODE_EXISTS',
          message: 'Role code already exists',
        },
      });
    }

    const role = new Role({
      id: uuidv4(),
      name,
      code,
      description,
      companyId,
      permissions,
      isSystemRole: false,
      status: 'active',
      createdBy: userId,
    });

    await role.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'create',
      module: 'roles',
      entityType: 'Role',
      entityId: role.id,
      description: `Created new role: ${role.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully',
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Update role
export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = (req as any).user?.id;

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

    // Prevent modifying system roles
    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_MODIFY_SYSTEM_ROLE',
          message: 'Cannot modify system roles',
        },
      });
    }

    Object.assign(role, data);
    await role.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'update',
      module: 'roles',
      entityType: 'Role',
      entityId: role.id,
      description: `Updated role: ${role.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { changes: data },
    });

    return res.json({
      success: true,
      data: role,
      message: 'Role updated successfully',
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Assign permissions to role
export const assignPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    const userId = (req as any).user?.id;

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

    // Prevent modifying system roles
    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_MODIFY_SYSTEM_ROLE',
          message: 'Cannot modify system roles',
        },
      });
    }

    role.permissions = permissions;
    await role.save();

    // Log the action
    await AuditLog.create({
      userId,
      action: 'permission_change',
      module: 'roles',
      entityType: 'Role',
      entityId: role.id,
      description: `Updated permissions for role: ${role.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: role,
      message: 'Permissions assigned successfully',
    });
  } catch (error) {
    return;
    next(error);
  }
};

// Delete role
export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

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

    // Prevent deleting system roles
    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SYSTEM_ROLE',
          message: 'Cannot delete system roles',
        },
      });
    }

    // Check if role is assigned to users
    const userCount = await User.countDocuments({ role: role.code as any });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ROLE_IN_USE',
          message: 'Cannot delete role that is assigned to users',
        },
      });
    }

    await Role.findByIdAndDelete(id);

    // Log the action
    await AuditLog.create({
      userId,
      action: 'delete',
      module: 'roles',
      entityType: 'Role',
      entityId: id,
      description: `Deleted role: ${role.name}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
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
