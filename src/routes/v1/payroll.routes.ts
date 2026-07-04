import { Router } from 'express';
import { PayrollController } from '../../controllers/payroll/payroll.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { param, query } from 'express-validator';

const router = Router();
const payrollController = new PayrollController();

// Existing routes
router.get('/', authMiddleware, payrollController.getAllPayroll);
router.post('/process', authMiddleware, payrollController.processPayroll);
router.post('/approve', authMiddleware, payrollController.approvePayroll);
router.get('/report', authMiddleware, payrollController.getPayrollReport);
router.get('/reimbursement', authMiddleware, payrollController.getReimbursementPayroll);
router.get('/payslip', authMiddleware, payrollController.generatePayslip);
router.get('/export', authMiddleware, payrollController.exportPayrollData);

// New routes to match FrontEnd API
router.get('/summary', authMiddleware, query('month').optional(), query('year').optional(), payrollController.getPayrollSummary);
router.get('/employee/:employeeId', authMiddleware, param('employeeId').notEmpty(), query('month').optional(), query('year').optional(), payrollController.getPayrollByEmployee);
router.put('/:id/approve', authMiddleware, param('id').notEmpty(), payrollController.approvePayrollById);
router.put('/:id/paid', authMiddleware, param('id').notEmpty(), payrollController.markAsPaid);
router.get('/salary/:employeeId', authMiddleware, param('employeeId').notEmpty(), payrollController.getSalaryStructure);
router.put('/salary/:employeeId', authMiddleware, param('employeeId').notEmpty(), payrollController.updateSalaryStructure);
router.get('/salary/components', authMiddleware, payrollController.getSalaryComponents);
router.get('/adjustments', authMiddleware, query('month').optional(), query('year').optional(), payrollController.getPayrollAdjustments);
router.post('/adjustments', authMiddleware, payrollController.createAdjustment);
router.delete('/adjustments/:id', authMiddleware, param('id').notEmpty(), payrollController.deleteAdjustment);

export default router;
