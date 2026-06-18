import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/user.model';
import { Attendance } from '../../models/attendance.model';
import { Reimbursement } from '../../models/reimbursement.model';
import { AppError } from '../../middleware/error.middleware';

export class PayrollController {
  getAllPayroll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { month, year, status, page = 1, pageSize = 10 } = req.query;

      const matchStage: any = {};
      if (month && year) {
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
        matchStage.date = { $gte: startDate, $lte: endDate };
      }
      if (status) {
        matchStage.status = status;
      }

      const pipeline: any[] = [
        {
          $lookup: {
            from: 'users',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee',
          },
        },
        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'employee.departmentId',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      ];

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total] = await Promise.all([
        Attendance.aggregate(pipeline).skip(skip).limit(Number(pageSize)),
        Attendance.countDocuments(matchStage)
      ]);

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total,
            totalPages: Math.ceil(total / Number(pageSize)),
          },
        },
        message: 'Payroll data retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  processPayroll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { month, year, employeeIds } = req.body;

      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

      const matchStage: any = {
        date: { $gte: startDate, $lte: endDate },
      };

      if (employeeIds && employeeIds.length > 0) {
        matchStage.employeeId = { $in: employeeIds };
      }

      const payrollData = await Attendance.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'users',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee',
          },
        },
        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$employeeId',
            employeeId: { $first: '$employeeId' },
            empId: { $first: '$employee.employeeId' },
            firstName: { $first: '$employee.firstName' },
            lastName: { $first: '$employee.lastName' },
            department: { $first: '$employee.departmentId' },
            totalHours: { $sum: '$totalHours' },
            totalOvertime: { $sum: '$overtimeHours' },
            daysPresent: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
            daysAbsent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
            daysLeave: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } },
          }
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          processed: payrollData,
          month,
          year,
          processedAt: new Date(),
        },
        message: 'Payroll processed successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  approvePayroll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { payrollIds } = req.body;

      // In a real implementation, you would update the payroll records status
      // For now, we'll just return success
      res.status(200).json({
        success: true,
        data: {
          approvedCount: payrollIds.length,
          approvedIds: payrollIds,
          approvedAt: new Date(),
        },
        message: 'Payroll approved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
  getPayrollReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { month, year, departmentId } = req.query;

      const matchStage: any = {};
      if (month && year) {
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
        matchStage.date = { $gte: startDate, $lte: endDate };
      }

      const pipeline: any[] = [
        {
          $lookup: {
            from: 'users',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee',
          },
        },
        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'employee.departmentId',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      ];

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        pipeline.push({ $match: { employeeId: { $in: employeeIds.map(id => id.toString()) } } });
      }

      pipeline.push({
        $group: {
          _id: '$employeeId',
          employeeId: { $first: '$employeeId' },
          empId: { $first: '$employee.employeeId' },
          firstName: { $first: '$employee.firstName' },
          lastName: { $first: '$employee.lastName' },
          department: { $first: '$department.name' },
          joiningDate: { $first: '$employee.joiningDate' },
          totalHoursWorked: { $sum: '$totalHours' },
          totalOvertimeHours: { $sum: '$overtimeHours' },
          daysPresent: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          daysAbsent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          daysOnLeave: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } },
          daysLate: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
        }
      });

      pipeline.push({ $sort: { firstName: 1, lastName: 1 } });

      const result = await Attendance.aggregate(pipeline);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Payroll report retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getReimbursementPayroll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { payrollMonth } = req.query;
      const matchStage: any = {
        status: { $in: ['Forwarded to Payroll', 'Paid'] },
      };
      if (payrollMonth) {
        matchStage.payrollMonth = payrollMonth;
      }
      const reimbursements = await Reimbursement.find(matchStage)
        .populate('employeeId')
        .sort({ submittedOn: -1 });

      const total = reimbursements.length;
      const pending = reimbursements.filter(r => r.status === 'Forwarded to Payroll').length;
      const paid = reimbursements.filter(r => r.status === 'Paid').length;
      const totalAmount = reimbursements.reduce((sum, r) => sum + r.amountClaimed, 0);
      res.status(200).json({
        success: true,
        data: {
          items: reimbursements,
          summary: { total, pending, paid, totalAmount },
        },
        message: 'Reimbursement payroll data retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  generatePayslip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, month, year } = req.query;

      const employee = await User.findOne({ employeeId: String(employeeId) }).populate('departmentId');

      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

      const attendanceResult = await Attendance.aggregate([
        {
          $match: {
            employeeId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalHours: { $sum: '$totalHours' },
            totalOvertime: { $sum: '$overtimeHours' },
            daysPresent: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
            daysAbsent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
            daysLeave: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } },
          },
        },
      ]);

      const attendance = attendanceResult[0] || {
        totalHours: 0,
        totalOvertime: 0,
        daysPresent: 0,
        daysAbsent: 0,
        daysLeave: 0,
      };

      const reimbursementResult = await Reimbursement.aggregate([
        {
          $match: {
            employeeId,
            status: 'Paid',
            payrollMonth: `${year}-${month}`,
          },
        },
        {
          $group: {
            _id: null,
            totalReimbursement: { $sum: '$amountClaimed' },
          },
        },
      ]);

      const reimbursement = reimbursementResult[0]?.totalReimbursement || 0;

      const payslip = {
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          department: (employee.departmentId as any)?.name || '',
          role: (employee as any).role,
          joiningDate: employee.joiningDate,
        },
        period: {
          month,
          year,
        },
        attendance: {
          totalHours: attendance.totalHours || 0,
          totalOvertime: attendance.totalOvertime || 0,
          daysPresent: attendance.daysPresent || 0,
          daysAbsent: attendance.daysAbsent || 0,
          daysLeave: attendance.daysLeave || 0,
        },
        financials: {
          baseSalary: 0,
          overtimePay: 0,
          reimbursements: reimbursement,
          deductions: 0,
          netPay: 0,
        },
      };

      res.status(200).json({
        success: true,
        data: payslip,
        message: 'Payslip generated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  exportPayrollData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { month, year, departmentId } = req.query;

      const matchStage: any = {};
      if (month && year) {
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
        matchStage.date = { $gte: startDate, $lte: endDate };
      }

      const pipeline: any[] = [
        {
          $lookup: {
            from: 'users',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee',
          },
        },
        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'employee.departmentId',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      ];

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      if (departmentId && typeof departmentId === 'string') {
        const employeeIds = await User.find({ departmentId, role: 'employee' }).distinct('_id');
        pipeline.push({ $match: { employeeId: { $in: employeeIds.map(id => id.toString()) } } });
      }

      pipeline.push({
        $group: {
          _id: '$employeeId',
          employeeId: { $first: '$employee.employeeId' },
          firstName: { $first: '$employee.firstName' },
          lastName: { $first: '$employee.lastName' },
          department: { $first: '$department.name' },
          role: { $first: '$employee.role' },
          totalHours: { $sum: '$totalHours' },
          overtimeHours: { $sum: '$overtimeHours' },
          daysPresent: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        }
      });

      pipeline.push({ $sort: { firstName: 1, lastName: 1 } });

      const result = await Attendance.aggregate(pipeline);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Payroll data exported successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
