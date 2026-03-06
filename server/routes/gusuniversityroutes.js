// routes/gusuniversityroutes.js

import express from 'express';
import {
  getGusUniversityApplications,
  getGusUniversityApplicationById,
  getGusUniversityStats,
} from '../controllers/gusuniversitycontroller.js';
import { protectProcessAdmin } from '../middleware/processAdminAuth.js';

const router = express.Router();

/* =====================================================
   GUS UNIVERSITY — PROCESS ADMIN ROUTES
   Base path (registered in server.js):
     /api/application/process-admin/gus-university
===================================================== */

/**
 * @route   GET /api/application/process-admin/gus-university/applications
 * @desc    Get all EQHE applications (joined with personal info)
 * @access  Private/ProcessAdmin
 * @query   page, limit, status ("completed"|"incomplete"|"inprogress"), search
 */
router.get(
  '/applications',
  protectProcessAdmin,
  getGusUniversityApplications
);

/**
 * @route   GET /api/application/process-admin/gus-university/applications/:studentId
 * @desc    Get single application detail by studentId
 * @access  Private/ProcessAdmin
 */
router.get(
  '/applications/:studentId',
  protectProcessAdmin,
  getGusUniversityApplicationById
);

/**
 * @route   GET /api/application/process-admin/gus-university/stats
 * @desc    Get aggregate stat counts (total, completed, incomplete, inProgress)
 * @access  Private/ProcessAdmin
 */
router.get(
  '/stats',
  protectProcessAdmin,
  getGusUniversityStats
);

export default router;