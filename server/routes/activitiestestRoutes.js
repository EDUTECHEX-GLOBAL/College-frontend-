// routes/activitiestestRoutes.js
import express from 'express';
import { getCurrentActivities, updateCurrentActivities, deleteActivities } from '../controllers/activitiestestController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/activities - Get activities data
router.get('/', authenticateToken, getCurrentActivities);

// PUT /api/activities - Update activities data
router.put('/', authenticateToken, updateCurrentActivities);

// DELETE /api/activities - Delete activities record
router.delete('/', authenticateToken, deleteActivities);

export default router;
