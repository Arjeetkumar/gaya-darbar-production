import { Router } from 'express';
import {
  getKitchenTicketsHandler,
  getKitchenTicketByIdHandler,
  updateKitchenTicketStatusHandler,
  updateKitchenTicketPriorityHandler,
} from '../../controllers/kitchenTicketController.js';
import { authenticateUser, authorizeRoles } from '../../middleware/authMiddleware.js';

const router = Router();

// Require authentication and authorized staff role for all kitchen endpoints
router.use(authenticateUser);
router.use(authorizeRoles('admin', 'manager', 'kitchen_staff'));

router.get('/', getKitchenTicketsHandler);
router.get('/:id', getKitchenTicketByIdHandler);
router.patch('/:id/status', updateKitchenTicketStatusHandler);
router.patch('/:id/priority', updateKitchenTicketPriorityHandler);

export default router;
