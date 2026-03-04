// server/controllers/applicationPreviewController.js

import PersonalInfo          from '../models/applicationModel.js';
import ApplicationAddress    from '../models/applicationAddressModels.js';
import ApplicationEducation  from '../models/applicationEducationModel.js';
import ApplicationLanguage   from '../models/ApplicationLanguageModel.js';
import ApplicationDocument   from '../models/applicationDocumentModel.js';
import ApplicationSpecialNeed from '../models/ApplicationSpecialNeed.js';

/* ======================================================
   HELPER: Format date → readable string
====================================================== */
const fmt = (date) => {
  if (!date) return 'Not provided';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return 'Invalid date'; }
};

/* ======================================================
   HELPER: File display name from a doc sub-object
====================================================== */
const docLabel = (docObj) =>
  docObj?.originalName || docObj?.fileName || 'Not uploaded';

/* ======================================================
   BUILD ALL PREVIEW SECTIONS
====================================================== */
const buildSections = ({ personal, address, education, language, documents, specialNeed }) => {
  const sections = [];

  /* ── 1. Personal Information ───────────────────────── */
  if (personal) {
    sections.push({
      title: 'Personal Information',
      data: [
        { label: 'Title',                     value: personal.title || 'Not provided' },
        { label: 'Full Name',                 value: [personal.firstName, personal.lastName].filter(Boolean).join(' ') || 'Not provided' },
        { label: 'Date of Birth',             value: fmt(personal.dateOfBirth) },
        { label: 'Place of Birth',            value: personal.placeOfBirth || 'Not provided' },
        { label: 'Country of Birth',          value: personal.countryOfBirth || 'Not provided' },
        { label: 'Citizenship / Nationality', value: personal.citizenship || 'Not provided' },
        { label: 'Gender',                    value: personal.gender || 'Not provided' },
        { label: 'EU Citizen',                value: personal.isEUCitizen === true ? 'Yes' : personal.isEUCitizen === false ? 'No' : 'Not provided' },
        { label: 'Document Type',             value: personal.documentType || 'Not provided' },
        { label: 'Needs Visa',                value: personal.needVisa || 'Not provided' },
        { label: 'Refer a Friend',            value: personal.referFriend || 'Not provided' },
        { label: 'Email',                     value: personal.email || 'Not provided' },
        { label: 'Mobile',                    value: personal.mobile || 'Not provided' },
        { label: 'Landline',                  value: personal.landline || 'Not provided' },
        { label: 'Correspondence Language',   value: personal.correspondenceLanguage || 'Not provided' },
        { label: 'Passport Number',           value: personal.passportNumber || 'Not provided' },
        { label: 'Passport Issue Date',       value: fmt(personal.passportIssueDate) },
        { label: 'Passport Expiry Date',      value: fmt(personal.passportExpiryDate) },
        { label: 'Issuing Country',           value: personal.issuingCountry || 'Not provided' },
      ]
    });
  }

  /* ── 2. Address ────────────────────────────────────── */
  if (address) {
    const permAddr = [
      address.careOf ? `c/o ${address.careOf}` : null,
      address.streetAndHouseNumber,
      address.city,
      address.stateProvince,
      address.country,
      address.postcode
    ].filter(Boolean).join(', ') || 'Not provided';

    const corrAddr = address.hasDifferentCorrespondenceAddress
      ? [
          address.correspondenceCareOf ? `c/o ${address.correspondenceCareOf}` : null,
          address.correspondenceStreetAndHouseNumber,
          address.correspondenceCity,
          address.correspondenceStateProvince,
          address.correspondenceCountry,
          address.correspondencePostcode
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
        { label: 'National ID',                   value: docLabel({ originalName: address.nationalIdOriginalName, fileName: address.nationalIdFileName }) },
      ]
    });
  }

  /* ── 3. Entrance Qualification (Language model) ────── */
  if (language) {
    const rows = [
      { label: 'EQHE Country',        value: language.eqheCountry || 'Not provided' },
      { label: 'EQHE Original Title', value: language.eqheOriginalTitle || 'Not provided' },
      { label: 'EQHE Date',           value: fmt(language.eqheDate) },
      { label: 'EQHE City',           value: language.eqheCity || 'Not provided' },
      { label: 'EQHE Certificate',    value: docLabel({ originalName: language.eqheCertificateFileName, fileName: language.eqheCertificate }) },
      { label: 'Has Another EQHE',    value: language.hasAnotherEQHE ? 'Yes' : 'No' },
    ];
    if (language.hasAnotherEQHE) {
      rows.push(
        { label: 'Additional EQHE Country',        value: language.anotherEqheCountry || 'Not provided' },
        { label: 'Additional EQHE Original Title', value: language.anotherEqheOriginalTitle || 'Not provided' },
        { label: 'Additional EQHE Date',           value: fmt(language.anotherEqheDate) },
        { label: 'Additional EQHE City',           value: language.anotherEqheCity || 'Not provided' },
        { label: 'Additional EQHE Certificate',    value: docLabel({ originalName: language.anotherEqheCertificateFileName, fileName: language.anotherEqheCertificate }) },
      );
    }
    sections.push({ title: 'Entrance Qualification (EQHE)', data: rows });
  }

  /* ── 4. Higher Education ───────────────────────────── */
  if (education) {
    const baseRows = [
      { label: 'Previously Enrolled at HEI',   value: education.wasEnrolled === true ? 'Yes' : education.wasEnrolled === false ? 'No' : 'Not provided' },
      { label: 'Currently Enrolled Elsewhere',  value: education.isCurrentlyEnrolled === true ? 'Yes' : education.isCurrentlyEnrolled === false ? 'No' : 'Not provided' },
    ];

    if (education.educationEntries?.length > 0) {
      education.educationEntries.forEach((entry, i) => {
        baseRows.push(
          { label: `[Entry ${i + 1}] Country of Registration`,  value: entry.countryOfInitialRegistration || 'Not provided' },
          { label: `[Entry ${i + 1}] Semester of Registration`, value: entry.semesterOfInitialRegistration || 'Not provided' },
          { label: `[Entry ${i + 1}] Entry Type`,               value: entry.entryType || 'Not provided' },
          { label: `[Entry ${i + 1}] Degree`,                   value: entry.degree || 'Not provided' },
          { label: `[Entry ${i + 1}] Specialisation`,           value: entry.specialisation || 'Not provided' },
          { label: `[Entry ${i + 1}] Study Period`,             value: entry.standardStudyPeriod || 'Not provided' },
          { label: `[Entry ${i + 1}] Institution`,              value: entry.institutionName || 'Not provided' },
          { label: `[Entry ${i + 1}] City`,                     value: entry.city || 'Not provided' },
          { label: `[Entry ${i + 1}] Start Date`,               value: fmt(entry.startDate) },
          { label: `[Entry ${i + 1}] End Date`,                 value: entry.isCurrentEnrollment ? 'Currently enrolled' : fmt(entry.endDate) },
          { label: `[Entry ${i + 1}] Transcript`,               value: docLabel({ originalName: entry.transcriptOriginalName, fileName: entry.transcriptFileName }) },
          { label: `[Entry ${i + 1}] Remarks`,                  value: entry.remarks || 'None' },
        );
      });
    }
    sections.push({ title: 'Higher Education', data: baseRows });
  }

  /* ── 5. Supporting Documents ───────────────────────────────────────────
     Field names MUST match applicationDocumentModel.js schema fields:
       cv, photo, passport, transcript, diploma,
       cert9th, cert10th, cert11th, cert12th,
       testScores, languageProficiency, recommendationLetter
  ────────────────────────────────────────────────────────────────────── */
  if (documents) {
    const certRows = [];

    // Grade certificates — show expected date if no file uploaded
    ['cert9th', 'cert10th', 'cert11th', 'cert12th'].forEach((field) => {
      const label = {
        cert9th:  '9th Grade Certificate',
        cert10th: '10th Grade Certificate',
        cert11th: '11th Grade Certificate',
        cert12th: '12th Grade Certificate',
      }[field];

      let value = 'Not uploaded';
      if (documents[field]?.fileName) {
        value = docLabel(documents[field]);
      } else if (documents[`${field}_expectedDate`]) {
        // Expected date stored as "YYYY-MM" — display as "Month YYYY"
        const [yyyy, mm] = documents[`${field}_expectedDate`].split('-');
        const monthName = mm
          ? new Date(2000, parseInt(mm, 10) - 1).toLocaleString('en-US', { month: 'long' })
          : '';
        value = `Expected: ${monthName} ${yyyy}`.trim();
      }
      certRows.push({ label, value });
    });

    sections.push({
      title: 'Supporting Documents',
      data: [
        // ── Personal ──
        { label: 'CV / Resume',                       value: docLabel(documents.cv) },
        { label: 'Photo',                             value: docLabel(documents.photo) },
        { label: 'Passport / ID Proof',               value: docLabel(documents.passport) },
        // ── Academic ──
        { label: 'High School Transcript',            value: docLabel(documents.transcript) },
        { label: 'High School Diploma / Certificate', value: docLabel(documents.diploma) },
        // ── Grade Certificates ──
        ...certRows,
        // ── Optional ──
        { label: 'Standardized Test Scores',          value: docLabel(documents.testScores) },
        { label: 'English Language Proficiency',      value: docLabel(documents.languageProficiency) },
        { label: 'Letters of Recommendation',         value: docLabel(documents.recommendationLetter) },
        // ── CV Portfolio link (if any) ──
        { label: 'Portfolio Link',                    value: documents.portfolioLink || 'Not provided' },
      ]
    });
  }

  /* ── 6. Special Needs ──────────────────────────────── */
  if (specialNeed) {
    const rows = [
      { label: 'Has Special Needs',  value: specialNeed.hasSpecialNeeds === 'yes' ? 'Yes' : specialNeed.hasSpecialNeeds === 'no' ? 'No' : 'Not provided' },
      { label: 'Description',        value: specialNeed.specialNeedsDescription || 'Not provided' },
      { label: 'Other Description',  value: specialNeed.otherNeedsDescription || 'Not provided' },
      { label: 'Status',             value: specialNeed.status || 'Not provided' },
    ];
    if (specialNeed.specialNeeds?.length > 0) {
      rows.push({ label: 'Types of Special Needs',  value: specialNeed.specialNeeds.join(', ') });
    }
    if (specialNeed.requiredArrangements?.length > 0) {
      rows.push({ label: 'Required Arrangements',   value: specialNeed.requiredArrangements.join(', ') });
    }
    sections.push({ title: 'Special Needs / Disability', data: rows });
  }

  return sections;
};

