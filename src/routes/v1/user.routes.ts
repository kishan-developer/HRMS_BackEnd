import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  // resetUserPassword,
  activateUser,
  deactivateUser,
  // assignRole,
  // getUserStats,
  updateProfile,
  bulkUploadUsers,
  upload,
  uploadDocument,
  deleteDocument,
} from '../../controllers/user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validator.middleware';

const router = Router();

// GET /api/users - Get all users with filters (no auth required)
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'inactive']),
    query('role').optional().isString(),
    query('companyId').optional().isString(),
    query('search').optional().isString(),
  ],
  getUsers
);

// POST /api/users/dashboard/create - Create new user from dashboard (requires superadmin or hr_manager role)
router.post(
  '/dashboard/create',
  authMiddleware,
  rbacMiddleware(['employee:write']),
  [
    body('employeeId').optional().trim().notEmpty().withMessage('Employee ID is required if provided'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['superadmin', 'hr_manager', 'accounts', 'employee', 'support']).withMessage('Invalid role'),
    body('companyId').optional().isString(),
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('department').optional().isString(),
  ],
  validate,
  createUser
); 

// POST /api/users/bulk-upload - Bulk upload users from CSV/Excel (requires superadmin or hr_manager role)
router.post(
  '/bulk-upload',
  authMiddleware,
  rbacMiddleware(['employee:write']),
  upload.single('file'),
  bulkUploadUsers
); 

// POST /api/users - Create new user (dummy endpoint - no auth for testing)
router.post(
  '/',
  [
    body('employeeId').optional().trim().notEmpty().withMessage('Employee ID is required if provided'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['superadmin', 'hr_manager', 'accounts', 'employee', 'support']).withMessage('Invalid role'),
    body('companyId').optional().isString(),
  ],
  validate,
  createUser
);

// PATCH /api/users/:id/activate - Activate user (no auth for testing)
router.patch(
  '/:id/activate',
  [param('id').isString().notEmpty()],
  validate,
  activateUser
);

// PATCH /api/users/:id/deactivate - Deactivate user (no auth for testing)
router.patch(
  '/:id/deactivate',
  [param('id').isString().notEmpty()],
  validate,
  deactivateUser
);

// GET /api/users/:id - Get user by ID (no auth for testing)
router.get(
  '/:id',
  [param('id').isString().notEmpty()],
  validate,
  getUserById
);

// PUT /api/users/:id - Update user (no auth for testing)
router.put(
  '/:id',
  [
    param('id').isString().notEmpty(),
    body('email').optional().isEmail(),
    body('role').optional().isIn(['superadmin', 'hr_manager', 'accounts', 'employee', 'support']),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  updateUser
);

// PUT /api/users/:id/profile - Update user profile (requires auth, users can only update their own profile)
router.put(
  '/:id/profile',
  authMiddleware,
  [
    param('id').isString().notEmpty(),
    // Personal Information
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('middleName').optional().isString(),
    body('displayName').optional().isString(),
    body('phone').optional().isString(),
    body('dateOfBirth').optional().isString(),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('maritalStatus').optional().isIn(['single', 'married', 'divorced', 'widowed']),
    body('bloodGroup').optional().isString(),
    body('nationality').optional().isString(),
    body('religion').optional().isString(),
    body('fatherName').optional().isString(),
    body('motherName').optional().isString(),
    body('spouseName').optional().isString(),
    body('emergencyContactName').optional().isString(),
    body('emergencyContactPhone').optional().isString(),
    body('emergencyContactRelation').optional().isString(),
    body('panNumber').optional().isString(),
    body('aadharNumber').optional().isString(),
    body('passportNumber').optional().isString(),
    // Contact Information
    body('mobile').optional().isString(),
    body('alternativeMobile').optional().isString(),
    body('currentAddress').optional().isString(),
    body('permanentAddress').optional().isString(),
    body('city').optional().isString(),
    body('state').optional().isString(),
    body('country').optional().isString(),
    body('zipCode').optional().isString(),
    body('permanentCity').optional().isString(),
    body('permanentState').optional().isString(),
    body('permanentCountry').optional().isString(),
    body('permanentZipCode').optional().isString(),
    // Work Information
    body('designation').optional().isString(),
    body('department').optional().isString(),
    body('branch').optional().isString(),
    body('employmentType').optional().isIn(['full-time', 'part-time', 'contract', 'intern']),
    body('workType').optional().isIn(['Office', 'Remote', 'On Field']),
    body('employeeStatus').optional().isIn(['Active', 'Inactive', 'On Leave', 'Probation']),
    body('company').optional().isString(),
    body('reportingManagerId').optional().isString(),
    body('teamLeadId').optional().isString(),
    body('workLocation').optional().isString(),
    body('probationEndDate').optional().isString(),
    body('contractEndDate').optional().isString(),
    body('salary').optional().isNumeric(),
    body('salaryCurrency').optional().isString(),
    body('bankName').optional().isString(),
    body('bankAccountNumber').optional().isString(),
    body('bankIfscCode').optional().isString(),
    body('pfNumber').optional().isString(),
    body('esiNumber').optional().isString(),
    body('uanNumber').optional().isString(),
    // Education
    body('highestQualification').optional().isString(),
    body('collegeName').optional().isString(),
    body('passingYear').optional().isString(),
    body('education').optional().isArray(),
    // Skills & Languages
    body('skills').optional().isArray(),
    body('languages').optional().isArray(),
    body('experience').optional().isArray(),
  ],
  validate,
  updateProfile
);

// POST /api/users/:id/documents - Upload document for user profile (requires auth)
router.post(
  '/:id/documents',
  authMiddleware,
  upload.single('file'),
  uploadDocument
);

// DELETE /api/users/:id/documents - Delete document from user profile (requires auth)
router.delete(
  '/:id/documents',
  authMiddleware,
  deleteDocument
);

// 
// DELETE /api/users/:id - Delete user (no auth for testing)
router.delete(
  '/:id',
  [param('id').isString().notEmpty()],
  validate,
  deleteUser
);

// All other routes require authentication
router.use(authMiddleware);

export default router;
