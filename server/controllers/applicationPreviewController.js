// server/controllers/applicationPreviewController.js

import PersonalInfo           from '../models/applicationModel.js';
import ApplicationAddress     from '../models/applicationAddressModels.js';
import ApplicationEducation   from '../models/applicationEducationModel.js';
import ApplicationLanguage    from '../models/ApplicationLanguageModel.js';
import ApplicationDocument    from '../models/applicationDocumentModel.js';
import ApplicationSpecialNeed from '../models/ApplicationSpecialNeed.js';
import Account                from '../models/accountModel.js';
import { sendEmailEnhanced }  from '../utils/sendEmail.js';

/* ======================================================
   HELPER — format date
====================================================== */
const fmt = (date) => {
  if (!date) return 'Not provided';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return 'Invalid date'; }
};

/* ======================================================
   HELPER — file display name
====================================================== */
const docLabel = (docObj) =>
  docObj?.originalName || docObj?.fileName || 'Not uploaded';

/* ======================================================
   BUILD PREVIEW SECTIONS
====================================================== */
const buildSections = ({ personal, address, education, language, documents, specialNeed }) => {
  const sections = [];

  /* ── 1. Personal Information ── */
  if (personal) {
    sections.push({
      title: 'Personal Information',
      data: [
        { label: 'Title',                   value: personal.title || 'Not provided' },
        { label: 'Full Name',               value: [personal.firstName, personal.lastName].filter(Boolean).join(' ') || 'Not provided' },
        { label: 'Date of Birth',           value: fmt(personal.dateOfBirth) },
        { label: 'Place of Birth',          value: personal.placeOfBirth || 'Not provided' },
        { label: 'Country of Birth',        value: personal.countryOfBirth || 'Not provided' },
        { label: 'Citizenship',             value: personal.citizenship || 'Not provided' },
        { label: 'Gender',                  value: personal.gender || 'Not provided' },
        { label: 'EU Citizen',              value: personal.isEUCitizen === true ? 'Yes' : personal.isEUCitizen === false ? 'No' : 'Not provided' },
        { label: 'Document Type',           value: personal.documentType || 'Not provided' },
        { label: 'Needs Visa',              value: personal.needVisa || 'Not provided' },
        { label: 'Refer a Friend',          value: personal.referFriend || 'Not provided' },
        { label: 'Email',                   value: personal.email || 'Not provided' },
        { label: 'Mobile',                  value: personal.mobile || 'Not provided' },
        { label: 'Landline',                value: personal.landline || 'Not provided' },
        { label: 'Correspondence Language', value: personal.correspondenceLanguage || 'Not provided' },
        { label: 'Passport Number',         value: personal.passportNumber || 'Not provided' },
        { label: 'Passport Issue Date',     value: fmt(personal.passportIssueDate) },
        { label: 'Passport Expiry Date',    value: fmt(personal.passportExpiryDate) },
        { label: 'Issuing Country',         value: personal.issuingCountry || 'Not provided' },
      ],
    });
  }

  /* ── 2. Address ── */
  if (address) {
    const permAddr = [
      address.careOf ? `c/o ${address.careOf}` : null,
      address.streetAndHouseNumber,
      address.city,
      address.stateProvince,
      address.country,
      address.postcode,
    ].filter(Boolean).join(', ') || 'Not provided';

    const corrAddr = address.hasDifferentCorrespondenceAddress
      ? [
          address.correspondenceCareOf ? `c/o ${address.correspondenceCareOf}` : null,
          address.correspondenceStreetAndHouseNumber,
          address.correspondenceCity,
          address.correspondenceStateProvince,
          address.correspondenceCountry,
          address.correspondencePostcode,
        ].filter(Boolean).join(', ') || 'Not provided'
      : 'Same as permanent address';

    sections.push({
      title: 'Address',
      data: [
        { label: 'Permanent Address',             value: permAddr },
        { label: 'City',                          value: address.city || 'Not provided' },
        { label: 'State / Province',              value: address.stateProvince || 'Not provided' },
        { label: 'Country',                       value: address.country || 'Not provided' },
        { label: 'Postcode',                      value: address.postcode || 'Not provided' },
        { label: 'Different Correspondence Addr', value: address.hasDifferentCorrespondenceAddress ? 'Yes' : 'No' },
        { label: 'Correspondence Address',        value: corrAddr },
        { label: 'National ID',                   value: address.nationalIdOriginalName || address.nationalIdFileName || 'Not uploaded' },
      ],
    });
  }

  /* ── 3. Entrance Qualification ── */
  if (language) {
    const rows = [
      { label: 'EQHE Country',        value: language.eqheCountry || 'Not provided' },
      { label: 'EQHE Original Title', value: language.eqheOriginalTitle || 'Not provided' },
      { label: 'EQHE Date',           value: fmt(language.eqheDate) },
      { label: 'EQHE City',           value: language.eqheCity || 'Not provided' },
      { label: 'EQHE Certificate',    value: language.eqheCertificateFileName || language.eqheCertificate || 'Not uploaded' },
      { label: 'Has Another EQHE',    value: language.hasAnotherEQHE ? 'Yes' : 'No' },
    ];
    if (language.hasAnotherEQHE) {
      rows.push(
        { label: 'Additional EQHE Country',        value: language.anotherEqheCountry || 'Not provided' },
        { label: 'Additional EQHE Original Title', value: language.anotherEqheOriginalTitle || 'Not provided' },
        { label: 'Additional EQHE Date',           value: fmt(language.anotherEqheDate) },
        { label: 'Additional EQHE City',           value: language.anotherEqheCity || 'Not provided' },
        { label: 'Additional EQHE Certificate',    value: language.anotherEqheCertificateFileName || language.anotherEqheCertificate || 'Not uploaded' },
      );
    }
    sections.push({ title: 'Entrance Qualification (EQHE)', data: rows });
  }

  /* ── 4. Higher Education ── */
  if (education) {
    const rows = [
      { label: 'Previously Enrolled at HEI',  value: education.wasEnrolled === true ? 'Yes' : education.wasEnrolled === false ? 'No' : 'Not provided' },
      { label: 'Currently Enrolled Elsewhere', value: education.isCurrentlyEnrolled === true ? 'Yes' : education.isCurrentlyEnrolled === false ? 'No' : 'Not provided' },
    ];
    if (education.educationEntries?.length > 0) {
      education.educationEntries.forEach((entry, i) => {
        rows.push(
          { label: `[Entry ${i + 1}] Country`,        value: entry.countryOfInitialRegistration || 'Not provided' },
          { label: `[Entry ${i + 1}] Semester`,       value: entry.semesterOfInitialRegistration || 'Not provided' },
          { label: `[Entry ${i + 1}] Entry Type`,     value: entry.entryType || 'Not provided' },
          { label: `[Entry ${i + 1}] Degree`,         value: entry.degree || 'Not provided' },
          { label: `[Entry ${i + 1}] Specialisation`, value: entry.specialisation || 'Not provided' },
          { label: `[Entry ${i + 1}] Study Period`,   value: entry.standardStudyPeriod || 'Not provided' },
          { label: `[Entry ${i + 1}] Institution`,    value: entry.institutionName || 'Not provided' },
          { label: `[Entry ${i + 1}] City`,           value: entry.city || 'Not provided' },
          { label: `[Entry ${i + 1}] Start Date`,     value: fmt(entry.startDate) },
          { label: `[Entry ${i + 1}] End Date`,       value: entry.isCurrentEnrollment ? 'Currently enrolled' : fmt(entry.endDate) },
          { label: `[Entry ${i + 1}] Transcript`,     value: entry.transcriptOriginalName || entry.transcriptFileName || 'Not uploaded' },
          { label: `[Entry ${i + 1}] Remarks`,        value: entry.remarks || 'None' },
        );
      });
    }
    sections.push({ title: 'Higher Education', data: rows });
  }

  /* ── 5. Supporting Documents ── */
  if (documents) {
    const certRows = [];
    ['cert9th', 'cert10th', 'cert11th', 'cert12th'].forEach((field) => {
      const labelMap = {
        cert9th:  '9th Grade Certificate',
        cert10th: '10th Grade Certificate',
        cert11th: '11th Grade Certificate',
        cert12th: '12th Grade Certificate',
      };
      let value = 'Not uploaded';
      if (documents[field]?.fileName) {
        value = documents[field].originalName || documents[field].fileName;
      } else if (documents[`${field}_expectedDate`]) {
        const [yyyy, mm] = documents[`${field}_expectedDate`].split('-');
        const monthName  = mm
          ? new Date(2000, parseInt(mm, 10) - 1).toLocaleString('en-US', { month: 'long' })
          : '';
        value = `Expected: ${monthName} ${yyyy}`.trim();
      }
      certRows.push({ label: labelMap[field], value });
    });

    sections.push({
      title: 'Supporting Documents',
      data: [
        { label: 'CV / Resume',                       value: docLabel(documents.cv) },
        { label: 'Photo',                             value: docLabel(documents.photo) },
        { label: 'Passport / ID Proof',               value: docLabel(documents.passport) },
        { label: 'High School Transcript',            value: docLabel(documents.transcript) },
        { label: 'High School Diploma / Certificate', value: docLabel(documents.diploma) },
        ...certRows,
        { label: 'Standardized Test Scores',          value: docLabel(documents.testScores) },
        { label: 'English Language Proficiency',      value: docLabel(documents.languageProficiency) },
        { label: 'Letters of Recommendation',         value: docLabel(documents.recommendationLetter) },
        { label: 'Portfolio Link',                    value: documents.portfolioLink || 'Not provided' },
      ],
    });
  }

  /* ── 6. Special Needs ── */
  if (specialNeed) {
    const rows = [
      { label: 'Has Special Needs', value: specialNeed.hasSpecialNeeds === 'yes' ? 'Yes' : specialNeed.hasSpecialNeeds === 'no' ? 'No' : 'Not provided' },
      { label: 'Description',       value: specialNeed.specialNeedsDescription || 'Not provided' },
      { label: 'Other Description', value: specialNeed.otherNeedsDescription || 'Not provided' },
      { label: 'Status',            value: specialNeed.status || 'Not provided' },
    ];
    if (specialNeed.specialNeeds?.length > 0) {
      rows.push({ label: 'Types of Special Needs', value: specialNeed.specialNeeds.join(', ') });
    }
    if (specialNeed.requiredArrangements?.length > 0) {
      rows.push({ label: 'Required Arrangements', value: specialNeed.requiredArrangements.join(', ') });
    }
    sections.push({ title: 'Special Needs / Disability', data: rows });
  }

  return sections;
};

