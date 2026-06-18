import { Router } from 'express';
import { EmployeeController } from '../../controllers/employee/employee.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const employeeController = new EmployeeController();

const createEmployeeValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
];

const updateEmployeeValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
];

router.get('/', authMiddleware, employeeController.getAllEmployees);
router.get('/:id', authMiddleware, param('id').isMongoId(), employeeController.getEmployeeById);
router.get('/employee-id/:employeeId', authMiddleware, employeeController.getEmployeeByEmployeeId);
router.post('/', authMiddleware, createEmployeeValidation, employeeController.createEmployee);
router.put('/:id', authMiddleware, param('id').isMongoId(), updateEmployeeValidation, employeeController.updateEmployee);
router.delete('/:id', authMiddleware, param('id').isMongoId(), employeeController.deleteEmployee);
router.get('/department/:departmentId', authMiddleware, param('departmentId').isMongoId(), employeeController.getDepartmentEmployees);
router.get('/shift/:shiftId', authMiddleware, param('shiftId').isMongoId(), employeeController.getShiftEmployees);

export default router;
