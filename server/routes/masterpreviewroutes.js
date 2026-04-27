// server/routes/masterpreviewroutes.js

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { protectProcessAdmin } from '../middleware/processAdminAuth.js';
import {
  getMasterPreview,
  submitMasterApplication,
  resendMasterConfirmationEmail,
  downloadMasterApplicationPDF,
  downloadMasterApplicationHTML,
} from '../controllers/masterpreviewcontroller.js';
import {
  getMasterUniversityApplications,
  getMasterUniversityApplicationById,
  getMasterUniversityStats,
} from '../controllers/masterUniversityController.js';

const router = express.Router();

console.log('✅ masterpreviewroutes.js loaded');

// ── PING ─────────────────────────────────────────────────────────────────────
router.get('/ping', (_req, res) => {
  res.json({ success: true, message: '✅ master-preview route is working' });
});

// ── PROCESS ADMIN ROUTES ─────────────────────────────────────────────────────

// GET /api/master-preview/admin/applications
router.get('/admin/applications', protectProcessAdmin, getMasterUniversityApplications);

// GET /api/master-preview/admin/applications/:id
router.get('/admin/applications/:id', protectProcessAdmin, getMasterUniversityApplicationById);

// GET /api/master-preview/admin/stats
router.get('/admin/stats', protectProcessAdmin, getMasterUniversityStats);

// ── STUDENT ROUTES (protected by authMiddleware) ──────────────────────────────

// GET  /api/master-preview
router.get('/', authMiddleware, getMasterPreview);

// POST /api/master-preview/submit
router.post('/submit', authMiddleware, submitMasterApplication);

// POST /api/master-preview/resend-email
router.post('/resend-email', authMiddleware, resendMasterConfirmationEmail);

// GET  /api/master-preview/download-pdf
router.get('/download-pdf', authMiddleware, downloadMasterApplicationPDF);

// GET  /api/master-preview/download-html
router.get('/download-html', authMiddleware, downloadMasterApplicationHTML);

export default router;