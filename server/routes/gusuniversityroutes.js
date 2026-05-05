import express from 'express';
import {
  getGusUniversityApplications,
  getGusUniversityApplicationById,
  getGusUniversityStats,
  sendDocumentReuploadEmail,          // ← ADD THIS
} from '../controllers/gusuniversitycontroller.js';
import { protectProcessAdmin } from '../middleware/processAdminAuth.js';

const router = express.Router();

router.get('/applications',         protectProcessAdmin, getGusUniversityApplications);
router.get('/applications/:studentId', protectProcessAdmin, getGusUniversityApplicationById);
router.get('/stats',                protectProcessAdmin, getGusUniversityStats);
router.post('/send-doc-email',      protectProcessAdmin, sendDocumentReuploadEmail);  // ← ADD THIS

export default router;