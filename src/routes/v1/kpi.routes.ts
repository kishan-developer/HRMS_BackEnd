import { Router } from 'express';
import { KPIController } from '../../controllers/performance/kpi.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const kpiController = new KPIController();

const createKPIValidation = [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('target').isFloat({ min: 0 }).withMessage('Target must be a positive number'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('cycle').notEmpty().withMessage('Cycle is required'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
];

const updateKPIValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('target').optional().isFloat({ min: 0 }).withMessage('Target must be a positive number'),
];

const updateProgressValidation = [
  body('currentAchievement').isFloat({ min: 0 }).withMessage('Current achievement must be a positive number'),
];

router.get('/', authMiddleware, kpiController.getAllKPIs);
router.get('/:id', authMiddleware, param('id').isMongoId(), kpiController.getKPIById);
router.post('/', authMiddleware, createKPIValidation, kpiController.createKPI);
router.put('/:id', authMiddleware, param('id').isMongoId(), updateKPIValidation, kpiController.updateKPI);
router.delete('/:id', authMiddleware, param('id').isMongoId(), kpiController.deleteKPI);
router.post('/:id/assign', authMiddleware, param('id').isMongoId(), kpiController.assignKPI);
router.post('/:id/progress', authMiddleware, param('id').isMongoId(), updateProgressValidation, kpiController.updateKPIProgress);
router.get('/analytics', authMiddleware, kpiController.getKPIAnalytics);

export default router;
