import express from 'express';
import {
  saveOrUpdateOverview,
  getOverview,
  deleteOverview
} from '../controllers/masteroverviewcontroller.js';
import authenticateToken from '../middleware/authmiddleware.js';

const router = express.Router();

// POST /api/master-overview/save
router.post('/save', authenticateToken, saveOrUpdateOverview);

// GET /api/master-overview
router.get('/', authenticateToken, getOverview);

// DELETE /api/master-overview
router.delete('/', authenticateToken, deleteOverview);

export default router;