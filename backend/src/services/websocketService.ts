import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';

export interface WebSocketUser {
  userId: string;
  userRole: string;
  socketId: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, WebSocketUser> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        // Verify JWT token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env['JWT_SECRET']!);
        
        // Attach user info to socket
        (socket as any).userId = decoded.userId;
        (socket as any).userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const userId = (socket as any).userId;
      const userRole = (socket as any).userRole;

      logger.info('WebSocket client connected', {
        socketId: socket.id,
        userId,
        userRole
      });

      // Store connected user
      this.connectedUsers.set(socket.id, {
        userId,
        userRole,
        socketId: socket.id
      });

      // Join user-specific room
      if (userId) {
        socket.join(`user:${userId}`);
      }

      // Join role-based rooms
      if (userRole === 'admin') {
        socket.join('admin');
      }
      
      if (['admin', 'manager'].includes(userRole)) {
        socket.join('management');
      }

      // Join general room
      socket.join('general');

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.id);
        logger.info('WebSocket client disconnected', {
          socketId: socket.id,
          userId
        });
      });

      // Handle custom events
      socket.on('join-project', (projectId: string) => {
        socket.join(`project:${projectId}`);
        logger.info('User joined project room', {
          userId,
          projectId
        });
      });

      socket.on('leave-project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
        logger.info('User left project room', {
          userId,
          projectId
        });
      });

      // Handle task updates
      socket.on('task-updated', (data: any) => {
        const { projectId, taskId, updates } = data;
        
        // Notify project members
        if (projectId) {
          this.io.to(`project:${projectId}`).emit('task-updated', {
            taskId,
            updates,
            updatedBy: userId
          });
        }

        // Notify task assignee
        if (updates.assignee) {
          this.io.to(`user:${updates.assignee}`).emit('task-assigned', {
            taskId,
            updates
          });
        }
      });

      // Handle task comments
      socket.on('task-comment', (data: any) => {
        const { projectId, taskId, comment } = data;
        
        this.io.to(`project:${projectId}`).emit('task-comment-added', {
          taskId,
          comment,
          addedBy: userId
        });
      });
    });
  }

  // Public methods for sending notifications
  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public sendToProject(projectId: string, event: string, data: any): void {
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  public sendToRole(role: string, event: string, data: any): void {
    this.io.to(role).emit(event, data);
  }

  public sendToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public getConnectedUsers(): WebSocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUserCount(): number {
    return this.connectedUsers.size;
  }
}

export const setupWebSocketHandlers = (server: HTTPServer): WebSocketService => {
  return new WebSocketService(server);
};
