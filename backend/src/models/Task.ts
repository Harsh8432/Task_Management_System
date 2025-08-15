import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { TaskStatus, TaskPriority } from '../types';
import type { TaskAttachment, TaskComment, TimeEntry } from '../types/taskTypes';

export interface TaskDocument extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  assignedToId?: string | Types.ObjectId;
  assignedTo?: string | Types.ObjectId;
  createdById: string | Types.ObjectId;
  createdBy?: string | Types.ObjectId;
  attachments: TaskAttachment[];
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  parentTaskId?: string | Types.ObjectId;
  subtasks: (string | Types.ObjectId)[];
  comments: TaskComment[];
  timeEntries: TimeEntry[];
  dependencies: (string | Types.ObjectId)[];
  category?: string;
  labels: string[];
  projectId?: string | Types.ObjectId;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringEndDate?: Date;
  estimatedCost?: number;
  actualCost?: number;
  startDate?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string | Types.ObjectId;
  cancellationReason?: string;
  isTemplate?: boolean;
  templateName?: string;
  version?: number;
  createdAt: Date;
  updatedAt: Date;
  isOverdue(): boolean;
  updateProgress(): Promise<void>;
  addComment(content: string, authorId: string): Promise<void>;
  addTimeEntry(entry: TimeEntry): Promise<void>;
  assignTo(userId: string): Promise<void>;
  changeStatus(newStatus: TaskStatus): Promise<void>;
  addAttachment(attachment: TaskAttachment): Promise<void>;
  removeAttachment(attachmentId: string): Promise<void>;
  getSubtaskProgress(): { completed: number; total: number; percentage: number };
  calculateEstimatedTime(): number;
  getDependencies(): Promise<TaskDocument[]>;
  isBlocked(): Promise<boolean>;
}

  export interface TaskModel extends Model<TaskDocument> {
    findByUser(userId: string, filters?: Record<string, unknown>): Promise<TaskDocument[]>;
    findByProject(projectId: string): Promise<TaskDocument[]>;
    getOverdueTasks(): Promise<TaskDocument[]>;
    getTasksByStatus(status: TaskStatus): Promise<TaskDocument[]>;
    getTasksByPriority(priority: TaskPriority): Promise<TaskDocument[]>;
    searchTasks(query: string, filters?: Record<string, unknown>): Promise<TaskDocument[]>;
    getTaskStats(): Promise<Record<string, unknown>>;
    getTasksDueSoon(days: number): Promise<TaskDocument[]>;
    getTasksByAssignee(userId: string): Promise<TaskDocument[]>;
    getTasksByCreator(userId: string): Promise<TaskDocument[]>;
  }

// Task attachment schema
const taskAttachmentSchema = new Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadPath: {
    type: String,
    required: true
  },
  downloadUrl: {
    type: String,
    required: true
  },
  uploadedById: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Task comment schema
const taskCommentSchema = new Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  parentCommentId: {
    type: Schema.Types.ObjectId,
    ref: 'TaskComment'
  },
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'TaskComment'
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    type: Schema.Types.ObjectId,
    ref: 'TaskAttachment'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// Time entry schema
const timeEntrySchema = new Schema({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isBillable: {
    type: Boolean,
    default: false
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative']
  },
  isRunning: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Task schema
const taskSchema = new Schema<TaskDocument>({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed', 'cancelled', 'on-hold'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  assignedToId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdById: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [taskAttachmentSchema],
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours cannot be negative']
  },
  actualHours: {
    type: Number,
    min: [0, 'Actual hours cannot be negative'],
    default: 0
  },
  progress: {
    type: Number,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100%'],
    default: 0
  },
  parentTaskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },
  subtasks: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  comments: [taskCommentSchema],
  timeEntries: [timeEntrySchema],
  dependencies: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  labels: [{
    type: String,
    trim: true,
    maxlength: [50, 'Label cannot exceed 50 characters']
  }],
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  recurringEndDate: Date,
  estimatedCost: {
    type: Number,
    min: [0, 'Estimated cost cannot be negative']
  },
  actualCost: {
    type: Number,
    min: [0, 'Actual cost cannot be negative'],
    default: 0
  },
  startDate: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: String,
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full task path (including parent tasks)
taskSchema.virtual('fullPath').get(function() {
  if (this.parentTaskId) {
    return `${this.parentTaskId} > ${this.title}`;
  }
  return this.title;
});

// Virtual for task age
taskSchema.virtual('age').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = this.dueDate;
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Indexes
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ assignedToId: 1 });
taskSchema.index({ createdById: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ projectId: 1 });
taskSchema.index({ parentTaskId: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ labels: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ updatedAt: -1 });

