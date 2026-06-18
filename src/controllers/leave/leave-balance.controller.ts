import { Request, Response, NextFunction } from 'express';
import { LeaveBalance } from '../../models/leave-balance.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class LeaveBalanceController {
  getAllLeaveBalances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { departmentId, year } = req.query;
      
      const filter: any = {};
      if (year) filter.year = Number(year);
      else filter.year = new Date().getFullYear();

      let query = LeaveBalance.find(filter).populate('employeeId');

      if (departmentId) {
        query = query.populate({
          path: 'employeeId',
          match: { departmentId }
        });
      }

      const balances = await query;

      res.status(200).json({
        success: true,
        data: balances,
        message: 'Leave balances retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getLeaveBalanceByEmployeeId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const year = new Date().getFullYear();

      let balance = await LeaveBalance.findOne({ employeeId, year }).populate('employeeId');

      if (!balance) {
        // Create default balance if not exists
        balance = await LeaveBalance.create({
          employeeId,
          year,
          casualLeave: 12,
          sickLeave: 8,
          earnedLeave: 15,
          maternityLeave: 180,
          paternityLeave: 15,
          unpaidLeave: 0,
        });
        balance = await LeaveBalance.findById(balance._id).populate('employeeId');
      }

      res.status(200).json({
        success: true,
        data: balance,
        message: 'Leave balance retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateLeaveBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { employeeId } = req.params;
      const { casualLeave, sickLeave, earnedLeave, maternityLeave, paternityLeave, unpaidLeave } = req.body;

      const updateData: any = {};
      if (casualLeave !== undefined) updateData.casualLeave = casualLeave;
      if (sickLeave !== undefined) updateData.sickLeave = sickLeave;
      if (earnedLeave !== undefined) updateData.earnedLeave = earnedLeave;
      if (maternityLeave !== undefined) updateData.maternityLeave = maternityLeave;
      if (paternityLeave !== undefined) updateData.paternityLeave = paternityLeave;
      if (unpaidLeave !== undefined) updateData.unpaidLeave = unpaidLeave;

      const balance = await LeaveBalance.findOneAndUpdate(
        { employeeId, year: new Date().getFullYear() },
        updateData,
        { new: true, upsert: true }
      ).populate('employeeId');

      res.status(200).json({
        success: true,
        data: balance,
        message: 'Leave balance updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
