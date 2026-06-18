import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  cloneRole,
  getPermissions,
  updateRolePermissions,
  getUserAccess,
  updateUserAccess,
  getUsersWithAccess,
  getAPIPermissions,
  updateAPIPermission,
  getPageAccess,
  updatePageAccess,
  getAccessAuditLogs,
  getAccessControlStats,
  getRolesWithCounts,
  getUsersByRole,
  getPages,
  getAllPermissions,
  saveUserPermissionOverrides,
  getUserPermissions,
} from '../../controllers/access-control.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validator.middleware';

const router = Router();

// Access control UI endpoints don't require authentication for testing
// ==================== STATISTICS ====================
router.get('/stats', getAccessControlStats);

// ==================== ACCESS CONTROL UI ENDPOINTS ====================
router.get('/ui/roles-with-counts', getRolesWithCounts);
router.get('/ui/users-by-role/:roleCode', getUsersByRole);
router.get('/pages', getPages);
router.get('/permissions/all', getAllPermissions);
router.post('/user-permissions', saveUserPermissionOverrides);
router.get('/user-permissions/:userId', getUserPermissions);

// All other routes require authentication
router.use(authMiddleware);

// ==================== ROLES ====================
router.get('/roles', getRoles);
router.get('/roles/:id', getRoleById);
router.post(
  '/roles',
  [
    body('name').trim().notEmpty().withMessage('Role name is required'),
    body('code').trim().notEmpty().withMessage('Role code is required'),
    validate,
  ],
  createRole
);
router.put(
  '/roles/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Role name cannot be empty'),
    validate,
  ],
  updateRole
);
router.delete('/roles/:id', deleteRole);
router.post('/roles/:id/clone', cloneRole);
router.put(
  '/roles/:id/permissions',
  [
    body('permissions').isArray().withMessage('Permissions must be an array'),
    validate,
  ],
  updateRolePermissions
);

// ==================== PERMISSIONS ====================
router.get('/permissions', getPermissions);

// ==================== USER ACCESS ====================
router.get('/users', getUsersWithAccess);
router.get('/users/:userId', getUserAccess);
router.put(
  '/users/:userId',
  [
    body('override').optional().isBoolean().withMessage('Override must be a boolean'),
    body('allow').optional().isArray().withMessage('Allow must be an array'),
    body('deny').optional().isArray().withMessage('Deny must be an array'),
    validate,
  ],
  updateUserAccess
);

// ==================== API PERMISSIONS ====================
router.get('/apis', getAPIPermissions);
router.put(
  '/apis/:id',
  [
    body('roles').optional().isArray().withMessage('Roles must be an array'),
    body('rateLimit').optional().isNumeric().withMessage('Rate limit must be a number'),
    validate,
  ],
  updateAPIPermission
);

// ==================== PAGE ACCESS ====================
router.get('/pages', getPageAccess);
router.put(
  '/pages/:id',
  [
    body('allowedRoles').optional().isArray().withMessage('Allowed roles must be an array'),
    validate,
  ],
  updatePageAccess
);

// ==================== AUDIT LOGS ====================
router.get(
  '/logs',
  [
    query('page').optional().isInt().withMessage('Page must be an integer'),
    query('limit').optional().isInt().withMessage('Limit must be an integer'),
    validate,
  ],
  getAccessAuditLogs
);

export default router;
