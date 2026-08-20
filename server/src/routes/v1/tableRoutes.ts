import { Router } from 'express';
import { getTableByQrHandler } from '../../controllers/tableController.js';

const router = Router();

// Public endpoint to resolve table by QR identifier
router.get('/:qrCodeIdentifier', getTableByQrHandler);

export default router;
