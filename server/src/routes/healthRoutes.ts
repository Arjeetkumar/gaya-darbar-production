import { Router } from 'express';
import { getHealthCheck, getReadinessCheck } from '../controllers/healthController.js';

const router = Router();

router.get('/health', getHealthCheck);
router.get('/readiness', getReadinessCheck);

export default router;
