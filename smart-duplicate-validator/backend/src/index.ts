import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Load environment variables
dotenv.config();

import { prisma } from './utils/database';
import { redisClient } from './utils/redis';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { setupQueues } from './services/queueService';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import mediaRoutes from './routes/media';
import duplicateRoutes from './routes/duplicates';
import adminRoutes from './routes/admin';
import healthRoutes from './routes/health';

const app = express();
const server = createServer(app);

// Socket.IO setup for real-time updates
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3001",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimiter);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check (before auth middleware)
app.use('/health', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/duplicates', duplicateRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Duplicate Media Validator API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      media: '/api/media',
      duplicates: '/api/duplicates',
      admin: '/api/admin'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('join-room', (userId: string) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined room`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Make io available globally for services
declare global {
  var io: Server;
}
global.io = io;

const PORT = process.env.PORT || 3000;

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  await prisma.$disconnect();
  await redisClient.disconnect();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  await prisma.$disconnect();
  await redisClient.disconnect();
  
  process.exit(0);
});

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test Redis connection
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
    
    // Setup job queues
    await setupQueues();
    console.log('✅ Job queues initialized');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Documentation: http://localhost:${PORT}/`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

export { app, io };