import { Request, Response, NextFunction } from 'express';
import { SupportRequest } from '../../models/support.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class RequestsController {
  getAllRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, type, priority, companyId } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (priority) filter.priority = priority;
      if (companyId) filter.companyId = companyId;

      const requests = await SupportRequest.find(filter)
        .populate('createdBy', 'firstName lastName email employeeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: requests,
        message: 'Requests retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const requestId = `REQ${Date.now()}`;
      const request = await SupportRequest.create({
        ...req.body,
        requestId,
      });

      res.status(201).json({
        success: true,
        data: request,
        message: 'Request created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
