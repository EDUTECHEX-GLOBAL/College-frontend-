import express from 'express';
import {
  getGeneralApplication,
  saveGeneralApplication,
  updateGeneralApplication,
  clearField,
  getAllGeneralApplications,
  deleteGeneralApplication
} from '../controllers/generalController.js';
import authMiddleware from '../middleware/authMiddleware.js'; // Changed to default import

const router = express.Router();

console.log('✅ generalRoutes.js loaded successfully');

// All routes are protected and require authentication
router.use(authMiddleware); // Use the default export

// GET /api/general/:collegeId - Get general application for specific college
router.get('/:collegeId', getGeneralApplication);

// POST /api/general/:collegeId - Create or update general application
router.post('/:collegeId', saveGeneralApplication);

// PUT /api/general/:collegeId - Update general application
router.put('/:collegeId', updateGeneralApplication);

// DELETE /api/general/:collegeId - Delete general application
router.delete('/:collegeId', deleteGeneralApplication);

// GET /api/general - Get all general applications for student
router.get('/', getAllGeneralApplications);

// DELETE /api/general/:collegeId/clear/:field - Clear specific field
router.delete('/:collegeId/clear/:field', clearField);

export default router;