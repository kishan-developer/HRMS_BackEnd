import { Router } from 'express';
import { DashboardController } from '../../controllers/support/dashboard.controller';
import { TicketsController } from '../../controllers/support/tickets.controller';
import { RequestsController } from '../../controllers/support/requests.controller';
import { KnowledgeBaseController } from '../../controllers/support/knowledge-base.controller';
import { AnnouncementsController } from '../../controllers/support/announcements.controller';
import { TechnicalIssuesController } from '../../controllers/support/technical-issues.controller';
import { LiveChatController } from '../../controllers/support/live-chat.controller';
import { ReportsController } from '../../controllers/support/reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const dashboardController = new DashboardController();
const ticketsController = new TicketsController();
const requestsController = new RequestsController();
const knowledgeBaseController = new KnowledgeBaseController();
const announcementsController = new AnnouncementsController();
const technicalIssuesController = new TechnicalIssuesController();
const liveChatController = new LiveChatController();
const reportsController = new ReportsController();

const ticketValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').isIn(['Technical', 'HR', 'Payroll', 'IT', 'General']).withMessage('Valid category is required'),
  body('createdBy').notEmpty().withMessage('Created by is required'),
];

const requestValidation = [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('type').isIn(['Information', 'Service', 'Complaint', 'Feedback']).withMessage('Valid type is required'),
  body('createdBy').notEmpty().withMessage('Created by is required'),
];

const knowledgeValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('author').notEmpty().withMessage('Author is required'),
];

const announcementValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('createdBy').notEmpty().withMessage('Created by is required'),
];

// Dashboard
router.get('/dashboard', authMiddleware, dashboardController.getDashboardStats);

// Support Tickets
router.get('/tickets', authMiddleware, ticketsController.getAllTickets);
router.get('/tickets/:id', authMiddleware, param('id').isMongoId(), ticketsController.getTicketById);
router.post('/tickets', authMiddleware, ticketValidation, ticketsController.createTicket);
router.put('/tickets/:id', authMiddleware, param('id').isMongoId(), ticketValidation, ticketsController.updateTicket);
router.delete('/tickets/:id', authMiddleware, param('id').isMongoId(), ticketsController.deleteTicket);

// Support Requests
router.get('/requests', authMiddleware, requestsController.getAllRequests);
router.post('/requests', authMiddleware, requestValidation, requestsController.createRequest);

// Technical Issues
router.get('/technical-issues', authMiddleware, technicalIssuesController.getAllTechnicalIssues);

// Knowledge Base
router.get('/knowledge-base', authMiddleware, knowledgeBaseController.getAllKnowledgeBase);
router.post('/knowledge-base', authMiddleware, knowledgeValidation, knowledgeBaseController.createKnowledgeArticle);

// Announcements
router.get('/announcements', authMiddleware, announcementsController.getAllAnnouncements);
router.post('/announcements', authMiddleware, announcementValidation, announcementsController.createAnnouncement);

// Live Chat
router.get('/live-chat', authMiddleware, liveChatController.getAllLiveChats);

// Reports
router.get('/reports', authMiddleware, reportsController.getReports);

export default router;
