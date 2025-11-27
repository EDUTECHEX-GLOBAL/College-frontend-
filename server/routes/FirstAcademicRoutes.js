import express from 'express';
import {
  getAcademicApplication,
  saveAcademicApplication,
  updateAcademicApplication,
  clearField,
  getAllAcademicApplications,
  deleteAcademicApplication
} from '../controllers/FirstAcademicController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

console.log('✅ FirstAcademicRoutes.js loaded successfully');

// All routes are protected and require authentication
router.use(authMiddleware);

// GET /api/academics/:collegeId - Get academic application for specific college
router.get('/:collegeId', getAcademicApplication);

// POST /api/academics/:collegeId - Create or update academic application
router.post('/:collegeId', saveAcademicApplication);

// PUT /api/academics/:collegeId - Update academic application
router.put('/:collegeId', updateAcademicApplication);

// DELETE /api/academics/:collegeId - Delete academic application
router.delete('/:collegeId', deleteAcademicApplication);

// GET /api/academics - Get all academic applications for student
router.get('/', getAllAcademicApplications);

// DELETE /api/academics/:collegeId/clear/:field - Clear specific field
router.delete('/:collegeId/clear/:field', clearField);

export default router;