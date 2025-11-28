// routes/activitiestestRoutes.js
import express from 'express';
import { getCurrentActivities, updateCurrentActivities, deleteActivities } from '../controllers/activitiestestController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/transfer/activities - Get activities data
router.get('/activities', authenticateToken, getCurrentActivities);

// PUT /api/transfer/activities - Update activities data
router.put('/activities', authenticateToken, updateCurrentActivities);

// DELETE /api/transfer/activities - Delete activities record
router.delete('/activities', authenticateToken, deleteActivities);

export default router;