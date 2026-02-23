// src/routes/courseroutes.js
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
  validateStudyMode
} from '../controllers/coursecontroller.js';

import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// TEST ENDPOINT (Must come before /:id routes)
// ============================================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Courses API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      getByUniversity: 'GET /api/courses/university/:universityId',
      getById: 'GET /api/courses/:id',
      search: 'GET /api/courses/search',
      popular: 'GET /api/courses/popular',
      related: 'GET /api/courses/:id/related',
      application: 'GET /api/courses/application/:universityId',
      create: 'POST /api/courses',
      update: 'PUT /api/courses/:id',
      delete: 'DELETE /api/courses/:id',
      bulkCreate: 'POST /api/courses/bulk',
      validateStudyMode: 'POST /api/courses/validate-study-mode'
    }
  });
});

// ============================================
// PUBLIC ROUTES
// ============================================

// Search routes (specific first)
router.get('/search', searchCourses);
router.get('/popular', getPopularCourses);

// University-specific routes
router.get('/university/:universityId', getCoursesByUniversity);
router.get('/application/:universityId', getCoursesForApplication);

// ID-specific routes (must come after other routes)
router.get('/:id/related', getRelatedCourses);
router.get('/:id', getCourseById);

// Validation route
router.post('/validate-study-mode', validateStudyMode);

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================
router.post('/', authenticateToken, createCourse);
router.put('/:id', authenticateToken, updateCourse);
router.delete('/:id', authenticateToken, deleteCourse);
router.post('/bulk', authenticateToken, bulkCreateCourses);

export default router;