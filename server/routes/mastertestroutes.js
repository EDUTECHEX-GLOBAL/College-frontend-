import express from 'express';
import {
  getMasterTest,
  saveMasterTest
} from '../controllers/mastertestcontroller.js';

import authenticateToken from '../middleware/authmiddleware.js';

const router = express.Router();

// 📥 Get test scores
router.get('/', authenticateToken, getMasterTest);

// 💾 Save / update test scores
router.post('/', authenticateToken, saveMasterTest);

export default router;