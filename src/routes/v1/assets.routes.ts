import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';
import { Request, Response } from 'express';

const router = Router();

// Assets routes
const createAssetValidation = [
  body('name').notEmpty().withMessage('Asset name is required'),
  body('type').notEmpty().withMessage('Asset type is required'),
  body('serialNumber').notEmpty().withMessage('Serial number is required'),
  body('status').notEmpty().withMessage('Status is required'),
];

router.get('/', authMiddleware, (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Assets retrieved successfully',
  });
});

router.get('/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Asset retrieved successfully',
  });
});

router.post('/', authMiddleware, createAssetValidation, (_req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    data: {},
    message: 'Asset created successfully',
  });
});

router.put('/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Asset updated successfully',
  });
});

router.delete('/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Asset deleted successfully',
  });
});

// Inventory routes
router.get('/inventory/all', authMiddleware, (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Inventory retrieved successfully',
  });
});

// Assign asset
const assignAssetValidation = [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('assignedDate').notEmpty().withMessage('Assigned date is required'),
];

router.post('/:id/assign', authMiddleware, param('id').isMongoId(), assignAssetValidation, (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Asset assigned successfully',
  });
});

export default router;
