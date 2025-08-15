import { Types } from 'mongoose';

export interface TaskAttachment {
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  uploadPath: string;
  downloadUrl: string;
  uploadedById: Types.ObjectId;
  uploadedBy?: Types.ObjectId;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskComment {
  content: string;
  authorId: Types.ObjectId;
  author?: Types.ObjectId;
  taskId: Types.ObjectId;
  parentCommentId?: Types.ObjectId;
  replies?: Types.ObjectId[];
  mentions?: Types.ObjectId[];
  attachments?: Types.ObjectId[];
  isEdited?: boolean;
  editedAt?: Date;
  likes?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimeEntry {
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  user?: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  description?: string;
  isBillable?: boolean;
  hourlyRate?: number;
  isRunning?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
