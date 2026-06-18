import { Router } from 'express';
import {
  register,
  completeRegistration,
  login,
  logout,
  refreshToken,
  verifyEmailOTP,
  forgotPassword,
  resetPassword,
  resendOTP,
} from '../../controllers/auth/auth.controller';

const router = Router();

// Auth routes
router.post('/register', register);
router.post('/complete-registration', completeRegistration);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', verifyEmailOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOTP);

export default router;
