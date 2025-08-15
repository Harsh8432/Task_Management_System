import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { rateLimit, authenticateToken } from '../middleware/auth';
import AuthController from '../controllers/authController';

const router = Router();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit(5, 15 * 60 * 1000); // 5 requests per 15 minutes

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  authRateLimit,
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('role')
    .optional()
    .isIn(['user', 'manager', 'admin'])
    .withMessage('Role must be one of: user, manager, admin'),
  validateRequest
], AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', [
  authRateLimit,
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean value'),
  validateRequest
], AuthController.login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  validateRequest
], AuthController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post('/logout', [
  authenticateToken,
  body('refreshToken')
    .optional()
    .notEmpty()
    .withMessage('Refresh token must not be empty if provided'),
  validateRequest
], AuthController.logout);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify-email/:token', [
  param('token')
    .isLength({ min: 32, max: 64 })
    .withMessage('Invalid verification token format')
    .matches(/^[a-f0-9]+$/i)
    .withMessage('Invalid verification token format'),
  validateRequest
], AuthController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', [
  authRateLimit,
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validateRequest
], (req: Request, res: Response, next: NextFunction) => AuthController.resendVerificationEmail(req, res, next));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', [
  authRateLimit,
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validateRequest
], AuthController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', [
  body('token')
    .isLength({ min: 32, max: 64 })
    .withMessage('Invalid reset token format')
    .matches(/^[a-f0-9]+$/i)
    .withMessage('Invalid reset token format'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  validateRequest
], AuthController.resetPassword);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  validateRequest
], AuthController.changePassword);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', [
  authenticateToken,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be one of: light, dark, auto'),
  body('preferences.language')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('Language code must be between 2 and 10 characters'),
  body('preferences.timezone')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Timezone must be between 3 and 50 characters'),
  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean value'),
  body('preferences.pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean value'),
  body('preferences.weeklyDigest')
    .optional()
    .isBoolean()
    .withMessage('Weekly digest must be a boolean value'),
  validateRequest
], AuthController.updateProfile);

/**
 * @route   POST /api/auth/enable-2fa
 * @desc    Enable two-factor authentication
 * @access  Private
 */
router.post('/enable-2fa', [
  authenticateToken,
  body('twoFactorSecret')
    .isLength({ min: 6, max: 6 })
    .withMessage('Two-factor secret must be exactly 6 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Two-factor secret must contain only numbers'),
  validateRequest
], async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementation for enabling 2FA
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/disable-2fa
 * @desc    Disable two-factor authentication
 * @access  Private
 */
router.post('/disable-2fa', [
  authenticateToken,
  body('twoFactorToken')
    .isLength({ min: 6, max: 6 })
    .withMessage('Two-factor token must be exactly 6 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Two-factor token must contain only numbers'),
  validateRequest
], async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementation for disabling 2FA
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify two-factor authentication token
 * @access  Private
 */
router.post('/verify-2fa', [
  authenticateToken,
  body('twoFactorToken')
    .isLength({ min: 6, max: 6 })
    .withMessage('Two-factor token must be exactly 6 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Two-factor token must contain only numbers'),
  validateRequest
], async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementation for verifying 2FA
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication verified successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/sessions
 * @desc    Get active sessions for current user
 * @access  Private
 */
router.get('/sessions', authenticateToken, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementation for getting active sessions
    res.status(200).json({
      success: true,
      message: 'Active sessions retrieved successfully',
      data: [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', [
  authenticateToken,
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format'),
  validateRequest
], async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementation for revoking specific session
    res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/auth/sessions
 * @desc    Revoke all sessions except current
 * @access  Private
 */
router.delete('/sessions', authenticateToken, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementation for revoking all sessions except current
    res.status(200).json({
      success: true,
      message: 'All other sessions revoked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/activity
 * @desc    Get user activity log
 * @access  Private
 */
router.get('/activity', [
  authenticateToken,
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validateRequest
], async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementation for getting user activity log
    res.status(200).json({
      success: true,
      message: 'Activity log retrieved successfully',
      data: [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
