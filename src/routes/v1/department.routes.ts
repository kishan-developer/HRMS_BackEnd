import { Router } from 'express';
import { DepartmentController } from '../../controllers/employee/department.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const departmentController = new DepartmentController();

const createDepartmentValidation = [
  body('name').notEmpty().withMessage('Department name is required'),
];

const updateDepartmentValidation = [
  body('name').optional().notEmpty().withMessage('Department name cannot be empty'),
];

router.get('/', authMiddleware, departmentController.getAllDepartments);
router.get('/:id', authMiddleware, param('id').isMongoId(), departmentController.getDepartmentById);
router.post('/', authMiddleware, createDepartmentValidation, departmentController.createDepartment);
router.put('/:id', authMiddleware, param('id').isMongoId(), updateDepartmentValidation, departmentController.updateDepartment);
router.delete('/:id', authMiddleware, param('id').isMongoId(), departmentController.deleteDepartment);

export default router;
