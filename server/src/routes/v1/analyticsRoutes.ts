import { Router } from 'express';
import {
  getOverviewAnalyticsHandler,
  getOrderAnalyticsHandler,
  getRevenueAnalyticsHandler,
  getKitchenAnalyticsHandler,
  getDeliveryAnalyticsHandler,
  getRiderAnalyticsHandler,
  getMenuAnalyticsHandler,
  getCustomerAnalyticsHandler,
  getNutritionAnalyticsHandler,
} from '../../controllers/analyticsController.js';
import { authenticateUser, authorizeRoles } from '../../middleware/authMiddleware.js';

const router = Router();

// Protect all analytics endpoints with auth and RBAC (Admin & Manager only)
router.use(authenticateUser);
router.use(authorizeRoles('admin', 'manager'));

router.get('/overview', getOverviewAnalyticsHandler);
router.get('/orders', getOrderAnalyticsHandler);
router.get('/revenue', getRevenueAnalyticsHandler);
router.get('/kitchen', getKitchenAnalyticsHandler);
router.get('/delivery', getDeliveryAnalyticsHandler);
router.get('/riders', getRiderAnalyticsHandler);
router.get('/menu', getMenuAnalyticsHandler);
router.get('/customers', getCustomerAnalyticsHandler);
router.get('/nutrition', getNutritionAnalyticsHandler);

export default router;
