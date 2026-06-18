import { Request, Response, NextFunction } from 'express';
import { LiveChat } from '../../models/support.model';

export class LiveChatController {
  getAllLiveChats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, agentId } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (agentId) filter.agentId = agentId;

      const chats = await LiveChat.find(filter)
        .populate('userId', 'firstName lastName email employeeId')
        .populate('agentId', 'firstName lastName email employeeId')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: chats,
        message: 'Live chats retrieved successfully',
      });
    } catch (error) {
    return;
      next(error);
    }
  };
}
