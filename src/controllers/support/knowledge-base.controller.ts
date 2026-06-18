import { Request, Response, NextFunction } from 'express';
import { KnowledgeBase } from '../../models/support.model';
import { AppError } from '../../middleware/error.middleware';
import { validationResult } from 'express-validator';

export class KnowledgeBaseController {
  getAllKnowledgeBase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, isPublished, companyId, search, tags } = req.query;

      const filter: any = {};
      if (category) filter.category = category;
      if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
      if (companyId) filter.companyId = companyId;
      if (tags) filter.tags = { $in: (tags as string).split(',') };
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ];
      }

      const articles = await KnowledgeBase.find(filter)
        .populate('author', 'firstName lastName email employeeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: articles,
        message: 'Knowledge base articles retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };

  createKnowledgeArticle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
      }

      const articleId = `KB${Date.now()}`;
      const article = await KnowledgeBase.create({
        ...req.body,
        articleId,
      });

      res.status(201).json({
        success: true,
        data: article,
        message: 'Knowledge base article created successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
