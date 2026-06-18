import { Router } from "express";
import {
  testRealtimeEndpoint,
  receiveRealtimeAttendance,
  getRealtimeAttendance,
  getRealtimeStats
} from "../controllers/realtime-attendance.controller";
import { validateRealtimeToken } from "../middleware/realtime-auth.middleware";

const router = Router();

// Test endpoint (use this to debug Realtime Software data format)
// Remove this in production
router.all("/test", testRealtimeEndpoint);

// Main endpoint for Realtime Software
// POST /api/attendance - with Bearer token authentication
router.post("/attendance", validateRealtimeToken, receiveRealtimeAttendance);

// Admin endpoints (require additional authentication)
router.get("/attendance", getRealtimeAttendance);
router.get("/stats", getRealtimeStats);

export default router;
