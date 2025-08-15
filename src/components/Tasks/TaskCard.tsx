import React from 'react';
import { Clock, User, Paperclip, MoreVertical, Calendar } from 'lucide-react';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView: (task: Task) => void;
}

export default function TaskCard({ task, onEdit, onDelete, onView }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
    };
    return colors[status as keyof typeof colors] || colors.todo;
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 
            className="text-lg font-semibold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => onView(task)}
          >
            {task.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
            {task.description}
          </p>
        </div>
        <div className="relative">
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
          {task.status.replace('-', ' ')}
        </span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <Calendar className="w-4 h-4 mr-2" />
          <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            Due: {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue && ' (Overdue)'}
          </span>
        </div>

        {task.assignedTo && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <User className="w-4 h-4 mr-2" />
            <span>Assigned to {task.assignedTo.firstName} {task.assignedTo.lastName}</span>
          </div>
        )}

        {task.attachments.length > 0 && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Paperclip className="w-4 h-4 mr-2" />
            <span>{task.attachments.length} attachment{task.attachments.length > 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
          <span>by {task.createdBy?.firstName} {task.createdBy?.lastName}</span>
        </div>
      </div>

      <div className="flex space-x-2 mt-4">
        <button
          onClick={() => onEdit(task)}
          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 dark:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/50 dark:hover:bg-red-900/70 dark:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}