import { Router } from 'express';
import {
  getAdminOrdersHandler,
  getAdminOrderByIdHandler,
  updateAdminOrderStatusHandler,
  cancelAdminOrderHandler,
} from '../../controllers/adminOrderController.js';
import { authenticateUser, authorizeRoles } from '../../middleware/authMiddleware.js';

const router = Router();

// Require authentication and authorized Admin/Manager role for all admin order endpoints
router.use(authenticateUser);
router.use(authorizeRoles('admin', 'manager'));

router.get('/', getAdminOrdersHandler);
router.get('/:id', getAdminOrderByIdHandler);
router.patch('/:id/status', updateAdminOrderStatusHandler);
router.patch('/:id/cancel', cancelAdminOrderHandler);

export default router;
