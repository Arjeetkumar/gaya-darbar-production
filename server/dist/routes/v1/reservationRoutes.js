import { Router } from 'express';
import { checkAvailabilityHandler, createReservationHandler, getUserReservationsHandler, getUserReservationByIdHandler, cancelUserReservationHandler, } from '../../controllers/reservationController.js';
import { authenticateUser } from '../../middleware/authMiddleware.js';
const router = Router();
// Public availability check endpoint
router.get('/availability', checkAvailabilityHandler);
// Protected reservation operations
router.use(authenticateUser);
router.post('/', createReservationHandler);
router.get('/', getUserReservationsHandler);
router.get('/:id', getUserReservationByIdHandler);
router.patch('/:id/cancel', cancelUserReservationHandler);
export default router;
