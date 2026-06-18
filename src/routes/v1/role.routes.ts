import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getSystemRoles,
  assignPermissions,
} from '../../controllers/role.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validator.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/roles - Get all roles with filters
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'inactive']),
    query('companyId').optional().isString(),
    query('isSystemRole').optional().isBoolean(),
    query('search').optional().isString(),
  ],
  validate,
  getRoles
);

// GET /api/roles/system - Get system roles
router.get('/system', getSystemRoles);

// GET /api/roles/:id - Get role by ID
router.get(
  '/:id',
  [param('id').isString().notEmpty()],
  validate,
  getRoleById
);

// POST /api/roles - Create new role
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Role name is required'),
    body('code').trim().notEmpty().withMessage('Role code is required'),
    body('description').optional().trim(),
    body('companyId').optional().isString(),
    body('permissions').isArray().withMessage('Permissions must be an array'),
  ],
  validate,
  createRole
);

// PUT /api/roles/:id - Update role
router.put(
  '/:id',
  [
    param('id').isString().notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('permissions').optional().isArray(),
    body('status').optional().isIn(['active', 'inactive']),
  ],
  validate,
  updateRole
);

// PATCH /api/roles/:id/permissions - Assign permissions to role
router.patch(
  '/:id/permissions',
  [
    param('id').isString().notEmpty(),
    body('permissions').isArray().withMessage('Permissions must be an array'),
  ],
  validate,
  assignPermissions
);

// DELETE /api/roles/:id - Delete role
router.delete(
  '/:id',
  [param('id').isString().notEmpty()],
  validate,
  deleteRole
);

export default router;
