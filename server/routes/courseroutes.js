import express from 'express';
import {
  getCoursesByUniversity,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  searchCourses,
  getCoursesForApplication,
  getPopularCourses,
  getRelatedCourses,
  bulkCreateCourses,
  validateStudyMode  // Add this import
} from '../controllers/coursecontroller.js';

import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes
router.get('/search', searchCourses);
router.get('/university/:universityId', getCoursesByUniversity);
router.get('/application/:universityId', getCoursesForApplication);
router.get('/popular', getPopularCourses);
router.get('/:id/related', getRelatedCourses);
router.get('/:id', getCourseById);
router.post('/validate-study-mode', validateStudyMode);  // Add this route

// Protected Routes (Admin only for create, update, delete)
router.post('/', authenticateToken, createCourse);
router.put('/:id', authenticateToken, updateCourse);
router.delete('/:id', authenticateToken, deleteCourse);
router.post('/bulk', authenticateToken, bulkCreateCourses);

export default router;