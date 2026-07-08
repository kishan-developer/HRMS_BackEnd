import { Router, Request, Response, NextFunction } from 'express';
const { submitBrochureRequest } = require('../../controllers/brochure.controller');

const router = Router();

// POST /api/v1/brochure/request - Submit brochure request (public)
router.post('/request', (req: Request, res: Response, next: NextFunction) => {
  submitBrochureRequest(req, res, next);
});

export default router;
