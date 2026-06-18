import { Router } from 'express';
import {
  registerDevice,
  getAllDevices,
  getDevice,
  updateDevice,
  deleteDevice,
  connectDevice,
  disconnectDevice,
  testConnection,
  syncAttendance,
  getDeviceLogs,
  getDeviceUsers,
  getDeviceInfo,
  syncAttendanceByRange,
  syncAllDevices,
} from '../../controllers/biometric.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();

// Validation middleware
const registerDeviceValidation = [
  body('name').notEmpty().withMessage('Device name is required'),
  body('brand').notEmpty().withMessage('Brand is required'),
  body('deviceModel').notEmpty().withMessage('Device model is required'),
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('ipAddress').notEmpty().withMessage('IP address is required'),
  body('port').isNumeric().withMessage('Port must be a number'),
  body('gateway').notEmpty().withMessage('Gateway is required'),
  body('serialNumber').notEmpty().withMessage('Serial number is required'),
];

const updateDeviceValidation = [
  body('name').optional().notEmpty().withMessage('Device name cannot be empty'),
  body('brand').optional().notEmpty().withMessage('Brand cannot be empty'),
  body('deviceModel').optional().notEmpty().withMessage('Device model cannot be empty'),
  body('ipAddress').optional().notEmpty().withMessage('IP address cannot be empty'),
  body('port').optional().isNumeric().withMessage('Port must be a number'),
  body('gateway').optional().notEmpty().withMessage('Gateway cannot be empty'),
  body('serialNumber').optional().notEmpty().withMessage('Serial number cannot be empty'),
];

// Device management routes
router.post('/devices', authMiddleware, registerDeviceValidation, registerDevice);
router.get('/devices', authMiddleware, getAllDevices);
router.get('/devices/:deviceId', authMiddleware, param('deviceId').notEmpty(), getDevice);
router.put('/devices/:deviceId', authMiddleware, param('deviceId').notEmpty(), updateDeviceValidation, updateDevice);
router.delete('/devices/:deviceId', authMiddleware, param('deviceId').notEmpty(), deleteDevice);

// Device connection routes
router.post('/devices/:deviceId/connect', authMiddleware, param('deviceId').notEmpty(), connectDevice);
router.post('/devices/:deviceId/disconnect', authMiddleware, param('deviceId').notEmpty(), disconnectDevice);
router.post('/devices/:deviceId/test', authMiddleware, param('deviceId').notEmpty(), testConnection);

// Device info routes
router.get('/devices/:deviceId/info', authMiddleware, param('deviceId').notEmpty(), getDeviceInfo);
router.get('/devices/:deviceId/users', authMiddleware, param('deviceId').notEmpty(), getDeviceUsers);
router.get('/devices/:deviceId/logs', authMiddleware, param('deviceId').notEmpty(), getDeviceLogs);

// Attendance sync routes
router.post('/devices/:deviceId/sync', authMiddleware, param('deviceId').notEmpty(), syncAttendance);
router.post('/devices/:deviceId/sync/range', authMiddleware, param('deviceId').notEmpty(), syncAttendanceByRange);
router.post('/sync-all', authMiddleware, syncAllDevices);

export default router;
