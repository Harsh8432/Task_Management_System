// import express from 'express';
// import { body, param, query } from 'express-validator';
// import { validateRequest } from '../middleware/validation';
// import { authenticateToken, requireAdmin, requireManager } from '../middleware/auth';
// import { User } from '../models/User';
// // Removed unused logger import

// const router = express.Router();

// // Apply authentication middleware to all routes
// router.use(authenticateToken);

// // Get all users (admin/manager only)
// router.get('/', 
//   requireManager,
//   [
//     query('page').optional().isInt({ min: 1 }),
//     query('limit').optional().isInt({ min: 1, max: 100 }),
//     query('role').optional().isIn(['user', 'manager', 'admin']),
//     query('status').optional().isIn(['active', 'inactive']),
//     query('search').optional().isString().trim()
//   ],
//   validateRequest,
//   async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//       const { page = 1, limit = 10, role, status, search } = req.query;
      
//       const filters: any = {};
//       if (role) filters.role = role;
//       if (status) filters.isActive = status === 'active';
//       if (search) {
//         filters.$or = [
//           { firstName: { $regex: search, $options: 'i' } },
//           { lastName: { $regex: search, $options: 'i' } },
//           { email: { $regex: search, $options: 'i' } }
//         ];
//       }

//       const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      
//       const users = await User.find(filters)
//         .select('-password -emailVerificationToken -passwordResetToken')
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit as string));

//       const total = await User.countDocuments(filters);

//       return res.json({
//         success: true,
//         data: users,
//         pagination: {
//           page: parseInt(page as string),
//           limit: parseInt(limit as string),
//           total,
//           pages: Math.ceil(total / parseInt(limit as string))
//         }
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Get current user profile
// router.get('/profile', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//   try {
//     const user = await User.findById(req.user?.id)
//       .select('-password -emailVerificationToken -passwordResetToken');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     return res.json({
//       success: true,
//       data: user
//     });
//   } catch (error) {
//     return next(error);
//   }
// });

// // Get user by ID (admin/manager only)
// router.get('/:id',
//   requireManager,
//   [
//     param('id').isMongoId()
//   ],
//   validateRequest,
//   async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//   const user = await User.findById(req.params['id'])
//         .select('-password -emailVerificationToken -passwordResetToken');

//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       return res.json({
//         success: true,
//         data: user
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Update user profile
// router.put('/profile',
//   [
//     body('firstName').optional().isString().trim().isLength({ min: 1, max: 50 }),
//     body('lastName').optional().isString().trim().isLength({ min: 1, max: 50 }),
//     body('preferences').optional().isObject()
//   ],
//   validateRequest,
//   async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//       const { firstName, lastName, preferences } = req.body;
      
//       const updateData: any = {};
//       if (firstName) updateData.firstName = firstName;
//       if (lastName) updateData.lastName = lastName;
//       if (preferences) updateData.preferences = preferences;

//       const user = await User.findByIdAndUpdate(
//         req.user?.id,
//         updateData,
//         { new: true, runValidators: true }
//       ).select('-password -emailVerificationToken -passwordResetToken');

//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       return res.json({
//         success: true,
//         message: 'Profile updated successfully',
//         data: user
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Update user (admin/manager only)
// router.put('/:id',
//   requireManager,
//   [
//     param('id').isMongoId(),
//     body('firstName').optional().isString().trim().isLength({ min: 1, max: 50 }),
//     body('lastName').optional().isString().trim().isLength({ min: 1, max: 50 }),
//     body('role').optional().isIn(['user', 'manager', 'admin']),
//     body('isActive').optional().isBoolean(),
//     body('preferences').optional().isObject()
//   ],
//   validateRequest,
//   async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//       const { firstName, lastName, role, isActive, preferences } = req.body;
      
//       const updateData: any = {};
//       if (firstName) updateData.firstName = firstName;
//       if (lastName) updateData.lastName = lastName;
//       if (role) updateData.role = role;
//       if (typeof isActive === 'boolean') updateData.isActive = isActive;
//       if (preferences) updateData.preferences = preferences;

//       const user = await User.findByIdAndUpdate(
//         req.params['id'],
//         updateData,
//         { new: true, runValidators: true }
//       ).select('-password -emailVerificationToken -passwordResetToken');

