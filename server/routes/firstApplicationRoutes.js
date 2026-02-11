import express from 'express';
import {
  getOrCreateApplication,
  updateApplication,
  submitApplication,
  getApplicationById,
  getAllApplications,
  updateApplicationStatus,
  deleteApplication
} from '../controllers/firstApplicationController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Student routes
router.get('/first-application', getOrCreateApplication);
router.put('/first-application', updateApplication);
router.post('/first-application/submit', submitApplication);

// Get application by ID (both student and admin)
router.get('/applications/:id', getApplicationById);

// Admin routes only
router.get('/admin/applications', getAllApplications);
router.put('/admin/applications/:id/status', updateApplicationStatus);
router.delete('/applications/:id', deleteApplication);

export default router;