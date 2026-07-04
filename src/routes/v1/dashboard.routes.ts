import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  getGpsSummary,
  getLeaveSummary,
  getUpcomingHolidays,
  getPayrollSummary,
  getAlerts,
  resolveAlert,
  getDepartmentInsights,
  getDepartmentAttendanceByLocation,
} from '../../controllers/dashboard.controller';
import { param, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GPS Summary
router.get('/gps-summary', getGpsSummary);

// Leave Summary
router.get('/leave-summary', getLeaveSummary);

// Upcoming Holidays
router.get('/holidays', getUpcomingHolidays);

// Payroll Summary
router.get('/payroll-summary', query('month').optional(), getPayrollSummary);

// Alerts
router.get('/alerts', getAlerts);
router.put('/alerts/:id/resolve', param('id').notEmpty(), resolveAlert);

// Department Insights
router.get('/department-insights', getDepartmentInsights);

// Department Attendance by Location
router.get('/department-attendance', query('location').optional(), getDepartmentAttendanceByLocation);

export default router;
