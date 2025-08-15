import express from 'express';
import { auth } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Placeholder route - to be implemented
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Search route - to be implemented',
    data: []
  });
});

export default router;
