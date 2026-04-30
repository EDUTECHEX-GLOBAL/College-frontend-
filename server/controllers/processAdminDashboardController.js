// controllers/processAdminDashboardController.js
// ─────────────────────────────────────────────────────────────────────────────
// Aggregates data from both GUS (Bachelor) and Master University applications
// for the Process Admin Dashboard overview.
// ─────────────────────────────────────────────────────────────────────────────

import ApplicationLanguage from '../models/ApplicationLanguageModel.js';
import MasterPreview       from '../models/masterpreviewmodel.js';
import PersonalInfo        from '../models/applicationModel.js';
import Account             from '../models/accountModel.js';
import mongoose            from 'mongoose';

/* ─── Helpers ─── */
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return ''; }
};

const toObjectId = (id) => {
  if (!id) return null;
  const s = id.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
};

const makeApplicationId = (userId) =>
  'UEG-M-' + userId.toString().slice(-10).toUpperCase();

/* ═════════════════════════════════════════════════════════════════════════════
   GET DASHBOARD STATS
   GET /api/process-admin/dashboard/stats
   Returns combined counts for both Bachelor (GUS) + Master applications
═════════════════════════════════════════════════════════════════════════════ */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      gusTotalCount,
      masterTotalCount,
      masterSubmittedCount,
      masterDraftCount,
      masterUnderReviewCount,
    ] = await Promise.all([
      ApplicationLanguage.countDocuments({}),
      MasterPreview.countDocuments({}),
      MasterPreview.countDocuments({ applicationStatus: 'submitted' }),
      MasterPreview.countDocuments({ applicationStatus: 'draft' }),
      MasterPreview.countDocuments({ applicationStatus: 'under_review' }),
    ]);

    // For GUS, calc completion from all records
    const gusRecords = await ApplicationLanguage
      .find({})
      .select('completionPercentage isCompleted')
      .lean();

    let gusCompleted  = 0;
    let gusIncomplete = 0;
    let gusInProgress = 0;

    gusRecords.forEach(({ completionPercentage: pct = 0 }) => {
      if (pct === 100)    gusCompleted++;
      else if (pct === 0) gusIncomplete++;
      else                gusInProgress++;
    });

    const totalApplications  = gusTotalCount + masterTotalCount;
    const totalPending        = gusInProgress + masterUnderReviewCount + masterDraftCount;
    const totalCompleted      = gusCompleted  + masterSubmittedCount;
    const totalIncomplete     = gusIncomplete + masterDraftCount;

    return res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        totalPending,
        totalCompleted,
        totalIncomplete,
        bachelor: {
          total:      gusTotalCount,
          completed:  gusCompleted,
          incomplete: gusIncomplete,
          inProgress: gusInProgress,
        },
        master: {
          total:       masterTotalCount,
          submitted:   masterSubmittedCount,
          draft:       masterDraftCount,
          underReview: masterUnderReviewCount,
        },
      },
    });
  } catch (error) {
    console.error('❌ getDashboardStats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/* ═════════════════════════════════════════════════════════════════════════════
   GET RECENT APPLICATIONS
   GET /api/process-admin/dashboard/recent-applications
   Returns latest 5 from Bachelor + latest 5 from Master, merged & sorted
═════════════════════════════════════════════════════════════════════════════ */
export const getRecentApplications = async (req, res) => {
  try {
    const LIMIT = 5;

    // ── Fetch latest GUS (Bachelor) records ───────────────────────────
    const gusRecords = await ApplicationLanguage
      .find({})
      .sort({ createdAt: -1 })
      .limit(LIMIT)
      .select('studentId applicationId isCompleted completionPercentage createdAt updatedAt')
      .lean();

    // ── Fetch latest Master records ───────────────────────────────────
    const masterRecords = await MasterPreview
      .find({})
      .sort({ updatedAt: -1 })
      .limit(LIMIT)
      .select('userId applicationStatus personal contact course createdAt updatedAt')
      .lean();

    // ── Resolve GUS student names from PersonalInfo / Account ─────────
    const gusStudentIds    = gusRecords.map((r) => toObjectId(r.studentId)).filter(Boolean);
    const masterUserIds    = masterRecords.map((r) => toObjectId(r.userId)).filter(Boolean);
    const allIds           = [...gusStudentIds, ...masterUserIds];

    const [personalDocs, accountDocs] = await Promise.all([
      PersonalInfo.find({ _id: { $in: allIds } })
        .select('firstName lastName email applicationStatus')
        .lean(),
      Account.find({ _id: { $in: allIds } })
        .select('firstName lastName email')
        .lean(),
    ]);

    const personalMap = {};
    personalDocs.forEach((p) => { personalMap[p._id.toString()] = p; });
    const accountMap = {};
    accountDocs.forEach((a) => { accountMap[a._id.toString()] = a; });

    const getName = (id) => {
      const sid = id?.toString() || '';
      const p   = personalMap[sid];
      const a   = accountMap[sid];
      const fn  = p?.firstName || a?.firstName || '';
      const ln  = p?.lastName  || a?.lastName  || '';
      return [fn, ln].filter(Boolean).join(' ') || 'Unknown';
    };

    // ── Map GUS records ───────────────────────────────────────────────
    const gusApps = gusRecords.map((r) => {
      const sid        = r.studentId?.toString() || '';
      const personal   = personalMap[sid] || {};
      const pct        = r.completionPercentage || 0;
      let   statusLabel = 'Pending';
      let   statusType  = 'pending';
      if (pct === 100) { statusLabel = 'Completed'; statusType = 'approved'; }
      else if (pct > 0) { statusLabel = 'In Progress'; statusType = 'review'; }

      return {
        _id:           r._id,
        applicationId: r.applicationId || '',
        studentName:   getName(sid),
        email:         personal.email  || '',
        university:    'GUS University',
        type:          'bachelor',
        program:       'Bachelor Application',
        status:        statusLabel,
        statusType,
        completionPercentage: pct,
        date:          fmtDate(r.createdAt),
        createdAt:     r.createdAt,
      };
    });

    // ── Map Master records ────────────────────────────────────────────
    const masterApps = masterRecords.map((r) => {
      const uid  = r.userId?.toString() || '';
      const contactRaw = r.contact || r.contactDetails || r.contactInfo || {};
      const email =
        contactRaw.emailAddress ||
        contactRaw.email        ||
        accountMap[uid]?.email  ||
        '';

      const appStatus  = r.applicationStatus || 'draft';
      let   statusLabel = 'Pending';
      let   statusType  = 'pending';
      if (appStatus === 'submitted')    { statusLabel = 'Submitted';   statusType = 'approved'; }
      if (appStatus === 'under_review') { statusLabel = 'In Review';   statusType = 'review'; }
      if (appStatus === 'draft')        { statusLabel = 'Pending';     statusType = 'pending'; }

      const course     = r.course || {};
      const personal   = r.personal || {};

      return {
        _id:           r._id,
        applicationId: makeApplicationId(uid),
        studentName:   personal.fullName || getName(uid),
        email,
        university:    course.universityName || 'Master University',
        type:          'master',
        program:       course.preferredCourse || 'Master Application',
        status:        statusLabel,
        statusType,
        completionPercentage: 0,
        date:          fmtDate(r.updatedAt || r.createdAt),
        createdAt:     r.updatedAt || r.createdAt,
      };
    });

    // ── Merge, sort by date desc, take top 6 ─────────────────────────
    const combined = [...gusApps, ...masterApps]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    return res.status(200).json({
      success: true,
      data:    combined,
    });

  } catch (error) {
    console.error('❌ getRecentApplications Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent applications.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};