// Compound indexes
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ assignedToId: 1, status: 1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ createdById: 1, status: 1 });

// Instance method to check if task is overdue
taskSchema.methods['isOverdue'] = function(): boolean {
  if (this['status'] === 'completed' || this['status'] === 'cancelled') {
    return false;
  }
  return new Date() > this['dueDate'];
};

// Instance method to update progress
taskSchema.methods['updateProgress'] = async function(): Promise<void> {
  if (this['subtasks'] && this['subtasks'].length > 0) {
    const subtaskProgress = this['getSubtaskProgress']();
    this['progress'] = subtaskProgress.percentage;
  }
  
  if (this['progress'] === 100 && this['status'] !== 'completed') {
    this['status'] = 'completed';
    this['completedAt'] = new Date();
  }
  
  await this['save']();
};

// Instance method to add comment
taskSchema.methods['addComment'] = async function(content: string, authorId: string): Promise<void> {
  const comment = {
    content,
    authorId,
    taskId: this['_id'],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  this['comments'].push(comment);
  await this['save']();
};

// Instance method to add time entry
taskSchema.methods['addTimeEntry'] = async function(entry: TimeEntry): Promise<void> {
  this['timeEntries'].push(entry);
  
  // Update actual hours
  if (entry.duration) {
    this['actualHours'] = (this['actualHours'] || 0) + (entry.duration / 60);
  }
  
  await this['save']();
};

// Instance method to assign task
taskSchema.methods['assignTo'] = async function(userId: string): Promise<void> {
  this['assignedToId'] = userId;
  this['updatedAt'] = new Date();
  await this['save']();
};

// Instance method to change status
taskSchema.methods['changeStatus'] = async function(newStatus: TaskStatus): Promise<void> {
  this['status'] = newStatus;
  this['updatedAt'] = new Date();
  
  if (newStatus === 'completed') {
    this['completedAt'] = new Date();
  } else if (newStatus === 'cancelled') {
    this['cancelledAt'] = new Date();
  }
  
  await this['save']();
};

// Instance method to add attachment
taskSchema.methods['addAttachment'] = async function(attachment: TaskAttachment): Promise<void> {
  this['attachments'].push(attachment);
  await this['save']();
};

// Instance method to remove attachment
taskSchema.methods['removeAttachment'] = async function(attachmentId: string): Promise<void> {
  this['attachments'] = this['attachments'].filter((att: TaskAttachment) => {
    // Use a property that exists on TaskAttachment, e.g. att.attachmentId or att.fileName
    // If you have a unique id property, use that. For now, fallback to fileName for demo:
    return att.fileName !== attachmentId;
  });
  await this['save']();
};

// Instance method to get subtask progress
taskSchema.methods['getSubtaskProgress'] = function(): { completed: number; total: number; percentage: number } {
  if (!this['subtasks'] || this['subtasks'].length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  
  // This would need to be populated to work properly
  const completed = this['subtasks'].filter((subtask: TaskDocument | { status?: string }) => subtask.status === 'completed').length;
  const total = this['subtasks'].length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
};

// Instance method to calculate estimated time
taskSchema.methods['calculateEstimatedTime'] = function(): number {
  let total = this['estimatedHours'] || 0;
  
  if (this['subtasks'] && this['subtasks'].length > 0) {
    // This would need to be populated to work properly
  const subtaskTime = this['subtasks'].reduce((sum: number, subtask: TaskDocument | { estimatedHours?: number }) => {
      return sum + (subtask.estimatedHours || 0);
    }, 0);
    total += subtaskTime;
  }
  
  return total;
};

// Instance method to get dependencies
taskSchema.methods['getDependencies'] = async function(): Promise<TaskDocument[]> {
  if (!this['dependencies'] || this['dependencies'].length === 0) {
    return [];
  }
  return await mongoose.model('Task').find({
    _id: { $in: this['dependencies'] }
  });
};

// Instance method to check if task is blocked
taskSchema.methods['isBlocked'] = async function(): Promise<boolean> {
  const dependencies = await this['getDependencies']();
  return dependencies.some((dep: TaskDocument) => dep['status'] !== 'completed');
};

// Static method to find tasks by user
taskSchema.statics['findByUser'] = function(userId: string, filters: Record<string, unknown> = {}): Promise<TaskDocument[]> {
  const query: Record<string, unknown> = {
    $or: [
      { assignedToId: userId },
      { createdById: userId }
    ]
  };
  if (filters['status']) query['status'] = filters['status'];
  if (filters['priority']) query['priority'] = filters['priority'];
  if (filters['projectId']) query['projectId'] = filters['projectId'];
  return this.find(query).populate('assignedTo createdBy projectId');
};

// Static method to find tasks by project
taskSchema.statics['findByProject'] = function(projectId: string): Promise<TaskDocument[]> {
  return this.find({ projectId }).populate('assignedTo createdBy');
};

// Static method to get overdue tasks
taskSchema.statics['getOverdueTasks'] = function(): Promise<TaskDocument[]> {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  }).populate('assignedTo createdBy');
};

