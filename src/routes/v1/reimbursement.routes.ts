import { Router } from 'express';
import { ReimbursementController } from '../../controllers/payroll/reimbursement.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const reimbursementController = new ReimbursementController();

const createReimbursementValidation = [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('claimType').notEmpty().withMessage('Claim type is required'),
  body('claimDate').isISO8601().withMessage('Valid claim date is required'),
  body('amountClaimed').isFloat({ min: 0 }).withMessage('Amount claimed must be a positive number'),
];

const updateReimbursementValidation = [
  body('amountClaimed').optional().isFloat({ min: 0 }).withMessage('Amount claimed must be a positive number'),
];

const uploadDocumentValidation = [
  body('fileName').notEmpty().withMessage('File name is required'),
  body('fileType').notEmpty().withMessage('File type is required'),
  body('fileUrl').isURL().withMessage('Valid file URL is required'),
];

router.get('/', authMiddleware, reimbursementController.getAllReimbursements);
router.get('/:id', authMiddleware, param('id').isMongoId(), reimbursementController.getReimbursementById);
router.post('/', authMiddleware, createReimbursementValidation, reimbursementController.createReimbursement);
router.put('/:id', authMiddleware, param('id').isMongoId(), updateReimbursementValidation, reimbursementController.updateReimbursement);
router.post('/:id/approve', authMiddleware, param('id').isMongoId(), reimbursementController.approveReimbursement);
router.post('/:id/reject', authMiddleware, param('id').isMongoId(), reimbursementController.rejectReimbursement);
router.post('/:id/forward-payroll', authMiddleware, param('id').isMongoId(), reimbursementController.forwardToPayroll);
router.post('/:id/mark-paid', authMiddleware, param('id').isMongoId(), reimbursementController.markAsPaid);
router.post('/:id/upload-document', authMiddleware, param('id').isMongoId(), uploadDocumentValidation, reimbursementController.uploadDocument);
router.post('/bulk-approve', authMiddleware, reimbursementController.bulkApproveReimbursements);
router.get('/payroll', authMiddleware, reimbursementController.getPayrollReimbursements);

export default router;
