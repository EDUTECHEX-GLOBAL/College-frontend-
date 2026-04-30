// controllers/admindashboardcontroller.js
// ─────────────────────────────────────────────────────────────────────────────
// Aggregates data from ALL modules for the main Admin Dashboard overview:
//   - Users (total, active, admins, inactive)
//   - University import stats (imported unis, colleges, bachelors, masters)
//   - Bachelor & Master program stats
//   - Student analytics (registrations over time, profile funnel)
// ─────────────────────────────────────────────────────────────────────────────

import University          from '../models/University.js';
import College             from '../models/College.js';
import BachelorsUniversity from '../models/bachelorsUniversityModel.js';
import MastersUniversity   from '../models/mastersUniversityModel.js';
import UserProfile         from '../models/userprofilemodel.js';
import Account             from '../models/accountModel.js';

/* ─── Helpers ─── */
const safeCount = async (model, query = {}) => {
  try { return await model.countDocuments(query); }
  catch { return 0; }
};

/* ═════════════════════════════════════════════════════════════════════════════
   GET FULL DASHBOARD OVERVIEW
   GET /api/admin/dashboard/overview
   Returns everything the main dashboard needs in ONE request:
     - userStats
     - universityStats
     - programStats
     - studentAnalytics
     - registrationTrend (last 7 days)
     - studentProfileFunnel
═════════════════════════════════════════════════════════════════════════════ */
export const getDashboardOverview = async (req, res) => {
  try {

    // ── 1. USER STATS ───────────────────────────────────────────────────────
    // Counts from Account model (your auth user store)
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      inactiveUsers,
    ] = await Promise.all([
      safeCount(Account),
      safeCount(Account, { isActive: true }),
      safeCount(Account, { role: 'admin' }),
      safeCount(Account, { isActive: false }),
    ]);

    // ── 2. UNIVERSITY STATS ─────────────────────────────────────────────────
    const [
      importedUnis,
      importedColleges,
      bachelorsUnis,
      mastersUnis,
      mastersActive,
    ] = await Promise.all([
      safeCount(University),
      safeCount(College),
      safeCount(BachelorsUniversity),
      safeCount(MastersUniversity),
      safeCount(MastersUniversity, { isActive: true }),
    ]);

    // Bach avg programs per university
    let bachAvgPrograms = 0;
    try {
      const bachAgg = await BachelorsUniversity.aggregate([
        { $group: { _id: null, avg: { $avg: '$programCount' } } },
      ]);
      bachAvgPrograms = bachAgg[0]?.avg ? parseFloat(bachAgg[0].avg.toFixed(1)) : 0;
    } catch { /* ignore */ }

    // Masters total programs
    let mastersTotalPrograms = 0;
    try {
      const masterAgg = await MastersUniversity.aggregate([
        { $group: { _id: null, total: { $sum: '$programCount' } } },
      ]);
      mastersTotalPrograms = masterAgg[0]?.total || 0;
    } catch { /* ignore */ }

    // ── 3. STUDENT ANALYTICS ────────────────────────────────────────────────
    const [
      totalStudents,
      completedProfiles,
    ] = await Promise.all([
      safeCount(UserProfile),
      safeCount(UserProfile, { profileCompleted: true }),
    ]);

    // Unique universities selected
    let uniqueUniversitiesSelected = 0;
    let totalCoursesChosen = 0;
    try {
      const [uniAgg, courseAgg] = await Promise.all([
        UserProfile.aggregate([
          { $unwind: '$selectedUniversities' },
          { $group: { _id: '$selectedUniversities.name' } },
          { $count: 'total' },
        ]),
        UserProfile.aggregate([
          { $unwind: '$selectedUniversities' },
          { $unwind: '$selectedUniversities.selectedCourses' },
          { $count: 'total' },
        ]),
      ]);
      uniqueUniversitiesSelected = uniAgg[0]?.total || 0;
      totalCoursesChosen         = courseAgg[0]?.total || 0;
    } catch { /* ignore */ }

    const completedPct = totalStudents > 0
      ? Math.round((completedProfiles / totalStudents) * 100)
      : 0;

    // ── 4. REGISTRATION TREND (last 7 days) ─────────────────────────────────
    let registrationTrend = { labels: [], data: [] };
    try {
      const days = 7;
      const now  = new Date();
      const trend = [];

      for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await UserProfile.countDocuments({
          createdAt: { $gte: dayStart, $lte: dayEnd },
        });

        trend.push({
          label: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: count,
          date:  dayStart.toISOString().split('T')[0],
        });
      }

      registrationTrend = {
        labels: trend.map(t => t.label),
        data:   trend.map(t => t.value),
        dates:  trend.map(t => t.date),
      };
    } catch { /* ignore */ }

    // ── 5. STUDENT PROFILE FUNNEL ────────────────────────────────────────────
    // Shows how many students completed each profile step
    let profileFunnel = {
      totalRegistered:       totalStudents,
      hasBasicInfo:          0,
      hasEducation:          0,
      hasSelectedUniversity: 0,
      hasSelectedCourses:    0,
      profileCompleted:      completedProfiles,
    };
    try {
      const [basicInfoCount, educationCount, uniCount, courseCount] = await Promise.all([
        UserProfile.countDocuments({ 'basicInfo.fullName': { $exists: true, $ne: '' } }),
        UserProfile.countDocuments({ 'education.field':    { $exists: true, $ne: '' } }),
        UserProfile.countDocuments({ 'selectedUniversities.0': { $exists: true } }),
        UserProfile.countDocuments({ 'selectedUniversities.0.selectedCourses.0': { $exists: true } }),
      ]);
      profileFunnel = {
        totalRegistered:       totalStudents,
        hasBasicInfo:          basicInfoCount,
        hasEducation:          educationCount,
        hasSelectedUniversity: uniCount,
        hasSelectedCourses:    courseCount,
        profileCompleted:      completedProfiles,
      };
    } catch { /* ignore */ }

    // ── 6. TODAY & THIS WEEK REGISTRATIONS ──────────────────────────────────
    let todayRegistrations = 0;
    let weekRegistrations  = 0;
    let todayPercentChange = 0;
    let weekPercentChange  = 0;
    try {
      const now       = new Date();
      const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
      const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

      const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd   = new Date(todayEnd);   yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

      const weekStart      = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0,0,0,0);
      const prevWeekStart  = new Date(weekStart); prevWeekStart.setDate(prevWeekStart.getDate() - 7);

      const [todayCount, yesterdayCount, thisWeekCount, prevWeekCount] = await Promise.all([
        UserProfile.countDocuments({ createdAt: { $gte: todayStart,    $lte: todayEnd   } }),
        UserProfile.countDocuments({ createdAt: { $gte: yesterdayStart,$lte: yesterdayEnd } }),
        UserProfile.countDocuments({ createdAt: { $gte: weekStart,     $lte: now        } }),
        UserProfile.countDocuments({ createdAt: { $gte: prevWeekStart, $lt:  weekStart  } }),
      ]);

      todayRegistrations = todayCount;
      weekRegistrations  = thisWeekCount;
      todayPercentChange = yesterdayCount > 0
        ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
        : todayCount > 0 ? 100 : 0;
      weekPercentChange  = prevWeekCount > 0
        ? Math.round(((thisWeekCount - prevWeekCount) / prevWeekCount) * 100)
        : thisWeekCount > 0 ? 100 : 0;
    } catch { /* ignore */ }

    // ── ASSEMBLE RESPONSE ────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        userStats: {
          totalUsers,
          activeUsers,
          adminUsers,
          inactiveUsers,
        },
        universityStats: {
          importedUnis,
          importedColleges,
          bachelorsUnis,
          bachAvgPrograms,
          mastersUnis,
          mastersActive,
          mastersTotalPrograms,
        },
        studentAnalytics: {
          totalStudents,
          uniqueUniversitiesSelected,
          totalCoursesChosen,
          completedPct,
          completedProfiles,
        },
        registrations: {
          todayRegistrations,
          todayPercentChange,
          weekRegistrations,
          weekPercentChange,
        },
        registrationTrend,
        profileFunnel,
      },
    });

  } catch (error) {
    console.error('❌ getDashboardOverview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard overview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/* ═════════════════════════════════════════════════════════════════════════════
   GET USER STATS ONLY
   GET /api/admin/dashboard/users
   Light endpoint for the USERS section stat cards
═════════════════════════════════════════════════════════════════════════════ */
export const getUserStats = async (req, res) => {
  try {
    const [total, active, admins, inactive] = await Promise.all([
      safeCount(Account),
      safeCount(Account, { isActive: true }),
      safeCount(Account, { role: 'admin' }),
      safeCount(Account, { isActive: false }),
    ]);

    return res.status(200).json({
      success: true,
      data: { total, active, admins, inactive },
    });
  } catch (error) {
    console.error('❌ getUserStats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═════════════════════════════════════════════════════════════════════════════
   GET UNIVERSITY OVERVIEW STATS
   GET /api/admin/dashboard/universities
   For the UNIVERSITY section stat cards
═════════════════════════════════════════════════════════════════════════════ */
export const getUniversityStats = async (req, res) => {
  try {
    const [importedUnis, importedColleges, bachelorsUnis, mastersUnis] = await Promise.all([
      safeCount(University),
      safeCount(College),
      safeCount(BachelorsUniversity),
      safeCount(MastersUniversity),
    ]);

    return res.status(200).json({
      success: true,
      data: { importedUnis, importedColleges, bachelorsUnis, mastersUnis },
    });
  } catch (error) {
    console.error('❌ getUniversityStats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═════════════════════════════════════════════════════════════════════════════
   GET PROGRAM STATS
   GET /api/admin/dashboard/programs
   For the BACHELOR'S & MASTER'S PROGRAMS section stat cards
═════════════════════════════════════════════════════════════════════════════ */
export const getProgramStats = async (req, res) => {
  try {
    const [bachTotal, mastersTotal, mastersActive] = await Promise.all([
      safeCount(BachelorsUniversity),
      safeCount(MastersUniversity),
      safeCount(MastersUniversity, { isActive: true }),
    ]);

    let bachAvgPrograms = 0;
    try {
      const agg = await BachelorsUniversity.aggregate([
        { $group: { _id: null, avg: { $avg: '$programCount' } } },
      ]);
      bachAvgPrograms = agg[0]?.avg ? parseFloat(agg[0].avg.toFixed(1)) : 0;
    } catch { /* ignore */ }

    return res.status(200).json({
      success: true,
      data: { bachTotal, bachAvgPrograms, mastersTotal, mastersActive },
    });
  } catch (error) {
    console.error('❌ getProgramStats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};