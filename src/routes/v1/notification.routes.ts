import { Router } from 'express';
import { NotificationController } from '../../controllers/notification/notification.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { param } from 'express-validator';

const router = Router();
const notificationController = new NotificationController();

router.get('/', authMiddleware, notificationController.getAllNotifications);
router.get('/my-notifications', authMiddleware, notificationController.getMyNotifications);
router.get('/:id', authMiddleware, param('id').isMongoId(), notificationController.getNotificationById);
router.put('/:id/mark-read', authMiddleware, param('id').isMongoId(), notificationController.markAsRead);
router.put('/:id/read', authMiddleware, param('id').isMongoId(), notificationController.markAsRead);
router.put('/mark-all-read', authMiddleware, notificationController.markAllAsRead);
router.delete('/:id', authMiddleware, param('id').isMongoId(), notificationController.deleteNotification);

export default router;
