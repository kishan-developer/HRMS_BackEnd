import { Router } from "express";
import {
  syncAttendance,
  getAttendanceLogs,
  getDailyAttendance,
  getDeviceStatus,
  registerDevice,
  registerEmployee
} from "../controllers/attendance-log.controller";
import {
  calculateDailyAttendance,
  getAttendanceReport
} from "../controllers/attendance-calculation.controller";
import { authenticateApiKey } from "../middleware/auth.middleware";

const router = Router();

// Public routes (secured with API key for sync agent)
router.post("/sync", authenticateApiKey, syncAttendance);

// Protected routes (require JWT authentication)
router.get("/logs", getAttendanceLogs);
router.get("/daily", getDailyAttendance);
router.get("/devices", getDeviceStatus);
router.get("/report", getAttendanceReport);

// Admin routes
router.post("/devices/register", registerDevice);
router.post("/employees/register", registerEmployee);
router.post("/calculate", calculateDailyAttendance);

export default router;