// Static method to get tasks by status
taskSchema.statics['getTasksByStatus'] = function(status: TaskStatus): Promise<TaskDocument[]> {
  return this.find({ status }).populate('assignedTo createdBy');
};

// Static method to get tasks by priority
taskSchema.statics['getTasksByPriority'] = function(priority: TaskPriority): Promise<TaskDocument[]> {
  return this.find({ priority }).populate('assignedTo createdBy');
};

// Static method to search tasks
taskSchema.statics['searchTasks'] = function(query: string, filters: Record<string, unknown> = {}): Promise<TaskDocument[]> {
  const searchQuery: Record<string, unknown> = {
    $text: { $search: query }
  };
  if (filters['status']) searchQuery['status'] = filters['status'];
  if (filters['priority']) searchQuery['priority'] = filters['priority'];
  if (filters['assignedTo']) searchQuery['assignedToId'] = filters['assignedTo'];
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .populate('assignedTo createdBy');
};

// Static method to get task statistics
taskSchema.statics['getTaskStats'] = async function(): Promise<Record<string, unknown>> {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pendingTasks: { $sum: { $cond: [{ $in: ['$status', ['todo', 'in-progress', 'review']] }, 1, 0] } },
        overdueTasks: { $sum: { $cond: [{ $and: [{ $lt: ['$dueDate', new Date()] }, { $ne: ['$status', 'completed'] }] }, 1, 0] } },
        tasksByStatus: { $push: { status: '$status', count: 1 } },
        tasksByPriority: { $push: { priority: '$priority', count: 1 } }
      }
    }
  ]);
  return stats[0] || {};
};

// Static method to get tasks due soon
taskSchema.statics['getTasksDueSoon'] = function(days: number = 7): Promise<TaskDocument[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({
    dueDate: { $lte: futureDate, $gte: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  }).populate('assignedTo createdBy');
};

// Static method to get tasks by assignee
taskSchema.statics['getTasksByAssignee'] = function(userId: string): Promise<TaskDocument[]> {
  return this.find({ assignedToId: userId }).populate('assignedTo createdBy projectId');
};

// Static method to get tasks by creator
taskSchema.statics['getTasksByCreator'] = function(userId: string): Promise<TaskDocument[]> {
  return this.find({ createdById: userId }).populate('assignedTo createdBy projectId');
};

// Pre-save middleware to update progress
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    this.progress = 100;
    this.completedAt = new Date();
  }
  next();
});

// Export the model
export const Task = mongoose.model<TaskDocument, TaskModel>('Task', taskSchema);
