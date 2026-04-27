// server/controllers/masterpreviewcontroller.js

import mongoose from 'mongoose';

import MasterPersonal  from '../models/masterpersonalmodel.js';
import MasterContact   from '../models/mastercontactmodel.js';
import MasterCourse    from '../models/mastercoursemodel.js';
import MasterAcademic  from '../models/masteracademicmodel.js';
import MasterTest      from '../models/mastertestmodel.js';
import MasterDocument  from '../models/masterdocumentmodel.js';
import MasterOverview  from '../models/masteroverviewmodels.js';
import MasterPreview   from '../models/masterpreviewmodel.js';
import Account         from '../models/accountModel.js';
import { sendEmailEnhanced } from '../utils/sendEmail.js';

/* ======================================================
   HELPERS — userId resolution
====================================================== */
const getRawUserId = (req) => {
  const id =
    req.userId       ||
    req.user?.userId ||
    req.user?.id     ||
    req.user?._id    ||
    '';
  console.log(`🔑 getRawUserId → "${id}"`);
  return id;
};

const resolveUserId = (rawId) => {
  if (!rawId) return null;
  const str = rawId.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(str)) {
    console.error(`resolveUserId: invalid ObjectId string: "${str}"`);
    return null;
  }
  return new mongoose.Types.ObjectId(str);
};

/* ======================================================
   STYLE CONSTANTS
====================================================== */
const C = {
  navy:      '#1e3a5f',
  blue:      '#2563eb',
  bluePale:  '#eff6ff',
  blueBdr:   '#bfdbfe',
  blueText:  '#1e40af',
  muted:     '#93c5fd',
  green:     '#16a34a',
  greenPale: '#dcfce7',
  greenText: '#166534',
  amber:     '#fde68a',
  amberPale: '#fefce8',
  amberText: '#92400e',
  amberDark: '#78350f',
  rowEven:   '#f8fafc',
  rowOdd:    '#ffffff',
  border:    '#e2e8f0',
  label:     '#374151',
  value:     '#111827',
  empty:     '#94a3b8',
  footer:    '#60a5fa',
};

/* ======================================================
   FORMATTERS
====================================================== */
const fmt = (date) => {
  if (!date) return 'Not provided';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return 'Not provided'; }
};

const safe = (val) =>
  (val && String(val).trim()) ? String(val).trim() : 'Not provided';

const makeApplicationId = (rawId) =>
  'UEG-M-' + rawId.toString().slice(-10).toUpperCase();

const buildStudentName = (personal) =>
  (personal?.fullName || '').trim() || 'Applicant';

/* ======================================================
   DOCUMENT FIELDS
====================================================== */
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

const formatDocuments = (documents) => {
  if (!documents) return {};
  const result = {};
  DOC_FIELDS.forEach((field) => {
    const raw = documents[field] || documents?.documents?.[field];
    if (raw?.fileName) {
      result[field] = {
        fileName:     raw.fileName,
        fileKey:      raw.fileKey      || '',
        fileUrl:      raw.fileUrl      || '',
        originalName: raw.originalName || raw.fileName,
        uploadedAt:   raw.uploadedAt   || '',
        size:         raw.size         || 0,
      };
    }
  });
  return result;
};

/* ======================================================
   MISSING FIELDS VALIDATOR
====================================================== */
const getMissingMasterFields = (personal) => {
  const missing = [];
  if (!personal?.fullName)       missing.push('Full name (Personal Information)');
  if (!personal?.dateOfBirth)    missing.push('Date of birth (Personal Information)');
  if (!personal?.gender)         missing.push('Gender (Personal Information)');
  if (!personal?.nationality)    missing.push('Nationality (Personal Information)');
  if (!personal?.passportNumber) missing.push('Passport number (Personal Information)');
  if (!personal?.maritalStatus)  missing.push('Marital status (Personal Information)');
  return missing;
};

/* ======================================================
   TEST KEYS / LABELS
====================================================== */
const TEST_LABELS = {
  sat: 'SAT', act: 'ACT', satSubject: 'SAT Subject Tests',
  ap: 'AP Subject Tests', ib: 'IB Subject Tests', cambridge: 'Cambridge Exams',
  toefl: 'TOEFL iBT', ielts: 'IELTS', pte: 'PTE Academic',
  duolingo: 'Duolingo English Test', gre: 'GRE', gmat: 'GMAT',
};

/* ======================================================
   MERGE COURSE — combines MasterCourse + MasterOverview
====================================================== */
const mergeCourseWithOverview = (course, overview) => {
  const ov = overview?.course || {};
  return {
    _id:             course?._id             || '',
    preferredCourse: course?.preferredCourse || ov.preferredCourse || '',
    specialization:  course?.specialization  || ov.majorArea       || '',
    intake:          course?.intake          || ov.intake          || '',
    modeOfStudy:     course?.modeOfStudy     || ov.modeOfStudy     || '',
    universityName:  course?.universityName  || ov.universityName  || '',
    universityId:    course?.universityId    || '',
    duration:        course?.duration        || ov.duration        || '',
    level:           course?.level           || ov.level           || '',
    majorArea:       course?.majorArea       || ov.majorArea       || '',
  };
};

