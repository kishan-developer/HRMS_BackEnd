import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_ACCESS_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const JWT_REFRESH_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  employeeId?: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRY_SECONDS,
  };
  console.log('JWT Util - Generating access token with secret:', JWT_SECRET.substring(0, 10) + '...');
  return jwt.sign(payload, JWT_SECRET, options);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRY_SECONDS,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
