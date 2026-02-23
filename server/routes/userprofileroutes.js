// src/routes/userprofileroutes.js
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
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

// PUBLIC TEST ROUTE - NO AUTH REQUIRED
router.get('/test', (req, res) => {
  console.log('✅ Test endpoint hit');
  res.json({
    success: true,
    message: '✅ User profile routes are working',
    timestamp: new Date().toISOString(),
    headers: req.headers,
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

// Debug route to check auth - requires token
router.get('/debug-auth', authenticateToken, (req, res) => {
  console.log('🔐 Debug Auth - User ID:', req.userId);
  res.json({
    success: true,
    message: 'Auth working',
    userId: req.userId,
    user: req.user
  });
});

// All profile routes require authentication
router.post('/profile', authenticateToken, createOrUpdateProfile);
router.get('/profile', authenticateToken, getProfile);
router.get('/profile/status', authenticateToken, checkProfileStatus);
router.patch('/profile/image', authenticateToken, updateProfileImage);
router.delete('/profile', authenticateToken, deleteProfile);
router.get('/profile/email/:email', authenticateToken, getProfileByEmail);

// Admin routes
router.get('/admin/profiles', authenticateToken, getAllProfiles);
router.get('/admin/profiles/program/:program', authenticateToken, getProfilesByProgram);
router.get('/admin/stats', authenticateToken, getProfileStats);

export default router;