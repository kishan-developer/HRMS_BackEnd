import { Router } from 'express';
import { param } from 'express-validator';
import {
  validateJoiningToken,
  submitJoiningForm,
} from '../../controllers/onboarding.controller';
import { validate } from '../../middleware/validator.middleware';

const router = Router();

// Public routes - no authentication required

// GET /api/v1/public/joining/:token - Validate joining token
router.get(
  '/joining/:token',
  [param('token').isString().notEmpty()],
  validate,
  validateJoiningToken
);

// POST /api/v1/public/joining/:token - Submit joining form
router.post(
  '/joining/:token',
  [param('token').isString().notEmpty()],
  validate,
  submitJoiningForm
);

export default router;
