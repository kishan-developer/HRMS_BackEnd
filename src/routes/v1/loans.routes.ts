import { Router } from 'express';
import { LoansController } from '../../controllers/payroll/loans.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const loansController = new LoansController();

const createLoanValidation = [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('loanType').isIn(['Personal', 'Housing', 'Education', 'Medical', 'Emergency', 'Other']).withMessage('Valid loan type is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('tenureMonths').isInt({ min: 1 }).withMessage('Tenure must be at least 1 month'),
  body('interestRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
];

router.get('/', authMiddleware, loansController.getAllLoans);
router.post('/create', authMiddleware, createLoanValidation, loansController.createLoan);
router.get('/:id', authMiddleware, param('id').isMongoId(), loansController.getLoanById);
router.post('/:id/approve', authMiddleware, param('id').isMongoId(), loansController.approveLoan);
router.post('/:id/reject', authMiddleware, param('id').isMongoId(), loansController.rejectLoan);

export default router;
