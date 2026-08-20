import { Router } from 'express';
import {
  getAdminPaymentsHandler,
  processAdminRefundHandler,
} from '../../controllers/paymentController.js';
import { authenticateUser, authorizeRoles } from '../../middleware/authMiddleware.js';

const router = Router();

// Protect all admin payment endpoints with authenticateUser + authorizeRoles('admin', 'manager')
router.use(authenticateUser);
router.use(authorizeRoles('admin', 'manager'));

router.get('/', getAdminPaymentsHandler);
router.post('/:id/refund', processAdminRefundHandler);

export default router;
