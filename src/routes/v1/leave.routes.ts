import { Router, Request, Response } from 'express';
import { LeaveController } from '../../controllers/leave/leave.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const leaveController = new LeaveController();

const createLeaveValidation = [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('leaveType').isIn(['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave']).withMessage('Invalid leave type'),
  body('fromDate').isISO8601().withMessage('Valid from date is required'),
  body('toDate').isISO8601().withMessage('Valid to date is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

const updateLeaveValidation = [
  body('leaveType').optional().isIn(['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave']).withMessage('Invalid leave type'),
];

router.get('/', authMiddleware, leaveController.getAllLeaves);
router.get('/my-requests', authMiddleware, leaveController.getMyLeaveRequests);
router.get('/my-pending', authMiddleware, leaveController.getMyPendingLeaves);
router.get('/:id', authMiddleware, param('id').isMongoId(), leaveController.getLeaveById);
router.post('/', authMiddleware, createLeaveValidation, leaveController.createLeave);
router.put('/:id', authMiddleware, param('id').isMongoId(), updateLeaveValidation, leaveController.updateLeave);
router.put('/:id/approve', authMiddleware, param('id').isMongoId(), leaveController.approveLeave);
router.put('/:id/reject', authMiddleware, param('id').isMongoId(), leaveController.rejectLeave);
router.post('/:id/cancel', authMiddleware, param('id').isMongoId(), leaveController.cancelLeave);
router.get('/balance/:employeeId', authMiddleware, param('employeeId').isMongoId(), leaveController.getLeaveBalance);
router.get('/approvals', authMiddleware, leaveController.getLeaveApprovals);

// Holidays routes
router.get('/holidays', authMiddleware, (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Holidays retrieved successfully',
  });
});

router.get('/holidays/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Holiday retrieved successfully',
  });
});

router.post('/holidays', authMiddleware, (_req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    data: {},
    message: 'Holiday created successfully',
  });
});

router.put('/holidays/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Holiday updated successfully',
  });
});

router.delete('/holidays/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Holiday deleted successfully',
  });
});

// Leave types routes
router.get('/types', authMiddleware, (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Leave types retrieved successfully',
  });
});

router.get('/types/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Leave type retrieved successfully',
  });
});

router.post('/types', authMiddleware, (_req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    data: {},
    message: 'Leave type created successfully',
  });
});

router.put('/types/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Leave type updated successfully',
  });
});

router.delete('/types/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Leave type deleted successfully',
  });
});

export default router;
