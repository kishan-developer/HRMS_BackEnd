import { Request, Response, NextFunction } from 'express';
import { TechnicalIssue } from '../../models/support.model';

export class TechnicalIssuesController {
  getAllTechnicalIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, severity, category, assignedTo, companyId } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (severity) filter.severity = severity;
      if (category) filter.category = category;
      if (assignedTo) filter.assignedTo = assignedTo;
      if (companyId) filter.companyId = companyId;

      const issues = await TechnicalIssue.find(filter)
        .populate('assignedTo', 'firstName lastName email employeeId')
        .populate('reportedBy', 'firstName lastName email employeeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: issues,
        message: 'Technical issues retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
