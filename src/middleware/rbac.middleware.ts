import { Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { AuthRequest } from './auth.middleware';

export const rbacMiddleware = (requiredPermissions: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const role = req.role;

    if (!role) {
      throw new AppError('No role found in request', 403, 'NO_ROLE');
    }

    const rolePermissions = getPermissionsForRole(role);
    const hasPermission = requiredPermissions.every((permission) =>
      rolePermissions.includes(permission)
    );

    if (!hasPermission) {
      throw new AppError(
        'Insufficient permissions',
        403,
        'INSUFFICIENT_PERMISSIONS',
        { required: requiredPermissions, user: rolePermissions }
      );
    }

    next();
  };
};

const getPermissionsForRole = (role: string): string[] => {
  const permissions: Record<string, string[]> = {
    superadmin: [
      'attendance:read',
      'attendance:write',
      'leave:read',
      'leave:write',
      'leave:approve',
      'overtime:read',
      'overtime:write',
      'overtime:approve',
      'performance:read',
      'performance:write',
      'reimbursement:read',
      'reimbursement:write',
      'reimbursement:approve',
      'employee:read',
      'employee:write',
      'report:read',
      'report:generate',
      'support:read',
      'support:write',
      'support:approve',
      'payroll:read',
      'payroll:write',
      'loan:read',
      'loan:write',
      'loan:approve',
    ],
    hr_manager: [
      'attendance:read',
      'attendance:write',
      'leave:read',
      'leave:write',
      'leave:approve',
      'overtime:read',
      'overtime:write',
      'overtime:approve',
      'performance:read',
      'performance:write',
      'reimbursement:read',
      'reimbursement:write',
      'reimbursement:approve',
      'employee:read',
      'employee:write',
      'report:read',
      'report:generate',
      'support:read',
      'support:write',
      'payroll:read',
      'loan:read',
      'loan:write',
    ],
    accounts: [
      'reimbursement:read',
      'reimbursement:write',
      'reimbursement:approve',
      'payroll:read',
      'payroll:write',
      'loan:read',
      'loan:write',
      'loan:approve',
      'employee:read',
      'report:read',
      'report:generate',
    ],
    support: [
      'support:read',
      'support:write',
      'support:approve',
      'employee:read',
    ],
    employee: [
      'attendance:read',
      'leave:read',
      'leave:write',
      'overtime:read',
      'overtime:write',
      'performance:read',
      'reimbursement:read',
      'reimbursement:write',
    ],
  };

  return permissions[role] || [];
};
