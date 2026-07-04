import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  getAttendanceMachines,
  getAttendanceMachineById,
  addAttendanceMachine,
  updateAttendanceMachine,
  deleteAttendanceMachine,
  syncAttendanceMachine,
  testMachineConnection,
  getSyncLogs,
} from '../../controllers/attendance-machine.controller';
import { body, param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all attendance machines
router.get('/machines', getAttendanceMachines);

// Get attendance machine by ID
router.get('/machines/:id', param('id').notEmpty(), getAttendanceMachineById);

// Add attendance machine
router.post('/machines', addAttendanceMachine);

// Update attendance machine
router.put('/machines/:id', param('id').notEmpty(), updateAttendanceMachine);

// Delete attendance machine
router.delete('/machines/:id', param('id').notEmpty(), deleteAttendanceMachine);

// Sync attendance machine
router.post('/machines/:id/sync', param('id').notEmpty(), syncAttendanceMachine);

// Test machine connection
router.post('/machines/test-connection', testMachineConnection);

// Get sync logs
router.get('/machines/:machineId/sync-logs', param('machineId').notEmpty(), getSyncLogs);

export default router;
