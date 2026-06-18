import { Request, Response, NextFunction } from "express";

export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): any => {
  const apiKey = req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "API key is required"
    });
  }

  // Validate API key against environment variable
  const validApiKey = process.env.SYNC_AGENT_API_KEY;

  if (!validApiKey || apiKey !== validApiKey) {
    return res.status(403).json({
      success: false,
      message: "Invalid API key"
    });
  }

  next();
};
