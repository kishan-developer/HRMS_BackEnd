import { Router } from "express";
import {
  testRealtimeEndpoint,
  receiveRealtimeAttendance,
  getRealtimeAttendance,
  getRealtimeStats,
  sendToThirdPartyAPI
} from "../controllers/realtime-attendance.controller";
import { validateRealtimeToken } from "../middleware/realtime-auth.middleware";

const router = Router();

// Test endpoint (use this to debug Realtime Software data format)
// Remove this in production
router.all("/test", testRealtimeEndpoint);

// Main endpoint for Realtime Software
// POST /api/attendance - with Bearer token authentication
router.post("/attendance/with-auth", validateRealtimeToken, receiveRealtimeAttendance);// with auth
router.post("/attendance", receiveRealtimeAttendance); // without auth 

// Admin endpoints (require additional authentication)
router.get("/attendance", getRealtimeAttendance);
router.get("/stats", getRealtimeStats);

// Third-party API integration endpoint
// POST /api/third-party - send attendance data to external biometric API
router.post("/third-party", sendToThirdPartyAPI);

export default router;
