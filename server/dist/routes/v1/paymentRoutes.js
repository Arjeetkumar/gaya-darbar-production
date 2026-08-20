import { Router } from 'express';
import { createPaymentOrderHandler, verifyPaymentHandler, } from '../../controllers/paymentController.js';
import { authenticateUser } from '../../middleware/authMiddleware.js';
const router = Router();
// Customer payment endpoints require authentication
router.use(authenticateUser);
router.post('/create-order', createPaymentOrderHandler);
router.post('/verify', verifyPaymentHandler);
export default router;
