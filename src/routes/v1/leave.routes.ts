import { Router } from 'express';
import { LeaveController } from '../../controllers/leave/leave.controller';
import { HolidayController } from '../../controllers/leave/holiday.controller';
import { LeavePolicyController } from '../../controllers/leave/leave-policy.controller';
import { LeaveTypeController } from '../../controllers/leave/leave-type.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const leaveController = new LeaveController();
const holidayController = new HolidayController();
const leavePolicyController = new LeavePolicyController();
const leaveTypeController = new LeaveTypeController();

const createLeaveValidation = [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('leaveType').isIn(['Casual Leave', 'Paternity Leave']).withMessage('Invalid leave type'),
  body('fromDate').isISO8601().withMessage('Valid from date is required'),
  body('toDate').isISO8601().withMessage('Valid to date is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
];


const updateLeaveValidation = [
  body('leaveType').optional().isIn(['Casual Leave', 'Paternity Leave']).withMessage('Invalid leave type'),
];


// Static routes MUST be declared before /:id to avoid Express matching them as IDs
router.get('/', authMiddleware, leaveController.getAllLeaves);
router.get('/my-requests', authMiddleware, leaveController.getMyLeaveRequests);
router.get('/my-pending', authMiddleware, leaveController.getMyPendingLeaves);
router.get('/approvals', authMiddleware, leaveController.getLeaveApprovals);
router.get('/balance/:employeeId', authMiddleware, param('employeeId').isMongoId(), leaveController.getLeaveBalance);
router.post('/', authMiddleware, createLeaveValidation, leaveController.createLeave);

// Holidays routes (must come before /:id)
router.get('/holidays', authMiddleware, holidayController.getAllHolidays);
router.get('/holidays/:id', authMiddleware, param('id').isMongoId(), holidayController.getHolidayById);
router.post('/holidays', authMiddleware, holidayController.createHoliday);
router.put('/holidays/:id', authMiddleware, param('id').isMongoId(), holidayController.updateHoliday);
router.delete('/holidays/:id', authMiddleware, param('id').isMongoId(), holidayController.deleteHoliday);

// Leave policy routes (must come before /:id)
router.get('/policy', authMiddleware, leavePolicyController.getLeavePolicies);
router.put('/policy', authMiddleware, leavePolicyController.updateLeavePolicies);

// Leave types routes (must come before /:id)
router.get('/types', authMiddleware, leaveTypeController.getAllLeaveTypes);
router.get('/types/:id', authMiddleware, param('id').isMongoId(), leaveTypeController.getLeaveTypeById);
router.post('/types', authMiddleware, leaveTypeController.createLeaveType);
router.put('/types/:id', authMiddleware, param('id').isMongoId(), leaveTypeController.updateLeaveType);
router.delete('/types/:id', authMiddleware, param('id').isMongoId(), leaveTypeController.deleteLeaveType);

// Parameterized routes go AFTER all static routes
router.get('/:id', authMiddleware, param('id').isMongoId(), leaveController.getLeaveById);
router.put('/:id', authMiddleware, param('id').isMongoId(), updateLeaveValidation, leaveController.updateLeave);
router.put('/:id/approve', authMiddleware, param('id').isMongoId(), leaveController.approveLeave);
router.put('/:id/reject', authMiddleware, param('id').isMongoId(), leaveController.rejectLeave);
router.post('/:id/cancel', authMiddleware, param('id').isMongoId(), leaveController.cancelLeave);

export default router;
