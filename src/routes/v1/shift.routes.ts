import { Router } from 'express';
import { ShiftController } from '../../controllers/employee/shift.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const shiftController = new ShiftController();

const createShiftValidation = [
  body('name').notEmpty().withMessage('Shift name is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
];

const updateShiftValidation = [
  body('name').optional().notEmpty().withMessage('Shift name cannot be empty'),
  body('startTime').optional().notEmpty().withMessage('Start time cannot be empty'),
  body('endTime').optional().notEmpty().withMessage('End time cannot be empty'),
];

router.get('/', shiftController.getAllShifts);
router.get('/:id', authMiddleware, param('id').isMongoId(), shiftController.getShiftById);
router.post('/', authMiddleware, createShiftValidation, shiftController.createShift);
router.put('/:id', authMiddleware, param('id').isMongoId(), updateShiftValidation, shiftController.updateShift);
router.delete('/:id', authMiddleware, param('id').isMongoId(), shiftController.deleteShift);

export default router;
