import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticateToken as auth, requireManager } from '../middleware/auth';
import TaskController from '../controllers/taskController';

const router = Router();

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with filtering and pagination
 * @access  Private
 */
router.get('/', [
  auth,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed', 'cancelled', 'on-hold'])
    .withMessage('Invalid status value'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent', 'critical'])
    .withMessage('Invalid priority value'),
  query('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid assignedTo ID format'),
  query('createdBy')
    .optional()
    .isMongoId()
    .withMessage('Invalid createdBy ID format'),
  query('dueDateRange.start')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  query('dueDateRange.end')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date'),
  query('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  query('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be between 1 and 100 characters'),
  query('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters'),
  query('isOverdue')
    .optional()
    .isBoolean()
    .withMessage('isOverdue must be a boolean value'),
  query('hasAttachments')
    .optional()
    .isBoolean()
    .withMessage('hasAttachments must be a boolean value'),
  query('hasComments')
    .optional()
    .isBoolean()
    .withMessage('hasComments must be a boolean value'),
  query('sortBy')
    .optional()
    .isIn(['title', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  validateRequest
], TaskController.getTasks);

/**
 * @route   GET /api/tasks/my-tasks
 * @desc    Get current user's tasks
 * @access  Private
 */
router.get('/my-tasks', [
  auth,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed', 'cancelled', 'on-hold'])
    .withMessage('Invalid status value'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent', 'critical'])
    .withMessage('Invalid priority value'),
  validateRequest
], TaskController.getMyTasks);

/**
 * @route   GET /api/tasks/overdue
 * @desc    Get overdue tasks
 * @access  Private
 */
router.get('/overdue', [
  auth,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validateRequest
], TaskController.getOverdueTasks);

/**
 * @route   GET /api/tasks/due-soon
 * @desc    Get tasks due soon
 * @access  Private
 */
router.get('/due-soon', [
  auth,
  query('days')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Days must be between 1 and 30'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validateRequest
], TaskController.getTasksDueSoon);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:id', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  validateRequest
], TaskController.getTaskById);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', [
  auth,
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, urgent, critical'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid ISO date'),
  body('assignedToId')
    .optional()
    .isMongoId()
    .withMessage('Invalid assignedTo ID format'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('parentTaskId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent task ID format'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be between 1 and 100 characters'),
  body('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array'),
  body('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID format'),
  validateRequest
], TaskController.createTask);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task by ID
 * @access  Private (Owner, Assigned User, or Manager/Admin)
 */
router.put('/:id', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed', 'cancelled', 'on-hold'])
    .withMessage('Invalid status value'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, urgent, critical'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO date'),
  body('assignedToId')
    .optional()
    .isMongoId()
    .withMessage('Invalid assignedTo ID format'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('actualHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual hours must be a positive number'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be between 1 and 100 characters'),
  body('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array'),
  validateRequest
], TaskController.updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task by ID
 * @access  Private (Owner or Admin)
 */
router.delete('/:id', [
  auth,
  requireManager,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  validateRequest
], TaskController.deleteTask);

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Update task status
 * @access  Private (Owner, Assigned User, or Manager/Admin)
 */
router.patch('/:id/status', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('status')
    .isIn(['todo', 'in-progress', 'review', 'completed', 'cancelled', 'on-hold'])
    .withMessage('Invalid status value'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  validateRequest
], TaskController.updateTaskStatus);

/**
 * @route   PATCH /api/tasks/:id/assign
 * @desc    Assign task to user
 * @access  Private (Owner or Manager/Admin)
 */
router.patch('/:id/assign', [
  auth,
  requireManager,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('assignedToId')
    .isMongoId()
    .withMessage('Invalid assignedTo ID format'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  validateRequest
], TaskController.assignTask);

/**
 * @route   PATCH /api/tasks/:id/progress
 * @desc    Update task progress
 * @access  Private (Owner or Assigned User)
 */
router.patch('/:id/progress', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('progress')
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  validateRequest
], TaskController.updateTaskProgress);

/**
 * @route   POST /api/tasks/:id/comments
 * @desc    Add comment to task
 * @access  Private
 */
router.post('/:id/comments', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID format'),
  body('mentions')
    .optional()
    .isArray()
    .withMessage('Mentions must be an array'),
  validateRequest
], TaskController.addComment);

/**
 * @route   PUT /api/tasks/:id/comments/:commentId
 * @desc    Update comment
 * @access  Private (Comment Author or Admin)
 */
router.put('/:id/comments/:commentId', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID format'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
  validateRequest
], TaskController.updateComment);

/**
 * @route   DELETE /api/tasks/:id/comments/:commentId
 * @desc    Delete comment
 * @access  Private (Comment Author or Admin)
 */
router.delete('/:id/comments/:commentId', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID format'),
  validateRequest
], TaskController.deleteComment);

/**
 * @route   POST /api/tasks/:id/time-entries
 * @desc    Add time entry to task
 * @access  Private
 */
router.post('/:id/time-entries', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO date'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (in minutes)'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('isBillable')
    .optional()
    .isBoolean()
    .withMessage('isBillable must be a boolean value'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  validateRequest
], TaskController.addTimeEntry);

/**
 * @route   PUT /api/tasks/:id/time-entries/:timeEntryId
 * @desc    Update time entry
 * @access  Private (Time Entry Owner or Admin)
 */
router.put('/:id/time-entries/:timeEntryId', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  param('timeEntryId')
    .isMongoId()
    .withMessage('Invalid time entry ID format'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO date'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (in minutes)'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('isBillable')
    .optional()
    .isBoolean()
    .withMessage('isBillable must be a boolean value'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  validateRequest
], TaskController.updateTimeEntry);

/**
 * @route   DELETE /api/tasks/:id/time-entries/:timeEntryId
 * @desc    Delete time entry
 * @access  Private (Time Entry Owner or Admin)
 */
router.delete('/:id/time-entries/:timeEntryId', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  param('timeEntryId')
    .isMongoId()
    .withMessage('Invalid time entry ID format'),
  validateRequest
], TaskController.deleteTimeEntry);

/**
 * @route   POST /api/tasks/:id/attachments
 * @desc    Upload attachment to task
 * @access  Private
 */
router.post('/:id/attachments', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  // File upload middleware will be handled in the controller
], TaskController.uploadAttachment);

