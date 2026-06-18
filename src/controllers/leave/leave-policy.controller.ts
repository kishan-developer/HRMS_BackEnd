import { Request, Response, NextFunction } from 'express';
import { LeavePolicy } from '../../models/leave-policy.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class LeavePolicyController {
  getLeavePolicies = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let policy = await LeavePolicy.findOne({ isActive: true });

      if (!policy) {
        // Create default policy if not exists
        policy = await LeavePolicy.create({
          casualLeaveDays: 12,
          sickLeaveDays: 8,
          earnedLeaveDays: 15,
          maternityLeaveDays: 180,
          paternityLeaveDays: 15,
          unpaidLeaveDays: 0,
          carryForwardEnabled: true,
          leaveEncashmentEnabled: true,
          sandwichLeaveRule: false,
          maxCarryForwardDays: 15,
          minServiceForEncashment: 240,
          isActive: true,
        });
      }

      res.status(200).json({
        success: true,
        data: policy,
        message: 'Leave policies retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateLeavePolicies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const {
        casualLeaveDays,
        sickLeaveDays,
        earnedLeaveDays,
        maternityLeaveDays,
        paternityLeaveDays,
        unpaidLeaveDays,
        carryForwardEnabled,
        leaveEncashmentEnabled,
        sandwichLeaveRule,
        maxCarryForwardDays,
        minServiceForEncashment,
      } = req.body;

      const updateData: any = {};
      if (casualLeaveDays !== undefined) updateData.casualLeaveDays = casualLeaveDays;
      if (sickLeaveDays !== undefined) updateData.sickLeaveDays = sickLeaveDays;
      if (earnedLeaveDays !== undefined) updateData.earnedLeaveDays = earnedLeaveDays;
      if (maternityLeaveDays !== undefined) updateData.maternityLeaveDays = maternityLeaveDays;
      if (paternityLeaveDays !== undefined) updateData.paternityLeaveDays = paternityLeaveDays;
      if (unpaidLeaveDays !== undefined) updateData.unpaidLeaveDays = unpaidLeaveDays;
      if (carryForwardEnabled !== undefined) updateData.carryForwardEnabled = carryForwardEnabled;
      if (leaveEncashmentEnabled !== undefined) updateData.leaveEncashmentEnabled = leaveEncashmentEnabled;
      if (sandwichLeaveRule !== undefined) updateData.sandwichLeaveRule = sandwichLeaveRule;
      if (maxCarryForwardDays !== undefined) updateData.maxCarryForwardDays = maxCarryForwardDays;
      if (minServiceForEncashment !== undefined) updateData.minServiceForEncashment = minServiceForEncashment;

      const policy = await LeavePolicy.findOneAndUpdate(
        { isActive: true },
        updateData,
        { new: true, upsert: true }
      );

      res.status(200).json({
        success: true,
        data: policy,
        message: 'Leave policies updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
