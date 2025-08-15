import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Calendar,
  Users,
  CheckSquare,
  Clock
} from 'lucide-react';
import { Task, User } from '../types';
import * as api from '../services/api';

export default function Reports() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tasksResponse, usersResponse] = await Promise.all([
        api.getTasks(1, 1000), // Get all tasks
        api.getUsers(1, 100)
      ]);

      // Filter tasks by date range
      const filteredTasks = tasksResponse.tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return taskDate >= startDate && taskDate <= endDate;
      });

      setTasks(filteredTasks);
      setUsers(usersResponse.users);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskStats = () => {
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      todo: tasks.filter(t => t.status === 'todo').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      overdue: tasks.filter(t => 
        new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length,
    };

    return stats;
  };

  const getPriorityStats = () => {
    return {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };
  };

  const getUserStats = () => {
    return users.map(user => ({
      user,
      assignedTasks: tasks.filter(t => t.assignedToId === user.id).length,
      completedTasks: tasks.filter(t => t.assignedToId === user.id && t.status === 'completed').length,
      createdTasks: tasks.filter(t => t.createdById === user.id).length,
    }));
  };

  const getCompletionRate = () => {
    const stats = getTaskStats();
    return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  };

  const exportReport = () => {
    const stats = getTaskStats();
    const priorityStats = getPriorityStats();
    const userStats = getUserStats();

    const reportData = {
      dateRange,
      summary: {
        ...stats,
        completionRate: getCompletionRate(),
      },
      priorityBreakdown: priorityStats,
      userPerformance: userStats,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-report-${dateRange.start}-to-${dateRange.end}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = getTaskStats();
  const priorityStats = getPriorityStats();
  const userStats = getUserStats();
  const completionRate = getCompletionRate();

  const StatCard = ({ title, value, icon: Icon, color, bgColor, subtitle }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    bgColor: string;
    subtitle?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '...' : value}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Analytics and insights for your tasks and team performance
          </p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
          </div>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          icon={CheckSquare}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-900/50"
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completed}
          icon={CheckSquare}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-100 dark:bg-green-900/50"
          subtitle={`${completionRate}% completion rate`}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="text-yellow-600 dark:text-yellow-400"
          bgColor="bg-yellow-100 dark:bg-yellow-900/50"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdue}
          icon={TrendingUp}
          color="text-red-600 dark:text-red-400"
          bgColor="bg-red-100 dark:bg-red-900/50"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <PieChart className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Task Status Distribution
            </h3>
          </div>
          <div className="space-y-4">
            {Object.entries(stats).filter(([key]) => !['total', 'overdue'].includes(key)).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    status === 'completed' 
                      ? 'bg-green-500' 
                      : status === 'inProgress' 
                      ? 'bg-blue-500'
                      : status === 'cancelled'
                      ? 'bg-red-500'
                      : 'bg-gray-500'
                  }`} />
                  <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {status.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {count}
                  </span>
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'completed' 
                          ? 'bg-green-500' 
                          : status === 'inProgress' 
                          ? 'bg-blue-500'
                          : status === 'cancelled'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      }`}
                      style={{
                        width: `${stats.total > 0 ? (count as number / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Priority Distribution
            </h3>
          </div>
          <div className="space-y-4">
            {Object.entries(priorityStats).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    priority === 'urgent' 
                      ? 'bg-red-500' 
                      : priority === 'high' 
                      ? 'bg-orange-500'
                      : priority === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`} />
                  <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {priority}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {count}
                  </span>
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        priority === 'urgent' 
                          ? 'bg-red-500' 
                          : priority === 'high' 
                          ? 'bg-orange-500'
                          : priority === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Performance
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assigned Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completed Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {userStats.map((userStat) => {
                const completionRate = userStat.assignedTasks > 0 
                  ? Math.round((userStat.completedTasks / userStat.assignedTasks) * 100)
                  : 0;
                
                return (
                  <tr key={userStat.user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {userStat.user.firstName[0]}{userStat.user.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {userStat.user.firstName} {userStat.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {userStat.user.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {userStat.assignedTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {userStat.completedTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {userStat.createdTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              completionRate >= 80 
                                ? 'bg-green-500'
                                : completionRate >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}