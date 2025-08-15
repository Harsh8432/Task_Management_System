import express from 'express';
import { auth } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Placeholder route - to be implemented
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Dashboard route - to be implemented',
    data: []
  });
});

export default router;
