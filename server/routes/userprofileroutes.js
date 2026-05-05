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

import BachelorsUniversity from '../models/bachelorsUniversityModel.js';
import MastersUniversity   from '../models/mastersUniversityModel.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TEST
// ─────────────────────────────────────────────────────────────────────────────
router.get('/test', (_req, res) => {
  res.json({
    success:   true,
    message:   '✅ User profile routes are working',
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
// UNIVERSITIES  —  student-safe endpoint
//
// GET /api/user/universities?stream=UG|PG
//
// stream=UG  → BachelorsUniversity only  (student chose UG / eligibleProgram=Bachelor)
// stream=PG  → MastersUniversity only    (student chose PG / eligibleProgram=Master|PhD)
// (no param) → both collections          (fallback / admin use)
//
// We intentionally removed GUSUniversity from here.
// Only Bachelor and Master university data is shown to students.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/universities', authenticateToken, async (req, res) => {
  try {
    const stream = (req.query.stream || '').toUpperCase(); // 'PG' | 'UG' | ''
    const limit  = Math.min(500, parseInt(req.query.limit) || 200);

    // Decide which collection(s) to query
    const fetchBachelors = !stream || stream === 'UG';
    const fetchMasters   = !stream || stream === 'PG';

    const [bachResult, mastResult] = await Promise.allSettled([
      fetchBachelors
        ? BachelorsUniversity.find({ isActive: true }).limit(limit).lean()
        : Promise.resolve([]),

      fetchMasters
        ? MastersUniversity.find({ isActive: true }).limit(limit).lean()
        : Promise.resolve([]),
    ]);

    const bachUnis = bachResult.status === 'fulfilled' ? bachResult.value : [];
    const mastUnis = mastResult.status === 'fulfilled' ? mastResult.value : [];

    if (bachResult.status === 'rejected')
      console.warn('⚠️  BachelorsUniversity query failed:', bachResult.reason?.message);
    if (mastResult.status === 'rejected')
      console.warn('⚠️  MastersUniversity query failed:', mastResult.reason?.message);

    // Tag each record so the frontend knows which type it is
    const taggedBach = bachUnis.map(u => ({ ...u, universityType: 'Bachelor', _source: 'bachelors' }));
    const taggedMast = mastUnis.map(u => ({ ...u, universityType: 'Master',   _source: 'masters'   }));

    // Combined list — UG first, then PG
    const all = [...taggedBach, ...taggedMast];

    console.log(
      `✅ /api/admin/universities[stream=${stream || 'ALL'}]` +
      ` — bachelors: ${bachUnis.length}, masters: ${mastUnis.length}, total: ${all.length}`
    );

    return res.status(200).json({
      success: true,
      stream:  stream || 'ALL',
      data: {
        bachelors: taggedBach,
        masters:   taggedMast,
        all,            // convenience: single flat array
      },
      counts: {
        bachelors: bachUnis.length,
        masters:   mastUnis.length,
        total:     all.length,
      },
    });
  } catch (error) {
    console.error('❌ Error in GET /api/admin/universities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch universities',
      error:   error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// COURSES for a specific university
// GET /api/user/universities/:universityId/courses?type=Bachelor|Master
// ─────────────────────────────────────────────────────────────────────────────
router.get('/universities/:universityId/courses', authenticateToken, async (req, res) => {
  try {
    const { universityId } = req.params;
    const type = req.query.type; // 'Bachelor' | 'Master'

    if (!universityId)
      return res.status(400).json({ success: false, message: 'universityId is required' });

    let university = null;

    // Search based on type hint, or try both
    if (!type || type === 'Bachelor') {
      university =
        await BachelorsUniversity.findById(universityId).lean().catch(() => null) ||
        await BachelorsUniversity.findOne({ UNITID: universityId }).lean().catch(() => null);
    }

    if (!university && (!type || type === 'Master')) {
      university =
        await MastersUniversity.findById(universityId).lean().catch(() => null) ||
        await MastersUniversity.findOne({ UNITID: universityId }).lean().catch(() => null);
    }

    if (!university)
      return res.status(404).json({ success: false, message: 'University not found' });

    const courses = university.programs || university.courses || [];

    return res.status(200).json({
      success:        true,
      universityId,
      universityName: university.INSTNM || university.name || '',
      universityType: type || (university._source === 'masters' ? 'Master' : 'Bachelor'),
      totalCourses:   courses.length,
      data:           courses,
    });
  } catch (error) {
    console.error('❌ Error fetching university courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error:   error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.post  ('/profile',              authenticateToken, createOrUpdateProfile);
router.get   ('/profile',              authenticateToken, getProfile);
router.get   ('/profile/courses',      authenticateToken, getProfileWithCourses);
router.get   ('/profile/status',       authenticateToken, checkProfileStatus);
router.patch ('/profile/image',        authenticateToken, updateProfileImage);
router.delete('/profile',              authenticateToken, deleteProfile);
router.get   ('/profile/email/:email', authenticateToken, getProfileByEmail);

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
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