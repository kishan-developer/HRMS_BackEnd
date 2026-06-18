import { Router } from 'express';
import { RegularizationController } from '../../controllers/attendance/regularization.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const regularizationController = new RegularizationController();

const createRegularizationValidation = [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('issueType').isIn(['Late Check-in', 'Early Check-out', 'Missing Punch']).withMessage('Invalid issue type'),
  body('punchType').isIn(['Punch In', 'Punch Out']).withMessage('Invalid punch type'),
  body('requestedTime').notEmpty().withMessage('Requested time is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

const updateRegularizationValidation = [
  body('issueType').optional().isIn(['Late Check-in', 'Early Check-out', 'Missing Punch']).withMessage('Invalid issue type'),
  body('punchType').optional().isIn(['Punch In', 'Punch Out']).withMessage('Invalid punch type'),
  body('requestedTime').optional().notEmpty().withMessage('Requested time cannot be empty'),
];

router.get('/', authMiddleware, regularizationController.getAllRegularization);
router.get('/:id', authMiddleware, param('id').isMongoId(), regularizationController.getRegularizationById);
router.post('/', authMiddleware, createRegularizationValidation, regularizationController.createRegularization);
router.put('/:id', authMiddleware, param('id').isMongoId(), updateRegularizationValidation, regularizationController.updateRegularization);
router.post('/:id/approve', authMiddleware, param('id').isMongoId(), regularizationController.approveRegularization);
router.post('/:id/reject', authMiddleware, param('id').isMongoId(), regularizationController.rejectRegularization);

export default router;
