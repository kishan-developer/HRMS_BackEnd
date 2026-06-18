import { Request, Response, NextFunction } from 'express';
import { Attendance } from '../../models/attendance.model';
import { Reimbursement } from '../../models/reimbursement.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';

export class PayslipsController {
  getAllPayslips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, month, year, page = 1, pageSize = 10 } = req.query;

      // Since payslips are generated on the fly, we'll return attendance data as payslip records
      const matchStage: any = {};
      if (employeeId) matchStage.employeeId = employeeId;
      if (month && year) {
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
        matchStage.date = { $gte: startDate, $lte: endDate };
      }

      const pipeline: any[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee',
          },
        },
        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { employeeId: '$employeeId', month: { $month: '$date' }, year: { $year: '$date' } },
            employeeId: { $first: '$employeeId' },
            employeeName: { $first: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] } },
            month: { $first: { $month: '$date' } },
            year: { $first: { $year: '$date' } },
            totalHours: { $sum: '$totalHours' },
            totalOvertime: { $sum: '$overtimeHours' },
            daysPresent: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
            daysAbsent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
            daysLeave: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } },
          },
        },
        { $sort: { year: -1, month: -1 } },
      ];

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total] = await Promise.all([
        Attendance.aggregate(pipeline).skip(skip).limit(Number(pageSize)),
        Attendance.aggregate([...pipeline, { $count: 'total' }])
      ]);

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total: total[0]?.total || 0,
            totalPages: Math.ceil((total[0]?.total || 0) / Number(pageSize)),
          },
        },
        message: 'Payslips retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  generatePayslip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, month, year } = req.body;

      // Since we're using the User model now, we need to handle employeeId as a string
      // The employee data is now in the User model
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
        id: `${employeeId}-${year}-${month}`,
        employeeId: employeeId,
        period: {
          month: Number(month),
          year: Number(year),
        },
        attendance: {
          totalHours: attendance.totalHours || 0,
          totalOvertime: attendance.totalOvertime || 0,
          daysPresent: attendance.daysPresent || 0,
          daysAbsent: attendance.daysAbsent || 0,
          daysLeave: attendance.daysLeave || 0,
        },
        earnings: {
          baseSalary: 0,
          overtimePay: 0,
          reimbursements: reimbursement,
          bonus: 0,
          totalEarnings: reimbursement,
        },
        deductions: {
          tax: 0,
          insurance: 0,
          otherDeductions: 0,
          totalDeductions: 0,
        },
        netPay: reimbursement,
        generatedAt: new Date(),
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

  getMyPayslips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const { month, year, page = 1, pageSize = 10 } = req.query;

      const matchStage: any = { employeeId: user.employeeId };
      if (month && year) {
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
        matchStage.date = { $gte: startDate, $lte: endDate };
      }

      const pipeline: any[] = [
        { $match: matchStage },
        {
          $group: {
            _id: { month: { $month: '$date' }, year: { $year: '$date' } },
            employeeId: { $first: '$employeeId' },
            month: { $first: { $month: '$date' } },
            year: { $first: { $year: '$date' } },
            totalHours: { $sum: '$totalHours' },
            totalOvertime: { $sum: '$overtimeHours' },
            daysPresent: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
            daysAbsent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
            daysLeave: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } },
          },
        },
        { $sort: { year: -1, month: -1 } },
      ];

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total] = await Promise.all([
        Attendance.aggregate(pipeline).skip(skip).limit(Number(pageSize)),
        Attendance.aggregate([...pipeline, { $count: 'total' }])
      ]);

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total: total[0]?.total || 0,
            totalPages: Math.ceil((total[0]?.total || 0) / Number(pageSize)),
          },
        },
        message: 'My payslips retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getPayslipById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Since payslips are generated on the fly, we'll parse the ID to get employeeId, month, year
      const [employeeId, year, month] = id.split('-');

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
        id,
        employeeId: employeeId,
        period: {
          month: Number(month),
          year: Number(year),
        },
        attendance: {
          totalHours: attendance.totalHours || 0,
          totalOvertime: attendance.totalOvertime || 0,
          daysPresent: attendance.daysPresent || 0,
          daysAbsent: attendance.daysAbsent || 0,
          daysLeave: attendance.daysLeave || 0,
        },
        earnings: {
          baseSalary: 0,
          overtimePay: 0,
          reimbursements: reimbursement,
          bonus: 0,
          totalEarnings: reimbursement,
        },
        deductions: {
          tax: 0,
          insurance: 0,
          otherDeductions: 0,
          totalDeductions: 0,
        },
        netPay: reimbursement,
        generatedAt: new Date(),
      };

      res.status(200).json({
        success: true,
        data: payslip,
        message: 'Payslip retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
