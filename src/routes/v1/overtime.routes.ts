import { Router } from 'express';
import { OvertimeController } from '../../controllers/attendance/overtime.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const overtimeController = new OvertimeController();

const createOvertimeValidation = [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('actualHours').isFloat({ min: 0 }).withMessage('Actual hours must be a positive number'),
  body('allowedHours').isFloat({ min: 0 }).withMessage('Allowed hours must be a positive number'),
  body('overtimeHours').isFloat({ min: 0 }).withMessage('Overtime hours must be a positive number'),
  body('otType').isIn(['Weekday', 'Weekend', 'Holiday']).withMessage('Invalid overtime type'),
];

const updateOvertimeValidation = [
  body('actualHours').optional().isFloat({ min: 0 }).withMessage('Actual hours must be a positive number'),
  body('allowedHours').optional().isFloat({ min: 0 }).withMessage('Allowed hours must be a positive number'),
  body('overtimeHours').optional().isFloat({ min: 0 }).withMessage('Overtime hours must be a positive number'),
];

router.get('/', authMiddleware, overtimeController.getAllOvertime);
router.get('/:id', authMiddleware, param('id').isMongoId(), overtimeController.getOvertimeById);
router.post('/', authMiddleware, createOvertimeValidation, overtimeController.createOvertime);
router.put('/:id', authMiddleware, param('id').isMongoId(), updateOvertimeValidation, overtimeController.updateOvertime);
router.post('/:id/approve', authMiddleware, param('id').isMongoId(), overtimeController.approveOvertime);
router.post('/:id/reject', authMiddleware, param('id').isMongoId(), overtimeController.rejectOvertime);
router.get('/summary', authMiddleware, overtimeController.getOvertimeSummary);

export default router;
