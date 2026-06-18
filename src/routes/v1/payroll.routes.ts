import { Router } from 'express';
import { PayrollController } from '../../controllers/payroll/payroll.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const payrollController = new PayrollController();

router.get('/', authMiddleware, payrollController.getAllPayroll);
router.post('/process', authMiddleware, payrollController.processPayroll);
router.post('/approve', authMiddleware, payrollController.approvePayroll);
router.get('/report', authMiddleware, payrollController.getPayrollReport);
router.get('/reimbursement', authMiddleware, payrollController.getReimbursementPayroll);
router.get('/payslip', authMiddleware, payrollController.generatePayslip);
router.get('/export', authMiddleware, payrollController.exportPayrollData);

export default router;
