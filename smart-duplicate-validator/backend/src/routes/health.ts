import { Router } from 'express';
import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../utils/database';
import { redisClient } from '../utils/redis';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}));

// Detailed health check
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Check database
  const dbHealth = await checkDatabaseHealth();
  
  // Check Redis
  const redisHealth = await redisClient.healthCheck();

  // Check memory usage
  const memoryUsage = process.memoryUsage();

  const responseTime = Date.now() - startTime;

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime,
    services: {
      database: {
        status: dbHealth ? 'healthy' : 'unhealthy',
      },
      redis: redisHealth,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
      },
    },
  };

  // Determine overall health
  const allServicesHealthy = dbHealth && redisHealth.status === 'healthy';
  if (!allServicesHealthy) {
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    success: health.status === 'healthy',
    data: health,
  });
}));

// Readiness probe (for Kubernetes)
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const redisHealth = await redisClient.ping();

  if (dbHealth && redisHealth) {
    res.json({
      success: true,
      message: 'Service is ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Service is not ready',
      timestamp: new Date().toISOString(),
    });
  }
}));

// Liveness probe (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;