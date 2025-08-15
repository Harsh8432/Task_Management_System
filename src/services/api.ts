import { User, Task, TaskAttachment, TaskFilters, PaginationState } from '../types';

// Mock data for demonstration
let mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    email: 'user@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'user',
    createdAt: '2024-01-16T09:30:00Z',
    updatedAt: '2024-01-16T09:30:00Z',
  },
  {
    id: '3',
    email: 'developer@example.com',
    firstName: 'Bob',
    lastName: 'Johnson',
    role: 'user',
    createdAt: '2024-01-17T14:15:00Z',
    updatedAt: '2024-01-17T14:15:00Z',
  },
];

let mockTasks: Task[] = [
  {
    id: '1',
    title: 'Implement User Authentication',
    description: 'Set up JWT-based authentication system with login and registration',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-01-20T23:59:59Z',
    assignedToId: '2',
    assignedTo: mockUsers[1],
    createdById: '1',
    createdBy: mockUsers[0],
    attachments: [
      {
        id: 'att1',
        fileName: 'auth-specs.pdf',
        fileSize: 245760,
        fileType: 'application/pdf',
        uploadedAt: '2024-01-15T11:00:00Z',
        downloadUrl: '/api/files/att1',
      },
    ],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
  },
  {
    id: '2',
    title: 'Design Task Management UI',
    description: 'Create responsive interface for task CRUD operations',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2024-01-25T23:59:59Z',
    assignedToId: '3',
    assignedTo: mockUsers[2],
    createdById: '1',
    createdBy: mockUsers[0],
    attachments: [],
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-19T10:20:00Z',
  },
  {
    id: '3',
    title: 'Setup Database Schema',
    description: 'Design and implement MongoDB schemas for users and tasks',
    status: 'todo',
    priority: 'urgent',
    dueDate: '2024-01-22T23:59:59Z',
    assignedToId: '2',
    assignedTo: mockUsers[1],
    createdById: '1',
    createdBy: mockUsers[0],
    attachments: [
      {
        id: 'att2',
        fileName: 'database-schema.pdf',
        fileSize: 156832,
        fileType: 'application/pdf',
        uploadedAt: '2024-01-16T10:30:00Z',
        downloadUrl: '/api/files/att2',
      },
      {
        id: 'att3',
        fileName: 'migration-plan.pdf',
        fileSize: 98304,
        fileType: 'application/pdf',
        uploadedAt: '2024-01-16T11:00:00Z',
        downloadUrl: '/api/files/att3',
      },
    ],
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
];

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Auth API
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  await delay(500);
  
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const token = `mock-jwt-token-${user.id}`;
  return { user, token };
};

export const register = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ user: User; token: string }> => {
  await delay(500);
  
  if (mockUsers.some(u => u.email === email)) {
    throw new Error('Email already exists');
  }
  
  const newUser: User = {
    id: Date.now().toString(),
    email,
    firstName,
    lastName,
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockUsers.push(newUser);
  const token = `mock-jwt-token-${newUser.id}`;
  return { user: newUser, token };
};

// Users API
export const getUsers = async (page = 1, limit = 10, search = ''): Promise<{
  users: User[];
  pagination: PaginationState;
}> => {
  await delay(300);
  
  let filtered = mockUsers;
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = mockUsers.filter(
      user =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const users = filtered.slice(startIndex, endIndex);
  
  return {
    users,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
};

export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  await delay(300);
  
  if (mockUsers.some(u => u.email === userData.email)) {
    throw new Error('Email already exists');
  }
  
  const newUser: User = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockUsers.push(newUser);
  return newUser;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  await delay(300);
  
  const userIndex = mockUsers.findIndex(u => u.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  if (updates.email && mockUsers.some(u => u.email === updates.email && u.id !== id)) {
    throw new Error('Email already exists');
  }
  
  mockUsers[userIndex] = {
    ...mockUsers[userIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  return mockUsers[userIndex];
};

export const deleteUser = async (id: string): Promise<void> => {
  await delay(300);
  
  const userIndex = mockUsers.findIndex(u => u.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  mockUsers.splice(userIndex, 1);
};

// Tasks API
export const getTasks = async (
  page = 1,
  limit = 10,
  filters: TaskFilters = {}
): Promise<{
  tasks: Task[];
  pagination: PaginationState;
}> => {
  await delay(300);
  
  let filtered = [...mockTasks];
  
  // Apply filters
  if (filters.status) {
    filtered = filtered.filter(task => task.status === filters.status);
  }
  
  if (filters.priority) {
    filtered = filtered.filter(task => task.priority === filters.priority);
  }
  
  if (filters.assignedTo) {
    filtered = filtered.filter(task => task.assignedToId === filters.assignedTo);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.dueDateRange) {
    filtered = filtered.filter(task => {
      const taskDate = new Date(task.dueDate);
      const start = new Date(filters.dueDateRange!.start);
      const end = new Date(filters.dueDateRange!.end);
      return taskDate >= start && taskDate <= end;
    });
  }
  
  // Sort by due date (nearest first)
  filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const tasks = filtered.slice(startIndex, endIndex);
  
  // Populate user references
  const populatedTasks = tasks.map(task => ({
    ...task,
    assignedTo: task.assignedToId ? mockUsers.find(u => u.id === task.assignedToId) : undefined,
    createdBy: mockUsers.find(u => u.id === task.createdById),
  }));
  
  return {
    tasks: populatedTasks,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
};

export const getTask = async (id: string): Promise<Task> => {
  await delay(200);
  
  const task = mockTasks.find(t => t.id === id);
  if (!task) {
    throw new Error('Task not found');
  }
  
  return {
    ...task,
    assignedTo: task.assignedToId ? mockUsers.find(u => u.id === task.assignedToId) : undefined,
    createdBy: mockUsers.find(u => u.id === task.createdById),
  };
};

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'attachments' | 'assignedTo' | 'createdBy'>): Promise<Task> => {
  await delay(300);
  
  const newTask: Task = {
    ...taskData,
    id: Date.now().toString(),
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockTasks.push(newTask);
  
  return {
    ...newTask,
    assignedTo: newTask.assignedToId ? mockUsers.find(u => u.id === newTask.assignedToId) : undefined,
    createdBy: mockUsers.find(u => u.id === newTask.createdById),
  };
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  await delay(300);
  
  const taskIndex = mockTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    throw new Error('Task not found');
  }
  
  mockTasks[taskIndex] = {
    ...mockTasks[taskIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  return {
    ...mockTasks[taskIndex],
    assignedTo: mockTasks[taskIndex].assignedToId 
      ? mockUsers.find(u => u.id === mockTasks[taskIndex].assignedToId) 
      : undefined,
    createdBy: mockUsers.find(u => u.id === mockTasks[taskIndex].createdById),
  };
};

export const deleteTask = async (id: string): Promise<void> => {
  await delay(300);
  
  const taskIndex = mockTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    throw new Error('Task not found');
  }
  
  mockTasks.splice(taskIndex, 1);
};

// File upload API (mock)
export const uploadFile = async (file: File): Promise<TaskAttachment> => {
  await delay(1000); // Simulate upload time
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    throw new Error('File size exceeds 5MB limit');
  }
  
  if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
    throw new Error('Only PDF and Word documents are allowed');
  }
  
  const attachment: TaskAttachment = {
    id: Date.now().toString(),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    uploadedAt: new Date().toISOString(),
    downloadUrl: `/api/files/${Date.now().toString()}`,
  };
  
  return attachment;
};

export const deleteFile = async (attachmentId: string): Promise<void> => {
  await delay(200);
  // In a real app, delete file from storage
};