/* ======================================================
   COMPUTE COMPLETION STATUS PER SECTION
   Uses actual schema field names from applicationDocumentModel.js
====================================================== */
const computeCompletion = ({ personal, address, education, language, documents, specialNeed }) => {
  const p = personal || {};
  const personalDone = !!(
    p.firstName && p.lastName && p.dateOfBirth && p.countryOfBirth &&
    p.citizenship && p.email && p.mobile && p.passportNumber &&
    p.passportIssueDate && p.passportExpiryDate && p.issuingCountry &&
    p.correspondenceLanguage
  );

  const addressDone = !!(
    address?.streetAndHouseNumber && address?.city &&
    address?.country && address?.stateProvince && address?.postcode
  );

  const educationDone = !!(
    education?.wasEnrolled !== null &&
    education?.isCurrentlyEnrolled !== null
  );

  const languageDone = !!(language?.eqheCountry && language?.eqheOriginalTitle);

  // Required documents: cv, photo, passport, transcript, diploma,
  // cert9th–cert12th (file OR expectedDate counts)
  const CERT_FIELDS = ['cert9th', 'cert10th', 'cert11th', 'cert12th'];
  const documentsDone = !!(
    documents &&
    documents.cv?.fileName &&
    documents.photo?.fileName &&
    documents.passport?.fileName &&
    documents.transcript?.fileName &&
    documents.diploma?.fileName &&
    CERT_FIELDS.every(field =>
      documents[field]?.fileName || documents[`${field}_expectedDate`]
    )
  );

  const specialNeedDone = !!(specialNeed?.hasSpecialNeeds);

  const sections = { personalDone, addressDone, educationDone, languageDone, documentsDone, specialNeedDone };
  const overall  = Object.values(sections).every(Boolean);
  return { ...sections, overall };
};

