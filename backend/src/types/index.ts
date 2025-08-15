import { Request } from 'express';

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// User related types
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  profilePicture?: string;
  preferences: UserPreferences;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}

export type UserRole = 'admin' | 'manager' | 'user' | 'guest';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  preferences?: Partial<UserPreferences>;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Task related types
export interface Task extends BaseEntity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  assignedToId?: string;
  assignedTo?: User;
  createdById: string;
  createdBy: User;
  attachments: TaskAttachment[];
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  parentTaskId?: string;
  subtasks: Task[];
  comments: TaskComment[];
  timeEntries: TimeEntry[];
  dependencies: string[];
  category: string;
  labels: string[];
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'cancelled' | 'on-hold';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export interface TaskAttachment extends BaseEntity {
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  uploadPath: string;
  downloadUrl: string;
  uploadedById: string;
  uploadedBy: User;
  isPublic: boolean;
}

export interface TaskComment extends BaseEntity {
  content: string;
  authorId: string;
  author: User;
  taskId: string;
  parentCommentId?: string;
  replies: TaskComment[];
  mentions: string[];
  attachments: TaskAttachment[];
}

export interface TimeEntry extends BaseEntity {
  taskId: string;
  userId: string;
  user: User;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description: string;
  isBillable: boolean;
  hourlyRate?: number;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  assignedToId?: string;
  tags?: string[];
  estimatedHours?: number;
  parentTaskId?: string;
  category?: string;
  labels?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedToId?: string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  category?: string;
  labels?: string[];
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedTo?: string;
  createdBy?: string;
  dueDateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  category?: string;
  labels?: string[];
  search?: string;
  isOverdue?: boolean;
  hasAttachments?: boolean;
  hasComments?: boolean;
}

// Project related types
export interface Project extends BaseEntity {
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  managerId: string;
  manager: User;
  members: ProjectMember[];
  tasks: Task[];
  budget?: number;
  actualCost?: number;
  progress: number;
  tags: string[];
  category: string;
  client?: string;
  priority: ProjectPriority;
}

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectMember extends BaseEntity {
  userId: string;
  user: User;
  role: ProjectRole;
  joinedAt: Date;
  permissions: ProjectPermission[];
}

export type ProjectRole = 'owner' | 'manager' | 'member' | 'viewer';
export type ProjectPermission = 'read' | 'write' | 'delete' | 'admin';

// Notification types
export interface Notification extends BaseEntity {
  userId: string;
  user: User;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  data?: Record<string, any>;
  priority: NotificationPriority;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_completed'
  | 'task_overdue'
  | 'comment_mentioned'
  | 'project_update'
  | 'deadline_reminder'
  | 'system_alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Dashboard and Analytics types
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  recentActivity: ActivityLog[];
  upcomingDeadlines: Task[];
  teamPerformance: TeamPerformance[];
}

export interface ActivityLog extends BaseEntity {
  userId: string;
  user: User;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface TeamPerformance {
  userId: string;
  user: User;
  tasksCompleted: number;
  tasksOverdue: number;
  averageCompletionTime: number;
  productivityScore: number;
  lastActive: Date;
}

// File upload types
export interface FileUploadRequest {
  file: Express.Multer.File;
  taskId?: string;
  commentId?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface FileUploadResponse {
  file: TaskAttachment;
  uploadUrl: string;
}

// Search types
export interface SearchRequest {
  query: string;
  type?: 'tasks' | 'users' | 'projects' | 'comments';
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  description: string;
  relevance: number;
  url: string;
  metadata: Record<string, any>;
}

// API Request types with authentication
export interface AuthenticatedRequest extends Request {
  user?: import('../models/User').UserDocument;
  token?: string;
}

export interface PaginatedRequest extends AuthenticatedRequest {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    [key: string]: any;
  };
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  userId?: string;
}

export interface WebSocketConnection {
  userId: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// Audit log types
export interface AuditLog extends BaseEntity {
  userId: string;
  user: User;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
}

