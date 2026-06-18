import { Request, Response, NextFunction } from 'express';
import { Department } from '../../models/department.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class DepartmentController {
  
  getAllDepartments = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departments = await Department.find().populate('managerId').lean();

      const departmentsWithCount = await Promise.all(
        departments.map(async (dept: any) => {
          const employeeCount = await User.countDocuments({ departmentId: dept._id, role: 'employee' });
          const manager = dept.managerId as any;
          return {
            ...dept,
            managerName: manager ? `${manager.firstName} ${manager.lastName}` : null,
            employeeCount,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: departmentsWithCount,
        message: 'Departments retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getDepartmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const department = await Department.findById(id).populate('managerId');

      if (!department) {
        throw new AppError('Department not found', 404, 'DEPARTMENT_NOT_FOUND');
      }

      const manager = department.managerId as any;
      const result = {
        ...department.toObject(),
        managerName: manager ? `${manager.firstName} ${manager.lastName}` : null,
      };

      res.status(200).json({
        success: true,
        data: result,
        message: 'Department retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { name, description, managerId } = req.body;

      const department = await Department.create({
        name,
        description,
        managerId,
      });

      res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const department = await Department.findByIdAndUpdate(id, req.body, { new: true });

      if (!department) {
        throw new AppError('Department not found', 404, 'DEPARTMENT_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: department,
        message: 'Department updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  deleteDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      const employeeCount = await User.countDocuments({ departmentId: id, role: 'employee' });

      if (employeeCount > 0) {
        throw new AppError('Cannot delete department with employees', 400, 'DEPARTMENT_HAS_EMPLOYEES');
      }

      const department = await Department.findByIdAndDelete(id);

      if (!department) {
        throw new AppError('Department not found', 404, 'DEPARTMENT_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

}
