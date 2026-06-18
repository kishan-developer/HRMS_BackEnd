import { Request, Response, NextFunction } from 'express';
import { KPI } from '../../models/kpi.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class KPIController {
  getAllKPIs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, status, category, cycle, year, departmentId, page = 1, pageSize = 10 } = req.query;
      
      const filter: any = {};
      if (employeeId) filter.employeeId = employeeId;
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (cycle) filter.cycle = cycle;
      if (year) filter.year = year;

      let query = KPI.find(filter).populate('employeeId').sort({ dueDate: 1 });
      
      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        query = query.where('employeeId').in(employeeIds);
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total] = await Promise.all([
        query.skip(skip).limit(Number(pageSize)),
        KPI.countDocuments(filter)
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
        message: 'KPIs retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getKPIById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const kpi = await KPI.findById(id).populate('employeeId');

      if (!kpi) {
        throw new AppError('KPI not found', 404, 'KPI_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: kpi,
        message: 'KPI retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createKPI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { employeeId, title, description, category, target, targetUnit, dueDate, measurementMethod, startDate, cycle, year, notes, attachments } = req.body;

      const kpi = await KPI.create({
        employeeId,
        title,
        description,
        category,
        target,
        targetUnit,
        currentAchievement: 0,
        achievementPercent: 0,
        dueDate: new Date(dueDate),
        status: 'Not Started',
        measurementMethod,
        startDate: startDate ? new Date(startDate) : undefined,
        cycle,
        year,
        notes,
        attachments,
      });

      res.status(201).json({
        success: true,
        data: kpi,
        message: 'KPI created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateKPI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const { title, description, category, target, targetUnit, currentAchievement, dueDate, measurementMethod, startDate, cycle, year, notes, attachments } = req.body;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category) updateData.category = category;
      if (target) updateData.target = target;
      if (targetUnit !== undefined) updateData.targetUnit = targetUnit;
      if (currentAchievement !== undefined) {
        updateData.currentAchievement = currentAchievement;
        if (target) {
          updateData.achievementPercent = Math.round((currentAchievement / target) * 100);
        }
      }
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (measurementMethod) updateData.measurementMethod = measurementMethod;
      if (startDate) updateData.startDate = new Date(startDate);
      if (cycle) updateData.cycle = cycle;
      if (year) updateData.year = year;
      if (notes !== undefined) updateData.notes = notes;
      if (attachments !== undefined) updateData.attachments = attachments;

      const kpi = await KPI.findByIdAndUpdate(id, updateData, { new: true });

      if (!kpi) {
        throw new AppError('KPI not found', 404, 'KPI_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: kpi,
        message: 'KPI updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  deleteKPI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const kpi = await KPI.findByIdAndDelete(id);

      if (!kpi) {
        throw new AppError('KPI not found', 404, 'KPI_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        message: 'KPI deleted successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  assignKPI = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { employeeId } = req.body;

      const kpi = await KPI.findByIdAndUpdate(
        id,
        { employeeId },
        { new: true }
      );

      if (!kpi) {
        throw new AppError('KPI not found', 404, 'KPI_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: kpi,
        message: 'KPI assigned successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateKPIProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { currentAchievement, notes } = req.body;

      const kpi = await KPI.findById(id);

      if (!kpi) {
        throw new AppError('KPI not found', 404, 'KPI_NOT_FOUND');
      }

      const achievementPercent = Math.round((currentAchievement / kpi.target) * 100);

      let status = 'On Track';
      if (achievementPercent >= 100) {
        status = 'Achieved';
      } else if (achievementPercent < 50) {
        status = 'At Risk';
      }

      kpi.currentAchievement = currentAchievement;
      kpi.achievementPercent = achievementPercent;
      kpi.status = status as 'Not Started' | 'On Track' | 'At Risk' | 'Achieved' | 'Missed';
      kpi.notes = notes;
      await kpi.save();

      res.status(200).json({
        success: true,
        data: kpi,
        message: 'KPI progress updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getKPIAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cycle, year, departmentId } = req.query;

      const matchStage: any = {};
      if (cycle) matchStage.cycle = cycle;
      if (year) matchStage.year = year;

      const pipeline: any[] = [
        { $match: matchStage },
      ];

      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        pipeline.push({ $match: { employeeId: { $in: employeeIds.map(id => id.toString()) } } });
      }

      pipeline.push({
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          notStarted: { $sum: { $cond: [{ $eq: ['$status', 'Not Started'] }, 1, 0] } },
          onTrack: { $sum: { $cond: [{ $eq: ['$status', 'On Track'] }, 1, 0] } },
          atRisk: { $sum: { $cond: [{ $eq: ['$status', 'At Risk'] }, 1, 0] } },
          achieved: { $sum: { $cond: [{ $eq: ['$status', 'Achieved'] }, 1, 0] } },
          missed: { $sum: { $cond: [{ $eq: ['$status', 'Missed'] }, 1, 0] } },
          avgAchievementPercent: { $avg: '$achievementPercent' },
        }
      });

      const result = await KPI.aggregate(pipeline);

      res.status(200).json({
        success: true,
        data: result,
        message: 'KPI analytics retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
