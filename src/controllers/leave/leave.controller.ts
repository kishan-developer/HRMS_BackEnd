import { Request, Response, NextFunction } from 'express';
import { Leave } from '../../models/leave.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class LeaveController {
  getAllLeaves = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, status, leaveType, departmentId, page = 1, pageSize = 10 } = req.query;
      
      const filter: any = {};
      if (employeeId) filter.employeeId = employeeId;
      if (status) filter.status = status;
      if (leaveType) filter.leaveType = leaveType;

      let query = Leave.find(filter).sort({ createdAt: -1 });
      
      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        query = query.where('employeeId').in(employeeIds);
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total] = await Promise.all([
        query.skip(skip).limit(Number(pageSize)),
        Leave.countDocuments(filter)
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
        message: 'Leave requests retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getLeaveById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const leave = await Leave.findById(id).populate('employeeId');

      if (!leave) {
        throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leave,
        message: 'Leave request retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { employeeId, leaveType, fromDate, toDate, reason, attachmentUrl } = req.body;
      
      // If employeeId looks like a userId (MongoDB ObjectId), look up the user's employeeId
      let targetEmployeeId = employeeId;
      const user = await User.findById(employeeId);
      if (user && user.employeeId) {
        targetEmployeeId = user.employeeId.toString();
      }
      
      const totalDays = this.calculateDays(fromDate, toDate);

      const leave = await Leave.create({
        employeeId: targetEmployeeId,
        leaveType,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        totalDays,
        reason,
        attachmentUrl,
        status: 'Pending',
      });

      res.status(201).json({
        success: true,
        data: leave,
        message: 'Leave request created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const { leaveType, fromDate, toDate, reason, attachmentUrl } = req.body;

      const updateData: any = {};
      if (leaveType) updateData.leaveType = leaveType;
      if (fromDate && toDate) {
        updateData.fromDate = new Date(fromDate);
        updateData.toDate = new Date(toDate);
        updateData.totalDays = this.calculateDays(fromDate, toDate);
      }
      if (reason) updateData.reason = reason;
      if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;

      const leave = await Leave.findByIdAndUpdate(id, updateData, { new: true });

      if (!leave) {
        throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leave,
        message: 'Leave request updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  approveLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, managerNotes } = req.body;

      const leave = await Leave.findByIdAndUpdate(
        id,
        {
          status: 'Approved',
          approvedBy,
          managerNotes,
          approvedAt: new Date(),
        },
        { new: true }
      );

      if (!leave) {
        throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leave,
        message: 'Leave request approved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  rejectLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, managerNotes, rejectionReason } = req.body;

      const leave = await Leave.findByIdAndUpdate(
        id,
        {
          status: 'Rejected',
          approvedBy,
          managerNotes,
          rejectionReason,
        },
        { new: true }
      );

      if (!leave) {
        throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leave,
        message: 'Leave request rejected successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  cancelLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const leave = await Leave.findByIdAndUpdate(
        id,
        { status: 'Cancel Requested' },
        { new: true }
      );

      if (!leave) {
        throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: leave,
        message: 'Leave request cancelled successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getLeaveBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const year = new Date().getFullYear();

      // If employeeId looks like a userId (MongoDB ObjectId), look up the user's employeeId
      let targetEmployeeId = employeeId;
      const user = await User.findById(employeeId);
      if (user && user.employeeId) {
        targetEmployeeId = user.employeeId.toString();
      }

      const leaves = await Leave.find({
        employeeId: targetEmployeeId,
        status: 'Approved',
        fromDate: { $gte: new Date(`${year}-01-01`) },
        toDate: { $lte: new Date(`${year}-12-31`) },
      });

      const balance = leaves.reduce((acc: any, leave) => {
        acc[leave.leaveType] = (acc[leave.leaveType] || 0) + leave.totalDays;
        return acc;
      }, {});

      // Calculate remaining balance (subtract used from total)
      const totalBalances = {
        'Casual Leave': 12,
        'Earned Leave': 15,
        'Sick Leave': 6,
        'Maternity Leave': 90,
        'Paternity Leave': 15,
        'Unpaid Leave': 0,
      };

      const remainingBalance: any = {};
      for (const [leaveType, total] of Object.entries(totalBalances)) {
        remainingBalance[leaveType] = Math.max(0, total - (balance[leaveType] || 0));
      }

      res.status(200).json({
        success: true,
        data: remainingBalance,
        message: 'Leave balance retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getLeaveApprovals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { departmentId } = req.query;

      let query = Leave.find({ status: 'Pending' }).sort({ createdAt: -1 });

      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        query = query.where('employeeId').in(employeeIds);
      }

      const leaves = await query;

      res.status(200).json({
        success: true,
        data: leaves,
        message: 'Leave approvals retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getMyLeaveRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const leaves = await Leave.find({ employeeId: user.employeeId }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: leaves,
        message: 'My leave requests retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getMyPendingLeaves = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const leaves = await Leave.find({ 
        employeeId: user.employeeId, 
        status: { $in: ['Pending', 'Cancel Requested'] } 
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: leaves,
        message: 'My pending leaves retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  private calculateDays(fromDate: string, toDate: string): number {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }
}
