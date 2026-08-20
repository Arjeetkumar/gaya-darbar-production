import { Router } from 'express';
import {
  getUserNotificationsHandler,
  getUnreadCountHandler,
  markReadHandler,
  markAllReadHandler,
} from '../../controllers/notificationController.js';
import { authenticateUser } from '../../middleware/authMiddleware.js';

const router = Router();

// Protect all notification routes with user authentication
router.use(authenticateUser);

router.get('/', getUserNotificationsHandler);
router.get('/unread-count', getUnreadCountHandler);
router.patch('/:id/read', markReadHandler);
router.patch('/read-all', markAllReadHandler);

export default router;
