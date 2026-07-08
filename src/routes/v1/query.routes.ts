import { Router } from 'express';
import {
  createQuery,
  getAllQueries,
  getQueryById,
  updateQueryStatus,
  deleteQuery,
} from '../../controllers/query.controller';

const router = Router();

// POST /api/v1/queries - Create a new query/lead (public)
router.post('/', createQuery);

// GET /api/v1/queries - Get all queries (admin)
router.get('/', getAllQueries);

// GET /api/v1/queries/:id - Get query by ID (admin)
router.get('/:id', getQueryById);

// PATCH /api/v1/queries/:id - Update query status (admin)
router.patch('/:id', updateQueryStatus);

// DELETE /api/v1/queries/:id - Delete query (admin)
router.delete('/:id', deleteQuery);

export default router;
