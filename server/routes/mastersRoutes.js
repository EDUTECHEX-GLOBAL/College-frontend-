// routes/mastersRoutes.js
import express from 'express';
import {
  createUniversity,
  getUniversities,
  getUniversityById,
  getUniversityByCode,
  updateUniversity,
  deleteUniversity,
  getFeaturedUniversities,
  searchUniversities,
  bulkCreateUniversities,
  toggleUniversityStatus,
  toggleFeaturedStatus,
  getUniversitiesByCountry,
  getStats
} from '../controllers/mastersController.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // ✅ Using the same working auth

const router = express.Router();

// Public routes (no auth needed for viewing - matches Bachelors pattern)
router.get('/', getUniversities);
router.get('/featured', getFeaturedUniversities);
router.get('/search/:query', searchUniversities);
router.get('/country/:country', getUniversitiesByCountry);
router.get('/code/:code', getUniversityByCode);
router.get('/:id', getUniversityById);

// Protected routes - require authentication (matches Bachelors pattern)
router.post('/', authenticateToken, createUniversity);
router.put('/:id', authenticateToken, updateUniversity);
router.delete('/:id', authenticateToken, deleteUniversity);
router.post('/bulk', authenticateToken, bulkCreateUniversities);
router.patch('/:id/toggle-status', authenticateToken, toggleUniversityStatus);
router.patch('/:id/toggle-featured', authenticateToken, toggleFeaturedStatus);
router.get('/stats/overview', authenticateToken, getStats);

export default router;