//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       return res.json({
//         success: true,
//         message: 'User updated successfully',
//         data: user
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Deactivate user (admin only)
// router.delete('/:id',
//   requireAdmin,
//   [
//     param('id').isMongoId()
//   ],
//   validateRequest,
//   async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//       const user = await User.findByIdAndUpdate(
//         req.params['id'],
//         { isActive: false },
//         { new: true }
//       ).select('-password -emailVerificationToken -passwordResetToken');

//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       res.json({
//         success: true,
//         message: 'User deactivated successfully',
//         data: user
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Get user statistics (admin only)
// router.get('/stats/overview',
//   requireAdmin,
//   async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     try {
//       const totalUsers = await User.countDocuments();
//       const activeUsers = await User.countDocuments({ isActive: true });
//       const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
      
//       const roleStats = await User.aggregate([
//         {
//           $group: {
//             _id: '$role',
//             count: { $sum: 1 }
//           }
//         }
//       ]);

//       const recentUsers = await User.find()
//         .sort({ createdAt: -1 })
//         .limit(5)
//         .select('firstName lastName email role createdAt');

//       res.json({
//         success: true,
//         data: {
//           total: totalUsers,
//           active: activeUsers,
//           verified: verifiedUsers,
//           roleDistribution: roleStats,
//           recentUsers
//         }
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// export default router;

import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireAdmin, requireManager } from '../middleware/auth';
import { User } from '../models/User';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all users (admin/manager only)
router.get(
  '/',
  requireManager,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['user', 'manager', 'admin']),
    query('status').optional().isIn(['active', 'inactive']),
    query('search').optional().isString().trim(),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { page = 1, limit = 10, role, status, search } = req.query;

      const filters: any = {};
      if (role) filters.role = role;
      if (status) filters.isActive = status === 'active';
      if (search) {
        filters.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const users = await User.find(filters)
        .select('-password -emailVerificationToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      const total = await User.countDocuments(filters);

      return res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Get current user profile
router.get('/profile', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const user = await User.findById(req.user?.id).select(
      '-password -emailVerificationToken -passwordResetToken'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
});

// Get user by ID (admin/manager only)
router.get(
  '/:id',
  requireManager,
  [param('id').isMongoId()],
  validateRequest,
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const user = await User.findById(req.params['id']).select(
        '-password -emailVerificationToken -passwordResetToken'
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Update user profile
router.put(
  '/profile',
  [
    body('firstName').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('preferences').optional().isObject(),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { firstName, lastName, preferences } = req.body;

      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (preferences) updateData.preferences = preferences;

      const user = await User.findByIdAndUpdate(req.user?.id, updateData, {
        new: true,
        runValidators: true,
      }).select('-password -emailVerificationToken -passwordResetToken');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Update user (admin/manager only)
router.put(
  '/:id',
  requireManager,
  [
    param('id').isMongoId(),
    body('firstName').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('role').optional().isIn(['user', 'manager', 'admin']),
    body('isActive').optional().isBoolean(),
    body('preferences').optional().isObject(),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { firstName, lastName, role, isActive, preferences } = req.body;

      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      if (preferences) updateData.preferences = preferences;

      const user = await User.findByIdAndUpdate(req.params['id'], updateData, {
        new: true,
        runValidators: true,
      }).select('-password -emailVerificationToken -passwordResetToken');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Deactivate user (admin only)
router.delete(
  '/:id',
  requireAdmin,
  [param('id').isMongoId()],
  validateRequest,
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params['id'],
        { isActive: false },
        { new: true }
      ).select('-password -emailVerificationToken -passwordResetToken');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        message: 'User deactivated successfully',
        data: user,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Get user statistics (admin only)
router.get(
  '/stats/overview',
  requireAdmin,
  async (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const verifiedUsers = await User.countDocuments({ isEmailVerified: true });

      const roleStats = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]);

      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email role createdAt');

      return res.json({
        success: true,
        data: {
          total: totalUsers,
          active: activeUsers,
          verified: verifiedUsers,
          roleDistribution: roleStats,
          recentUsers,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;

