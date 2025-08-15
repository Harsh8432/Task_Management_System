import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Clock, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  Plus
} from 'lucide-react';
import { Task, User } from '../types';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalUsers: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [tasksResponse, usersResponse] = await Promise.all([
        api.getTasks(1, 10),
        api.getUsers(1, 100),
      ]);

      const tasks = tasksResponse.tasks;
      const users = usersResponse.users;

      // Calculate statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const pendingTasks = tasks.filter(t => ['todo', 'in-progress'].includes(t.status)).length;
      const overdueTasks = tasks.filter(t => 
        new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length;

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        totalUsers: users.length,
      });

      setRecentTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="ml-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '...' : value}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    const colors = {
      todo: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700',
      'in-progress': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/50',
      completed: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50',
      cancelled: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50',
    };
    return colors[status as keyof typeof colors] || colors.todo;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50',
      medium: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50',
      high: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/50',
      urgent: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-blue-100 text-lg">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={CheckSquare}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-900/50"
        />
        <StatCard
          title="Completed"
          value={stats.completedTasks}
          icon={CheckSquare}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-100 dark:bg-green-900/50"
        />
        <StatCard
          title="Pending"
          value={stats.pendingTasks}
          icon={Clock}
          color="text-yellow-600 dark:text-yellow-400"
          bgColor="bg-yellow-100 dark:bg-yellow-900/50"
        />
        <StatCard
          title="Overdue"
          value={stats.overdueTasks}
          icon={AlertTriangle}
          color="text-red-600 dark:text-red-400"
          bgColor="bg-red-100 dark:bg-red-900/50"
        />
        {user?.role === 'admin' && (
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="text-purple-600 dark:text-purple-400"
            bgColor="bg-purple-100 dark:bg-purple-900/50"
          />
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Tasks
                </h2>
                <a
                  href="/tasks"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  View all
                </a>
              </div>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentTasks.length > 0 ? (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center space-x-4 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                          <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {task.title}
                        </h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace('-', ' ')}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No tasks found</p>
                  <button className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4 mr-2" />
                    Create your first task
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <a
                href="/tasks?new=true"
                className="w-full flex items-center px-4 py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-400 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 mr-3" />
                Create New Task
              </a>
              <a
                href="/tasks"
                className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                <CheckSquare className="w-5 h-5 mr-3" />
                View All Tasks
              </a>
              <a
                href="/reports"
                className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                <TrendingUp className="w-5 h-5 mr-3" />
                View Reports
              </a>
              {user?.role === 'admin' && (
                <a
                  href="/users"
                  className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <Users className="w-5 h-5 mr-3" />
                  Manage Users
                </a>
              )}
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Progress Overview
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Task Completion</span>
                  <span>
                    {stats.totalTasks > 0 
                      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                      : 0
                    }%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${stats.totalTasks > 0 
                        ? (stats.completedTasks / stats.totalTasks) * 100
                        : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.completedTasks}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.pendingTasks}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}