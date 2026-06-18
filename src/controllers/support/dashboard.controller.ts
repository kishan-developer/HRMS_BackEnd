import { Request, Response, NextFunction } from 'express';
import {
  SupportTicket,
  SupportRequest,
  KnowledgeBase,
  Announcement,
  TechnicalIssue,
  LiveChat,
} from '../../models/support.model';

export class DashboardController {
  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { companyId } = req.query;

      const filter: any = {};
      if (companyId) filter.companyId = companyId;

      const [
        totalTickets,
        openTickets,
        inProgressTickets,
        totalRequests,
        pendingRequests,
        totalKnowledgeArticles,
        publishedArticles,
        totalAnnouncements,
        activeAnnouncements,
        totalTechnicalIssues,
        criticalIssues,
        activeChats,
      ] = await Promise.all([
        SupportTicket.countDocuments(filter),
        SupportTicket.countDocuments({ ...filter, status: 'Open' }),
        SupportTicket.countDocuments({ ...filter, status: 'In Progress' }),
        SupportRequest.countDocuments(filter),
        SupportRequest.countDocuments({ ...filter, status: 'Pending' }),
        KnowledgeBase.countDocuments(filter),
        KnowledgeBase.countDocuments({ ...filter, isPublished: true }),
        Announcement.countDocuments(filter),
        Announcement.countDocuments({ ...filter, isPublished: true }),
        TechnicalIssue.countDocuments(filter),
        TechnicalIssue.countDocuments({ ...filter, severity: 'Critical' }),
        LiveChat.countDocuments({ status: 'Active' }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          tickets: {
            total: totalTickets,
            open: openTickets,
            inProgress: inProgressTickets,
            resolved: totalTickets - openTickets - inProgressTickets,
          },
          requests: {
            total: totalRequests,
            pending: pendingRequests,
            completed: totalRequests - pendingRequests,
          },
          knowledgeBase: {
            total: totalKnowledgeArticles,
            published: publishedArticles,
            draft: totalKnowledgeArticles - publishedArticles,
          },
          announcements: {
            total: totalAnnouncements,
            active: activeAnnouncements,
          },
          technicalIssues: {
            total: totalTechnicalIssues,
            critical: criticalIssues,
          },
          liveChat: {
            active: activeChats,
          },
        },
        message: 'Dashboard stats retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
