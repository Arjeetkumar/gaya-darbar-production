import { Router } from 'express';
import {
  getAdminDeliveriesHandler,
  getAvailableRidersHandler,
  getAdminDeliveryByIdHandler,
  assignDeliveryRiderHandler,
  reassignDeliveryRiderHandler,
  cancelDeliveryHandler,
  getMyDeliveriesHandler,
  getMyDeliveryByIdHandler,
  updateMyDeliveryStatusHandler,
} from '../../controllers/deliveryController.js';
import { authenticateUser, authorizeRoles } from '../../middleware/authMiddleware.js';

const router = Router();

// Protect all delivery routes with authentication
router.use(authenticateUser);

// ----------------------------------------------------
// ADMIN & MANAGER DISPATCH ENDPOINTS
// ----------------------------------------------------
const adminRouter = Router();
adminRouter.use(authorizeRoles('admin', 'manager'));

adminRouter.get('/', getAdminDeliveriesHandler);
adminRouter.get('/riders', getAvailableRidersHandler);
adminRouter.get('/:id', getAdminDeliveryByIdHandler);
adminRouter.post('/:id/assign', assignDeliveryRiderHandler);
adminRouter.patch('/:id/reassign', reassignDeliveryRiderHandler);
adminRouter.patch('/:id/cancel', cancelDeliveryHandler);

router.use('/admin/deliveries', adminRouter);

// ----------------------------------------------------
// RIDER DASHBOARD ENDPOINTS
// ----------------------------------------------------
const riderRouter = Router();
riderRouter.use(authorizeRoles('delivery_rider'));

riderRouter.get('/my-deliveries', getMyDeliveriesHandler);
riderRouter.get('/my-deliveries/:id', getMyDeliveryByIdHandler);
riderRouter.patch('/my-deliveries/:id/status', updateMyDeliveryStatusHandler);

router.use('/delivery', riderRouter);

export default router;
