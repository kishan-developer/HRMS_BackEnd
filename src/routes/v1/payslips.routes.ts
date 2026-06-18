import { Router } from 'express';
import { PayslipsController } from '../../controllers/payroll/payslips.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body } from 'express-validator';

const router = Router();
const payslipsController = new PayslipsController();

const generatePayslipValidation = [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Valid year is required'),
];

router.get('/', authMiddleware, payslipsController.getAllPayslips);
router.get('/my-payslips', authMiddleware, payslipsController.getMyPayslips);
router.get('/:id', authMiddleware, payslipsController.getPayslipById);
router.post('/generate', authMiddleware, generatePayslipValidation, payslipsController.generatePayslip);

export default router;