/* ======================================================
   COMPUTE COMPLETION STATUS
====================================================== */
const computeCompletion = ({ personal, address, education, language, documents, specialNeed }) => {
  const p = personal || {};

  const personalDone = !!(
    p.firstName && p.lastName && p.dateOfBirth &&
    p.countryOfBirth && p.citizenship && p.email &&
    p.mobile && p.passportNumber && p.passportIssueDate &&
    p.passportExpiryDate && p.issuingCountry && p.correspondenceLanguage
  );

  const addressDone = !!(
    address?.streetAndHouseNumber && address?.city &&
    address?.country && address?.stateProvince && address?.postcode
  );

  const educationDone = !!(
    education?.wasEnrolled !== null && education?.wasEnrolled !== undefined &&
    education?.isCurrentlyEnrolled !== null && education?.isCurrentlyEnrolled !== undefined
  );

  const languageDone = !!(language?.eqheCountry && language?.eqheOriginalTitle);

  const CERT_FIELDS   = ['cert9th', 'cert10th', 'cert11th', 'cert12th'];
  const documentsDone = !!(
    documents &&
    documents.cv?.fileName &&
    documents.photo?.fileName &&
    documents.passport?.fileName &&
    documents.transcript?.fileName &&
    documents.diploma?.fileName &&
    CERT_FIELDS.every(f => documents[f]?.fileName || documents[`${f}_expectedDate`])
  );

  const specialNeedDone = !!(specialNeed?.hasSpecialNeeds);

  const sectionStatus = {
    personalDone,
    addressDone,
    educationDone,
    languageDone,
    documentsDone,
    specialNeedDone,
  };

  return { ...sectionStatus, overall: Object.values(sectionStatus).every(Boolean) };
};

