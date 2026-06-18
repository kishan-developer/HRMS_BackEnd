import { Request, Response, NextFunction } from 'express';
import { SupportTicket } from '../../models/support.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class TicketsController {
  getAllTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, priority, category, assignedTo, companyId, search } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;
      if (assignedTo) filter.assignedTo = assignedTo;
      if (companyId) filter.companyId = companyId;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const tickets = await SupportTicket.find(filter)
        .populate('assignedTo', 'firstName lastName email employeeId')
        .populate('createdBy', 'firstName lastName email employeeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: tickets,
        message: 'Tickets retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  getTicketById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const ticket = await SupportTicket.findById(id)
        .populate('assignedTo', 'firstName lastName email employeeId')
        .populate('createdBy', 'firstName lastName email employeeId');

      if (!ticket) {
        throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: ticket,
        message: 'Ticket retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const ticketId = `TKT${Date.now()}`;
      const ticket = await SupportTicket.create({
        ...req.body,
        ticketId,
      });

      res.status(201).json({
        success: true,
        data: ticket,
        message: 'Ticket created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  updateTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const updateData: any = { ...req.body };

      if (updateData.status === 'Resolved' && !updateData.resolvedAt) {
        updateData.resolvedAt = new Date();
      }

      const ticket = await SupportTicket.findByIdAndUpdate(id, updateData, { new: true });

      if (!ticket) {
        throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: ticket,
        message: 'Ticket updated successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  deleteTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const ticket = await SupportTicket.findByIdAndDelete(id);

      if (!ticket) {
        throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        message: 'Ticket deleted successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