/* ======================================================
   GET MISSING REQUIRED FIELDS
====================================================== */
const getMissing = (personal) => {
  const m = [];
  if (!personal?.firstName)              m.push('First name');
  if (!personal?.lastName)               m.push('Last name');
  if (!personal?.dateOfBirth)            m.push('Date of birth');
  if (!personal?.countryOfBirth)         m.push('Country of birth');
  if (!personal?.citizenship)            m.push('Citizenship');
  if (!personal?.email)                  m.push('Email');
  if (!personal?.mobile)                 m.push('Mobile');
  if (!personal?.passportNumber)         m.push('Passport number');
  if (!personal?.passportIssueDate)      m.push('Passport issue date');
  if (!personal?.passportExpiryDate)     m.push('Passport expiry date');
  if (!personal?.issuingCountry)         m.push('Issuing country');
  if (!personal?.correspondenceLanguage) m.push('Correspondence language');
  if (personal?.isEUCitizen === false && !personal?.needVisa) m.push('Visa requirement');
  return m;
};

/* ======================================================
   GET FULL APPLICATION PREVIEW
   GET /api/application/preview
====================================================== */
export const getApplicationPreview = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all models in parallel
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
      message: 'Failed to fetch application preview',
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
      return res.status(400).json({ success: false, message: 'agreed must be a boolean' });
    }

    await PersonalInfo.findByIdAndUpdate(
      userId,
      { $set: { agreedToTerms: agreed, lastUpdated: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `Terms ${agreed ? 'accepted' : 'revoked'}`,
      agreedToTerms: agreed,
    });
  } catch (error) {
    console.error('❌ saveAgreedToTerms:', error);
    return res.status(500).json({ success: false, message: 'Failed to save terms agreement' });
  }
};

/* ======================================================
   SUBMIT APPLICATION
   POST /api/application/preview/submit
====================================================== */
export const submitApplication = async (req, res) => {
  try {
    const userId          = req.user.userId;
    const { agreedToTerms } = req.body;

    if (!agreedToTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to the terms and conditions before submitting.',
      });
    }

    const personal = await PersonalInfo.findById(userId);
    if (!personal) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const missingFields = getMissing(personal);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Application is incomplete',
        missingFields,
      });
    }

    personal.applicationStatus = 'submitted';
    personal.submittedAt       = new Date();
    personal.agreedToTerms     = true;
    await personal.save();

    const applicationId = `UEG${userId.toString().slice(-10).toUpperCase()}`;

    return res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      submittedAt: personal.submittedAt,
      applicationId,
    });
  } catch (error) {
    console.error('❌ submitApplication:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
};