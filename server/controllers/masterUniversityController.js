// server/controllers/masterUniversityController.js
// ─────────────────────────────────────────────────────────────────────────────
// Process-Admin controller for Master University applications.
// Reads directly from the `masterpreviews` collection (MasterPreview model)
// which already aggregates all sections: personal, contact, course,
// academics, tests, documents — written by masterpreviewcontroller.js
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import MasterPreview from '../models/masterpreviewmodel.js';
import Account       from '../models/accountModel.js';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendEmailEnhanced, emailTemplates } from '../utils/sendEmail.js';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

/** Convert any id string to ObjectId safely */
const toObjectId = (id) => {
  if (!id) return null;
  const s = id.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
};

/** Safe ISO date formatter → 'YYYY-MM-DD' */
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; }
  catch { return ''; }
};

/** Reconstruct the same applicationId the student's controller generates */
const makeApplicationId = (userId) =>
  'UEG-M-' + userId.toString().slice(-10).toUpperCase();

/* ─────────────────────────────────────────────────────────────────────────────
   S3 CLIENT
───────────────────────────────────────────────────────────────────────────── */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getDynamicFileUrl = async (key) => {
  if (!key) return null;
  try {
    const command = new GetObjectCommand({
      Bucket: "ups-bucket-s3",
      Key: key,
    });
    return await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
  } catch (err) {
    console.error(`❌ Failed to generate signed URL for key "${key}":`, err.message);
    return null;
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DOCUMENT FIELDS (must match masterpreviewmodel.js + masterpreviewcontroller.js)
───────────────────────────────────────────────────────────────────────────── */
const DOC_FIELDS = [
  'passport', 'photo', 'cert10th', 'cert12th',
  'bachelorTranscript', 'bachelorDegree', 'provisionalCertificate',
  'consolidatedMarksheet', 'resumeCv', 'statementOfPurpose',
  'lettersOfRecommendation', 'englishCertificate', 'testScores', 'workExperience',
];

const DOC_LABELS = {
  passport:                'Passport / ID Proof',
  photo:                   'Passport-Size Photo',
  cert10th:                '10th Grade Certificate',
  cert12th:                '12th Grade Certificate',
  bachelorTranscript:      "Bachelor's Degree Transcript",
  bachelorDegree:          "Bachelor's Degree Certificate",
  provisionalCertificate:  'Provisional Certificate',
  consolidatedMarksheet:   'Consolidated Marksheet',
  resumeCv:                'Resume / CV',
  statementOfPurpose:      'Statement of Purpose (SOP)',
  lettersOfRecommendation: 'Letters of Recommendation',
  englishCertificate:      'English Language Proficiency',
  testScores:              'Standardized Test Scores (GRE / GMAT)',
  workExperience:          'Work Experience / Experience Letter',
};

/* ─────────────────────────────────────────────────────────────────────────────
   DOCUMENT MAPPER  (async — generates presigned S3 URLs for uploaded files)
───────────────────────────────────────────────────────────────────────────── */
const mapDocuments = async (docsObj) => {
  const result = {};
  let uploadedCount = 0;

  // Generate all signed URLs in parallel
  const urlResults = await Promise.all(
    DOC_FIELDS.map(async (field) => {
      const raw     = docsObj?.[field];
      const hasFile = !!(raw?.fileName && raw.fileName.trim() !== '');
      const fileUrl = hasFile ? await getDynamicFileUrl(raw.fileKey) : null;
      return { field, raw, hasFile, fileUrl };
    })
  );

  urlResults.forEach(({ field, raw, hasFile, fileUrl }) => {
    result[field] = {
      label:        DOC_LABELS[field] || field,
      uploaded:     hasFile,
      fileName:     hasFile ? raw.fileName                        : null,
      fileKey:      hasFile ? raw.fileKey                         : null,
      fileUrl,                                                        // ← presigned URL
      originalName: hasFile ? (raw.originalName || raw.fileName)  : null,
      uploadedAt:   hasFile ? raw.uploadedAt                      : null,
      size:         hasFile ? raw.size                            : 0,
    };
    if (hasFile) uploadedCount++;
  });

  const completionPct = Math.round((uploadedCount / DOC_FIELDS.length) * 100);
  return { fields: result, uploadedCount, totalDocs: DOC_FIELDS.length, completionPct };
};

/* ─────────────────────────────────────────────────────────────────────────────
   TEST SCORE SUMMARIZER
───────────────────────────────────────────────────────────────────────────── */
const TEST_LABELS = {
  sat: 'SAT', act: 'ACT', satSubject: 'SAT Subject',
  ap: 'AP', ib: 'IB', cambridge: 'Cambridge',
  toefl: 'TOEFL', ielts: 'IELTS', pte: 'PTE',
  duolingo: 'Duolingo', gre: 'GRE', gmat: 'GMAT',
};

const summarizeTests = (testsObj) => {
  if (!testsObj || typeof testsObj !== 'object') return { hasScores: false, summary: [], raw: {} };

  const summary = [];

  Object.entries(TEST_LABELS).forEach(([key, label]) => {
    const attempts = testsObj[key];
    if (!Array.isArray(attempts) || attempts.length === 0) return;

    attempts.forEach((attempt, idx) => {
      const scoreEntries = Object.entries(attempt)
        .filter(([k, v]) => k !== 'testDate' && k !== '_id' && v !== '' && v != null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      if (scoreEntries) {
        summary.push({
          test:     label,
          attempt:  attempts.length > 1 ? idx + 1 : null,
          testDate: attempt.testDate || '',
          scores:   scoreEntries,
        });
      }
    });

    const futureDates = testsObj[`${key}_futureDates`];
    if (Array.isArray(futureDates) && futureDates.filter(Boolean).length > 0) {
      summary.push({
        test:     label,
        attempt:  null,
        testDate: '',
        scores:   `Planned: ${futureDates.filter(Boolean).join(', ')}`,
      });
    }
  });

  return { hasScores: summary.length > 0, summary, raw: testsObj };
};

/* ─────────────────────────────────────────────────────────────────────────────
   ROW BUILDER  (async — awaits document URL generation)
───────────────────────────────────────────────────────────────────────────── */
const buildRow = async (preview, accountMap) => {
  const userId  = preview.userId?.toString() || '';
  const account = accountMap[userId] || {};

  const applicationId = makeApplicationId(userId);

  // ── Personal ──────────────────────────────────────────────────────────
  const personal    = preview.personal || {};
  const contactRaw  =
    preview.contact      ||
    preview.contactDetails ||
    preview.contactInfo    ||
    {};

  const email =
    contactRaw.emailAddress ||
    contactRaw.email        ||
    account.email           ||
    '';

  const course = preview.course || {};
  const phone  =
    contactRaw.mobileNumber ||
    contactRaw.phone        ||
    account.phone           ||
    '';

  // ── Documents (async — generates presigned URLs) ──────────────────────
  const documents = await mapDocuments(preview.documents);

  // ── Academics ─────────────────────────────────────────────────────────
  const academicsArray = Array.isArray(preview.academics) ? preview.academics : [];
  const firstAcademic  = academicsArray[0] || {};

  // ── Tests ─────────────────────────────────────────────────────────────
  const tests = summarizeTests(preview.tests);

  // ── Status / progress ─────────────────────────────────────────────────
  const appStatus = preview.applicationStatus || 'draft';

  const personalFields = [
    personal.fullName, personal.gender, personal.nationality,
    personal.passportNumber, personal.maritalStatus, personal.dateOfBirth,
  ].filter(Boolean).length;
  const personalPct = Math.round((personalFields / 6) * 100);

  const contactFields = [
    contactRaw.emailAddress,
    contactRaw.mobileNumber,
    contactRaw.city,
    contactRaw.country,
  ].filter(Boolean).length;
  const contactPct = Math.round((contactFields / 4) * 100);

  const courseFields = [
    course.preferredCourse, course.intake, course.modeOfStudy, course.universityName,
  ].filter(Boolean).length;
  const coursePct = Math.round((courseFields / 4) * 100);

  const infoPct = Math.round((personalPct + contactPct + coursePct) / 3);

  const overallPct = Math.round(
    documents.completionPct * 0.50 +
    (academicsArray.length > 0 ? 100 : 0) * 0.30 +
    infoPct * 0.20
  );

  return {
    // ── IDs ────────────────────────────────────────────────────────────
    _id:           preview._id,
    applicationId,
    studentId:     userId,

    // ── Student info ───────────────────────────────────────────────────
    studentName:    personal.fullName || (account.firstName
                      ? [account.firstName, account.lastName].filter(Boolean).join(' ')
                      : 'Unknown'),
    fullName:       personal.fullName    || '',
    email,
    phone,
    gender:         personal.gender         || '',
    dateOfBirth:    fmtDate(personal.dateOfBirth),
    nationality:    personal.nationality    || '',
    passportNumber: personal.passportNumber || '',
    maritalStatus:  personal.maritalStatus  || '',

    // ── Contact ────────────────────────────────────────────────────────
    contact: {
      emailAddress:   contactRaw.emailAddress  || contactRaw.email      || preview.email || '',
      mobileNumber:   contactRaw.mobileNumber  || contactRaw.phone      || preview.phone || '',
      alternatePhone: contactRaw.alternatePhone || '',
      addressLine1:   contactRaw.addressLine1  || contactRaw.address1   || preview.addressLine1 || '',
      addressLine2:   contactRaw.addressLine2  || contactRaw.address2   || '',
      city:           contactRaw.city          || preview.city          || '',
      state:          contactRaw.state         || '',
      postalCode:     contactRaw.postalCode    || contactRaw.zip        || '',
      country:        contactRaw.country       || '',
    },

    // ── Course ─────────────────────────────────────────────────────────
    course: {
      preferredCourse: course.preferredCourse || '',
      specialization:  course.specialization  || '',
      intake:          course.intake          || '',
      modeOfStudy:     course.modeOfStudy     || '',
      universityName:  course.universityName  || '',
      duration:        course.duration        || '',
      level:           course.level           || '',
      majorArea:       course.majorArea       || '',
    },

    // ── Academics ──────────────────────────────────────────────────────
    academics: {
      entries:           academicsArray,
      count:             academicsArray.length,
      primaryDegree:     firstAcademic.degree       || '',
      primaryField:      firstAcademic.fieldOfStudy || '',
      primaryUniversity: firstAcademic.university   || '',
      primaryCountry:    firstAcademic.country      || '',
      primaryGpa:        firstAcademic.gpa          || '',
    },

    // ── Tests ──────────────────────────────────────────────────────────
    tests,

    // ── Documents (includes presigned fileUrl per uploaded doc) ────────
    documents,

    // ── Status & progress ──────────────────────────────────────────────
    applicationStatus:    appStatus,
    isSubmitted:          appStatus === 'submitted',
    submittedAt:          fmtDate(preview.submittedAt),
    agreedToTerms:        preview.agreedToTerms || false,
    completionPercentage: overallPct,
    docsCompletionPct:    documents.completionPct,

    // ── Account ────────────────────────────────────────────────────────
    accountStatus: account.status   || '',
    role:          account.role     || '',
    joinDate:      fmtDate(account.joinDate),
    lastLogin:     account.lastLogin ? fmtDate(account.lastLogin) : '',

    createdAt: preview.createdAt,
    updatedAt: preview.updatedAt,
  };
};

/* ═════════════════════════════════════════════════════════════════════════════
   GET ALL MASTER UNIVERSITY APPLICATIONS
   GET /api/master-university/process-admin/all
   Query params: page, limit, status, search
═════════════════════════════════════════════════════════════════════════════ */
export const getMasterUniversityApplications = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const pageNum  = parseInt(page,  10);
    const limitNum = parseInt(limit, 10);
    const skip     = (pageNum - 1) * limitNum;

    // ── Build Mongo filter ─────────────────────────────────────────────
    const mongoFilter = {};
    if (status && status !== 'all') {
      if (status === 'submitted')    mongoFilter.applicationStatus = 'submitted';
      if (status === 'draft')        mongoFilter.applicationStatus = 'draft';
      if (status === 'under_review') mongoFilter.applicationStatus = 'under_review';
    }

    const [previews, total] = await Promise.all([
      MasterPreview.find(mongoFilter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MasterPreview.countDocuments(mongoFilter),
    ]);

    if (!previews.length) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page: pageNum, pages: 0, limit: limitNum },
      });
    }

    // ── Fetch matching Account docs in one query ───────────────────────
    const userObjectIds = previews.map((p) => toObjectId(p.userId)).filter(Boolean);

    const accounts = await Account
      .find({ _id: { $in: userObjectIds } })
      .select('firstName lastName email phone joinDate lastLogin status role')
      .lean();

    const accountMap = {};
    accounts.forEach((a) => { accountMap[a._id.toString()] = a; });

    // ── Build rows (async — generates presigned URLs) ──────────────────
    let data = await Promise.all(previews.map((p) => buildRow(p, accountMap)));

    // ── JS-side search filter ─────────────────────────────────────────
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((app) =>
        app.fullName?.toLowerCase().includes(q)       ||
        app.studentName?.toLowerCase().includes(q)    ||
        app.email?.toLowerCase().includes(q)          ||
        app.phone?.includes(q)                        ||
        app.applicationId?.toLowerCase().includes(q)  ||
        app.passportNumber?.toLowerCase().includes(q) ||
        app.studentId?.includes(q)
      );
    }

    // ── Completion-based status filter (non-DB statuses) ──────────────
    if (status && status !== 'all' && !['submitted', 'draft', 'under_review'].includes(status)) {
      data = data.filter((app) => {
        const pct = app.completionPercentage;
        if (status === 'completed')  return pct === 100;
        if (status === 'incomplete') return pct === 0;
        if (status === 'inprogress') return pct > 0 && pct < 100;
        return true;
      });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page:  pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });

  } catch (error) {
    console.error('❌ getMasterUniversityApplications Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Master University applications.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/* ═════════════════════════════════════════════════════════════════════════════
   GET SINGLE APPLICATION DETAIL
   GET /api/master-university/process-admin/:studentId
═════════════════════════════════════════════════════════════════════════════ */
export const getMasterUniversityApplicationById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const oid = toObjectId(studentId);

    if (!oid) {
      return res.status(400).json({ success: false, message: 'Invalid studentId format.' });
    }

    const [preview, account] = await Promise.all([
      MasterPreview.findOne({ userId: oid }).lean(),
      Account.findById(oid)
        .select('firstName lastName email phone joinDate lastLogin status role')
        .lean(),
    ]);

    if (!preview) {
      return res.status(404).json({
        success: false,
        message: 'No Master University application found for this student.',
      });
    }

    const accountMap = account ? { [studentId]: account } : {};
    const data = await buildRow(preview, accountMap);

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('❌ getMasterUniversityApplicationById Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch application detail.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/* ═════════════════════════════════════════════════════════════════════════════
   GET STATS SUMMARY
   GET /api/master-university/process-admin/stats
═════════════════════════════════════════════════════════════════════════════ */
export const getMasterUniversityStats = async (req, res) => {
  try {
    const [total, submitted, draft, underReview] = await Promise.all([
      MasterPreview.countDocuments({}),
      MasterPreview.countDocuments({ applicationStatus: 'submitted' }),
      MasterPreview.countDocuments({ applicationStatus: 'draft' }),
      MasterPreview.countDocuments({ applicationStatus: 'under_review' }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        submitted,
        draft,
        underReview,
        completed:  submitted,
        incomplete: draft,
        inProgress: underReview,
      },
    });

  } catch (error) {
    console.error('❌ getMasterUniversityStats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stats.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
/* ═════════════════════════════════════════════════════════════════════════════
   SEND DOCUMENT EMAIL
   POST /api/master-university/process-admin/send-document-email
═════════════════════════════════════════════════════════════════════════════ */
export const sendDocumentEmailToStudent = async (req, res) => {
  try {
    const {
      studentEmail,
      studentName,
      documentName,
      reason       = "other",
      adminNotes   = "",
      deadlineDays = 7,
    } = req.body;

    if (!studentEmail) {
      return res.status(400).json({ success: false, message: "studentEmail is required." });
    }
    if (!documentName) {
      return res.status(400).json({ success: false, message: "documentName is required." });
    }

    const { subject, html } = emailTemplates.documentCorrection({
      studentName:  studentName  || "Student",
      documentName: documentName,
      documentType: documentName,
      reason,
      adminNotes:   adminNotes || "",
      deadlineDays: Number(deadlineDays) || 7,
    });

    const result = await sendEmailEnhanced({ to: studentEmail, subject, html });

    if (!result.success) {
      return res.status(500).json({ success: false, message: "Failed to send email.", error: result.error });
    }

    return res.status(200).json({ success: true, message: `Email sent to ${studentEmail}`, messageId: result.messageId });

  } catch (error) {
    console.error("❌ sendDocumentEmailToStudent Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};