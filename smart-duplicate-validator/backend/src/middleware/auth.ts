import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { AuthUser, JWTPayload, AuthenticationError, AuthorizationError } from '../types';
import { UserRole } from '@prisma/client';

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Verify the token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is deactivated');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      avatar: user.avatar || undefined,
    } as AuthUser;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);

export const requireAdminOrReviewer = requireRole([UserRole.ADMIN, UserRole.REVIEWER]);

// Middleware to check if user owns the resource or is admin
export const requireOwnershipOrAdmin = (resourceUserIdField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentication required'));
      }

      // Admins can access anything
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Get resource user ID from params, body, or query
      const resourceUserId = req.params[resourceUserIdField] || 
                           req.body[resourceUserIdField] || 
                           req.query[resourceUserIdField];

      if (!resourceUserId) {
        return next(new AuthorizationError('Resource ownership cannot be determined'));
      }

      // Check if user owns the resource
      if (req.user.id !== resourceUserId) {
        return next(new AuthorizationError('You can only access your own resources'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without user
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        avatar: user.avatar || undefined,
      } as AuthUser;
    }

    next();
  } catch (error) {
    // Ignore token errors in optional auth
    next();
  }
};

// Utility function to generate JWT tokens
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(payload, jwtSecret, { expiresIn });
};

// Utility function to decode token without verification (for debugging)
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};