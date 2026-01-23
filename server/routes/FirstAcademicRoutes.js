import express from 'express';
import {
  getAcademicApplication,
  saveAcademicApplication,
  updateAcademicApplication,
  clearField,
  getAllAcademicApplications,
  deleteAcademicApplication,
  getAllAcademicApplicationsForAdmin, // ✅ new admin controller
} from '../controllers/FirstAcademicController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

console.log('✅ FirstAcademicRoutes.js loaded successfully');

// Protect all routes
router.use(authMiddleware); // ✅ All routes now require valid token

// ===============================
// STUDENT ROUTES
// ===============================

// GET /api/academics/:collegeId - Get academic application for specific college
router.get('/:collegeId', getAcademicApplication);

// POST /api/academics/:collegeId - Create or update academic application
router.post('/:collegeId', saveAcademicApplication);

// PUT /api/academics/:collegeId - Update academic application
router.put('/:collegeId', updateAcademicApplication);

// DELETE /api/academics/:collegeId - Delete academic application
router.delete('/:collegeId', deleteAcademicApplication);

// DELETE /api/academics/:collegeId/clear/:field - Clear specific field
router.delete('/:collegeId/clear/:field', clearField);

// GET /api/academics - Get all academic applications for student
router.get('/', getAllAcademicApplications);

// ===============================
// ADMIN ROUTES
// ===============================

// GET /api/academics/admin/all - Get all academic applications for admin
router.get('/admin/all', authMiddleware, getAllAcademicApplicationsForAdmin);

export default router;
