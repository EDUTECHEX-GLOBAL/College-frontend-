// routes/familytestRoutes.js   <-- Corrected comment
import express from 'express';
import { getFamilyData, updateFamilyData } from '../controllers/familytestController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/family-background
router.get('/', authenticateToken, getFamilyData);

// PUT /api/family-background
router.put('/', authenticateToken, updateFamilyData);

export default router;
