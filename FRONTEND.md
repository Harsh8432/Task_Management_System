# Frontend Documentation

This document provides detailed information about the frontend architecture and components of the Task Management System.

## 🏗️ Architecture Overview

The frontend is built using modern React patterns with a component-based architecture:

```
src/
├── components/         # Reusable UI components
├── pages/             # Page-level components
├── context/           # React Context for state management
├── services/          # API and external service integrations
├── types/             # TypeScript type definitions
├── hooks/             # Custom React hooks
└── utils/             # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
VITE_APP_NAME=Task Management System
```

### Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

## 🧩 Component Architecture

### Component Hierarchy

```
App
├── AuthContext
├── ProtectedRoute
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Main Content
├── Pages
│   ├── Dashboard
│   ├── Tasks
│   ├── Projects
│   ├── Users
│   ├── Reports
│   └── Settings
└── Auth Components
    ├── LoginForm
    └── RegisterForm
```

### Component Categories

#### 1. Layout Components
- **Layout.tsx**: Main layout wrapper
- **Header.tsx**: Top navigation bar
- **Sidebar.tsx**: Left navigation menu
- **ProtectedRoute.tsx**: Authentication guard

#### 2. Authentication Components
- **LoginForm.tsx**: User login form
- **RegisterForm.tsx**: User registration form

#### 3. Task Management Components
- **TaskCard.tsx**: Individual task display
- **TaskForm.tsx**: Task creation/editing form
- **TaskFilters.tsx**: Task filtering and search

#### 4. Page Components
- **Dashboard.tsx**: Main dashboard view
- **Tasks.tsx**: Task management page
- **Projects.tsx**: Project management page
- **Users.tsx**: User management page
- **Reports.tsx**: Analytics and reports
- **Settings.tsx**: User preferences

## 🔄 State Management

### Context API Structure

The application uses React Context for global state management:

#### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  loading: boolean;
}
```

#### Usage Example
```typescript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user?.name}!</div>;
}
```

### Local State Management

Components use React hooks for local state:

```typescript
function TaskForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ... component logic
}
```

## 🌐 API Integration

### API Service Structure

The frontend communicates with the backend through a centralized API service:

#### api.ts
```typescript
class ApiService {
  private baseURL: string;
  private token: string | null;
  
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL;
    this.token = localStorage.getItem('token');
  }
  
  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse>
  async register(userData: RegisterData): Promise<AuthResponse>
  
  // Tasks
  async getTasks(params?: TaskQueryParams): Promise<TaskResponse>
  async createTask(taskData: CreateTaskData): Promise<Task>
  async updateTask(id: string, taskData: UpdateTaskData): Promise<Task>
  async deleteTask(id: string): Promise<void>
  
  // Projects
  async getProjects(): Promise<Project[]>
  async createProject(projectData: CreateProjectData): Promise<Project>
  
  // Users
  async getProfile(): Promise<User>
  async updateProfile(userData: UpdateUserData): Promise<User>
}
```

#### Usage Example
```typescript
import { apiService } from '../services/api';

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await apiService.getTasks();
        setTasks(response.data.tasks);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };
    
    fetchTasks();
  }, []);
  
  // ... component logic
}
```

## 🎨 Styling & UI

### Tailwind CSS Integration

The application uses Tailwind CSS for styling with custom configuration:

#### tailwind.config.js
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // ... custom colors
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

#### Component Styling Example
```typescript
function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          task.priority === 'high' ? 'bg-red-100 text-red-800' :
          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {task.priority}
        </span>
      </div>
      <p className="text-gray-600 mb-4">{task.description}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Due: {formatDate(task.dueDate)}</span>
        <span>Assignee: {task.assignee.name}</span>
      </div>
    </div>
  );
}
```

## 🚦 Routing & Navigation

### React Router Configuration

The application uses React Router for client-side routing:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <AuthContext>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="projects" element={<Projects />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthContext>
    </BrowserRouter>
  );
}
```

### Protected Routes

Routes are protected using the `ProtectedRoute` component:

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

## 📱 Responsive Design

### Mobile-First Approach

The application is designed with a mobile-first approach:

```typescript
function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MenuIcon className="h-6 w-6" />
      </button>
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0
      `}>
        {/* Sidebar content */}
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
```

### Breakpoint System

```typescript
// Tailwind CSS breakpoints
// sm: 640px and up
// md: 768px and up
// lg: 1024px and up
// xl: 1280px and up
// 2xl: 1536px and up

function ResponsiveGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Grid items */}
    </div>
  );
}
```

## 🔌 Real-time Features

### WebSocket Integration

The application uses WebSocket for real-time updates:

```typescript
import { useEffect, useRef } from 'react';

function useWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle real-time updates
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.current?.close();
    };
  }, [url]);
  
  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };
  
  return { sendMessage };
}
```

## 🧪 Testing

### Component Testing

Components can be tested using React Testing Library:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskForm } from './TaskForm';

describe('TaskForm', () => {
  it('renders form fields', () => {
    render(<TaskForm />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
  });
  
  it('submits form with correct data', () => {
    const mockSubmit = jest.fn();
    render(<TaskForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Task' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      title: 'Test Task',
      description: '',
      priority: 'medium'
    });
  });
});
```

## 📦 Build & Deployment

### Vite Configuration

The application uses Vite for fast development and optimized builds:

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});
```

### Environment-specific Builds

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## 🔧 Performance Optimization

### Code Splitting

The application uses React.lazy for code splitting:

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Projects = lazy(() => import('./pages/Projects'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

Components use React.memo and useMemo for performance:

```typescript
const TaskCard = React.memo(({ task }: TaskCardProps) => {
  const formattedDate = useMemo(() => {
    return formatDate(task.dueDate);
  }, [task.dueDate]);
  
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <span>Due: {formattedDate}</span>
    </div>
  );
});
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)

---

**Happy Coding! 🚀**
