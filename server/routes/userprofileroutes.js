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

// ── University models imported directly so students can fetch them
//    without hitting admin-only routes (which always 401 for student tokens).
import GUSUniversity from '../models/GUSUniversity.js';
import BachelorsUniversity from '../models/bachelorsUniversityModel.js';
import MastersUniversity from '../models/mastersUniversityModel.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TEST ROUTE
// ─────────────────────────────────────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ User profile routes are working',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG AUTH
// ─────────────────────────────────────────────────────────────────────────────
router.get('/debug-auth', authenticateToken, (req, res) => {
  res.json({ success: true, userId: req.userId });
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT-SAFE UNIVERSITIES ENDPOINT
// GET /api/user/universities
//
// WHY THIS EXISTS:
//   The frontend was calling GET /api/admin/universities with a student token.
//   That route has admin-only auth middleware → always returns 401 for students.
//   This endpoint queries the same models directly and is protected only by
//   the regular authenticateToken middleware (student token is fine).
//
// WHAT IT RETURNS:
//   { data: { admin: [...], bachelors: [...], masters: [...] }, counts: {...} }
//   Matches the shape the fixed fetchUniversities() in UserProfile.js expects.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/universities', authenticateToken, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 100);
    const skip  = (page - 1) * limit;

    // Run all queries in parallel — if one collection fails the others still return
    const [adminResult, bachResult, mastResult] = await Promise.allSettled([

      // GUSUniversity = the collection behind /api/admin/universities
      GUSUniversity
        .find({ GUS_DATA: { $exists: true } })
        .skip(skip)
        .limit(limit)
        .lean(),

      // BachelorsUniversity = the collection behind /api/bachelors/universities
      BachelorsUniversity
        .find({ isActive: true })
        .limit(500)
        .lean(),

      // Masters universities
      MastersUniversity
        .find({ isActive: true })
        .limit(500)
        .lean(),
    ]);

    const adminUnis = adminResult.status === 'fulfilled' ? adminResult.value : [];
    const bachUnis  = bachResult.status  === 'fulfilled' ? bachResult.value  : [];
    const mastUnis  = mastResult.status  === 'fulfilled' ? mastResult.value  : [];

    // Warn in console if any query failed — server keeps running
    if (adminResult.status === 'rejected')
      console.warn('⚠️  GUSUniversity query failed:', adminResult.reason?.message);
    if (bachResult.status === 'rejected')
      console.warn('⚠️  BachelorsUniversity query failed:', bachResult.reason?.message);
    if (mastResult.status === 'rejected')
      console.warn('⚠️  MastersUniversity query failed:', mastResult.reason?.message);

    console.log(
      `✅ /api/user/universities — admin: ${adminUnis.length}, bachelors: ${bachUnis.length}, masters: ${mastUnis.length}`
    );

    return res.status(200).json({
      success: true,
      data: {
        admin:     adminUnis,
        bachelors: bachUnis,
        masters:   mastUnis,
      },
      counts: {
        admin:     adminUnis.length,
        bachelors: bachUnis.length,
        masters:   mastUnis.length,
        total:     adminUnis.length + bachUnis.length + mastUnis.length,
      },
    });
  } catch (error) {
    console.error('❌ Error in GET /api/user/universities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch universities',
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT PROFILE ROUTES
// Static sub-paths must come BEFORE bare /profile to avoid Express misrouting.
// ─────────────────────────────────────────────────────────────────────────────
router.post  ('/profile',              authenticateToken, createOrUpdateProfile);
router.get   ('/profile',              authenticateToken, getProfile);
router.get   ('/profile/courses',      authenticateToken, getProfileWithCourses);
router.get   ('/profile/status',       authenticateToken, checkProfileStatus);
router.patch ('/profile/image',        authenticateToken, updateProfileImage);
router.delete('/profile',              authenticateToken, deleteProfile);
router.get   ('/profile/email/:email', authenticateToken, getProfileByEmail);

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.get  ('/notifications',          authenticateToken, getUserNotifications);
router.patch('/notifications/:id/read', authenticateToken, markUserNotificationRead);

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSITY REQUEST
// ─────────────────────────────────────────────────────────────────────────────
router.post('/university/request', authenticateToken, submitUniversityRequest);

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
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