import { Request, Response, NextFunction } from 'express';
import { LeaveType } from '../../models/leave-type.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class LeaveTypeController {
  getAllLeaveTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { isActive } = req.query;
      
      const filter: any = {};
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const leaveTypes = await LeaveType.find(filter).sort({ name: 1 });

      res.status(200).json({
        success: true,
        data: leaveTypes,
        message: 'Leave types retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaveTypeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const leaveType = await LeaveType.findById(id);

      if (!leaveType) {
        throw new AppError('Leave type not found', 404, 'LEAVE_TYPE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leaveType,
        message: 'Leave type retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  createLeaveType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const {
        name,
        code,
        description,
        daysAllowed,
        isPaid,
        requiresApproval,
        requiresDocument,
        carryForwardAllowed,
        maxCarryForwardDays,
      } = req.body;

      const leaveType = await LeaveType.create({
        name,
        code: code.toUpperCase(),
        description,
        daysAllowed,
        isPaid,
        requiresApproval,
        requiresDocument,
        carryForwardAllowed,
        maxCarryForwardDays,
      });

      res.status(201).json({
        success: true,
        data: leaveType,
        message: 'Leave type created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateLeaveType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const {
        name,
        code,
        description,
        daysAllowed,
        isPaid,
        requiresApproval,
        requiresDocument,
        carryForwardAllowed,
        maxCarryForwardDays,
        isActive,
      } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (code) updateData.code = code.toUpperCase();
      if (description !== undefined) updateData.description = description;
      if (daysAllowed !== undefined) updateData.daysAllowed = daysAllowed;
      if (isPaid !== undefined) updateData.isPaid = isPaid;
      if (requiresApproval !== undefined) updateData.requiresApproval = requiresApproval;
      if (requiresDocument !== undefined) updateData.requiresDocument = requiresDocument;
      if (carryForwardAllowed !== undefined) updateData.carryForwardAllowed = carryForwardAllowed;
      if (maxCarryForwardDays !== undefined) updateData.maxCarryForwardDays = maxCarryForwardDays;
      if (isActive !== undefined) updateData.isActive = isActive;

      const leaveType = await LeaveType.findByIdAndUpdate(id, updateData, { new: true });

      if (!leaveType) {
        throw new AppError('Leave type not found', 404, 'LEAVE_TYPE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leaveType,
        message: 'Leave type updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteLeaveType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const leaveType = await LeaveType.findByIdAndDelete(id);

      if (!leaveType) {
        throw new AppError('Leave type not found', 404, 'LEAVE_TYPE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leaveType,
        message: 'Leave type deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
