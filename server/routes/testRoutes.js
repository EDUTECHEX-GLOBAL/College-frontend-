// routes/testRoutes.js
import express from 'express';
import { 
  getTestingData, 
  updateTestingData, 
  deleteTestEntry,
  getAllTestingData,
  deleteAllTestingData
} from '../controllers/testController.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // ✅ FIXED - Using your export name

const router = express.Router();

/**
 * @route   GET /api/testing
 * @desc    Get testing data for logged-in student
 * @access  Private
 */
router.get('/', authenticateToken, getTestingData);

/**
 * @route   PUT /api/testing
 * @desc    Update testing data for logged-in student
 * @access  Private
 */
router.put('/', authenticateToken, updateTestingData);

/**
 * @route   DELETE /api/testing/:testType/:index
 * @desc    Delete specific test entry
 * @access  Private
 * @example DELETE /api/testing/actTests/0
 */
router.delete('/:testType/:index', authenticateToken, deleteTestEntry);

/**
 * @route   DELETE /api/testing
 * @desc    Delete all testing data for logged-in student
 * @access  Private
 */
router.delete('/', authenticateToken, deleteAllTestingData);

/**
 * @route   GET /api/testing/all
 * @desc    Get all testing data (Admin only)
 * @access  Private/Admin
 */
router.get('/all', authenticateToken, getAllTestingData);

export default router;
