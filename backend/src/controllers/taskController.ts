import { Response, NextFunction } from 'express';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';

export default class TaskController {
  // Get all tasks with filtering and pagination
  public static async getAllTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        assignee,
        project,
        search,
        dueDate,
        tags
      } = req.query;

      const filters: any = {};
      
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (assignee) filters.assignee = assignee;
      if (project) filters.project = project;
      if (dueDate) {
        const date = new Date(dueDate as string);
        filters.dueDate = { $lte: date };
      }
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filters.tags = { $in: tagArray };
      }

      // Add search functionality
      if (search) {
        filters.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const tasks = await Task.find(filters)
        .populate('assignee', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      const total = await Task.countDocuments(filters);

      res.json({
        success: true,
        data: tasks,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Alias for getAllTasks - used by routes
  public static async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    return TaskController.getAllTasks(req, res, next);
  }

  // Get user's tasks
  public static async getUserTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.['id'];
      const { page = 1, limit = 10, status, priority } = req.query;

      const filters: any = { assignee: userId };
      if (status) filters.status = status;
      if (priority) filters.priority = priority;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const tasks = await Task.find(filters)
        .populate('project', 'name')
        .sort({ dueDate: 1, priority: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      const total = await Task.countDocuments(filters);

      res.json({
        success: true,
        data: tasks,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Alias for getUserTasks - used by routes
  public static async getMyTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    return TaskController.getUserTasks(req, res, next);
  }

  // Get single task
  public static async getTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await Task.findById(req.params['id'])
        .populate('assignee', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('project', 'name')
        .populate('dependencies', 'title status priority');

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  // Alias for getTask - used by routes
  public static async getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    return TaskController.getTask(req, res, next);
  }

  // Create new task
  public static async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskData = {
        ...req.body,
        createdBy: req.user?.['id'] as any
      };

      const task = new Task(taskData);
      await task.save();

      const populatedTask = await Task.findById(task._id)
        .populate('assignee', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('project', 'name');

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: populatedTask
      });
    } catch (error) {
      next(error);
    }
  }

  // Update task
  public static async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await Task.findByIdAndUpdate(
        req.params['id'],
        req.body,
        { new: true, runValidators: true }
      ).populate('assignee', 'firstName lastName email')
       .populate('createdBy', 'firstName lastName email')
       .populate('project', 'name');

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete task
  public static async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await Task.findByIdAndDelete(req.params['id']);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update task status
  public static async updateTaskStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const task = await Task.findByIdAndUpdate(
        req.params['id'],
        { status },
        { new: true, runValidators: true }
      ).populate('assignee', 'firstName lastName email');

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Task status updated successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  // Update task progress
  public static async updateTaskProgress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { progress } = req.body;
      const task = await Task.findByIdAndUpdate(
        req.params['id'],
        { progress },
        { new: true, runValidators: true }
      ).populate('assignee', 'firstName lastName email');

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Task progress updated successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  // Assign task to user
  public static async assignTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assigneeId } = req.body;
      
      // Verify user exists
      const user = await User.findById(assigneeId);
      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Assignee not found'
        });
        return;
      }

      const task = await Task.findByIdAndUpdate(
        req.params['id'],
        { assignee: assigneeId },
        { new: true, runValidators: true }
      ).populate('assignee', 'firstName lastName email');

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Task assigned successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  // Add comment to task
  public static async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content } = req.body;
      const task = await Task.findById(req.params['id']);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      task.comments.push({
        content,
        author: (req.user?.['id'] as any),
        createdAt: new Date()
      } as any);

      await task.save();

      const populatedTask = await Task.findById(task._id)
        .populate('assignee', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('comments.author', 'firstName lastName');

      res.json({
        success: true,
        message: 'Comment added successfully',
        data: populatedTask
      });
    } catch (error) {
      next(error);
    }
  }

  // Update comment
  public static async updateComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      const task = await Task.findById(req.params['id']);
      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      const comment = (task.comments as any).id(commentId);
      if (!comment) {
        res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
        return;
      }

      comment.content = content;
      comment.updatedAt = new Date();

      await task.save();

      res.json({
        success: true,
        message: 'Comment updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete comment
  public static async deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { commentId } = req.params;

      const task = await Task.findById(req.params['id']);
      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      (task.comments as any).pull(commentId);
      await task.save();

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Add time entry
  public static async addTimeEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hours, description, date } = req.body;
      const task = await Task.findById(req.params['id']);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      task.timeEntries.push({
        hours: parseFloat(hours),
        description,
        date: date ? new Date(date) : new Date(),
        user: (req.user?.['id'] as any)
      } as any);

      await task.save();

      res.json({
        success: true,
        message: 'Time entry added successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update time entry
  public static async updateTimeEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { timeEntryId } = req.params;
      const { hours, description, date } = req.body;

      const task = await Task.findById(req.params['id']);
      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      const timeEntry = (task.timeEntries as any).id(timeEntryId);
      if (!timeEntry) {
        res.status(404).json({
          success: false,
          message: 'Time entry not found'
        });
        return;
      }

      timeEntry.hours = parseFloat(hours);
      timeEntry.description = description;
      if (date) timeEntry.date = new Date(date);

      await task.save();

      res.json({
        success: true,
        message: 'Time entry updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete time entry
  public static async deleteTimeEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { timeEntryId } = req.params;

      const task = await Task.findById(req.params['id']);
      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      (task.timeEntries as any).pull(timeEntryId);
      await task.save();

      res.json({
        success: true,
        message: 'Time entry deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload attachment
  public static async uploadAttachment(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // This would typically handle file upload via multer
      // For now, just return a placeholder response
      res.json({
        success: true,
        message: 'File upload functionality to be implemented'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete attachment
  public static async deleteAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attachmentId } = req.params;

      const task = await Task.findById(req.params['id']);
      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      (task.attachments as any).pull(attachmentId);
      await task.save();

      res.json({
        success: true,
        message: 'Attachment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Create subtask
  public static async createSubtask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, priority, dueDate } = req.body;
      const parentTaskId = req.params['id'];

      const subtask = new Task({
        title,
        description,
        priority,
        dueDate,
        parentTask: parentTaskId,
        createdBy: (req.user?.['id'] as any),
        assignee: (req.user?.['id'] as any)
      });

      await subtask.save();

      // Update parent task
      await Task.findByIdAndUpdate(parentTaskId, {
        $push: { subtasks: subtask._id }
      });

      res.status(201).json({
        success: true,
        message: 'Subtask created successfully',
        data: subtask
      });
    } catch (error) {
      next(error);
    }
  }

  // Get subtasks
  public static async getSubtasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const subtasks = await Task.find({ parentTask: req.params['id'] })
        .populate('assignee', 'firstName lastName email')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: subtasks
      });
    } catch (error) {
      next(error);
    }
  }

  // Add dependency
  public static async addDependency(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dependencyId } = req.body;

      const task = await Task.findById(req.params['id']);
      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      if (!task.dependencies.includes(dependencyId)) {
        task.dependencies.push(dependencyId);
        await task.save();
      }

      res.json({
        success: true,
        message: 'Dependency added successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove dependency
  public static async removeDependency(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dependencyId } = req.params;

      const task = await Task.findById(req.params['id']);
      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      (task.dependencies as any).pull(dependencyId);
      await task.save();

      res.json({
        success: true,
        message: 'Dependency removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get task activity
  public static async getTaskActivity(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // This would typically return activity logs
      // For now, return a placeholder response
      res.json({
        success: true,
        message: 'Activity logging to be implemented',
        data: []
      });
    } catch (error) {
      next(error);
    }
  }

  // Duplicate task
  public static async duplicateTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const originalTask = await Task.findById(req.params['id']);
      if (!originalTask) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      const duplicatedTask = new Task({
        ...originalTask.toObject(),
        _id: undefined,
        title: `${originalTask.title} (Copy)`,
        status: 'pending',
        createdAt: new Date(),
        createdBy: (req.user?.['id'] as any)
      });

      await duplicatedTask.save();

      res.status(201).json({
        success: true,
        message: 'Task duplicated successfully',
        data: duplicatedTask
      });
    } catch (error) {
      next(error);
    }
  }

  // Archive task
  public static async archiveTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await Task.findByIdAndUpdate(
        req.params['id'],
        { isArchived: true },
        { new: true }
      );

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Task archived successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Restore task
  public static async restoreTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await Task.findByIdAndUpdate(
        req.params['id'],
        { isArchived: false },
        { new: true }
      );

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Task restored successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get overdue tasks
  public static async getOverdueTasks(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const overdueTasks = await Task.find({
        dueDate: { $lt: new Date() },
        status: { $ne: 'completed' }
      }).populate('assignee', 'firstName lastName email')
        .populate('project', 'name')
        .sort({ dueDate: 1 });

      res.json({
        success: true,
        data: overdueTasks
      });
    } catch (error) {
      next(error);
    }
  }

  // Get tasks due soon
  public static async getTasksDueSoon(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(req.query['days'] as string) || 7;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);

      const tasksDueSoon = await Task.find({
        dueDate: { $lte: dueDate, $gte: new Date() },
        status: { $ne: 'completed' }
      }).populate('assignee', 'firstName lastName email')
        .populate('project', 'name')
        .sort({ dueDate: 1 });

      res.json({
        success: true,
        data: tasksDueSoon
      });
    } catch (error) {
      next(error);
    }
  }
}
