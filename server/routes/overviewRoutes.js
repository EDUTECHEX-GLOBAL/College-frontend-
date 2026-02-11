import express from 'express';
import {
  getOverview,
  updateSelectedCourse,
  updateFieldCompletion,
  updateCurrentStep,
  resetOverview,
  getDashboardStats
} from '../controllers/overviewController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get overview data
router.get('/', getOverview);

// Update selected course
router.post('/course', updateSelectedCourse);

// Update field completion status
router.put('/field', updateFieldCompletion);

// Update current step
router.put('/step', updateCurrentStep);

// Reset overview data
router.post('/reset', resetOverview);

// Get dashboard statistics (admin only)
router.get('/stats', getDashboardStats);

export default router;