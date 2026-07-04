import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class EmployeeController {
  getAllEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { departmentId, roleId, shiftId, status, workType, search } = req.query;

      const filter: any = {};
      if (departmentId) filter.departmentId = departmentId;
      if (roleId) filter.roleId = roleId;
      if (shiftId) filter.shiftId = shiftId;
      if (status) filter.employeeStatus = status;
      if (workType) filter.workType = workType;
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
        ];
      }

      const employees = await User.find(filter).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: employees,
        message: 'Employees retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getEmployeeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const employee = await User.findById(id);

      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: employee,
        message: 'Employee retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getEmployeeByEmployeeId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const employee = await User.findOne({ employeeId });

      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: employee,
        message: 'Employee retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      // Generate employee ID in CG-XXXX format - find next available
      const existingEmployees = await User.find({
        employeeId: { $regex: /^CG-\d{4}$/ },
        role: 'employee'
      }).select('employeeId').sort({ employeeId: 1 });

      const existingNumbers = new Set(
        existingEmployees
          .map(e => parseInt(e.employeeId.split('-')[1]))
          .filter(n => !isNaN(n))
      );

      let nextNumber = 1;
      while (existingNumbers.has(nextNumber)) {
        nextNumber++;
      }

      const employeeId = `CG-${nextNumber.toString().padStart(4, '0')}`;
      
      const employee = await User.create({
        ...req.body,
        employeeId,
        role: 'employee',
      });

      res.status(201).json({
        success: true,
        data: employee,
        message: 'Employee created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const employee = await User.findByIdAndUpdate(id, req.body, { new: true });

      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: employee,
        message: 'Employee updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  deleteEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const employee = await User.findByIdAndDelete(id);

      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getDepartmentEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { departmentId } = req.params;
      const employees = await User.find({ departmentId, role: 'employee' }).sort({ firstName: 1, lastName: 1 });

      res.status(200).json({
        success: true,
        data: employees,
        message: 'Department employees retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getShiftEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shiftId } = req.params;
      const employees = await User.find({ shiftId, role: 'employee' }).sort({ firstName: 1, lastName: 1 });

      res.status(200).json({
        success: true,
        data: employees,
        message: 'Shift employees retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
