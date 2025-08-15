import { Model } from 'mongoose';
import type { OwnableResourceDocument } from '../types/OwnableResourceDocument';
import { Request, Response, NextFunction } from 'express';
import type { UserDocument } from '../models/User';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Extend Express Request interface to include user and token
declare module 'express-serve-static-core' {
  interface Request {
  user?: UserDocument;
    token?: string;
    resource?: unknown;
  }
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Access token required', 401, 'UNAUTHORIZED');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as JWTPayload;
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new AppError('User no longer exists', 401, 'USER_NOT_FOUND');
    }
    // Check if user is still active
    if (!user.isActive) {
      throw new AppError('User account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }
    // Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const passwordChangedTime = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < passwordChangedTime) {
        throw new AppError('Password recently changed, please login again', 401, 'PASSWORD_CHANGED');
      }
    }
    // Attach user to request
  req.user = user as UserDocument;
    req.token = token;
    logger.info(`User authenticated: ${user.email}`, { userId: user.id, role: user.role });
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as JWTPayload;
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
  req.user = user as UserDocument;
        req.token = token;
      }
    }
    next();
  } catch (error) {
    // Log the error for debugging, but continue without authentication
    logger.warn('Optional authentication failed', { error });
    next();
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email}`, {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.originalUrl
      });
      throw new AppError(
        `Access denied. Required roles: ${roles.join(', ')}`,
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }
    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireManager = requireRole('admin', 'manager');

export const requireOwnerOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    if (req.user.role === 'admin') {
      return next();
    }
    if (req.user.id === resourceUserId) {
      return next();
    }
    logger.warn(`Access denied for user ${req.user.email}`, {
      userId: req.user.id,
      userRole: req.user.role,
      resourceUserId,
      endpoint: req.originalUrl
    });
    throw new AppError('Access denied. You can only access your own resources.', 403, 'INSUFFICIENT_PERMISSIONS');
  };
};

export const requireResourceOwnership = (resourceModel: Model<OwnableResourceDocument>, resourceIdField: string = 'id') => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }
      const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
      if (!resourceId) {
        throw new AppError('Resource ID required', 400, 'MISSING_RESOURCE_ID');
      }
      const resource = await resourceModel?.findById?.(resourceId);
      if (!resource) {
        throw new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
      }
      // Admin can access all resources
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }
      // Check if user owns the resource
      const ownerField = resource.assignedToId ? 'assignedToId' : 'createdById';
      if (resource[ownerField]?.toString() === req.user.id) {
        req.resource = resource;
        return next();
      }
      logger.warn(`Resource access denied for user ${req.user.email}`, {
        userId: req.user.id,
        userRole: req.user.role,
        resourceId,
        resourceType: resourceModel.modelName,
        endpoint: req.originalUrl
      });
      throw new AppError('Access denied. You can only access your own resources.', 403, 'INSUFFICIENT_PERMISSIONS');
    } catch (error) {
      next(error);
    }
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }
  if (!req.user.hasPermission?.(permission)) {
      logger.warn(`Permission denied for user ${req.user.email}`, {
        userId: req.user.id,
        userRole: req.user.role,
        requiredPermission: permission,
        endpoint: req.originalUrl
      });
      throw new AppError(
        `Access denied. Required permission: ${permission}`,
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }
    next();
  };
};

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    // Clean up expired entries
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key);
      }
    }
    let id: string;
    if (typeof clientId === 'string' && clientId) {
      id = clientId;
    } else if (Array.isArray(clientId) && clientId.length > 0 && typeof clientId[0] === 'string') {
      id = clientId[0];
    } else {
      id = 'unknown';
    }
    const clientRequests = requests.get(id);
    if (!clientRequests || now > clientRequests.resetTime) {
      requests.set(id, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    if (clientRequests.count >= maxRequests) {
      logger.warn(`Rate limit exceeded for client ${clientId}`, {
        clientId,
        endpoint: req.originalUrl,
        limit: maxRequests,
        windowMs
      });
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientRequests.resetTime - now) / 1000)
      });
      return;
    }
    clientRequests.count++;
    next();
  };
};

export const requireApiKey = (req: Request, _res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] || req.query['apiKey'];
  if (!apiKey || apiKey !== process.env['API_KEY']) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      endpoint: req.originalUrl,
      userAgent: req.headers['user-agent']
    });
    throw new AppError('Valid API key required', 401, 'INVALID_API_KEY');
  }
  next();
};

export const requireTwoFactor = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
  }
  if (req.user.twoFactorEnabled) {
    const twoFactorToken = req.headers['x-2fa-token'] || req.body.twoFactorToken;
    if (!twoFactorToken) {
      throw new AppError('Two-factor authentication token required', 401, '2FA_REQUIRED');
    }
    // Here you would validate the 2FA token
    // For now, we'll just check if it exists
    if (twoFactorToken.length < 6) {
      throw new AppError('Invalid two-factor authentication token', 401, 'INVALID_2FA_TOKEN');
    }
  }
  next();
};

export const validateSession = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
  }
  // Check if user's session is still valid
  // This could include checking against a blacklist, expiry, etc.
  const sessionValid = true; // Placeholder for session validation logic
  if (!sessionValid) {
    throw new AppError('Session expired, please login again', 401, 'SESSION_EXPIRED');
  }
  next();
};

