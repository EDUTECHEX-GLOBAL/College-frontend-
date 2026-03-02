// server/routes/applicationPreviewRoutes.js

import express from 'express';
import {
  getApplicationPreview,
  submitApplication,
  saveAgreedToTerms,
} from '../controllers/applicationPreviewController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// GET  /api/application/preview         → full preview with all sections
router.get('/', getApplicationPreview);

// PATCH /api/application/preview/terms  → save terms checkbox live
router.patch('/terms', saveAgreedToTerms);

// POST /api/application/preview/submit  → final submit
router.post('/submit', submitApplication);

export default router;