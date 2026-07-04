import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/user.model';
import { Session } from '../../models/session.model';
import { Device } from '../../models/device.model';
import { OTP } from '../../models/otp.model';
import { LoginHistory } from '../../models/login-history.model';
import { AppError } from '../../middleware/error.middleware';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateOTP,
} from '../../utils/jwt.util';
import { hashPassword, comparePassword, validatePasswordStrength } from '../../utils/password.util';
import { parseDeviceInfo, getDeviceName } from '../../utils/device.util';
import { sendVerificationOTPEmail, sendPasswordResetOTPEmail } from '../../utils/email.utils';

// Register - Step 1: Send OTP to email without creating user
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Register request body:', req.body);
    const { firstName, lastName, email, phone, password, confirmPassword, role } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      throw new AppError('All fields are required', 400, 'MISSING_FIELDS');
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors.join(', '), 400, 'WEAK_PASSWORD');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400, 'USER_EXISTS');
    }

    // Generate OTP for email verification
    const otp = generateOTP();

    // Store OTP with registration data (temporary)
    await OTP.create({
      type: 'registration',
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      metadata: {
        firstName,
        lastName,
        email,
        phone,
        password, // Will be hashed after verification
        role: role || 'employee',
      },
      ipAddress: req.ip,
    });

    // Send OTP email
    await sendVerificationOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      data: {
        email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Complete Registration - Step 2: Verify OTP and create user
export const completeRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    // Find valid OTP for registration
    const otpRecord = await OTP.findOne({
      type: 'registration',
      otp,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    // Check if email matches
    if (otpRecord.metadata?.email !== email) {
      throw new AppError('Email does not match registration data', 400, 'EMAIL_MISMATCH');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await hashPassword(otpRecord.metadata.password);

    // Generate employee ID in CG-XXXX format - simple sequential approach
    let employeeId: string;
    let nextNumber = 1;
    const maxAttempts = 1000;

    while (nextNumber <= maxAttempts) {
      employeeId = `CG-${nextNumber.toString().padStart(4, '0')}`;

      try {
        // Try to create user with this ID
        const user = await User.create({
          firstName: otpRecord.metadata.firstName,
          lastName: otpRecord.metadata.lastName,
          email: otpRecord.metadata.email,
          phone: otpRecord.metadata.phone,
          password: hashedPassword,
          role: otpRecord.metadata.role || 'employee',
          employeeId,
          isActive: true,
        });

        // Mark OTP as verified
        otpRecord.isVerified = true;
        otpRecord.userId = user._id;
        await otpRecord.save();

        // Generate tokens
        const payload = {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Create session
        await Session.create({
          userId: user._id,
          token: accessToken,
          refreshToken,
          deviceInfo: parseDeviceInfo(req.get('user-agent') || ''),
          ipAddress: req.ip,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        res.status(201).json({
          success: true,
          message: 'Registration completed successfully',
          data: {
            user: {
              id: user._id,
              email: user.email,
              role: user.role,
            },
            accessToken,
            refreshToken,
          },
        });
        return; // Success
      } catch (createError: any) {
        // If duplicate key error, try next number
        if (createError.code === 11000 && createError.keyPattern?.employeeId) {
          console.log(`Employee ID ${employeeId} exists, trying next...`);
          nextNumber++;
          continue;
        }
        throw createError; // Re-throw other errors
      }
    }

    throw new AppError('Unable to generate unique employee ID. Please contact support.', 500, 'ID_GENERATION_FAILED');
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, rememberMe } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Log failed attempt
      await LoginHistory.create({
        userId: new mongoose.Types.ObjectId(), // Dummy ID for tracking
        email,
        status: 'failed',
        failureReason: 'User not found',
        ipAddress,
        deviceInfo: parseDeviceInfo(userAgent),
      });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      await LoginHistory.create({
        userId: user._id,
        email,
        status: 'failed',
        failureReason: 'Account not active',
        ipAddress,
        deviceInfo: parseDeviceInfo(userAgent),
      });
      throw new AppError('Account is not active. Please verify your email or contact support.', 401, 'ACCOUNT_INACTIVE');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeId: user.employeeId ? user.employeeId.toString() : undefined,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Parse device info
    const deviceInfo = parseDeviceInfo(userAgent);

    // Create session
    const sessionExpiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours
    const session = await Session.create({
      userId: user._id,
      token: accessToken,
      refreshToken,
      deviceInfo,
      ipAddress,
      isActive: true,
      expiresAt: new Date(Date.now() + sessionExpiry),
    });

    // Update or create device record
    const deviceName = getDeviceName(deviceInfo);
    await Device.findOneAndUpdate(
      {
        userId: user._id,
        userAgent,
      },
      {
        name: deviceName,
        deviceType: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        userAgent,
        ipAddress,
        lastUsed: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await LoginHistory.create({
      userId: user._id,
      email,
      status: 'success',
      ipAddress,
      deviceInfo,
      sessionId: session._id,
    });

    // Console log user details after successful login
    console.log('=== USER LOGIN SUCCESS ===');
    console.log('User ID:', user._id.toString());
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Employee ID:', user.employeeId || 'N/A');
    console.log('Is Active:', user.isActive);
    console.log('Last Login:', user.lastLogin);
    console.log('Login Time:', new Date().toISOString());
    console.log('IP Address:', ipAddress);
    console.log('==========================');

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken, // Included for mobile clients (web uses the HTTP-only cookie above)
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;

    // Deactivate all sessions for user
    await Session.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Accept from cookie (web) or request body (mobile)
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token not found', 401, 'NO_REFRESH_TOKEN');
    }

    // Verify refresh token
    const payload = verifyToken(refreshToken);

    // Find active session
    const session = await Session.findOne({
      refreshToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    // Update session with new access token
    session.token = newAccessToken;
    session.lastActivity = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify Email OTP
export const verifyEmailOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, otp } = req.body;

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      userId,
      type: 'email_verification',
      otp,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    // Mark OTP as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Activate user
    await User.findByIdAndUpdate(userId, { isActive: true });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      throw new AppError('If an account exists with this email, a reset link has been sent.', 200, 'EMAIL_SENT');
    }

    // Generate OTP
    const otp = generateOTP();
    await OTP.create({
      userId: user._id,
      type: 'password_reset',
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // Send OTP email
    await sendPasswordResetOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors.join(', '), 400, 'WEAK_PASSWORD');
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({
      userId: user._id,
      type: 'password_reset',
      otp,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    // Mark OTP as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Deactivate all sessions (force re-login)
    await Session.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, type } = req.body;

    // Delete previous unverified OTPs
    await OTP.deleteMany({
      userId,
      type,
      isVerified: false,
    });

    // Generate new OTP
    const otp = generateOTP();
    await OTP.create({
      userId,
      type,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // Send OTP email based on type
    if (type === 'email_verification') {
      const user = await User.findById(userId);
      if (user) {
        await sendVerificationOTPEmail(user.email, otp);
      }
    } else if (type === 'password_reset') {
      const user = await User.findById(userId);
      if (user) {
        await sendPasswordResetOTPEmail(user.email, otp);
      }
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};
