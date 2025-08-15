import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { ApiResponse, AuthResponse, CreateUserRequest, LoginRequest } from '../types';
import { logger } from '../utils/logger';
import { redisClient } from '../services/redisService';
import { AppError } from '../utils/AppError';

export class AuthController {
  /**
   * User registration
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, role }: CreateUserRequest = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
      }

      // Create verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const user = await User.create({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        role: role || 'user',
        emailVerificationToken,
        emailVerificationExpires
      });

      // Generate tokens
      const { accessToken, refreshToken } = await AuthController.generateTokens(user);

      // Store refresh token in Redis
      await redisClient.set(`refresh_token:${user.id}`, refreshToken, 30 * 24 * 60 * 60); // 30 days

      logger.info(`New user registered: ${user.email}`, { userId: user.id, role: user.role });

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as import('../types').UserRole,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt ?? new Date(), // always provide Date
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            preferences: user.preferences ?? { theme: 'auto', language: 'en', timezone: 'UTC', emailNotifications: true, pushNotifications: true, weeklyDigest: false },
            twoFactorEnabled: user.twoFactorEnabled ?? false
          },
          accessToken,
          refreshToken,
          expiresIn: parseInt(process.env['JWT_EXPIRES_IN'] || '604800') // 7 days in seconds
        },
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * User login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, rememberMe }: LoginRequest = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment login attempts
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        
        // Lock account after 5 failed attempts
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          await user.save();
          throw new AppError('Account locked due to multiple failed attempts. Try again in 15 minutes.', 423, 'ACCOUNT_LOCKED');
        }
        
        await user.save();
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > new Date()) {
        throw new AppError('Account is temporarily locked. Try again later.', 423, 'ACCOUNT_LOCKED');
      }

      // Reset login attempts
      user.loginAttempts = 0;
      user.lockUntil = undefined;

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
      const { accessToken, refreshToken } = await AuthController.generateTokens(user);

      // Store refresh token in Redis
      const tokenExpiry = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
      await redisClient.set(`refresh_token:${user.id}`, refreshToken, tokenExpiry);

      logger.info(`User logged in: ${user.email}`, { userId: user.id, role: user.role });

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as import('../types').UserRole,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            preferences: user.preferences ?? { theme: 'auto', language: 'en', timezone: 'UTC', emailNotifications: true, pushNotifications: true, weeklyDigest: false },
            twoFactorEnabled: user.twoFactorEnabled ?? false
          } as import('../types').User,
          accessToken,
          refreshToken,
          expiresIn: parseInt(process.env['JWT_EXPIRES_IN'] || '604800')
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token required', 400, 'REFRESH_TOKEN_REQUIRED');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env['JWT_REFRESH_SECRET']!) as any;
      
      // Check if refresh token exists in Redis
      const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      // Get user
      const user = await User.findById(decoded.userId).select('-password');
      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401, 'USER_NOT_FOUND');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await AuthController.generateTokens(user);

      // Update refresh token in Redis
      await redisClient.set(`refresh_token:${user.id}`, newRefreshToken, 30 * 24 * 60 * 60);

      const response: ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }> = {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: parseInt(process.env['JWT_EXPIRES_IN'] || '604800')
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const userId = (req as any).user?.id;

      if (refreshToken && userId) {
        // Remove refresh token from Redis
        await redisClient.del(`refresh_token:${userId}`);
      }

      logger.info(`User logged out: ${userId || 'unknown'}`);

      const response: ApiResponse<null> = {
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      });

      if (!user) {
        throw new AppError('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN');
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined as any;
      // @ts-ignore
      user['emailVerificationExpires'] = undefined;
      await user.save();

      logger.info(`Email verified for user: ${user.email}`, { userId: user.id });

      const response: ApiResponse<null> = {
        success: true,
        message: 'Email verified successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (user.isEmailVerified) {
        throw new AppError('Email already verified', 400, 'EMAIL_ALREADY_VERIFIED');
      }

      // Generate new verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      user.emailVerificationToken = emailVerificationToken;
      // @ts-ignore
      user['emailVerificationExpires'] = emailVerificationExpires;
      await user.save();

      logger.info(`Verification email resent to: ${user.email}`, { userId: user.id });

      const response: ApiResponse<null> = {
        success: true,
        message: 'Verification email sent successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if user exists
        const response: ApiResponse<null> = {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent',
          timestamp: new Date().toISOString()
        };
        res.status(200).json(response);
      }

      // Generate reset token
      const passwordResetToken = crypto.randomBytes(32).toString('hex');
      const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      if (!user) {
        return next(new AppError('User not found', 404));
      }
      // All user property accesses are now safe
      user.passwordResetToken = passwordResetToken;
      user.passwordResetExpires = passwordResetExpires;
      await user.save();
      logger.info(`Password reset email sent to: ${user.email}`, { userId: user.id });

      const response: ApiResponse<null> = {
        success: true,
        message: 'Password reset token sent to email',
        data: null,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
      }

      // Update password
      user.password = password;
      user.passwordResetToken = undefined as any;
      user.passwordResetExpires = undefined as any;
      await user.save();

      // Invalidate all refresh tokens
      await redisClient.del(`refresh_token:${user.id}`);

      logger.info(`Password reset for user: ${user.email}`, { userId: user.id });

      const response: ApiResponse<null> = {
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user.id;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400, 'INCORRECT_CURRENT_PASSWORD');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Invalidate all refresh tokens
      await redisClient.del(`refresh_token:${user.id}`);

      logger.info(`Password changed for user: ${user.email}`, { userId: user.id });

      const response: ApiResponse<null> = {
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const response: ApiResponse<any> = {
        success: true,
        message: 'Profile retrieved successfully',
        data: user,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const updates = req.body;

      // Remove sensitive fields from updates
      delete updates.password;
      delete updates.email;
      delete updates.role;
      delete updates.isActive;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      logger.info(`Profile updated for user: ${user.email}`, { userId: user.id });

      const response: ApiResponse<any> = {
        success: true,
        message: 'Profile updated successfully',
        data: user,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate JWT tokens
   */
  private static async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, String(process.env['JWT_SECRET']), { expiresIn: process.env['JWT_EXPIRES_IN'] || '7d' } as SignOptions);
    const refreshToken = jwt.sign(payload, String(process.env['JWT_REFRESH_SECRET']), { expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '30d' } as SignOptions);

    return { accessToken, refreshToken };
  }
}

export default AuthController;
