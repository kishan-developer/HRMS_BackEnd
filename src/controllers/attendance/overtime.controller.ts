import { Request, Response, NextFunction } from 'express';
import { Overtime } from '../../models/overtime.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class OvertimeController {
  getAllOvertime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, status, otType, departmentId, page = 1, pageSize = 10 } = req.query;
      
      const filter: any = {};
      if (employeeId) filter.employeeId = employeeId;
      if (status) filter.status = status;
      if (otType) filter.otType = otType;

      let query = Overtime.find(filter).sort({ date: -1 });
      
      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        query = query.where('employeeId').in(employeeIds);
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total] = await Promise.all([
        query.skip(skip).limit(Number(pageSize)),
        Overtime.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total,
            totalPages: Math.ceil(total / Number(pageSize)),
          },
        },
        message: 'Overtime requests retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getOvertimeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const overtime = await Overtime.findById(id).populate('employeeId');

      if (!overtime) {
        throw new AppError('Overtime request not found', 404, 'OVERTIME_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: overtime,
        message: 'Overtime request retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createOvertime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { employeeId, date, actualHours, allowedHours, overtimeHours, otType, reason, attachmentUrl } = req.body;

      const overtime = await Overtime.create({
        employeeId,
        date: new Date(date),
        actualHours,
        allowedHours,
        overtimeHours,
        otType,
        reason,
        attachmentUrl,
        status: 'Pending',
      });

      res.status(201).json({
        success: true,
        data: overtime,
        message: 'Overtime request created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateOvertime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const { actualHours, allowedHours, overtimeHours, otType, reason, attachmentUrl } = req.body;

      const updateData: any = {};
      if (actualHours) updateData.actualHours = actualHours;
      if (allowedHours) updateData.allowedHours = allowedHours;
      if (overtimeHours) updateData.overtimeHours = overtimeHours;
      if (otType) updateData.otType = otType;
      if (reason !== undefined) updateData.reason = reason;
      if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;

      const overtime = await Overtime.findByIdAndUpdate(id, updateData, { new: true });

      if (!overtime) {
        throw new AppError('Overtime request not found', 404, 'OVERTIME_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: overtime,
        message: 'Overtime request updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  approveOvertime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, managerNote } = req.body;

      const overtime = await Overtime.findByIdAndUpdate(
        id,
        {
          status: 'Approved',
          approvedBy,
          managerNote,
          approvedAt: new Date(),
        },
        { new: true }
      );

      if (!overtime) {
        throw new AppError('Overtime request not found', 404, 'OVERTIME_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: overtime,
        message: 'Overtime request approved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  rejectOvertime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, managerNote } = req.body;

      const overtime = await Overtime.findByIdAndUpdate(
        id,
        {
          status: 'Rejected',
          approvedBy,
          managerNote,
          approvedAt: new Date(),
        },
        { new: true }
      );

      if (!overtime) {
        throw new AppError('Overtime request not found', 404, 'OVERTIME_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: overtime,
        message: 'Overtime request rejected successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getOvertimeSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, departmentId } = req.query;

      const matchStage: any = {};
      if (startDate && typeof startDate === 'string') {
        matchStage.date = { ...matchStage.date, $gte: new Date(startDate) };
      }
      if (endDate && typeof endDate === 'string') {
        matchStage.date = { ...matchStage.date, $lte: new Date(endDate) };
      }

      const pipeline: any[] = [
        { $match: matchStage },
      ];

      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        pipeline.push({ $match: { employeeId: { $in: employeeIds.map(id => id.toString()) } } });
      }

      pipeline.push({
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          totalOvertimeHours: { $sum: '$overtimeHours' },
          avgOvertimeHours: { $avg: '$overtimeHours' },
        }
      });

      const result = await Overtime.aggregate(pipeline);

      res.status(200).json({
        success: true,
        data: result[0] || { total: 0, pending: 0, approved: 0, rejected: 0, totalOvertimeHours: 0, avgOvertimeHours: 0 },
        message: 'Overtime summary retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
