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
  getProfilesBySegment,
  getProfileStats,
  bulkUpdateProfiles,
  getProfileWithCourses,
  getProfileForAnalytics,
  submitUniversityRequest,
} from '../controllers/userprofilecontroller.js';

import {
  getUserNotifications,
  markUserNotificationRead,
} from '../controllers/notificationController.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TEST ROUTE — no auth required
// ─────────────────────────────────────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({
    success:   true,
    message:   '✅ User profile routes are working',
    timestamp: new Date().toISOString(),
    endpoints: {
      createProfile:         'POST   /api/user/profile',
      getProfile:            'GET    /api/user/profile',
      getProfileWithCourses: 'GET    /api/user/profile/courses',
      checkStatus:           'GET    /api/user/profile/status',
      updateImage:           'PATCH  /api/user/profile/image',
      deleteProfile:         'DELETE /api/user/profile',
      getByEmail:            'GET    /api/user/profile/email/:email',
      notifications:         'GET    /api/user/notifications',
      markNotifRead:         'PATCH  /api/user/notifications/:id/read',
      universityRequest:     'POST   /api/user/university/request',
      analyticsProfile:      'GET    /api/user/analytics/profile/:userId',
      adminProfiles:         'GET    /api/user/admin/profiles',
      adminProgram:          'GET    /api/user/admin/profiles/program/:program',
      adminSegment:          'GET    /api/user/admin/profiles/segment/:segmentId',
      adminBulkUpdate:       'PUT    /api/user/admin/profiles/bulk',
      stats:                 'GET    /api/user/admin/stats',
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG AUTH ROUTE
// ─────────────────────────────────────────────────────────────────────────────
router.get('/debug-auth', authenticateToken, (req, res) => {
  console.log('🔐 Debug Auth - User ID:', req.userId);
  res.json({ success: true, message: 'Auth working', userId: req.userId, user: req.user });
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT PROFILE ROUTES
// NOTE: specific static paths (/courses, /status, /image, /email/:email)
// must all come BEFORE the catch-all profile routes to avoid Express
// matching them as dynamic segments.
// ─────────────────────────────────────────────────────────────────────────────
router.post  ('/profile',              authenticateToken, createOrUpdateProfile);
router.get   ('/profile',              authenticateToken, getProfile);
router.get   ('/profile/courses',      authenticateToken, getProfileWithCourses);
router.get   ('/profile/status',       authenticateToken, checkProfileStatus);
router.patch ('/profile/image',        authenticateToken, updateProfileImage);
router.delete('/profile',              authenticateToken, deleteProfile);
router.get   ('/profile/email/:email', authenticateToken, getProfileByEmail);

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT NOTIFICATION ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.get  ('/notifications',            authenticateToken, getUserNotifications);
router.patch('/notifications/:id/read',   authenticateToken, markUserNotificationRead);

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSITY REQUEST ROUTE
// ─────────────────────────────────────────────────────────────────────────────
router.post('/university/request', authenticateToken, submitUniversityRequest);

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS ROUTE
// GET /api/user/analytics/profile/:userId
// Used by StudentAnalytics.js expanded row to fetch a single clean profile.
// authenticateToken here — the admin dashboard sends its token in the header.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/analytics/profile/:userId', authenticateToken, getProfileForAnalytics);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin/profiles',                    authenticateToken, getAllProfiles);
router.get('/admin/profiles/program/:program',   authenticateToken, getProfilesByProgram);
router.get('/admin/profiles/segment/:segmentId', authenticateToken, getProfilesBySegment);
router.put('/admin/profiles/bulk',               authenticateToken, bulkUpdateProfiles);
router.get('/admin/stats',                       authenticateToken, getProfileStats);

export default router;