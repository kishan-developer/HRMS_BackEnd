import { Request, Response, NextFunction } from 'express';
import { Announcement } from '../../models/support.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class AnnouncementsController {
  getAllAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, targetAudience, isPublished, companyId } = req.query;

      const filter: any = {};
      if (type) filter.type = type;
      if (targetAudience) filter.targetAudience = targetAudience;
      if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
      if (companyId) filter.companyId = companyId;

      const announcements = await Announcement.find(filter)
        .populate('createdBy', 'firstName lastName email employeeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: announcements,
        message: 'Announcements retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const announcementId = `ANN${Date.now()}`;
      const announcement = await Announcement.create({
        ...req.body,
        announcementId,
      });

      res.status(201).json({
        success: true,
        data: announcement,
        message: 'Announcement created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
