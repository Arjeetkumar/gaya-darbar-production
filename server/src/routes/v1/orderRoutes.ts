import { Router } from 'express';
import {
  createOrderHandler,
  getUserOrdersHandler,
  getUserOrderByIdHandler,
  updateOrderStatusHandler,
} from '../../controllers/orderController.js';
import { getCustomerOrderTrackingHandler } from '../../controllers/customerOrderTrackingController.js';
import { authenticateUser, authorizeRoles } from '../../middleware/authMiddleware.js';

const router = Router();

// Protect all order endpoints with authentication
router.use(authenticateUser);

router.post('/', createOrderHandler);
router.get('/', getUserOrdersHandler);
router.get('/:id/tracking', getCustomerOrderTrackingHandler);
router.get('/:id', getUserOrderByIdHandler);

// Controlled order status management for authorized staff
router.patch('/:id/status', authorizeRoles('admin', 'manager', 'kitchen_staff'), updateOrderStatusHandler);

export default router;
