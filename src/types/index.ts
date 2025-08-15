export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  assignedToId?: string;
  assignedTo?: User;
  createdById: string;
  createdBy?: User;
  attachments: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  dueDateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}