/* ======================================================
   NORMALIZE CONTACT — always returns a clean object
   Never returns nulls that would overwrite DB contact data
====================================================== */
const normalizeContact = (contact) => ({
  emailAddress:   contact?.emailAddress   || '',
  mobileNumber:   contact?.mobileNumber   || '',
  alternatePhone: contact?.alternatePhone || '',
  addressLine1:   contact?.addressLine1   || '',
  addressLine2:   contact?.addressLine2   || '',
  city:           contact?.city           || '',
  state:          contact?.state          || '',
  postalCode:     contact?.postalCode     || '',
  country:        contact?.country        || '',
});

/* ======================================================
   ✅ FIX: hasContactData — checks if a contact object has
   any meaningful data worth displaying in sections/PDF.
   Prevents empty Contact Details sections from appearing.
====================================================== */
const hasContactData = (contact) => {
  if (!contact) return false;
  return !!(
    contact.emailAddress   ||
    contact.mobileNumber   ||
    contact.alternatePhone ||
    contact.addressLine1   ||
    contact.city           ||
    contact.state          ||
    contact.postalCode     ||
    contact.country
  );
};

/* ======================================================
   CORE UPSERT — writes ALL sections into masterpreviews
====================================================== */
const upsertMasterPreview = async ({
  oid,
  personal,
  contact,
  course,
  academic,
  tests,
  documents,
  applicationStatus = 'draft',
  submittedAt       = null,
  agreedToTerms     = false,
}) => {
  const academicsArray = Array.isArray(academic?.academics)
    ? academic.academics
    : Array.isArray(academic) ? academic : [];

  let testsPayload = {};
  if (tests && typeof tests === 'object') {
    // eslint-disable-next-line no-unused-vars
    const { _id, userId: _u, createdAt, updatedAt, __v, ...scores } = tests;
    testsPayload = scores;
  }

  const documentsPayload = {};
  DOC_FIELDS.forEach((field) => {
    const raw = documents?.[field] || documents?.documents?.[field];
    if (raw?.fileName) {
      documentsPayload[field] = {
        fileName:     raw.fileName,
        fileKey:      raw.fileKey      || '',
        fileUrl:      raw.fileUrl      || '',
        originalName: raw.originalName || raw.fileName,
        uploadedAt:   raw.uploadedAt   || '',
        size:         raw.size         || 0,
      };
    }
  });

  // Use normalizeContact so country and all fields are never lost
  const contactPayload = normalizeContact(contact);

  const updateFields = {
    userId: oid,
    applicationStatus,
    agreedToTerms,
    personal: {
      fullName:       personal?.fullName       || '',
      dateOfBirth:    personal?.dateOfBirth    || null,
      gender:         personal?.gender         || '',
      nationality:    personal?.nationality    || '',
      passportNumber: personal?.passportNumber || '',
      maritalStatus:  personal?.maritalStatus  || '',
    },
    contact:   contactPayload,
    course: {
      preferredCourse: course?.preferredCourse || '',
      specialization:  course?.specialization  || '',
      intake:          course?.intake          || '',
      modeOfStudy:     course?.modeOfStudy     || '',
      universityName:  course?.universityName  || '',
      universityId:    course?.universityId    || '',
      duration:        course?.duration        || '',
      level:           course?.level           || '',
      majorArea:       course?.majorArea       || '',
    },
    academics:  academicsArray,
    tests:      testsPayload,
    documents:  documentsPayload,
  };

  if (submittedAt) updateFields.submittedAt = submittedAt;

  const result = await MasterPreview.findOneAndUpdate(
    { userId: oid },
    { $set: updateFields },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(
    `✅ MasterPreview upserted → _id: ${result._id} | ` +
    `status: ${result.applicationStatus} | contact.country: "${result.contact?.country}" | userId: ${oid}`
  );
  return result;
};

/* ======================================================
   SHARED DATA LOADER
====================================================== */
const fetchAllMasterDocs = (oid) => {
  console.log(`fetchAllMasterDocs → querying all collections for userId: ${oid}`);
  return Promise.all([
    MasterPersonal.findOne({ userId: oid }).lean(),
    MasterContact.findOne({ userId: oid }).lean(),
    MasterCourse.findOne({ userId: oid }).lean(),
    MasterAcademic.findOne({ userId: oid }).lean(),
    MasterTest.findOne({ userId: oid }).lean(),
    MasterDocument.findOne({ userId: oid }).lean(),
    MasterOverview.findOne({ userId: oid }).lean(),
  ]);
};

/* ======================================================
   ACCOUNT EMAIL LOOKUP
   Tries multiple field names to handle different schemas
====================================================== */
const getLoginEmailFromAccount = async (oid) => {
  try {
    // Try Account model first
    const account = await Account.findById(oid).lean();
    if (account) {
      const email = account.email || account.emailAddress || account.loginEmail || '';
      if (email) {
        console.log(`✅ Found email from Account model: ${email}`);
        return email;
      }
    }

    // Fallback: try MasterContact for this user
    const contact = await MasterContact.findOne({ userId: oid }).lean();
    if (contact?.emailAddress) {
      console.log(`✅ Fallback email from MasterContact: ${contact.emailAddress}`);
      return contact.emailAddress;
    }

    console.warn(`⚠️ No email found for userId: ${oid}`);
    return '';
  } catch (err) {
    console.error('❌ getLoginEmailFromAccount error:', err.message);
    return '';
  }
};

/* ======================================================
   BUILD SECTIONS (for email / PDF)

   ✅ FIX 1: contact section now uses normalizeContact() so
      all fields are proper strings before being checked.
   ✅ FIX 2: contact section is only added when there is
      actual contact data (hasContactData guard).
   ✅ FIX 3: addressParts trims each part before filtering
      so empty strings don't sneak through.
====================================================== */
const buildMasterSections = ({
  personal, contact, course, academics, tests, documents,
}) => {
  const sections = [];

  if (personal) {
    sections.push({
      title: 'Personal Information',
      data: [
        { label: 'Full Name',       value: safe(personal.fullName) },
        { label: 'Date of Birth',   value: personal.dateOfBirth ? fmt(personal.dateOfBirth) : 'Not provided' },
        { label: 'Gender',          value: safe(personal.gender) },
        { label: 'Nationality',     value: safe(personal.nationality) },
        { label: 'Passport Number', value: safe(personal.passportNumber) },
        { label: 'Marital Status',  value: safe(personal.maritalStatus) },
      ],
    });
  }

  // ✅ FIX: Always normalize contact before building the section so all
  // fields are clean strings. Guard with hasContactData so we never render
  // an all-"Not provided" Contact section when contact is null/empty.
  const normalizedContactForSection = normalizeContact(contact);
  if (hasContactData(normalizedContactForSection)) {
    const addressParts = [
      normalizedContactForSection.addressLine1,
      normalizedContactForSection.addressLine2,
      normalizedContactForSection.city,
      normalizedContactForSection.state,
      normalizedContactForSection.postalCode,
      normalizedContactForSection.country,
    ].map(p => (p || '').trim()).filter(Boolean);

    sections.push({
      title: 'Contact Details',
      data: [
        { label: 'Email',           value: safe(normalizedContactForSection.emailAddress) },
        { label: 'Mobile',          value: safe(normalizedContactForSection.mobileNumber) },
        { label: 'Alternate Phone', value: safe(normalizedContactForSection.alternatePhone) },
        { label: 'Address',         value: addressParts.length ? addressParts.join(', ') : 'Not provided' },
      ],
    });
  } else {
    console.warn('⚠️ buildMasterSections: contact data is empty — Contact Details section skipped');
  }

  if (course) {
    sections.push({
      title: 'Course Selection',
      data: [
        { label: 'Preferred Course', value: safe(course.preferredCourse) },
        { label: 'Specialization',   value: safe(course.specialization) },
        { label: 'Intake',           value: safe(course.intake) },
        { label: 'Mode of Study',    value: safe(course.modeOfStudy) },
        { label: 'University',       value: safe(course.universityName) },
        { label: 'Duration',         value: safe(course.duration) },
      ],
    });
  }

  const academicEntries = Array.isArray(academics)
    ? academics : (academics?.academics || []);
  if (academicEntries.length > 0) {
    const rows = [];
    academicEntries.filter(a => a.degree).forEach((entry, i) => {
      rows.push(
        { label: `[${i + 1}] Degree`,     value: safe(entry.degree) },
        { label: `[${i + 1}] Field`,      value: safe(entry.fieldOfStudy) },
        { label: `[${i + 1}] University`, value: safe(entry.university) },
        { label: `[${i + 1}] Country`,    value: safe(entry.country) },
        { label: `[${i + 1}] Period`,     value: `${safe(entry.startDate)} – ${safe(entry.endDate)}` },
        { label: `[${i + 1}] GPA`,        value: safe(entry.gpa) },
      );
    });
    if (rows.length) sections.push({ title: 'Academic History', data: rows });
  }

  if (tests && typeof tests === 'object') {
    const testRows = [];
    Object.entries(TEST_LABELS).forEach(([key, label]) => {
      const attempts = tests[key];
      if (!Array.isArray(attempts) || attempts.length === 0) return;
      attempts.forEach((attempt, idx) => {
        const prefix = attempts.length > 1 ? `${label} – Attempt ${idx + 1}` : label;
        const scores = Object.entries(attempt)
          .filter(([k, v]) => k !== 'testDate' && k !== '_id' && v !== '' && v !== null && v !== undefined)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
        testRows.push({
          label: attempt.testDate ? `${prefix} (${attempt.testDate})` : prefix,
          value: scores || 'No scores entered',
        });
      });
      const futureDates = tests[`${key}_futureDates`];
      if (Array.isArray(futureDates) && futureDates.filter(Boolean).length > 0) {
        testRows.push({ label: `${label} – Planned`, value: futureDates.filter(Boolean).join(', ') });
      }
    });
    if (testRows.length) sections.push({ title: 'Test Scores', data: testRows });
  }

  if (documents && Object.keys(documents).length > 0) {
    const docRows = Object.entries(DOC_LABELS).map(([field, label]) => {
      const raw = documents[field];
      let value = 'Not uploaded';
      if (raw) {
        if (typeof raw === 'string' && raw.trim()) value = raw;
        else if (raw.originalName || raw.fileName) value = `✓ ${raw.originalName || raw.fileName}`;
      }
      return { label, value };
    });
    sections.push({ title: 'Uploaded Documents', data: docRows });
  }

  return sections;
};

/* ======================================================
   HTML TABLE ROWS BUILDER
====================================================== */
const buildSectionRows = (sections) =>
  sections.map((sec, si) => {
    const dataRows = sec.data.map((item, ri) => {
      const isEmpty = !item.value || item.value === 'Not provided' || item.value === 'Not uploaded';
      const bg      = ri % 2 === 0 ? C.rowEven : C.rowOdd;
      return `<tr style="background:${bg};">
        <td style="width:38%;padding:8px 16px;color:${C.label};font-weight:600;font-size:12px;border-bottom:1px solid ${C.border};border-right:1px solid ${C.border};vertical-align:top;">${item.label}</td>
        <td style="padding:8px 16px;color:${isEmpty ? C.empty : C.value};font-size:12px;border-bottom:1px solid ${C.border};vertical-align:top;">${isEmpty ? '—' : item.value}</td>
      </tr>`;
    }).join('');
    return `<tr>
      <td colspan="2" style="background:${C.navy};color:#fff;font-weight:bold;padding:11px 16px;font-size:13px;">
        <span style="display:inline-block;background:${C.blue};border-radius:50%;width:22px;height:22px;font-size:11px;font-weight:bold;margin-right:10px;vertical-align:middle;line-height:22px;text-align:center;">${si + 1}</span>${sec.title}
      </td>
    </tr>${dataRows}`;
  }).join('');

/* ======================================================
   HTML SUMMARY GENERATOR
====================================================== */
const generateApplicationHTML = (sections, applicationId, studentName) => {
  const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const generatedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const sectionRows   = buildSectionRows(sections);
  const supportEmail  = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Application Summary - ${applicationId}</title>
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.value};background:#f1f5f9;padding:24px}
    .wrapper{max-width:760px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}
    .header{background:${C.navy};color:#fff;padding:32px 40px 28px}
    .header-logo{font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px}
    .header h1{font-size:22px;font-weight:bold;margin-bottom:8px}
    .header-meta{display:flex;gap:24px;margin-top:10px;flex-wrap:wrap}
    .header-meta-item{font-size:11px;color:${C.muted}}
    .header-meta-item strong{color:#fff;display:block;font-size:12px;margin-top:2px}
    .success-badge{background:${C.greenPale};border-left:5px solid ${C.green};padding:14px 24px;margin:20px 40px;border-radius:6px;display:flex;align-items:center;gap:12px}
    .success-icon{background:${C.green};color:#fff;width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:bold;flex-shrink:0}
    .success-text{color:${C.greenText};font-weight:bold;font-size:13px}
    .app-id-card{background:${C.bluePale};border:1px solid ${C.blueBdr};border-radius:8px;padding:16px 24px;margin:0 40px 24px}
    .app-id-label{font-size:10px;color:${C.blueText};font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
    .app-id-value{font-size:26px;font-weight:bold;color:${C.navy};letter-spacing:2px}
    .app-id-hint{font-size:11px;color:#64748b;margin-top:4px}
    .content{padding:0 40px 40px}
    .section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:${C.blueText};margin:24px 0 10px}
    .data-table{width:100%;border-collapse:collapse;border:1px solid ${C.border};overflow:hidden;margin-bottom:4px}
    .next-steps{background:${C.amberPale};border:1px solid ${C.amber};border-radius:8px;padding:18px 24px;margin-top:28px}
    .next-steps h3{color:${C.amberText};font-size:13px;margin-bottom:10px}
    .next-steps ul{padding-left:18px;color:${C.amberDark};font-size:12px;line-height:2}
    .footer{background:${C.navy};color:${C.muted};text-align:center;padding:18px 40px;font-size:10px;margin-top:32px;line-height:1.8}
    .footer a{color:${C.footer}}
    @media print{body{background:#fff;padding:0}.wrapper{box-shadow:none;border-radius:0}}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">University Admissions System</div>
      <h1>Master's Programme — Application Summary</h1>
      <div class="header-meta">
        <div class="header-meta-item">Application ID<strong>${applicationId}</strong></div>
        <div class="header-meta-item">Applicant<strong>${studentName}</strong></div>
        <div class="header-meta-item">Generated<strong>${generatedDate} at ${generatedTime}</strong></div>
        <div class="header-meta-item">Status<strong style="color:#86efac;">&#10003; Submitted</strong></div>
      </div>
    </div>
    <div class="success-badge">
      <div class="success-icon">&#10003;</div>
      <div class="success-text">Application submitted successfully.</div>
    </div>
    <div class="app-id-card">
      <div class="app-id-label">Application ID</div>
      <div class="app-id-value">${applicationId}</div>
      <div class="app-id-hint">Use this ID for all future correspondence with the admissions team.</div>
    </div>
    <div class="content">
      <div class="section-label">Application Details</div>
      <table class="data-table"><tbody>${sectionRows}</tbody></table>
      <div class="next-steps">
        <h3>What happens next?</h3>
        <ul>
          <li>Our admissions team will review your application within <strong>4–6 weeks</strong>.</li>
          <li>You will be contacted by email if additional documents are required.</li>
          <li>A final decision letter will be sent to your registered email address.</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      University Admissions System &nbsp;|&nbsp; Auto-generated document &nbsp;|&nbsp; ${applicationId}<br/>
      ${supportEmail ? `For queries: <a href="mailto:${supportEmail}">${supportEmail}</a>` : ''}
    </div>
  </div>
</body>
</html>`;
};

/* ======================================================
   EMAIL BODY BUILDER
====================================================== */
const buildConfirmationEmail = ({ studentName, applicationId, sections }) => {
  const sectionRows  = buildSectionRows(sections);
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Application Submitted - ${applicationId}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:${C.value};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.navy};">
    <tr><td style="padding:32px 40px;">
      <p style="margin:0 0 4px;color:${C.muted};font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">University Admissions System</p>
      <h1 style="margin:0;color:#fff;font-size:22px;">Master's Application Submitted</h1>
      <p style="margin:6px 0 0;color:${C.muted};font-size:13px;">Your application has been received and is under review.</p>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;margin:0 auto;">
    <tr><td style="padding:28px 24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:${C.greenPale};border-left:5px solid ${C.green};border-radius:6px;margin-bottom:24px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;color:${C.greenText};font-size:15px;font-weight:bold;">
            ✓ Your application has been successfully submitted!
          </p>
        </td></tr>
      </table>
      <p style="color:${C.navy};font-size:15px;margin:0 0 8px;">Dear <strong>${studentName}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Thank you for submitting your Master's programme application.
        Your complete application summary is attached as a <strong>PDF file</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:${C.bluePale};border:1px solid ${C.blueBdr};border-radius:8px;margin-bottom:24px;">
        <tr><td style="padding:18px 24px;">
          <p style="margin:0 0 4px;color:${C.blueText};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;">Application ID</p>
          <p style="margin:0;color:${C.navy};font-size:28px;font-weight:bold;letter-spacing:2px;">${applicationId}</p>
          <p style="margin:6px 0 0;color:#64748b;font-size:12px;">Keep this ID for all future correspondence.</p>
        </td></tr>
      </table>
      <p style="margin:0 0 12px;color:${C.navy};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Application Summary</p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid ${C.border};border-radius:8px;overflow:hidden;margin-bottom:28px;">
        <tbody>${sectionRows}</tbody>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:${C.amberPale};border:1px solid ${C.amber};border-radius:8px;margin-bottom:28px;">
        <tr><td style="padding:18px 24px;">
          <p style="margin:0 0 10px;color:${C.amberText};font-weight:bold;font-size:14px;">What happens next?</p>
          <ul style="margin:0;padding-left:18px;color:${C.amberDark};font-size:13px;line-height:2;">
            <li>Our admissions team will review your application within <strong>4–6 weeks</strong>.</li>
            <li>You will be contacted if additional documents are required.</li>
            <li>A final decision letter will be sent to this email address.</li>
          </ul>
        </td></tr>
      </table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.navy};margin-top:24px;">
    <tr><td style="padding:20px 40px;text-align:center;">
      <p style="color:${C.muted};font-size:12px;margin:0;">
        University Admissions System &nbsp;|&nbsp; Automated email — please do not reply.
      </p>
      ${supportEmail
        ? `<p style="color:${C.footer};font-size:12px;margin:6px 0 0;">
             Queries: <a href="mailto:${supportEmail}" style="color:${C.footer};">${supportEmail}</a>
           </p>`
        : ''}
    </td></tr>
  </table>
</body></html>`;
};

/* ======================================================
   PDF GENERATOR (puppeteer)
====================================================== */
const generatePDFBuffer = async (htmlContent) => {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    throw new Error('puppeteer not installed. Run: npm install puppeteer');
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-extensions'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 600));

    const pdfResult = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
      preferCSSPageSize: false,
    });

    const pdfBuffer = Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult);
    if (!pdfBuffer || pdfBuffer.length < 1000)
      throw new Error(`PDF buffer too small: ${pdfBuffer?.length ?? 0} bytes`);

    console.log(`✅ PDF buffer size: ${pdfBuffer.length} bytes`);
    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

/* ======================================================
   EMAIL SENDER (non-blocking helper)

   ✅ FIX: contact is now explicitly fetched fresh from DB
   if the passed-in value is null/missing, ensuring the
   confirmation email always has contact details.
====================================================== */
const sendMasterConfirmationEmail = async ({
  loginEmail, studentName, applicationId,
  personal, contact, course, academic, tests, documents,
  oid, // ✅ NEW: pass oid so we can re-fetch contact if missing
}) => {
  if (!loginEmail) {
    console.warn('⚠️ No login email — skipping email');
    return false;
  }

  // ✅ FIX: If contact is null/empty and oid is provided, fetch it fresh
  let resolvedContact = contact;
  if (!hasContactData(normalizeContact(contact)) && oid) {
    console.warn('⚠️ sendMasterConfirmationEmail: contact is empty, re-fetching from DB...');
    try {
      resolvedContact = await MasterContact.findOne({ userId: oid }).lean();
      console.log(`✅ Re-fetched contact for email → email: "${resolvedContact?.emailAddress}" country: "${resolvedContact?.country}"`);
    } catch (fetchErr) {
      console.error('❌ Failed to re-fetch contact:', fetchErr.message);
    }
  }

  const academicEntries = Array.isArray(academic) ? academic : (academic?.academics || []);
  const sections = buildMasterSections({
    personal, contact: resolvedContact, course,
    academics: academicEntries,
    tests,
    documents: formatDocuments(documents),
  });

  const htmlSummary = generateApplicationHTML(sections, applicationId, studentName);
  const emailBody   = buildConfirmationEmail({ studentName, applicationId, sections });

  let attachments;
  try {
    const pdfBuffer = await generatePDFBuffer(htmlSummary);
    attachments = [{ filename: `Application_${applicationId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }];
    console.log('✅ PDF generated for email');
  } catch (pdfErr) {
    console.warn('⚠️ PDF failed, attaching HTML:', pdfErr.message);
    attachments = [{ filename: `Application_${applicationId}.html`, content: Buffer.from(htmlSummary, 'utf-8'), contentType: 'text/html' }];
  }

  const result = await sendEmailEnhanced({
    to: loginEmail,
    subject: `Master's Application Submitted — ${applicationId} | University Admissions`,
    html: emailBody,
    attachments,
  });

  if (result.success) console.log(`✅ Email sent to: ${loginEmail}`);
  else console.warn('⚠️ Email failed:', result.error);
  return result.success;
};

/* ======================================================
   GET /api/master-preview
====================================================== */
export const getMasterPreview = async (req, res) => {
  try {
    const rawId = getRawUserId(req);
    const oid   = resolveUserId(rawId);

    if (!oid) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    const [personal, contact, course, academic, tests, documentDoc, overview] =
      await fetchAllMasterDocs(oid);

    const documents = documentDoc?.documents || documentDoc || null;

    const normalizedPersonal = personal ? {
      _id:               personal._id,
      fullName:          personal.fullName          || '',
      dateOfBirth:       personal.dateOfBirth
                           ? new Date(personal.dateOfBirth).toISOString().split('T')[0] : '',
      gender:            personal.gender            || '',
      nationality:       personal.nationality       || '',
      passportNumber:    personal.passportNumber    || '',
      maritalStatus:     personal.maritalStatus     || '',
      applicationStatus: personal.applicationStatus || 'draft',
      submittedAt:       personal.submittedAt       || null,
    } : {};

    // Use normalizeContact — country and all fields are always preserved
    const normalizedContact = contact ? {
      _id: contact._id,
      ...normalizeContact(contact),
    } : {};

    console.log(`📋 Contact for preview → country: "${normalizedContact.country}" | email: "${normalizedContact.emailAddress}"`);

    const normalizedCourse   = mergeCourseWithOverview(course, overview);
    const academicsArray     = Array.isArray(academic?.academics) ? academic.academics : [];
    const normalizedAcademic = {
      _id:      academic?._id || '',
      academics: academicsArray,
      _isValid:  academicsArray.length > 0,
    };

    let normalizedTests = {};
    if (tests) {
      // eslint-disable-next-line no-unused-vars
      const { _id, userId: _uid, createdAt, updatedAt, __v, ...testScores } = tests;
      normalizedTests = { ...testScores, _id: _id || '' };
    }

    const formattedDocuments = formatDocuments(documents);

    // Snapshot uses already-fetched contact — no empty overwrites
    setImmediate(async () => {
      try {
        if (!personal) return;
        const currentStatus = personal.applicationStatus || 'draft';
        await upsertMasterPreview({
          oid,
          personal,
          contact,          // ← real contact doc from DB, not undefined
          course:            normalizedCourse,
          academic,
          tests,
          documents,
          applicationStatus: currentStatus === 'submitted' ? 'submitted' : 'draft',
          submittedAt:       personal.submittedAt || null,
          agreedToTerms:     personal.agreedToTerms || false,
        });
        console.log(`✅ Draft snapshot saved — userId: ${oid}`);
      } catch (snapErr) {
        console.warn('⚠️ Draft snapshot failed (non-fatal):', snapErr.message);
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        personal:    normalizedPersonal,
        contact:     normalizedContact,
        course:      normalizedCourse,
        academic:    normalizedAcademic,
        tests:       normalizedTests,
        documents:   formattedDocuments,
        declaration: false,
      },
    });
  } catch (error) {
    console.error('getMasterPreview error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching preview data.' });
  }
};

/* ======================================================
   POST /api/master-preview/submit
====================================================== */
export const submitMasterApplication = async (req, res) => {
  try {
    const { agreedToTerms } = req.body;
    const rawId = getRawUserId(req);
    const oid   = resolveUserId(rawId);

    console.log(`submitMasterApplication → rawId: ${rawId} | oid: ${oid}`);

    if (!oid) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    if (!agreedToTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to the declaration before submitting.',
      });
    }

    let personal = await MasterPersonal.findOne({ userId: oid });
    if (!personal) {
      const total  = await MasterPersonal.countDocuments({});
      const orphan = await MasterPersonal.findOne({ userId: { $ne: oid } }).lean();

      console.error(
        `❌ MasterPersonal NOT FOUND\n` +
        `  Queried oid   : ${oid}\n` +
        `  Total docs    : ${total}\n` +
        `  Orphan userId : ${orphan?.userId ?? 'NONE'}`
      );

      if (orphan) {
        const orphanOid = orphan.userId;
        console.log(`🔄 Auto-migrating data from ${orphanOid} → ${oid}`);

        const collections = [
          MasterPersonal, MasterContact, MasterCourse, MasterAcademic,
          MasterTest, MasterDocument, MasterOverview, MasterPreview,
        ];

        await Promise.all(
          collections.map(async (Model) => {
            const existsForTarget = await Model.exists({ userId: oid });
            if (existsForTarget) {
              await Model.deleteOne({ userId: orphanOid });
              console.log(`🗑️  ${Model.modelName}: orphan deleted (target already has data)`);
            } else {
              await Model.updateOne({ userId: orphanOid }, { $set: { userId: oid } });
              console.log(`✅ ${Model.modelName}: re-linked ${orphanOid} → ${oid}`);
            }
          })
        );

        personal = await MasterPersonal.findOne({ userId: oid });
        if (!personal) {
          return res.status(404).json({
            success: false,
            message: 'Auto-migration failed. Please re-save Step 1 and try again.',
          });
        }
        console.log(`✅ Auto-migration successful → userId: ${oid}`);
      } else {
        return res.status(404).json({
          success: false,
          message: 'Personal information not found. Please complete Step 1 and save before submitting.',
        });
      }
    }

    const missingFields = getMissingMasterFields(personal);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Personal information is incomplete.',
        missingFields,
      });
    }

    if (personal.applicationStatus === 'submitted') {
      const applicationId = makeApplicationId(rawId);
      return res.status(200).json({
        success:          true,
        alreadySubmitted: true,
        applicationId,
        message:          'Application was already submitted.',
      });
    }

    const [contact, course, academic, tests, documentDoc, overview] = await Promise.all([
      MasterContact.findOne({ userId: oid }).lean(),
      MasterCourse.findOne({ userId: oid }).lean(),
      MasterAcademic.findOne({ userId: oid }).lean(),
      MasterTest.findOne({ userId: oid }).lean(),
      MasterDocument.findOne({ userId: oid }).lean(),
      MasterOverview.findOne({ userId: oid }).lean(),
    ]);

    // ✅ FIX: Log contact at submission time to catch null early
    console.log(`📋 Submit contact → email: "${contact?.emailAddress}" | country: "${contact?.country}" | null: ${contact === null}`);

    const documents     = documentDoc?.documents || documentDoc || null;
    const mergedCourse  = mergeCourseWithOverview(course, overview);
    const submittedAt   = new Date();
    const applicationId = makeApplicationId(rawId);
    const studentName   = buildStudentName(personal);

    try {
      await upsertMasterPreview({
        oid,
        personal:          personal.toObject(),
        contact,
        course:            mergedCourse,
        academic,
        tests,
        documents,
        applicationStatus: 'submitted',
        submittedAt,
        agreedToTerms:     true,
      });
      console.log(`✅ MasterPreview saved | userId: ${oid} | appId: ${applicationId}`);
    } catch (upsertErr) {
      console.error('⚠️ MasterPreview upsert failed:', upsertErr.message);
    }

    personal.applicationStatus = 'submitted';
    personal.submittedAt       = submittedAt;
    personal.agreedToTerms     = true;
    await personal.save();

    console.log(`✅ Application submitted — ID: ${applicationId}`);

    // ✅ FIX: Pass oid into sendMasterConfirmationEmail so it can
    // re-fetch contact from DB if the in-memory value is null/empty.
    setImmediate(async () => {
      try {
        const loginEmail = await getLoginEmailFromAccount(oid);
        if (!loginEmail) {
          console.warn('⚠️ No email found for userId:', oid, '— skipping confirmation email');
          return;
        }
        await sendMasterConfirmationEmail({
          loginEmail, studentName, applicationId,
          personal:  personal.toObject(),
          contact,          // pass what we have
          course: mergedCourse, academic, tests, documents,
          oid,              // ✅ NEW: allow re-fetch if contact is null
        });
      } catch (e) {
        console.error('⚠️ Background email error:', e.message);
      }
    });

    return res.status(200).json({
      success:      true,
      message:      'Application submitted successfully.',
      applicationId,
      submittedAt,
      emailSent:    false,
    });

  } catch (error) {
    console.error('submitMasterApplication error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};

/* ======================================================
   POST /api/master-preview/resend-email
====================================================== */
export const resendMasterConfirmationEmail = async (req, res) => {
  try {
    const rawId = getRawUserId(req);
    const oid   = resolveUserId(rawId);
    if (!oid) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    const personal = await MasterPersonal.findOne({ userId: oid }).lean();
    if (!personal)
      return res.status(404).json({ success: false, message: 'Application not found.' });
    if (personal.applicationStatus !== 'submitted')
      return res.status(400).json({ success: false, message: 'Application not submitted yet.' });

    // Use getLoginEmailFromAccount with MasterContact fallback
    const loginEmail = await getLoginEmailFromAccount(oid);
    if (!loginEmail)
      return res.status(400).json({ success: false, message: 'No email address found on account.' });

    const [contact, course, academic, tests, documentDoc, overview] = await Promise.all([
      MasterContact.findOne({ userId: oid }).lean(),
      MasterCourse.findOne({ userId: oid }).lean(),
      MasterAcademic.findOne({ userId: oid }).lean(),
      MasterTest.findOne({ userId: oid }).lean(),
      MasterDocument.findOne({ userId: oid }).lean(),
      MasterOverview.findOne({ userId: oid }).lean(),
    ]);

    const documents     = documentDoc?.documents || documentDoc || null;
    const applicationId = makeApplicationId(rawId);
    const studentName   = buildStudentName(personal);
    const mergedCourse  = mergeCourseWithOverview(course, overview);

    const emailSent = await sendMasterConfirmationEmail({
      loginEmail, studentName, applicationId,
      personal, contact, course: mergedCourse, academic, tests, documents,
      oid, // ✅ pass oid for re-fetch safety
    });

    if (!emailSent)
      return res.status(500).json({ success: false, message: 'Failed to send email.' });

    return res.status(200).json({
      success:   true,
      message:   `Confirmation email resent to: ${loginEmail}`,
      recipient: loginEmail,
    });
  } catch (error) {
    console.error('resendMasterConfirmationEmail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend email.' });
  }
};

/* ======================================================
   GET /api/master-preview/download-pdf
====================================================== */
export const downloadMasterApplicationPDF = async (req, res) => {
  try {
    const rawId = getRawUserId(req);
    const oid   = resolveUserId(rawId);
    if (!oid) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    const [personal, contact, course, academic, tests, documentDoc, overview] =
      await fetchAllMasterDocs(oid);

    if (!personal)
      return res.status(404).json({ success: false, message: 'Application not found.' });

    const documents       = documentDoc?.documents || documentDoc || null;
    const applicationId   = makeApplicationId(rawId);
    const studentName     = buildStudentName(personal);
    const academicEntries = Array.isArray(academic?.academics) ? academic.academics : [];
    const mergedCourse    = mergeCourseWithOverview(course, overview);

    // ✅ FIX: Log contact at PDF-download time for diagnosis
    console.log(`📄 PDF download contact → email: "${contact?.emailAddress}" | country: "${contact?.country}" | null: ${contact === null}`);

    const sections = buildMasterSections({
      personal, contact, course: mergedCourse,
      academics: academicEntries, tests, documents: formatDocuments(documents),
    });
    const html = generateApplicationHTML(sections, applicationId, studentName);

    try {
      console.log('📄 Generating PDF for:', applicationId);
      const pdfBuffer = await generatePDFBuffer(html);
      console.log(`✅ PDF generated: ${pdfBuffer.length} bytes`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Application_${applicationId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).end(pdfBuffer);
    } catch (pdfErr) {
      console.warn('⚠️ PDF failed, HTML fallback:', pdfErr.message);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Application_${applicationId}.html"`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(html);
    }
  } catch (error) {
    console.error('downloadMasterApplicationPDF error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
  }
};

/* ======================================================
   GET /api/master-preview/download-html
====================================================== */
export const downloadMasterApplicationHTML = async (req, res) => {
  try {
    const rawId = getRawUserId(req);
    const oid   = resolveUserId(rawId);
    if (!oid) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    const [personal, contact, course, academic, tests, documentDoc, overview] =
      await fetchAllMasterDocs(oid);

    if (!personal)
      return res.status(404).json({ success: false, message: 'Application not found.' });

    const documents       = documentDoc?.documents || documentDoc || null;
    const applicationId   = makeApplicationId(rawId);
    const studentName     = buildStudentName(personal);
    const academicEntries = Array.isArray(academic?.academics) ? academic.academics : [];
    const mergedCourse    = mergeCourseWithOverview(course, overview);

    const sections = buildMasterSections({
      personal, contact, course: mergedCourse,
      academics: academicEntries, tests, documents: formatDocuments(documents),
    });
    const html = generateApplicationHTML(sections, applicationId, studentName);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Application_${applicationId}.html"`);
    return res.status(200).send(html);
  } catch (error) {
    console.error('downloadMasterApplicationHTML error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate HTML.' });
  }
};