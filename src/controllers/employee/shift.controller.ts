import { Request, Response, NextFunction } from 'express';
import { Shift } from '../../models/shift.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class ShiftController {
  getAllShifts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shifts = await Shift.find().lean();
      
      const shiftsCount = await Promise.all(
        shifts.map(async (shift: any) => {
          const employeeCount = await User.countDocuments({ shiftId: shift._id, role: 'employee' });
          return {
            ...shift,
            employeeCount,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: shiftsCount,
        message: 'Shifts retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getShiftById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const shift = await Shift.findById(id);

      if (!shift) {
        throw new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: shift,
        message: 'Shift retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { name, startTime, endTime, breakDuration } = req.body;

      const shift = await Shift.create({
        name,
        startTime,
        endTime,
        breakDuration,
      });

      res.status(201).json({
        success: true,
        data: shift,
        message: 'Shift created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const shift = await Shift.findByIdAndUpdate(id, req.body, { new: true });

      if (!shift) {
        throw new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: shift,
        message: 'Shift updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  deleteShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      const employeeCount = await User.countDocuments({ shiftId: id, role: 'employee' });

      if (employeeCount > 0) {
        throw new AppError('Cannot delete shift with assigned employees', 400, 'SHIFT_HAS_EMPLOYEES');
      }

      const shift = await Shift.findByIdAndDelete(id);

      if (!shift) {
        throw new AppError('Shift not found', 404, 'SHIFT_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        message: 'Shift deleted successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
