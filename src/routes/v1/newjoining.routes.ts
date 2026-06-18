import express from 'express';
import {
  submitNewJoining,
  getNewJoiningSubmissions,
  getNewJoiningById,
  updateNewJoiningStatus,
} from '../../controllers/newjoining/newjoining.controller';

const router = express.Router();

router.post('/submit', submitNewJoining);
router.get('/', getNewJoiningSubmissions);
router.get('/:id', getNewJoiningById);
router.patch('/:id/status', updateNewJoiningStatus);

export default router;
