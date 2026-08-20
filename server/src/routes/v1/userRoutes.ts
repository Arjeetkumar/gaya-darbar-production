import { Router } from 'express';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../../controllers/userController.js';
import { authenticateUser } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/me', getCurrentUserProfile);
router.patch('/me', updateCurrentUserProfile);

export default router;
