import express from 'express';
import {
  getApplicationPreview,
  submitApplication,
  saveAgreedToTerms,
  resendConfirmationEmail
} from '../controllers/applicationPreviewController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// GET preview
router.get('/', getApplicationPreview);

// Save terms
router.patch('/terms', saveAgreedToTerms);

// Submit application
router.post('/submit', submitApplication);

// Resend confirmation email
router.post('/resend-email', resendConfirmationEmail);

export default router;