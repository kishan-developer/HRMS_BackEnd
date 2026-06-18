import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/error.middleware';
import { User } from '../models/user.model';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: 'superadmin' | 'hr_manager' | 'accounts' | 'employee' | 'support';
}

interface TokenPayload {
  userId: string;
  employeeId: string;
  role: 'superadmin' | 'hr_manager' | 'accounts' | 'employee' | 'support';
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production', {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    } as jwt.SignOptions);
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production', {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    } as jwt.SignOptions);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async login(credentials: LoginCredentials): Promise<{ tokens: AuthTokens; user: any }> {
    const { email, password } = credentials;

    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    const isValidPassword = await this.comparePassword(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const payload: TokenPayload = {
      userId: user._id.toString(),
      employeeId: user.employeeId?.toString() || '',
      role: user.role,
    };

    const tokens: AuthTokens = {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };

    user.lastLogin = new Date();
    await user.save();

    return {
      tokens,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        employeeId: user.employeeId?.toString() || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      },
    };
  }

  async register(data: RegisterData): Promise<{ user: any }> {
    const { firstName, lastName, email, phone, password, role = 'employee' } = data;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
    }

    const passwordHash = await this.hashPassword(password);

    // Generate employee ID in CG-XXXX format
    const employeeCount = await User.countDocuments({ role: 'employee' });
    const nextNumber = (employeeCount + 1).toString().padStart(4, '0');
    const employeeId = `CG-${nextNumber}`;

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: passwordHash,
      employeeId,
      role,
      isActive: true,
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        employeeId: user.employeeId?.toString() || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production') as TokenPayload;

      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      const tokens: AuthTokens = {
        accessToken: this.generateAccessToken(decoded),
        refreshToken: this.generateRefreshToken(decoded),
      };

      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isValidPassword = await this.comparePassword(oldPassword, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid old password', 400, 'INVALID_PASSWORD');
    }

    const newPasswordHash = await this.hashPassword(newPassword);
    user.password = newPasswordHash;
    await user.save();
  }
}
