import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';
import { Request, Response } from 'express';

const router = Router();

// Offboarding routes
const createOffboardingValidation = [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('offboardingDate').notEmpty().withMessage('Offboarding date is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

router.get('/', authMiddleware, (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Offboarding records retrieved successfully',
  });
});

router.get('/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Offboarding record retrieved successfully',
  });
});

router.post('/', authMiddleware, createOffboardingValidation, (_req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    data: {},
    message: 'Offboarding record created successfully',
  });
});

router.put('/:id', authMiddleware, param('id').isMongoId(), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Offboarding record updated successfully',
  });
});

export default router;
