// routes/adminapplicationroutes.js
import express from 'express';
// CHANGE THIS LINE - Import default export
import adminApplicationController from '../controllers/adminapplicationcontroller.js'; // ✅ Correct
import { authenticateAdmin, authorize } from '../middleware/adminAuthMiddleware.js';
import adminUpload from '../middleware/adminupload.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// ============= EXISTING ROUTES =============

// GET routes
router.get('/applications', adminApplicationController.getAllApplications);
router.get('/applications/archived', adminApplicationController.getArchivedApplications);
router.get('/applications/stats', adminApplicationController.getApplicationStats);
router.get('/applications/export', adminApplicationController.exportApplications);
router.get('/applications/:id', adminApplicationController.getApplicationById);
router.get('/applications/:id/download/:docId', adminApplicationController.downloadDocument);

// ============= NEW ROUTES FOR KANSAS UNIVERSITY =============

// 1. GET all Kansas University applications (for dashboard table)
router.get('/kansas/applications', adminApplicationController.getKansasApplicationsDashboard);

// 2. GET complete application details (view button)
router.get('/applications/:id/view-details', adminApplicationController.getCompleteApplicationDetails);

// 3. Download application as PDF (download button)
router.get('/applications/:id/download-pdf', adminApplicationController.downloadApplicationPDF);

// ============= EXISTING ROUTES CONTINUED =============

// POST routes
router.post('/applications/:id/notes', adminApplicationController.addAdminNote);
router.post('/applications/:id/documents', 
  adminUpload.single('document'),
  adminApplicationController.uploadDocument
);
router.post('/applications/bulk-update', adminApplicationController.bulkUpdateApplications);

// PUT routes
router.put('/applications/:id', adminApplicationController.updateApplication);
router.put('/applications/:id/status', adminApplicationController.updateApplicationStatus);
router.put('/applications/:id/restore', adminApplicationController.restoreApplication);
router.put('/applications/:id/archive', adminApplicationController.archiveApplication);

// DELETE routes
router.delete('/applications/:id', adminApplicationController.deleteApplication);
router.delete('/applications/:id/documents/:docId', adminApplicationController.deleteDocument);

export default router;