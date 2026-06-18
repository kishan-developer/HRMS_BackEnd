import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createJoiningLink,
  getJoiningLinks,
  getJoiningLinkById,
  deactivateJoiningLink,
  resendJoiningLink,
  getJoiningSubmissions,
  getSubmissionById,
} from '../../controllers/onboarding.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validator.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/v1/onboarding/joining-links - Create joining link
router.post(
  '/joining-links',
  [
    body('employeeName').trim().notEmpty().withMessage('Employee name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('departmentId').isString().notEmpty().withMessage('Department ID is required'),
    body('joiningDate').isISO8601().withMessage('Valid joining date is required'),
  ],
  validate,
  createJoiningLink
);

// GET /api/v1/onboarding/joining-links - Get all joining links
router.get(
  '/joining-links',
  [
    query('status').optional().isIn(['pending', 'submitted', 'expired']),
    query('departmentId').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  getJoiningLinks
);

// GET /api/v1/onboarding/joining-links/:id - Get joining link by ID
router.get(
  '/joining-links/:id',
  [param('id').isString().notEmpty()],
  validate,
  getJoiningLinkById
);

// PUT /api/v1/onboarding/joining-links/:id/deactivate - Deactivate joining link
router.put(
  '/joining-links/:id/deactivate',
  [param('id').isString().notEmpty()],
  validate,
  deactivateJoiningLink
);

// POST /api/v1/onboarding/joining-links/:id/resend - Resend joining link email
router.post(
  '/joining-links/:id/resend',
  [param('id').isString().notEmpty()],
  validate,
  resendJoiningLink
);

// GET /api/v1/onboarding/submissions - Get all submissions
router.get(
  '/submissions',
  [
    query('status').optional().isIn(['submitted', 'reviewed', 'approved', 'rejected']),
    query('departmentId').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  getJoiningSubmissions
);

// GET /api/v1/onboarding/submissions/:id - Get submission by ID
router.get(
  '/submissions/:id',
  [param('id').isString().notEmpty()],
  validate,
  getSubmissionById
);

export default router;
