import { Request, Response, NextFunction } from "express";

/**
 * Middleware to validate Bearer token for Realtime Software
 */
export const validateRealtimeToken = (req: Request, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization header is required"
    });
  }

  // Check if it starts with "Bearer "
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization header must start with 'Bearer '"
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // Validate against environment variable
  const validToken = process.env.REALTIME_BEARER_TOKEN;

  if (!validToken) {
    console.error("REALTIME_BEARER_TOKEN not configured in environment variables");
    return res.status(500).json({
      success: false,
      message: "Server configuration error"
    });
  }

  if (token !== validToken) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  next();
};