/**
 * @route   DELETE /api/tasks/:id/attachments/:attachmentId
 * @desc    Delete attachment
 * @access  Private (Task Owner or Admin)
 */
router.delete('/:id/attachments/:attachmentId', [
  auth,
  requireManager,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  param('attachmentId')
    .isMongoId()
    .withMessage('Invalid attachment ID format'),
  validateRequest
], TaskController.deleteAttachment);

/**
 * @route   POST /api/tasks/:id/subtasks
 * @desc    Create subtask
 * @access  Private
 */
router.post('/:id/subtasks', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, urgent, critical'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid ISO date'),
  body('assignedToId')
    .optional()
    .isMongoId()
    .withMessage('Invalid assignedTo ID format'),
  validateRequest
], TaskController.createSubtask);

/**
 * @route   GET /api/tasks/:id/subtasks
 * @desc    Get task subtasks
 * @access  Private
 */
router.get('/:id/subtasks', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  validateRequest
], TaskController.getSubtasks);

/**
 * @route   POST /api/tasks/:id/dependencies
 * @desc    Add dependency to task
 * @access  Private (Owner or Manager/Admin)
 */
router.post('/:id/dependencies', [
  auth,
  requireManager,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('dependencyId')
    .isMongoId()
    .withMessage('Invalid dependency ID format'),
  validateRequest
], TaskController.addDependency);

/**
 * @route   DELETE /api/tasks/:id/dependencies/:dependencyId
 * @desc    Remove dependency from task
 * @access  Private (Owner or Manager/Admin)
 */
router.delete('/:id/dependencies/:dependencyId', [
  auth,
  requireManager,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  param('dependencyId')
    .isMongoId()
    .withMessage('Invalid dependency ID format'),
  validateRequest
], TaskController.removeDependency);

/**
 * @route   GET /api/tasks/:id/activity
 * @desc    Get task activity log
 * @access  Private
 */
router.get('/:id/activity', [
  auth,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validateRequest
], TaskController.getTaskActivity);

/**
 * @route   POST /api/tasks/:id/duplicate
 * @desc    Duplicate task
 * @access  Private (Owner or Manager/Admin)
 */
router.post('/:id/duplicate', [
  auth,
  requireManager,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('assignedToId')
    .optional()
    .isMongoId()
    .withMessage('Invalid assignedTo ID format'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO date'),
  validateRequest
], TaskController.duplicateTask);

/**
 * @route   POST /api/tasks/:id/archive
 * @desc    Archive task
 * @access  Private (Owner or Admin)
 */
router.post('/:id/archive', [
  auth,
  requireManager,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  validateRequest
], TaskController.archiveTask);

/**
 * @route   POST /api/tasks/:id/restore
 * @desc    Restore archived task
 * @access  Private (Owner or Admin)
 */
router.post('/:id/restore', [
  auth,
  requireManager,
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  validateRequest
], TaskController.restoreTask);

export default router;