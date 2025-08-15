# Task Management System

A full-stack web application for managing tasks, projects, and team collaboration with real-time updates and modern UI/UX.

## 🚀 Features

### Frontend (React + TypeScript)
- **Modern UI**: Built with React 18, TypeScript, and Tailwind CSS
- **Responsive Design**: Mobile-first approach with beautiful, intuitive interface
- **Real-time Updates**: WebSocket integration for live task updates
- **State Management**: React Context API for global state management
- **Protected Routes**: Authentication-based routing and access control

### Backend (Node.js + Express)
- **RESTful API**: Clean, well-structured API endpoints
- **Authentication**: JWT-based user authentication and authorization
- **Database Integration**: MongoDB with Mongoose ODM
- **Real-time Communication**: WebSocket server for live updates
- **Email Service**: Automated email notifications
- **Redis Integration**: Caching and session management
- **Error Handling**: Comprehensive error handling and validation

### Core Functionality
- **User Management**: Registration, login, profile management
- **Task Management**: Create, update, delete, and assign tasks
- **Project Organization**: Group tasks by projects and categories
- **File Management**: Upload and manage project files
- **Search & Filters**: Advanced search and filtering capabilities
- **Notifications**: Real-time and email notifications
- **Dashboard**: Comprehensive overview and analytics
- **Reports**: Task progress and performance reports

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Socket.io** - Real-time communication
- **Redis** - Caching and sessions
- **Nodemailer** - Email service

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)
- **Redis** (optional, for enhanced performance)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Harsh8432/-Task-Management-System.git
cd -Task-Management-System/project
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Setup

Create `.env` files in both root and backend directories:

#### Root `.env` (Frontend)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

#### Backend `.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-management
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Start the Application

```bash
# Start backend server
cd backend
npm run dev

# In a new terminal, start frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Task Management Endpoints

#### GET `/api/tasks`
Get all tasks (with pagination and filters).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Task status filter
- `priority`: Priority filter
- `assignee`: Assignee ID filter

#### POST `/api/tasks`
Create a new task.

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive documentation for the project",
  "priority": "high",
  "status": "pending",
  "dueDate": "2024-01-15",
  "assignee": "user_id",
  "project": "project_id"
}
```

#### PUT `/api/tasks/:id`
Update an existing task.

#### DELETE `/api/tasks/:id`
Delete a task.

### Project Management Endpoints

#### GET `/api/projects`
Get all projects.

#### POST `/api/projects`
Create a new project.

**Request Body:**
```json
{
  "name": "Website Redesign",
  "description": "Modernize company website",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "team": ["user_id_1", "user_id_2"]
}
```

### User Management Endpoints

#### GET `/api/users`
Get all users (admin only).

#### GET `/api/users/profile`
Get current user profile.

#### PUT `/api/users/profile`
Update user profile.

## 🗂️ Project Structure

```
project/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── Auth/          # Authentication components
│   │   ├── Layout/        # Layout and navigation
│   │   └── Tasks/         # Task-related components
│   ├── context/           # React context providers
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── types/             # TypeScript type definitions
├── backend/                # Backend source code
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── package.json
├── package.json            # Frontend package.json
└── README.md              # This file
```

## 🔧 Configuration

### Database Configuration
The application uses MongoDB as the primary database. Configure your MongoDB connection in the backend `.env` file.

### Redis Configuration (Optional)
Redis is used for caching and session management. If Redis is not available, the application will fall back to in-memory storage.

### Email Configuration
Configure SMTP settings for email notifications. Gmail, Outlook, and other SMTP providers are supported.

## 🚀 Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service:

```bash
# Build for production
npm run build

# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
The backend can be deployed to various platforms:

- **Heroku**: Use the provided Procfile
- **Vercel**: Configure as a Node.js function
- **AWS**: Deploy to EC2 or Lambda
- **Docker**: Use the provided Dockerfile

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Harsh8432/-Task-Management-System/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS approach
- MongoDB team for the robust database
- All contributors who helped build this project

---

**Happy Task Managing! 🎯**
