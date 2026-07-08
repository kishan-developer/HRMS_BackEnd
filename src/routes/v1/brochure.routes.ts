import { Router } from 'express';
import { submitBrochureRequest } from '../../controllers/brochure.controller';

const router = Router();

// POST /api/v1/brochure/request - Submit brochure request (public)
router.post('/request', submitBrochureRequest);

export default router;