/* ======================================================
   HELPER — missing required personal fields
====================================================== */
const getMissingPersonalFields = (personal) => {
  const missing = [];
  if (!personal?.firstName)              missing.push('First name');
  if (!personal?.lastName)               missing.push('Last name');
  if (!personal?.dateOfBirth)            missing.push('Date of birth');
  if (!personal?.countryOfBirth)         missing.push('Country of birth');
  if (!personal?.citizenship)            missing.push('Citizenship');
  if (!personal?.email)                  missing.push('Email');
  if (!personal?.mobile)                 missing.push('Mobile');
  if (!personal?.passportNumber)         missing.push('Passport number');
  if (!personal?.passportIssueDate)      missing.push('Passport issue date');
  if (!personal?.passportExpiryDate)     missing.push('Passport expiry date');
  if (!personal?.issuingCountry)         missing.push('Issuing country');
  if (!personal?.correspondenceLanguage) missing.push('Correspondence language');
  return missing;
};

/* ======================================================
   HTML SUMMARY GENERATOR
   No external dependencies — pure Node.js.
   Attached to email as .html file.
   Student opens in browser → Print → Save as PDF.
====================================================== */
const generateApplicationHTML = (sections, applicationId, studentName) => {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const sectionHTML = sections.map((section, si) => `
    <div class="section">
      <div class="section-header">
        <span class="section-num">${si + 1}</span>
        ${section.title}
      </div>
      <table class="data-table">
        ${section.data.map((item, ri) => `
          <tr class="${ri % 2 === 0 ? 'row-even' : 'row-odd'}">
            <td class="label-cell">${item.label}</td>
            <td class="value-cell ${(!item.value || item.value === 'Not provided' || item.value === 'Not uploaded') ? 'empty' : ''}">
              ${(!item.value || item.value === 'Not provided' || item.value === 'Not uploaded') ? '—' : item.value}
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Application Summary — ${applicationId}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:12px; color:#1e293b; background:#fff; }
    .header { background:#1e3a5f; color:#fff; padding:28px 40px; }
    .header h1 { font-size:20px; margin-bottom:6px; }
    .header .meta { color:#93c5fd; font-size:11px; }
    .header .applicant { color:#bfdbfe; font-size:11px; margin-top:4px; }
    .badge { background:#eff6ff; border-left:4px solid #2563eb; padding:12px 20px; margin:16px 40px; border-radius:4px; color:#1e40af; font-weight:bold; font-size:13px; }
    .content { padding:0 40px 40px; }
    .section { margin-bottom:20px; }
    .section-header { background:#1e3a5f; color:#fff; padding:8px 14px; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:10px; border-radius:4px 4px 0 0; }
    .section-num { background:#2563eb; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:10px; flex-shrink:0; }
    .data-table { width:100%; border-collapse:collapse; border:1px solid #e2e8f0; border-top:none; }
    .row-even { background:#f8fafc; }
    .row-odd  { background:#ffffff; }
    .label-cell { width:38%; padding:7px 14px; font-weight:600; color:#374151; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0; }
    .value-cell { padding:7px 14px; color:#111827; border-bottom:1px solid #e2e8f0; }
    .value-cell.empty { color:#94a3b8; }
    .footer { background:#1e3a5f; color:#93c5fd; text-align:center; padding:14px; font-size:10px; margin-top:30px; }
    @media print {
      body { font-size:11px; }
      .header,.section-header,.row-even { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>University Application Summary</h1>
    <div class="meta">Application ID: ${applicationId} &nbsp;|&nbsp; Generated: ${generatedDate}</div>
    <div class="applicant">Applicant: ${studentName}</div>
  </div>
  <div class="badge">Application Submitted Successfully</div>
  <div class="content">${sectionHTML}</div>
  <div class="footer">
    University Admissions System &nbsp;|&nbsp; Auto-generated document &nbsp;|&nbsp; ${applicationId}
  </div>
</body>
</html>`;
};

/* ======================================================
   EMAIL BODY BUILDER
====================================================== */
const buildConfirmationEmail = ({ studentName, applicationId, sections }) => {
  const sectionRows = sections.map(sec => `
    <tr>
      <td colspan="2" style="background:#1e3a5f;color:#fff;font-weight:bold;padding:10px 14px;font-size:13px;">
        ${sec.title}
      </td>
    </tr>
    ${sec.data.map((item, ri) => `
      <tr style="background:${ri % 2 === 0 ? '#f8fafc' : '#fff'};">
        <td style="padding:7px 14px;color:#374151;font-weight:600;font-size:12px;width:40%;border-bottom:1px solid #e2e8f0;">
          ${item.label}
        </td>
        <td style="padding:7px 14px;color:${(!item.value || item.value === 'Not provided' || item.value === 'Not uploaded') ? '#94a3b8' : '#111827'};font-size:12px;border-bottom:1px solid #e2e8f0;">
          ${(!item.value || item.value === 'Not provided' || item.value === 'Not uploaded') ? '—' : item.value}
        </td>
      </tr>
    `).join('')}
  `).join('');

  return `<!DOCTYPE html><html lang="en">
  <head><meta charset="UTF-8"/></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a5f;">
      <tr><td style="padding:32px 40px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Application Submitted Successfully</h1>
        <p style="color:#93c5fd;margin:6px 0 0;font-size:13px;">University Admissions System</p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;">
      <tr><td style="padding:28px 24px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#dcfce7;border-left:5px solid #16a34a;border-radius:6px;margin-bottom:24px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0;color:#166534;font-size:15px;font-weight:bold;">
              Your application is complete and has been received!
            </p>
          </td></tr>
        </table>
        <p style="color:#1e293b;font-size:15px;margin:0 0 6px;">Dear <strong>${studentName}</strong>,</p>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
          Your application has been successfully submitted. Your complete application
          summary is below and also attached to this email as an HTML file.
          Open it in any browser and use <strong>Print → Save as PDF</strong> to keep a PDF copy.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:16px 20px;">
            <span style="color:#1e40af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Application ID</span><br/>
            <span style="color:#1e3a5f;font-size:24px;font-weight:bold;letter-spacing:1px;">${applicationId}</span>
            <p style="margin:6px 0 0;color:#64748b;font-size:12px;">Keep this ID for all future correspondence.</p>
          </td></tr>
        </table>
        <p style="color:#1e293b;font-size:14px;font-weight:bold;margin:0 0 10px;">Application Summary</p>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:28px;">
          ${sectionRows}
        </table>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;margin-bottom:28px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 8px;color:#92400e;font-weight:bold;font-size:13px;">What happens next?</p>
            <ul style="margin:0;padding-left:18px;color:#78350f;font-size:13px;line-height:1.9;">
              <li>Our admissions team will review your application within <strong>4-6 weeks</strong>.</li>
              <li>You will be contacted if additional documents are required.</li>
              <li>A final decision letter will be sent to this email address.</li>
            </ul>
          </td></tr>
        </table>
        <p style="color:#64748b;font-size:13px;text-align:center;margin-bottom:28px;">
          Your application summary HTML file is attached — open in browser and Print to save as PDF.
        </p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a5f;margin-top:32px;">
      <tr><td style="padding:20px 40px;text-align:center;">
        <p style="color:#93c5fd;font-size:12px;margin:0;">
          University Admissions System &nbsp;|&nbsp; This is an automated email — please do not reply.
        </p>
        <p style="color:#60a5fa;font-size:12px;margin:6px 0 0;">
          Queries: <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}"
            style="color:#60a5fa;">${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}</a>
        </p>
      </td></tr>
    </table>
  </body></html>`;
};

/* ======================================================
   GET APPLICATION PREVIEW
   GET /api/application/preview
====================================================== */
export const getApplicationPreview = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [personal, address, education, language, documents, specialNeed] = await Promise.all([
      PersonalInfo.findById(userId).lean(),
      ApplicationAddress.findOne({ userId }).lean(),
      ApplicationEducation.findOne({ userId }).lean(),
      ApplicationLanguage.findOne({ studentId: userId.toString() }).lean(),
      ApplicationDocument.findOne({ userId }).lean(),
      ApplicationSpecialNeed.findOne({ studentId: userId }).lean(),
    ]);

    if (!personal) {
      return res.status(404).json({
        success: false,
        message: 'No application found. Please complete your personal information first.',
      });
    }

    const sections         = buildSections({ personal, address, education, language, documents, specialNeed });
    const completionStatus = computeCompletion({ personal, address, education, language, documents, specialNeed });
    const applicationId    = `UEG${userId.toString().slice(-10).toUpperCase()}`;

    return res.status(200).json({
      success: true,
      preview: {
        applicationId,
        previewDate:       new Date().toISOString(),
        agreedToTerms:     personal.agreedToTerms || false,
        applicationStatus: personal.applicationStatus || 'draft',
        sections,
        completionStatus,
      },
    });
  } catch (error) {
    console.error('❌ getApplicationPreview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch application preview.',
    });
  }
};

/* ======================================================
   SAVE AGREED TO TERMS
   PATCH /api/application/preview/terms
====================================================== */
export const saveAgreedToTerms = async (req, res) => {
  try {
    const userId     = req.user.userId;
    const { agreed } = req.body;

    if (typeof agreed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '"agreed" must be a boolean.',
      });
    }

    await PersonalInfo.findByIdAndUpdate(
      userId,
      { $set: { agreedToTerms: agreed, lastUpdated: new Date() } },
      { new: true }
    );

    return res.status(200).json({
      success:       true,
      message:       `Terms ${agreed ? 'accepted' : 'revoked'}.`,
      agreedToTerms: agreed,
    });
  } catch (error) {
    console.error('❌ saveAgreedToTerms:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save terms agreement.',
    });
  }
};

/* ======================================================
   SUBMIT APPLICATION
   POST /api/application/preview/submit
====================================================== */
export const submitApplication = async (req, res) => {
  try {
    const userId            = req.user.userId;
    const { agreedToTerms } = req.body;

    if (!agreedToTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to the terms and conditions before submitting.',
      });
    }

    /* 1. Load personal record */
    const personal = await PersonalInfo.findById(userId);
    if (!personal) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    /* 2. Validate required fields */
    const missingFields = getMissingPersonalFields(personal);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Application is incomplete.',
        missingFields,
      });
    }

    /* 3. Mark as submitted */
    personal.applicationStatus = 'submitted';
    personal.submittedAt       = new Date();
    personal.agreedToTerms     = true;
    await personal.save();

    const applicationId = `UEG${userId.toString().slice(-10).toUpperCase()}`;
    const studentName   = `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || 'Applicant';

    /* 4. Send confirmation email (non-blocking) */
    let emailSent = false;
    try {
      // Fetch the Account (login email) so we always send to the correct inbox
      const account = await Account.findById(userId).lean();

      // Send ONLY to the login/account email — not the personal info form email
      const loginEmail      = account?.email || '';
      const emailRecipients = loginEmail ? [loginEmail] : [];

      console.log(`📧 Will send confirmation to: ${loginEmail || 'NO EMAIL FOUND'}`);

      const [address, education, language, documents, specialNeed] = await Promise.all([
        ApplicationAddress.findOne({ userId }).lean(),
        ApplicationEducation.findOne({ userId }).lean(),
        ApplicationLanguage.findOne({ studentId: userId.toString() }).lean(),
        ApplicationDocument.findOne({ userId }).lean(),
        ApplicationSpecialNeed.findOne({ studentId: userId }).lean(),
      ]);

      const sections    = buildSections({
        personal: personal.toObject(),
        address, education, language, documents, specialNeed,
      });
      const htmlSummary = generateApplicationHTML(sections, applicationId, studentName);
      const emailBody   = buildConfirmationEmail({ studentName, applicationId, sections });

      if (emailRecipients.length > 0) {
        const result = await sendEmailEnhanced({
          to:      emailRecipients.join(', '),  // nodemailer accepts comma-separated list
          subject: `Application Submitted - ${applicationId}`,
          html:    emailBody,
          attachments: [
            {
              filename:    `Application_${applicationId}.html`,
              content:     Buffer.from(htmlSummary, 'utf-8'),
              contentType: 'text/html',
            },
          ],
        });

        emailSent = result.success;
        if (!result.success) {
          console.warn('⚠️  Email send failed (non-fatal):', result.error);
        } else {
          console.log(`✅ Confirmation sent to: ${emailRecipients.join(', ')}`);
        }
      }
    } catch (emailErr) {
      console.error('⚠️  Email step failed (non-fatal):', emailErr.message);
    }

    return res.status(200).json({
      success:     true,
      message:     'Application submitted successfully.',
      applicationId,
      submittedAt: personal.submittedAt,
      emailSent,
    });
  } catch (error) {
    console.error('❌ submitApplication:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application.',
    });
  }
};

/* ======================================================
   RESEND CONFIRMATION EMAIL
   POST /api/application/preview/resend-email
   Only works if application is already submitted.
====================================================== */
export const resendConfirmationEmail = async (req, res) => {
  try {
    const userId  = req.user.userId;
    const personal = await PersonalInfo.findById(userId).lean();

    if (!personal) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (personal.applicationStatus !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Application has not been submitted yet.' });
    }

    const applicationId = `UEG${userId.toString().slice(-10).toUpperCase()}`;
    const studentName   = `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || 'Applicant';

    // Send ONLY to the login/account email
    const account         = await Account.findById(userId).lean();
    const loginEmail      = account?.email || '';
    const emailRecipients = loginEmail ? [loginEmail] : [];

    if (emailRecipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid email address found.' });
    }

    const [address, education, language, documents, specialNeed] = await Promise.all([
      ApplicationAddress.findOne({ userId }).lean(),
      ApplicationEducation.findOne({ userId }).lean(),
      ApplicationLanguage.findOne({ studentId: userId.toString() }).lean(),
      ApplicationDocument.findOne({ userId }).lean(),
      ApplicationSpecialNeed.findOne({ studentId: userId }).lean(),
    ]);

    const sections    = buildSections({ personal, address, education, language, documents, specialNeed });
    const htmlSummary = generateApplicationHTML(sections, applicationId, studentName);
    const emailBody   = buildConfirmationEmail({ studentName, applicationId, sections });

    const result = await sendEmailEnhanced({
      to:      emailRecipients.join(', '),
      subject: `Application Confirmation - ${applicationId}`,
      html:    emailBody,
      attachments: [
        {
          filename:    `Application_${applicationId}.html`,
          content:     Buffer.from(htmlSummary, 'utf-8'),
          contentType: 'text/html',
        },
      ],
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error || 'Failed to send email.' });
    }

    console.log(`✅ Confirmation resent to: ${emailRecipients.join(', ')}`);

    return res.status(200).json({
      success:    true,
      message:    `Email resent to: ${emailRecipients.join(', ')}`,
      recipients: emailRecipients,
    });
  } catch (error) {
    console.error('❌ resendConfirmationEmail:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend email.' });
  }
};