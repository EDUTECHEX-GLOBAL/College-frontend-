import express from 'express';
import {
    createOrUpdateEQHE,
    getEQHEByStudentId,
    uploadCertificate,
    deleteCertificate,
    getCompletionStatus,
    deleteEQHE,
    getAllEQHE,  // ← add this export to applicationLanguageController.js
} from '../controllers/applicationLanguageController.js';
import auth from '../middleware/authMiddleware.js';
import { protectProcessAdmin } from '../middleware/processAdminAuth.js';

const router = express.Router();

/* =====================================================
   ADMIN ROUTES (before auth middleware)
===================================================== */

/**
 * @route   GET /api/application/language/admin/all
 * @desc    Get all EQHE records for admin dashboard
 * @access  Private/Admin
 */
router.get('/admin/all', auth, getAllEQHE);

/**
 * @route   GET /api/application/language/process-admin/all
 * @desc    Get all EQHE records for process admin dashboard
 * @access  Private/ProcessAdmin
 */
router.get('/process-admin/all', protectProcessAdmin, getAllEQHE);

/* =====================================================
   STUDENT ROUTES
===================================================== */
router.use(auth);

/**
 * @route   POST /api/application/language/student/:studentId/eqhe
 * @desc    Create or update entrance qualification data
 * @access  Private
 */
router.post('/student/:studentId/eqhe', createOrUpdateEQHE);

/**
 * @route   GET /api/application/language/student/:studentId/eqhe
 * @desc    Get entrance qualification data by student ID
 * @access  Private
 */
router.get('/student/:studentId/eqhe', getEQHEByStudentId);

/**
 * @route   POST /api/application/language/student/:studentId/eqhe/certificate
 * @desc    Upload EQHE certificate
 * @access  Private
 */
router.post('/student/:studentId/eqhe/certificate', uploadCertificate);

/**
 * @route   DELETE /api/application/language/student/:studentId/eqhe/certificate/:certificateType
 * @desc    Delete specific certificate
 * @access  Private
 */
router.delete('/student/:studentId/eqhe/certificate/:certificateType', deleteCertificate);

/**
 * @route   GET /api/application/language/student/:studentId/eqhe/status
 * @desc    Get completion status of entrance qualification section
 * @access  Private
 */
router.get('/student/:studentId/eqhe/status', getCompletionStatus);

/**
 * @route   DELETE /api/application/language/student/:studentId/eqhe
 * @desc    Delete all entrance qualification data including files
 * @access  Private
 */
router.delete('/student/:studentId/eqhe', deleteEQHE);

export default router;