// src/routes/userprofileroutes.js
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js'; // Using your existing auth middleware
import {
  createOrUpdateProfile,
  getProfile,
  getProfileByEmail,
  updateProfileImage,
  checkProfileStatus,
  deleteProfile,
  getAllProfiles,
  getProfilesByProgram,
  getProfileStats
} from '../controllers/userprofilecontroller.js';

const router = express.Router();

// Public route (no auth required for testing - remove in production)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'User profile routes are working',
    endpoints: {
      createProfile: 'POST /api/user/profile',
      getProfile: 'GET /api/user/profile',
      checkStatus: 'GET /api/user/profile/status',
      updateImage: 'PATCH /api/user/profile/image',
      deleteProfile: 'DELETE /api/user/profile',
      getByEmail: 'GET /api/user/profile/email/:email',
      adminProfiles: 'GET /api/user/admin/profiles',
      adminProgram: 'GET /api/user/admin/profiles/program/:program',
      stats: 'GET /api/user/admin/stats'
    }
  });
});

// All profile routes require authentication (except test route above)
router.use(authenticateToken);

// User profile routes
router.post('/profile', createOrUpdateProfile);
router.get('/profile', getProfile);
router.get('/profile/status', checkProfileStatus);
router.patch('/profile/image', updateProfileImage);
router.delete('/profile', deleteProfile);

// Public route (with auth) - get profile by email
router.get('/profile/email/:email', getProfileByEmail);

// Admin routes (you can add role check in controller if needed)
router.get('/admin/profiles', getAllProfiles);
router.get('/admin/profiles/program/:program', getProfilesByProgram);
router.get('/admin/stats', getProfileStats);

export default router;