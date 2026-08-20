import { Router } from 'express';
import { getMealBuilderOptions } from '../../controllers/mealBuilderController.js';

const router = Router();

router.get('/options', getMealBuilderOptions);

export default router;
