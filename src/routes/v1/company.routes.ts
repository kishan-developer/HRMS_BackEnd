import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
  updateCompanyStatus,
  assignCompanyAdmin,
  getCompanySettings,
  updateCompanySettings,
} from '../../controllers/company.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validator.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/companies - Get all companies with filters
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'inactive', 'suspended']),
    query('subscriptionStatus').optional().isIn(['active', 'inactive', 'trial', 'expired']),
    query('subscriptionPlan').optional().isIn(['starter', 'professional', 'enterprise']),
    query('search').optional().isString(),
  ],
  validate,
  getCompanies
);

// GET /api/companies/stats - Get company statistics
router.get('/stats', getCompanyStats);

// GET /api/companies/:id - Get company by ID
router.get(
  '/:id',
  [param('id').isString().notEmpty()],
  validate,
  getCompanyById
);

// Company settings routes (must come before /:id routes)
router.get('/:id/settings', [param('id').isString().notEmpty()], validate, getCompanySettings);
router.put('/:id/settings', [param('id').isString().notEmpty()], validate, updateCompanySettings);

// POST /api/companies - Create new company
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Company name is required'),
    body('code').trim().notEmpty().withMessage('Company code is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('zipCode').trim().notEmpty().withMessage('Zip code is required'),
    body('industry').trim().notEmpty().withMessage('Industry is required'),
    body('size').isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
    body('subscriptionPlan').optional().isIn(['starter', 'professional', 'enterprise']),
    body('subscriptionEndDate').isISO8601().withMessage('Valid subscription end date is required'),
    body('maxEmployees').optional().isInt({ min: 1 }),
    body('maxBranches').optional().isInt({ min: 1 }),
  ],
  validate,
  createCompany
);

// PUT /api/companies/:id - Update company
router.put(
  '/:id',
  [
    param('id').isString().notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('country').optional().trim(),
    body('zipCode').optional().trim(),
    body('website').optional().isURL(),
    body('industry').optional().trim(),
    body('size').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
    body('subscriptionPlan').optional().isIn(['starter', 'professional', 'enterprise']),
    body('subscriptionStatus').optional().isIn(['active', 'inactive', 'trial', 'expired']),
    body('subscriptionEndDate').optional().isISO8601(),
    body('maxEmployees').optional().isInt({ min: 1 }),
    body('maxBranches').optional().isInt({ min: 1 }),
    body('settings').optional().isObject(),
  ],
  validate,
  updateCompany
);

// PATCH /api/companies/:id/status - Update company status
router.patch(
  '/:id/status',
  [
    param('id').isString().notEmpty(),
    body('status').isIn(['active', 'inactive', 'suspended']),
  ],
  validate,
  updateCompanyStatus
);

// PATCH /api/companies/:id/admin - Assign company admin
router.patch(
  '/:id/admin',
  [
    param('id').isString().notEmpty(),
    body('adminId').isString().notEmpty(),
  ],
  validate,
  assignCompanyAdmin
);

// DELETE /api/companies/:id - Delete company (soft delete)
router.delete(
  '/:id',
  [param('id').isString().notEmpty()],
  validate,
  deleteCompany
);

export default router;
