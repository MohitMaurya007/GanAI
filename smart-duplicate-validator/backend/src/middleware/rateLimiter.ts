import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../utils/redis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests, please try again later.',
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
};

export const createRateLimiter = (config: Partial<RateLimitConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = finalConfig.keyGenerator!(req);
      const rateLimitKey = `rate_limit:${key}`;

      const result = await redisClient.incrementRateLimit(
        rateLimitKey,
        finalConfig.windowMs,
        finalConfig.maxRequests
      );

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': finalConfig.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      if (!result.allowed) {
        res.status(429).json({
          success: false,
          error: finalConfig.message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // If Redis fails, allow the request to continue
      next();
    }
  };
};

// Default rate limiter
export const rateLimiter = createRateLimiter();

// Strict rate limiter for auth endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});

// Upload rate limiter
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 uploads per hour
  message: 'Upload limit exceeded, please try again later.',
});

// API rate limiter for authenticated users
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes for authenticated users
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return req.user?.id || req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// Admin rate limiter (more lenient)
export const adminRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5000, // 5000 requests per 15 minutes for admins
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// Dynamic rate limiter based on user role
export const dynamicRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return rateLimiter(req, res, next);
  }

  switch (req.user.role) {
    case 'ADMIN':
      return adminRateLimiter(req, res, next);
    case 'REVIEWER':
    case 'STANDARD_USER':
      return apiRateLimiter(req, res, next);
    default:
      return rateLimiter(req, res, next);
  }
};