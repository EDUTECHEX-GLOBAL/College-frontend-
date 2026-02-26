import express from 'express';
import {
  getAcademicApplication,
  saveAcademicApplication,
  updateAcademicApplication,
  clearField,
  getAllAcademicApplications,
  deleteAcademicApplication,
  getAllAcademicApplicationsForAdmin,
} from '../controllers/FirstAcademicController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { protectProcessAdmin } from '../middleware/processAdminAuth.js';

const router = express.Router();

console.log('✅ FirstAcademicRoutes.js loaded successfully');

// ===============================
// DEBUG ROUTE - Test without auth
// ===============================
router.get('/test-public', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Public test route works',
    timestamp: new Date().toISOString()
  });
});

// ===============================
// DEBUG ROUTE - Test with process admin auth
// ===============================
router.get('/test-auth', protectProcessAdmin, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth working!',
    admin: req.processAdmin,
    timestamp: new Date().toISOString()
  });
});

// ===============================
// ADMIN ROUTES (placed BEFORE authMiddleware)
// ===============================

// GET /api/academics/admin/all - Get all academic applications for regular admin
router.get('/admin/all', authMiddleware, getAllAcademicApplicationsForAdmin);

// ✅ GET /api/academics/process-admin/all - Get all academic applications for process admin
router.get('/process-admin/all', protectProcessAdmin, getAllAcademicApplicationsForAdmin);

// ===============================
// STUDENT ROUTES (protected by authMiddleware)
// ===============================
router.use(authMiddleware);

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

export default router;