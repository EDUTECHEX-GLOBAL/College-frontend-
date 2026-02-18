import express from 'express';
import {
    createOrUpdateEQHE,
    getEQHEByStudentId,
    uploadCertificate,
    deleteCertificate,
    getCompletionStatus,
    deleteEQHE
} from '../controllers/applicationLanguageController.js';
import auth from '../middleware/authMiddleware.js'; // Your auth middleware

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   POST /api/application/language/student/:studentId/eqhe
 * @desc    Create or update entrance qualification data
 * @access  Private
 * @body    {
 *              eqheDate: Date,
 *              eqheCity: String,
 *              eqheCountry: String (required),
 *              eqheOriginalTitle: String (required),
 *              hasAnotherEQHE: Boolean,
 *              anotherEqheDate: Date,
 *              anotherEqheCity: String,
 *              anotherEqheCountry: String,
 *              anotherEqheOriginalTitle: String
 *          }
 * @returns {Object} Success message and saved data
 */
router.post('/student/:studentId/eqhe', createOrUpdateEQHE);

/**
 * @route   GET /api/application/language/student/:studentId/eqhe
 * @desc    Get entrance qualification data by student ID
 * @access  Private
 * @returns {Object} Entrance qualification data with file URLs
 */
router.get('/student/:studentId/eqhe', getEQHEByStudentId);

/**
 * @route   POST /api/application/language/student/:studentId/eqhe/certificate
 * @desc    Upload EQHE certificate
 * @access  Private
 * @body    FormData with:
 *              - eqheCertificate: File (PDF only, max 10MB)
 *              - certificateType: String ('eqheCertificate' or 'anotherEqheCertificate')
 *              - studentId: String
 * @returns {Object} Upload success message and file details
 */
router.post('/student/:studentId/eqhe/certificate', uploadCertificate);

/**
 * @route   DELETE /api/application/language/student/:studentId/eqhe/certificate/:certificateType
 * @desc    Delete specific certificate (eqheCertificate or anotherEqheCertificate)
 * @access  Private
 * @params  certificateType: String ('eqheCertificate' or 'anotherEqheCertificate')
 * @returns {Object} Success message
 */
router.delete('/student/:studentId/eqhe/certificate/:certificateType', deleteCertificate);

/**
 * @route   GET /api/application/language/student/:studentId/eqhe/status
 * @desc    Get completion status of entrance qualification section
 * @access  Private
 * @returns {Object} Completion percentage and status
 */
router.get('/student/:studentId/eqhe/status', getCompletionStatus);

/**
 * @route   DELETE /api/application/language/student/:studentId/eqhe
 * @desc    Delete all entrance qualification data including files
 * @access  Private
 * @returns {Object} Success message
 */
router.delete('/student/:studentId/eqhe', deleteEQHE);

export default router;