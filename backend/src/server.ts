import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Import configurations and services
import { database } from './config/database';
import { logger, logStream } from './utils/logger';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { validateRequest } from './middleware/validation';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';
import projectRoutes from './routes/projects';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import fileRoutes from './routes/files';
import searchRoutes from './routes/search';

// Import WebSocket handlers
import { setupWebSocketHandlers } from './services/websocketService';

class TaskManagementServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private port: number;

  constructor() {
    this.port = parseInt(process.env['PORT'] || '5000');
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
        credentials: true
      }
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  /**
   * Initialize all middleware
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-2FA-Token']
    }));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(morgan('combined', { stream: logStream }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
      max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', limiter);

    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development'
      });
    });

    // API documentation endpoint
    this.app.get('/api/docs', (_req, res) => {
      res.json({
        success: true,
        message: 'Task Management API Documentation',
        version: process.env['API_VERSION'] || 'v1',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          tasks: '/api/tasks',
          projects: '/api/projects',
          notifications: '/api/notifications',
          dashboard: '/api/dashboard',
          files: '/api/files',
          search: '/api/search'
        },
        documentation: 'https://docs.taskmanagement.com'
      });
    });
  }

  /**
   * Initialize all routes
   */
  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/tasks', taskRoutes);
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/notifications', notificationRoutes);
    this.app.use('/api/dashboard', dashboardRoutes);
    this.app.use('/api/files', fileRoutes);
    this.app.use('/api/search', searchRoutes);

    // Global validation middleware for all routes
    this.app.use(validateRequest);

    // Catch-all route for undefined endpoints
    this.app.use('*', notFoundHandler);
  }

  /**
   * Initialize WebSocket handlers
   */
  private initializeWebSocket(): void {
    // Setup WebSocket authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth['token'] || socket.handshake.headers['authorization'];
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify token and attach user to socket
      try {
        const decoded = require('jsonwebtoken').verify(token, process.env['JWT_SECRET']!);
        (socket as any).userId = decoded.userId;
        (socket as any).userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Setup WebSocket event handlers
    setupWebSocketHandlers(this.server);

    // Handle WebSocket connections
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`, {
        userId: (socket as any).userId,
        userRole: (socket as any).userRole
      });

      // Join user to their personal room
      if ((socket as any).userId) {
        socket.join(`user:${(socket as any).userId}`);
        
        // Join role-based rooms
        if ((socket as any).userRole === 'admin') {
          socket.join('admin');
        }
        if (['admin', 'manager'].includes((socket as any).userRole)) {
          socket.join('management');
        }
      }

      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`, {
          userId: (socket as any).userId
        });
      });

      socket.on('error', (error) => {
        logger.error(`WebSocket error for client ${socket.id}:`, error);
      });
    });
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);

    // Graceful shutdown handling
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown();
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Connect to database
      await database.connect();
      logger.info('Database connected successfully');

      // Start HTTP server
      this.server.listen(this.port, () => {
        logger.info(`🚀 Task Management API Server running on port ${this.port}`);
        logger.info(`📚 API Documentation: http://localhost:${this.port}/api/docs`);
        logger.info(`🏥 Health Check: http://localhost:${this.port}/health`);
        logger.info(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
        logger.info(`🔗 CORS Origin: ${process.env['CORS_ORIGIN'] || 'http://localhost:3000'}`);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    logger.info('🛑 Received shutdown signal, starting graceful shutdown...');

    try {
      // Close HTTP server
      this.server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close WebSocket connections
      this.io.close(() => {
        logger.info('WebSocket server closed');
      });

      // Close database connection
      await database.disconnect();
      logger.info('Database connection closed');

      // Exit process
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance (for testing)
   */
  public getApp(): express.Application {
    return this.app;
  }

  /**
   * Get HTTP server instance
   */
  public getServer(): any {
    return this.server;
  }

  /**
   * Get WebSocket server instance
   */
  public getIO(): Server {
    return this.io;
  }
}

// Create and start server instance
const server = new TaskManagementServer();

// Start server if this file is run directly
if (require.main === module) {
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default server;
