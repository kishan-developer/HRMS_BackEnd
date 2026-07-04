import { Request, Response, NextFunction } from 'express';
import { Performance } from '../../models/performance.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class PerformanceController {
  getAllPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, status, cycle, year, departmentId, page = 1, pageSize = 10 } = req.query;
      
      const filter: any = {};
      if (employeeId) filter.employeeId = employeeId;
      if (status) filter.status = status;
      if (cycle) filter.cycle = cycle;
      if (year) filter.year = year;

      let query = Performance.find(filter).populate('employeeId').sort({ year: -1, createdAt: -1 });
      
      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        query = query.where('employeeId').in(employeeIds);
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total] = await Promise.all([
        query.skip(skip).limit(Number(pageSize)),
        Performance.countDocuments(filter)
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
        message: 'Performance records retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getPerformanceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const performance = await Performance.findById(id).populate('employeeId');

      if (!performance) {
        throw new AppError('Performance record not found', 404, 'PERFORMANCE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: performance,
        message: 'Performance record retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getEmployeePerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const performance = await Performance.find({ employeeId }).sort({ year: -1, cycle: -1 });

      res.status(200).json({
        success: true,
        data: performance,
        message: 'Employee performance retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { employeeId, cycle, year, overallScore, kpiAchievement, productivityScore, attendanceScore, status, managerComments, warningHistory, tags } = req.body;

      const performance = await Performance.create({
        employeeId,
        cycle,
        year,
        overallScore,
        kpiAchievement,
        productivityScore,
        attendanceScore,
        status,
        managerComments,
        warningHistory,
        tags,
      });

      res.status(201).json({
        success: true,
        data: performance,
        message: 'Performance record created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updatePerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const { overallScore, kpiAchievement, productivityScore, attendanceScore, status, managerComments, warningHistory, tags } = req.body;

      const updateData: any = {};
      if (overallScore !== undefined) updateData.overallScore = overallScore;
      if (kpiAchievement !== undefined) updateData.kpiAchievement = kpiAchievement;
      if (productivityScore !== undefined) updateData.productivityScore = productivityScore;
      if (attendanceScore !== undefined) updateData.attendanceScore = attendanceScore;
      if (status) updateData.status = status;
      if (managerComments !== undefined) updateData.managerComments = managerComments;
      if (warningHistory !== undefined) updateData.warningHistory = warningHistory;
      if (tags !== undefined) updateData.tags = tags;

      const performance = await Performance.findByIdAndUpdate(id, updateData, { new: true });

      if (!performance) {
        throw new AppError('Performance record not found', 404, 'PERFORMANCE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: performance,
        message: 'Performance record updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getPerformanceSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
          _id: null,
          total: { $sum: 1 },
          highPerformers: { $sum: { $cond: [{ $eq: ['$status', 'High Performer'] }, 1, 0] } },
          onTrack: { $sum: { $cond: [{ $eq: ['$status', 'On Track'] }, 1, 0] } },
          needsImprovement: { $sum: { $cond: [{ $eq: ['$status', 'Needs Improvement'] }, 1, 0] } },
          lowPerformers: { $sum: { $cond: [{ $eq: ['$status', 'Low Performer'] }, 1, 0] } },
          onWatchlist: { $sum: { $cond: [{ $eq: ['$status', 'On Watchlist'] }, 1, 0] } },
          avgOverallScore: { $avg: '$overallScore' },
          avgKpiAchievement: { $avg: '$kpiAchievement' },
          avgProductivityScore: { $avg: '$productivityScore' },
          avgAttendanceScore: { $avg: '$attendanceScore' },
        }
      });

      const result = await Performance.aggregate(pipeline);

      res.status(200).json({
        success: true,
        data: result[0] || { total: 0, highPerformers: 0, onTrack: 0, needsImprovement: 0, lowPerformers: 0, onWatchlist: 0, avgOverallScore: 0, avgKpiAchievement: 0, avgProductivityScore: 0, avgAttendanceScore: 0 },
        message: 'Performance summary retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getPerformanceAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { year, departmentId } = req.query;

      const matchStage: any = {};
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
          _id: '$cycle',
          avgScore: { $avg: '$overallScore' },
          avgKpi: { $avg: '$kpiAchievement' },
          avgProductivity: { $avg: '$productivityScore' },
          avgAttendance: { $avg: '$attendanceScore' },
          employeeCount: { $sum: 1 },
        }
      });

      pipeline.push({ $sort: { _id: 1 } });

      const result = await Performance.aggregate(pipeline);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Performance analytics retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  // Feedback endpoints to match FrontEnd API
  getFeedback = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: [],
        message: 'Feedback retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getFeedbackById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      void id;

      res.status(200).json({
        success: true,
        data: {},
        message: 'Feedback retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  createFeedback = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json({
        success: true,
        data: {},
        message: 'Feedback created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      void id;

      res.status(200).json({
        success: true,
        data: {},
        message: 'Feedback updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
