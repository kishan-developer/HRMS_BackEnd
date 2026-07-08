import { Router } from 'express';
const { submitBrochureRequest } = require('../../controllers/brochure.controller');

const router = Router();

// POST /api/v1/brochure/request - Submit brochure request (public)
router.post('/request', submitBrochureRequest as any);

export default router;
