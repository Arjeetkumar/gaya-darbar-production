import { Router } from 'express';
import { register, login, getMe, logout } from '../../controllers/authController.js';
import { authenticateUser } from '../../middleware/authMiddleware.js';
const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);
export default router;
