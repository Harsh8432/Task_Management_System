import React from 'react';
import { Filter, Search, X } from 'lucide-react';
import { TaskFilters as FilterType, User } from '../../types';

interface TaskFiltersProps {
  filters: FilterType;
  users: User[];
  onFiltersChange: (filters: FilterType) => void;
  onClearFilters: () => void;
}

export default function TaskFilters({ filters, users, onFiltersChange, onClearFilters }: TaskFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    !(typeof value === 'object' && Object.values(value).every(v => !v))
  );

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority || ''}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        {/* Assigned To Filter */}
        <select
          value={filters.assignedTo || ''}
          onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>

        {/* Due Date Range */}
        <div className="flex space-x-2">
          <input
            type="date"
            placeholder="Start date"
            value={filters.dueDateRange?.start || ''}
            onChange={(e) => handleFilterChange('dueDateRange', {
              ...filters.dueDateRange,
              start: e.target.value
            })}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="date"
            placeholder="End date"
            value={filters.dueDateRange?.end || ''}
            onChange={(e) => handleFilterChange('dueDateRange', {
              ...filters.dueDateRange,
              end: e.target.value
            })}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Active filters: {Object.entries(filters).filter(([, value]) => 
            value !== undefined && value !== '' &&
            !(typeof value === 'object' && Object.values(value).every(v => !v))
          ).length}
        </div>
      )}
    </div>
  );
}