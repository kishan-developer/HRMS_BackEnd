import { Router } from 'express';
import {
  registerDevice,
  unregisterDevice,
  sendPushNotification,
  getRegisteredDevices,
  verifyLocation,
  getAllowedLocations,
  addAllowedLocation,
  removeAllowedLocation,
  checkInWithLocation,
  checkOutWithLocation,
  getPendingActions,
  uploadOfflineData,
  getLastSyncTimestamp,
  markSyncComplete,
  getOfflineData,
  getEmployeeDashboard,
  getHRManagerDashboard,
  getMobileStats,
  getTodayStatus,
  getWeeklySummary,
  getMonthlySummary,
  getMyLeaveBalance,
  getUpcomingHolidays,
  getRecentPayslips,
  downloadPayslipPDF,
  getAttendanceRecords,
} from '../../controllers/mobile.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { param } from 'express-validator';

const router = Router();

// Push Notification APIs
router.post('/register-device', authMiddleware, registerDevice);
router.post('/unregister-device', authMiddleware, unregisterDevice);
router.post('/send-push', authMiddleware, sendPushNotification);
router.get('/devices/:userId', authMiddleware, param('userId').isMongoId(), getRegisteredDevices);

// GPS Location APIs
router.post('/verify-location', authMiddleware, verifyLocation);
router.get('/allowed-locations', authMiddleware, getAllowedLocations);
router.post('/allowed-locations', authMiddleware, addAllowedLocation);
router.delete('/allowed-locations/:id', authMiddleware, param('id').isString(), removeAllowedLocation);
router.post('/check-in-with-location', authMiddleware, checkInWithLocation);
router.post('/check-out-with-location', authMiddleware, checkOutWithLocation);

// Offline Sync APIs
router.get('/sync/pending-actions/:userId', authMiddleware, param('userId').isMongoId(), getPendingActions);
router.post('/sync/upload-offline-data', authMiddleware, uploadOfflineData);
router.get('/sync/last-sync/:userId', authMiddleware, param('userId').isMongoId(), getLastSyncTimestamp);
router.post('/sync/mark-complete', authMiddleware, markSyncComplete);
router.get('/sync/offline-data/:userId', authMiddleware, param('userId').isMongoId(), getOfflineData);

// Mobile Dashboard APIs
router.get('/dashboard/employee/:userId', authMiddleware, param('userId').isMongoId(), getEmployeeDashboard);
router.get('/dashboard/hr-manager/:userId', authMiddleware, param('userId').isMongoId(), getHRManagerDashboard);
router.get('/stats/:userId', authMiddleware, param('userId').isMongoId(), getMobileStats);

// Mobile-Specific Attendance APIs
router.get('/attendance/today-status/:userId', authMiddleware, param('userId').isMongoId(), getTodayStatus);
router.get('/attendance/weekly-summary/:userId', authMiddleware, param('userId').isMongoId(), getWeeklySummary);
router.get('/attendance/records/:userId', authMiddleware, param('userId').isMongoId(), getAttendanceRecords);
router.get('/attendance/monthly-summary/:userId', authMiddleware, param('userId').isMongoId(), getMonthlySummary);

// Mobile-Specific Leave APIs
router.get('/leave/balance/:userId', authMiddleware, param('userId').isMongoId(), getMyLeaveBalance);
router.get('/leave/upcoming-holidays', authMiddleware, getUpcomingHolidays);

// Mobile-Specific Payslip APIs
router.get('/payslips/recent/:userId', authMiddleware, param('userId').isMongoId(), getRecentPayslips);
router.get('/payslips/download/:id', authMiddleware, param('id').isMongoId(), downloadPayslipPDF);

export default router;
