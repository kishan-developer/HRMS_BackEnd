import { Request, Response, NextFunction } from 'express';
import { Regularization } from '../../models/regularization.model';
import { Attendance } from '../../models/attendance.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class RegularizationController {
  getAllRegularization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, status, issueType, departmentId, page = 1, pageSize = 10 } = req.query;
      
      const filter: any = {};
      if (employeeId) filter.employeeId = employeeId;
      if (status) filter.status = status;
      if (issueType) filter.issueType = issueType;

      let query = Regularization.find(filter).populate('employeeId').sort({ date: -1 });
      
      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        query = query.where('employeeId').in(employeeIds);
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total] = await Promise.all([
        query.skip(skip).limit(Number(pageSize)),
        Regularization.countDocuments(filter)
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
        message: 'Regularization requests retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getRegularizationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const regularization = await Regularization.findById(id).populate('employeeId');

      if (!regularization) {
        throw new AppError('Regularization request not found', 404, 'REGULARIZATION_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: regularization,
        message: 'Regularization request retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createRegularization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { employeeId, date, issueType, punchType, requestedTime, reason, attachmentUrl } = req.body;

      const regularization = await Regularization.create({
        employeeId,
        date: new Date(date),
        issueType,
        punchType,
        requestedTime,
        reason,
        attachmentUrl,
        status: 'Pending',
      });

      res.status(201).json({
        success: true,
        data: regularization,
        message: 'Regularization request created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateRegularization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const { issueType, punchType, requestedTime, reason, attachmentUrl } = req.body;

      const updateData: any = {};
      if (issueType) updateData.issueType = issueType;
      if (punchType) updateData.punchType = punchType;
      if (requestedTime) updateData.requestedTime = requestedTime;
      if (reason) updateData.reason = reason;
      if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;

      const regularization = await Regularization.findByIdAndUpdate(id, updateData, { new: true });

      if (!regularization) {
        throw new AppError('Regularization request not found', 404, 'REGULARIZATION_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: regularization,
        message: 'Regularization request updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  approveRegularization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, managerNote } = req.body;

      const regularization = await Regularization.findByIdAndUpdate(
        id,
        {
          status: 'Approved',
          approvedBy,
          managerNote,
          approvedAt: new Date(),
        },
        { new: true }
      );

      if (!regularization) {
        throw new AppError('Regularization request not found', 404, 'REGULARIZATION_NOT_FOUND');
      }

      const attendance = await Attendance.findOne({
        employeeId: regularization.employeeId,
        date: regularization.date,
      });

      if (attendance) {
        if (regularization.punchType === 'Punch In') {
          attendance.punchInTime = regularization.requestedTime;
        } else {
          attendance.punchOutTime = regularization.requestedTime;
        }
        attendance.status = 'Present';
        await attendance.save();
      }

      res.status(200).json({
        success: true,
        data: regularization,
        message: 'Regularization request approved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  rejectRegularization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, managerNote } = req.body;

      const regularization = await Regularization.findByIdAndUpdate(
        id,
        {
          status: 'Rejected',
          approvedBy,
          managerNote,
          approvedAt: new Date(),
        },
        { new: true }
      );

      if (!regularization) {
        throw new AppError('Regularization request not found', 404, 'REGULARIZATION_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: regularization,
        message: 'Regularization request rejected successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
