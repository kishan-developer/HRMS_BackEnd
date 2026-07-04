import { Router } from 'express';
import { PerformanceController } from '../../controllers/performance/performance.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const performanceController = new PerformanceController();

const createPerformanceValidation = [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('cycle').notEmpty().withMessage('Cycle is required'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
  body('overallScore').isFloat({ min: 0, max: 100 }).withMessage('Overall score must be between 0 and 100'),
  body('status').isIn(['High Performer', 'On Track', 'Needs Improvement', 'Low Performer', 'On Watchlist']).withMessage('Invalid status'),
];

const updatePerformanceValidation = [
  body('overallScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Overall score must be between 0 and 100'),
  body('status').optional().isIn(['High Performer', 'On Track', 'Needs Improvement', 'Low Performer', 'On Watchlist']).withMessage('Invalid status'),
];

// Performance routes
router.get('/', authMiddleware, performanceController.getAllPerformance);
router.get('/:id', authMiddleware, param('id').isMongoId(), performanceController.getPerformanceById);
router.get('/employee/:employeeId', authMiddleware, param('employeeId').isMongoId(), performanceController.getEmployeePerformance);
router.post('/', authMiddleware, createPerformanceValidation, performanceController.createPerformance);
router.put('/:id', authMiddleware, param('id').isMongoId(), updatePerformanceValidation, performanceController.updatePerformance);
router.get('/summary', authMiddleware, performanceController.getPerformanceSummary);
router.get('/analytics', authMiddleware, performanceController.getPerformanceAnalytics);

// Feedback routes (must come before /:id)
router.get('/feedback', authMiddleware, performanceController.getFeedback);
router.get('/feedback/:id', authMiddleware, param('id').notEmpty(), performanceController.getFeedbackById);
router.post('/feedback', authMiddleware, performanceController.createFeedback);
router.put('/feedback/:id', authMiddleware, param('id').notEmpty(), performanceController.updateFeedback);

export default router;
