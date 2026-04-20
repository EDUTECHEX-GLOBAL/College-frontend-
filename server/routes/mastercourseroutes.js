import express from 'express';
import {
  getMasterCourse,
  saveMasterCourse
} from '../controllers/mastercoursecontroller.js';

import authenticateToken from '../middleware/authmiddleware.js';

const router = express.Router();

// 📥 Get course data
router.get('/', authenticateToken, getMasterCourse);

// 💾 Save / Update course data
router.post('/', authenticateToken, saveMasterCourse);

export default router;