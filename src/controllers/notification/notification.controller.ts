import { Request, Response, NextFunction } from 'express';
import { Notification } from '../../models/notification.model';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

export class NotificationController {
  getAllNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { unreadOnly = false, page = 1, pageSize = 10 } = req.query;

      const filter: any = { userId };
      if (unreadOnly === 'true') {
        filter.isRead = false;
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total, unreadCount] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)),
        Notification.countDocuments(filter),
        Notification.countDocuments({ userId, isRead: false }),
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
          unreadCount,
        },
        message: 'Notifications retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      const { unreadOnly = false, page = 1, pageSize = 10 } = req.query;

      const filter: any = { userId };
      if (unreadOnly === 'true') {
        filter.isRead = false;
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total, unreadCount] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)),
        Notification.countDocuments(filter),
        Notification.countDocuments({ userId, isRead: false }),
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
          unreadCount,
        },
        message: 'My notifications retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getNotificationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const notification = await Notification.findById(id);

      if (!notification) {
        throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const notification = await Notification.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification marked as read',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
      }

      await Notification.updateMany(
        { userId },
        { isRead: true }
      );

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const notification = await Notification.findByIdAndDelete(id);

      if (!notification) {
        throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createNotification = async (userId: string, type: string, title: string, message: string): Promise<void> => {
    await Notification.create({
      audience: {
        audienceType: 'Specific Employees' as any,
        employeeIds: [userId],
      },
      type: type as any,
      title,
      message,
    });
  };

  createBulkNotifications = async (notifications: Array<{ userId: string; type: string; title: string; message: string }>): Promise<void> => {
    await Notification.insertMany(
      notifications.map(n => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: false,
      }))
    );
  };
}
