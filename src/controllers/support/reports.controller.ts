import { Request, Response, NextFunction } from 'express';
import {
  SupportTicket,
  SupportRequest,
  KnowledgeBase,
  TechnicalIssue,
  LiveChat,
} from '../../models/support.model';

export class ReportsController {
  getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, companyId } = req.query;

      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);

      const filter: any = {};
      if (companyId) filter.companyId = companyId;
      if (startDate || endDate) filter.createdAt = dateFilter;

      const [
        ticketsByStatus,
        ticketsByPriority,
        requestsByType,
        requestsByStatus,
        issuesBySeverity,
        knowledgeByCategory,
        chatActivity,
      ] = await Promise.all([
        SupportTicket.aggregate([
          { $match: filter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        SupportTicket.aggregate([
          { $match: filter },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
        SupportRequest.aggregate([
          { $match: filter },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        SupportRequest.aggregate([
          { $match: filter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        TechnicalIssue.aggregate([
          { $match: filter },
          { $group: { _id: '$severity', count: { $sum: 1 } } },
        ]),
        KnowledgeBase.aggregate([
          { $match: filter },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ]),
        LiveChat.aggregate([
          {
            $match: filter,
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      res.status(200).json({
        success: true,
        data: {
          ticketsByStatus,
          ticketsByPriority,
          requestsByType,
          requestsByStatus,
          issuesBySeverity,
          knowledgeByCategory,
          chatActivity,
        },
        message: 'Reports retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
