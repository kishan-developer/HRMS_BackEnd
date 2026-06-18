import { Request, Response, NextFunction } from 'express';
import { Loan } from '../../models/loan.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class LoansController {
  getAllLoans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, status, loanType, page = 1, pageSize = 10 } = req.query;
      
      const filter: any = {};
      if (employeeId) filter.employeeId = employeeId;
      if (status) filter.status = status;
      if (loanType) filter.loanType = loanType;

      const skip = (Number(page) - 1) * Number(pageSize);
      const [items, total] = await Promise.all([
        Loan.find(filter).populate('employeeId').sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)),
        Loan.countDocuments(filter)
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
        message: 'Loans retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { 
        employeeId, 
        loanType, 
        amount, 
        interestRate, 
        tenureMonths, 
        purpose 
      } = req.body;

      const employee = await User.findById(employeeId);
      if (!employee) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      // Calculate monthly installment (simple interest)
      const totalInterest = (amount * (interestRate || 0) * tenureMonths) / 100;
      const totalAmount = amount + totalInterest;
      const monthlyInstallment = totalAmount / tenureMonths;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + tenureMonths);

      const loan = await Loan.create({
        employeeId,
        loanType,
        amount,
        interestRate: interestRate || 0,
        tenureMonths,
        monthlyInstallment,
        startDate,
        endDate,
        status: 'Pending',
        purpose,
        remainingAmount: totalAmount,
        installmentsPaid: 0,
        timeline: [{ 
          date: startDate, 
          action: 'Submitted', 
          description: 'Loan application submitted', 
          actor: 'Employee' 
        }],
      });

      res.status(201).json({
        success: true,
        data: loan,
        message: 'Loan created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getLoanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const loan = await Loan.findById(id).populate('employeeId');

      if (!loan) {
        throw new AppError('Loan not found', 404, 'LOAN_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: loan,
        message: 'Loan retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  approveLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;

      const loan = await Loan.findById(id);

      if (!loan) {
        throw new AppError('Loan not found', 404, 'LOAN_NOT_FOUND');
      }

      if (loan.status !== 'Pending') {
        throw new AppError('Loan can only be approved when in Pending status', 400, 'INVALID_LOAN_STATUS');
      }

      loan.status = 'Approved';
      loan.approvedBy = approvedBy;
      loan.approvedAt = new Date();
      if (!loan.timeline) {
        loan.timeline = [];
      }
      loan.timeline.push({ 
        date: new Date(), 
        action: 'Approved', 
        description: 'Loan approved by manager', 
        actor: 'Manager' 
      });
      await loan.save();

      res.status(200).json({
        success: true,
        data: loan,
        message: 'Loan approved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  rejectLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      const loan = await Loan.findById(id);

      if (!loan) {
        throw new AppError('Loan not found', 404, 'LOAN_NOT_FOUND');
      }

      if (loan.status !== 'Pending') {
        throw new AppError('Loan can only be rejected when in Pending status', 400, 'INVALID_LOAN_STATUS');
      }

      loan.status = 'Rejected';
      if (loan.timeline) {
        loan.timeline.push({ 
          date: new Date(), 
          action: 'Rejected', 
          description: rejectionReason || 'Loan rejected by manager', 
          actor: 'Manager' 
        });
      }
      await loan.save();

      res.status(200).json({
        success: true,
        data: loan,
        message: 'Loan rejected successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
