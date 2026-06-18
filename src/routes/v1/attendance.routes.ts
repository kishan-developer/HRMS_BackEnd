import { Router } from 'express';
import { AttendanceController } from '../../controllers/attendance/attendance.controller';
import {
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  getTodayAttendance,
  getAttendanceByRange,
  getAttendanceStats,
  getLeaveBalance,
  getMonthlyCalendar,
} from '../../controllers/attendance.controller';
import { syncAttendance, syncAllDevices } from '../../controllers/biometric.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const attendanceController = new AttendanceController();

// Existing routes (punch-in/punch-out with geofence)
const punchInValidation = [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('latitude').isNumeric().withMessage('Latitude is required'),
  body('longitude').isNumeric().withMessage('Longitude is required'),
];

const punchOutValidation = [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('latitude').isNumeric().withMessage('Latitude is required'),
  body('longitude').isNumeric().withMessage('Longitude is required'),
];

router.post('/punch-in', authMiddleware, punchInValidation, attendanceController.punchIn);
router.post('/punch-out', authMiddleware, punchOutValidation, attendanceController.punchOut);
router.get('/today/:employeeId', authMiddleware, param('employeeId').notEmpty(), attendanceController.getTodayAttendance);
router.get('/employee/:employeeId', authMiddleware, param('employeeId').notEmpty(), attendanceController.getEmployeeAttendance);
router.get('/employee/:employeeId/two-months', authMiddleware, param('employeeId').notEmpty(), attendanceController.getEmployeeTwoMonthAttendance);
router.post('/employee/:employeeId/download-report', authMiddleware, param('employeeId').notEmpty(), attendanceController.downloadAttendanceReport);
router.post('/employee/:employeeId/send-report-email', authMiddleware, param('employeeId').notEmpty(), attendanceController.sendAttendanceReportEmail);
router.get('/all-employees', authMiddleware, attendanceController.getAllEmployeesAttendance);
router.get('/summary', authMiddleware, query('startDate').notEmpty(), query('endDate').notEmpty(), attendanceController.getAttendanceSummary);

// New routes for employee self-service attendance
router.post('/check-in', authMiddleware, checkIn);
router.post('/check-out', authMiddleware, checkOut);
router.post('/break/start', authMiddleware, startBreak);
router.post('/break/end', authMiddleware, endBreak);
router.get('/my-today', authMiddleware, getTodayAttendance);
router.get('/my-range', authMiddleware, getAttendanceByRange);
router.get('/my-stats', authMiddleware, getAttendanceStats);
router.get('/leave-balance', authMiddleware, getLeaveBalance);
router.get('/calendar', authMiddleware, getMonthlyCalendar);

// Biometric sync routes (convenience endpoints)
router.post('/biometric/sync/:deviceId', authMiddleware, param('deviceId').notEmpty(), syncAttendance);
router.post('/biometric/sync-all', authMiddleware, syncAllDevices);

export default router;
