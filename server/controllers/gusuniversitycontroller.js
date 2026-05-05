// controllers/gusuniversitycontroller.js

import mongoose               from 'mongoose';
import ApplicationLanguage    from '../models/ApplicationLanguageModel.js';
import PersonalInfo           from '../models/applicationModel.js';
import Account                from '../models/accountModel.js';
import ApplicationDocument    from '../models/applicationDocumentModel.js';
import ApplicationEducation   from '../models/applicationEducationModel.js';
import ApplicationScore       from '../models/ApplicationScore.js';
import ApplicationSpecialNeed from '../models/ApplicationSpecialNeed.js';
import Overview               from '../models/overviewModel.js';   // ✅ NEW
import { sendEmailEnhanced, emailTemplates } from '../utils/sendEmail.js';

/* =====================================================
   FOLDER MAP
===================================================== */
const DOC_FOLDER_MAP = {
  cv:                   'documents/cv',
  photo:                'documents/photo',
  passport:             'documents/personal',
  transcript:           'documents/academic',
  diploma:              'documents/academic',
  cert9th:              'documents/certificates',
  cert10th:             'documents/certificates',
  cert11th:             'documents/certificates',
  cert12th:             'documents/certificates',
  testScores:           'documents/optional',
  languageProficiency:  'documents/optional',
  recommendationLetter: 'documents/optional',
};

/* =====================================================
   URL RESOLVER
===================================================== */
const resolveFileUrl = (fieldObj, folder = '') => {
  if (!fieldObj?.fileName || fieldObj.fileName.trim() === '') return null;
  const { fileUrl, fileKey, fileName } = fieldObj;
  if (fileKey) {
    const key = fileKey.startsWith('/') ? fileKey.slice(1) : fileKey;
    return `/api/files/${key}`;
  }
  if (fileUrl && fileUrl.startsWith('https://')) {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.replace(/^\//, '');
      return `/api/files/${key}`;
    } catch { /* fall through */ }
  }
  const cleanName = fileName.replace(/^\/+/, '');
  if (folder) return `/api/files/${folder}/${cleanName}`;
  return `/uploads/${cleanName}`;
};

/* =====================================================
   HELPERS
===================================================== */
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; }
  catch { return ''; }
};

const toObjectId = (id) => {
  if (!id) return null;
  const s = id.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
};

const buildMap = (records, idField) => {
  const map = {};
  records.forEach((r) => {
    const raw = r[idField];
    if (raw) map[raw.toString()] = r;
  });
  return map;
};

/* =====================================================
   HELPER — build overview map keyed by userId
   One user may have multiple overviews (one per university).
   We store ALL overviews per userId so we can match by
   applicationId or just grab the most recent one.
===================================================== */
const buildOverviewMap = (overviews) => {
  const map = {};
  overviews.forEach((ov) => {
    const key = ov.userId?.toString();
    if (!key) return;
    if (!map[key]) map[key] = [];
    map[key].push(ov);
  });
  return map;
};

/* =====================================================
   HELPER — pick the correct overview for a student
   Match by applicationId stored on the language record,
   or fall back to most recent overview for that user.
===================================================== */
const pickOverview = (overviewsByUserId, userId, applicationId) => {
  const list = overviewsByUserId[userId] || [];
  if (!list.length) return null;

  // Prefer exact applicationId match
  if (applicationId) {
    const exact = list.find((ov) => ov.applicationId === applicationId);
    if (exact) return exact;
  }

  // Fallback: most recent (list is sorted desc by createdAt)
  return list[0] || null;
};

/* =====================================================
   RESOLVE DOCUMENT FIELD
===================================================== */
const resolveDoc = (fieldObj, folder = '') => {
  const hasFile = !!(fieldObj?.fileName && fieldObj.fileName.trim() !== '');
  if (!hasFile) {
    return { uploaded: false, status: 'not_uploaded', fileName: null, fileKey: null, fileUrl: null, originalName: null, fileType: null, fileSize: null, uploadedAt: null };
  }
  return {
    uploaded:     true,
    status:       fieldObj.documentStatus || 'pending',
    fileName:     fieldObj.fileName       || null,
    fileKey:      fieldObj.fileKey        || null,
    fileUrl:      resolveFileUrl(fieldObj, folder),
    originalName: fieldObj.originalName   || fieldObj.fileName || null,
    fileType:     fieldObj.fileType       || null,
    fileSize:     fieldObj.fileSize       || null,
    uploadedAt:   fieldObj.uploadedAt     || null,
  };
};

/* =====================================================
   COMPLETION CALCULATOR
===================================================== */
const REQUIRED_FIELDS = [
  'cv', 'photo', 'passport', 'transcript', 'diploma',
  'cert9th', 'cert10th', 'cert11th', 'cert12th',
];

const calcCompletionPct = (docRec) => {
  if (!docRec) return 0;
  let satisfied = 0;
  REQUIRED_FIELDS.forEach((field) => {
    const obj         = docRec[field];
    const hasFile     = !!(obj?.fileName && obj.fileName.trim() !== '');
    const expectedKey = `${field}_expectedDate`;
    const hasExpected = !!(docRec[expectedKey] && docRec[expectedKey].trim() !== '');
    if (hasFile || hasExpected) satisfied++;
  });
  return Math.round((satisfied / REQUIRED_FIELDS.length) * 100);
};

/* =====================================================
   MAP DOCUMENTS
===================================================== */
const mapDocuments = (docRec) => {
  const empty = {
    cvUploaded: false,         cvStatus: 'not_uploaded',         cvMeta: null,
    photoUploaded: false,      photoStatus: 'not_uploaded',      photoMeta: null,
    passportUploaded: false,   passportStatus: 'not_uploaded',   passportMeta: null,
    transcriptUploaded: false, transcriptStatus: 'not_uploaded', transcriptMeta: null,
    diplomaUploaded: false,    diplomaStatus: 'not_uploaded',    diplomaMeta: null,
    cert9thUploaded: false,    cert9thStatus: 'not_uploaded',    cert9thMeta: null,  cert9thExpectedDate: null,
    cert10thUploaded: false,   cert10thStatus: 'not_uploaded',   cert10thMeta: null, cert10thExpectedDate: null,
    cert11thUploaded: false,   cert11thStatus: 'not_uploaded',   cert11thMeta: null, cert11thExpectedDate: null,
    cert12thUploaded: false,   cert12thStatus: 'not_uploaded',   cert12thMeta: null, cert12thExpectedDate: null,
    testScoresUploaded: false, testScoresMeta: null,
    langProfUploaded: false,   langProfMeta: null,
    recLetterUploaded: false,  recLetterMeta: null,
    portfolioLink: '',
    docsCompletionPct: 0,
    docsCompleted: false,
  };
  if (!docRec) return empty;

  const cv         = resolveDoc(docRec.cv,                   DOC_FOLDER_MAP.cv);
  const photo      = resolveDoc(docRec.photo,                DOC_FOLDER_MAP.photo);
  const passport   = resolveDoc(docRec.passport,             DOC_FOLDER_MAP.passport);
  const transcript = resolveDoc(docRec.transcript,           DOC_FOLDER_MAP.transcript);
  const diploma    = resolveDoc(docRec.diploma,              DOC_FOLDER_MAP.diploma);
  const cert9th    = resolveDoc(docRec.cert9th,              DOC_FOLDER_MAP.cert9th);
  const cert10th   = resolveDoc(docRec.cert10th,             DOC_FOLDER_MAP.cert10th);
  const cert11th   = resolveDoc(docRec.cert11th,             DOC_FOLDER_MAP.cert11th);
  const cert12th   = resolveDoc(docRec.cert12th,             DOC_FOLDER_MAP.cert12th);
  const testScores = resolveDoc(docRec.testScores,           DOC_FOLDER_MAP.testScores);
  const langProf   = resolveDoc(docRec.languageProficiency,  DOC_FOLDER_MAP.languageProficiency);
  const recLetter  = resolveDoc(docRec.recommendationLetter, DOC_FOLDER_MAP.recommendationLetter);

  const meta = (r) => {
    if (!r.uploaded) return null;
    return { fileName: r.fileName, fileKey: r.fileKey, originalName: r.originalName, fileType: r.fileType, fileSize: r.fileSize, uploadedAt: r.uploadedAt, fileUrl: r.fileUrl };
  };

  return {
    cvUploaded:         cv.uploaded,         cvStatus:         cv.status,         cvMeta:         meta(cv),
    photoUploaded:      photo.uploaded,      photoStatus:      photo.status,      photoMeta:      meta(photo),
    passportUploaded:   passport.uploaded,   passportStatus:   passport.status,   passportMeta:   meta(passport),
    transcriptUploaded: transcript.uploaded, transcriptStatus: transcript.status, transcriptMeta: meta(transcript),
    diplomaUploaded:    diploma.uploaded,    diplomaStatus:    diploma.status,    diplomaMeta:    meta(diploma),
    cert9thUploaded:    cert9th.uploaded,    cert9thStatus:    cert9th.status,    cert9thMeta:    meta(cert9th),    cert9thExpectedDate:  docRec.cert9th_expectedDate  || null,
    cert10thUploaded:   cert10th.uploaded,   cert10thStatus:   cert10th.status,   cert10thMeta:   meta(cert10th),  cert10thExpectedDate: docRec.cert10th_expectedDate || null,
    cert11thUploaded:   cert11th.uploaded,   cert11thStatus:   cert11th.status,   cert11thMeta:   meta(cert11th),  cert11thExpectedDate: docRec.cert11th_expectedDate || null,
    cert12thUploaded:   cert12th.uploaded,   cert12thStatus:   cert12th.status,   cert12thMeta:   meta(cert12th),  cert12thExpectedDate: docRec.cert12th_expectedDate || null,
    testScoresUploaded: testScores.uploaded, testScoresMeta:   meta(testScores),
    langProfUploaded:   langProf.uploaded,   langProfMeta:     meta(langProf),
    recLetterUploaded:  recLetter.uploaded,  recLetterMeta:    meta(recLetter),
    portfolioLink:      docRec.portfolioLink || '',
    docsCompletionPct:  calcCompletionPct(docRec),
    docsCompleted:      docRec.isCompleted || false,
  };
};

/* =====================================================
   GET ALL GUS UNIVERSITY APPLICATIONS
===================================================== */
export const getGusUniversityApplications = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [languageRecords, total] = await Promise.all([
      ApplicationLanguage.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ApplicationLanguage.countDocuments(),
    ]);

    if (!languageRecords.length) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page: pageNum, pages: 0, limit: limitNum },
      });
    }

    const studentIdStrings = languageRecords.map((r) => r.studentId).filter(Boolean);
    const studentObjectIds = studentIdStrings.map(toObjectId).filter(Boolean);

    const [
      personalRecords,
      accountRecords,
      documentRecords,
      educationRecords,
      scoreRecords,
      specialNeedRecords,
      overviewRecords,          // ✅ fetch overviews for all students
    ] = await Promise.all([
      PersonalInfo.find({ _id: { $in: studentObjectIds } })
        .select(
          'firstName lastName title email mobile gender dateOfBirth ' +
          'placeOfBirth countryOfBirth citizenship passportNumber '   +
          'passportIssueDate passportExpiryDate issuingCountry '       +
          'isEUCitizen needVisa documentType correspondenceLanguage '   +
          'applicationStatus isVerified landline countryOfResidence '   +
          'passportFileName photographFileName'
        )
        .lean(),

      Account.find({ _id: { $in: studentObjectIds } })
        .select('firstName lastName email phone birthDate joinDate lastLogin status role')
        .lean(),

      ApplicationDocument.find({
        $or: [
          { userId: { $in: studentObjectIds } },
          { userId: { $in: studentIdStrings  } },
        ],
      }).lean(),

      ApplicationEducation.find({ userId: { $in: studentObjectIds } })
        .select('userId wasEnrolled isCurrentlyEnrolled isCompleted completionPercentage educationEntries')
        .lean(),

      ApplicationScore.find({ studentId: { $in: studentObjectIds } })
        .select('studentId satTotal satMath satReading ielts toefl pte duolingo act')
        .lean(),

      ApplicationSpecialNeed.find({ studentId: { $in: studentObjectIds } })
        .select('studentId hasSpecialNeeds specialNeeds requiredArrangements status')
        .lean(),

      // ✅ Fetch ALL overviews for these users (sorted newest first)
      Overview.find({ userId: { $in: studentObjectIds } })
        .select('userId applicationId selectedCourse applicationStatus progress')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const personalMap      = buildMap(personalRecords,    '_id');
    const accountMap       = buildMap(accountRecords,     '_id');
    const documentMap      = buildMap(documentRecords,    'userId');
    const educationMap     = buildMap(educationRecords,   'userId');
    const scoreMap         = buildMap(scoreRecords,       'studentId');
    const specialMap       = buildMap(specialNeedRecords, 'studentId');
    // ✅ Overview map: userId → array of overviews (newest first)
    const overviewsByUserId = buildOverviewMap(overviewRecords);

    const data = languageRecords.map((lang) => {
      const sid      = lang.studentId?.toString() || '';
      const personal = personalMap [sid] || {};
      const account  = accountMap  [sid] || {};
      const docRec   = documentMap [sid] || null;
      const eduRec   = educationMap[sid] || {};
      const scoreRec = scoreMap    [sid] || {};
      const snRec    = specialMap  [sid] || {};

      // ✅ Pick the matching overview — exact applicationId match preferred
      const overview     = pickOverview(overviewsByUserId, sid, lang.applicationId);
      const selectedCourse = overview?.selectedCourse || null;

      const firstName = personal.firstName || account.firstName || '';
      const lastName  = personal.lastName  || account.lastName  || '';

      const documents  = mapDocuments(docRec);
      const firstEntry = eduRec.educationEntries?.[0] || {};

      return {
        _id:           lang._id,
        applicationId: lang.applicationId || overview?.applicationId || '',
        studentId:     sid,
        studentName:   [firstName, lastName].filter(Boolean).join(' ') || 'Unknown',
        title:         personal.title || '',
        email:         personal.email  || account.email || '',
        phone:         personal.mobile || account.phone || '',
        gender:        personal.gender || '',
        dateOfBirth:   fmtDate(personal.dateOfBirth),
        placeOfBirth:  personal.placeOfBirth   || '',
        countryOfBirth:personal.countryOfBirth || '',
        citizenship:        personal.citizenship        || '',
        passportNumber:     personal.passportNumber     || '',
        passportIssueDate:  fmtDate(personal.passportIssueDate),
        passportExpiryDate: fmtDate(personal.passportExpiryDate),
        issuingCountry:     personal.issuingCountry || '',
        documentType:       personal.documentType   || '',
        passportUploaded:   documents.passportUploaded,
        photographUploaded: documents.photoUploaded,
        isEUCitizen: personal.isEUCitizen ?? null,
        needVisa:    personal.needVisa    || '',
        landline:               personal.landline               || '',
        countryOfResidence:     personal.countryOfResidence     || '',
        correspondenceLanguage: personal.correspondenceLanguage || '',
        applicationStatus: personal.applicationStatus || 'draft',
        // ✅ Overview status separate so frontend can use it for status badge
        overviewStatus: overview?.applicationStatus || null,
        isVerified:     personal.isVerified || false,
        eqheOriginalTitle:       lang.eqheOriginalTitle       || '',
        eqheCountry:             lang.eqheCountry             || '',
        eqheDate:                fmtDate(lang.eqheDate),
        eqheCity:                lang.eqheCity                || '',
        eqheCertificateFileName: lang.eqheCertificateFileName || '',
        hasAnotherEQHE:                 lang.hasAnotherEQHE                 || false,
        anotherEqheOriginalTitle:       lang.anotherEqheOriginalTitle       || '',
        anotherEqheCountry:             lang.anotherEqheCountry             || '',
        anotherEqheDate:                fmtDate(lang.anotherEqheDate),
        anotherEqheCity:                lang.anotherEqheCity                || '',
        anotherEqheCertificateFileName: lang.anotherEqheCertificateFileName || '',
        completionPercentage: documents.docsCompletionPct,
        isCompleted:          lang.isCompleted || false,
        documents,
        // ✅ selectedCourse — university name lives here, always correct
        selectedCourse: selectedCourse ? {
          programId:      selectedCourse.programId      || '',
          programName:    selectedCourse.programName    || '',
          universityId:   selectedCourse.universityId   || '',
          universityName: selectedCourse.universityName || '',
          universityLogo: selectedCourse.universityLogo || '',
          campus:         selectedCourse.campus         || '',
          country:        selectedCourse.country        || '',
          intakeMonth:    selectedCourse.intakeMonth    || '',
          intakeYear:     selectedCourse.intakeYear     || '',
          applicationFee: selectedCourse.applicationFee ?? 0,
          tuitionFee:     selectedCourse.tuitionFee     ?? 0,
        } : null,
        // ✅ Also expose flat fields for backward compatibility
        universityName: selectedCourse?.universityName || '',
        programName:    selectedCourse?.programName    || '',
        education: {
          wasEnrolled:         eduRec.wasEnrolled         ?? null,
          isCurrentlyEnrolled: eduRec.isCurrentlyEnrolled ?? null,
          eduCompleted:        eduRec.isCompleted         || false,
          eduCompletionPct:    eduRec.completionPercentage || 0,
          institutionName:     firstEntry.institutionName  || '',
          degree:              firstEntry.degree           || '',
          specialisation:      firstEntry.specialisation   || '',
          country:             firstEntry.countryOfInitialRegistration || '',
          entryType:           firstEntry.entryType        || '',
          standardStudyPeriod: firstEntry.standardStudyPeriod || '',
          transcriptUploaded:  !!firstEntry.transcriptFileName,
        },
        scores: {
          satTotal:   scoreRec.satTotal   || '',
          satMath:    scoreRec.satMath    || '',
          satReading: scoreRec.satReading || '',
          ielts:      scoreRec.ielts      || '',
          toefl:      scoreRec.toefl      || '',
          pte:        scoreRec.pte        || '',
          duolingo:   scoreRec.duolingo   || '',
          act:        scoreRec.act        || '',
        },
        specialNeeds: {
          hasSpecialNeeds:      snRec.hasSpecialNeeds      || 'no',
          specialNeeds:         snRec.specialNeeds         || [],
          requiredArrangements: snRec.requiredArrangements || [],
          snStatus:             snRec.status               || '',
        },
        accountStatus: account.status || '',
        role:          account.role   || '',
        joinDate:      fmtDate(account.joinDate),
        lastLogin:     account.lastLogin ? fmtDate(account.lastLogin) : '',
        createdAt: lang.createdAt,
        updatedAt: lang.updatedAt,
      };
    });

    let filtered = data;

    if (status && status !== 'all') {
      filtered = filtered.filter((app) => {
        const pct = app.completionPercentage;
        if (status === 'completed')  return pct === 100;
        if (status === 'incomplete') return pct === 0;
        if (status === 'inprogress') return pct > 0 && pct < 100;
        return true;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((app) =>
        app.studentName?.toLowerCase().includes(q)                       ||
        app.email?.toLowerCase().includes(q)                             ||
        String(app.studentId).includes(q)                                ||
        app.applicationId?.toLowerCase().includes(q)                     ||
        app.passportNumber?.toLowerCase().includes(q)                    ||
        app.selectedCourse?.universityName?.toLowerCase().includes(q)    ||
        app.selectedCourse?.programName?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: filtered,
      pagination: {
        total,
        page:  pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });

  } catch (error) {
    console.error('❌ getGusUniversityApplications Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch GUS University applications.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/* =====================================================
   GET SINGLE APPLICATION DETAIL
===================================================== */
export const getGusUniversityApplicationById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const objectId = toObjectId(studentId);
    if (!objectId) {
      return res.status(400).json({ success: false, message: 'Invalid studentId format.' });
    }

    const [lang, personal, account, docRec, eduRec, scoreRec, snRec, overviews] = await Promise.all([
      ApplicationLanguage.findOne({ studentId }).lean(),
      PersonalInfo.findById(objectId).lean(),
      Account.findById(objectId)
        .select('firstName lastName email phone birthDate joinDate lastLogin status role')
        .lean(),
      ApplicationDocument.findOne({ $or: [{ userId: objectId }, { userId: studentId }] }).lean(),
      ApplicationEducation.findOne({ $or: [{ userId: objectId }, { userId: studentId }] }).lean(),
      ApplicationScore.findOne({ $or: [{ studentId: objectId }, { studentId }] }).lean(),
      ApplicationSpecialNeed.findOne({ $or: [{ studentId: objectId }, { studentId }] }).lean(),
      // ✅ Fetch overviews for this user — newest first
      Overview.find({ userId: objectId })
        .select('userId applicationId selectedCourse applicationStatus')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!lang) {
      return res.status(404).json({ success: false, message: 'No EQHE application found for this student.' });
    }

    const firstName    = personal?.firstName || account?.firstName || '';
    const lastName     = personal?.lastName  || account?.lastName  || '';
    const firstEntry   = eduRec?.educationEntries?.[0] || {};
    const documents    = mapDocuments(docRec);

    // ✅ Pick matching overview
    const overviewsByUserId = buildOverviewMap(overviews);
    const overview          = pickOverview(overviewsByUserId, objectId.toString(), lang.applicationId);
    const selectedCourse    = overview?.selectedCourse || null;

    return res.status(200).json({
      success: true,
      data: {
        _id:           lang._id,
        applicationId: lang.applicationId || overview?.applicationId || '',
        studentId,
        studentName:   [firstName, lastName].filter(Boolean).join(' ') || 'Unknown',
        title:         personal?.title || '',
        email:         personal?.email  || account?.email || '',
        phone:         personal?.mobile || account?.phone || '',
        gender:        personal?.gender || '',
        dateOfBirth:   fmtDate(personal?.dateOfBirth),
        placeOfBirth:  personal?.placeOfBirth   || '',
        countryOfBirth:personal?.countryOfBirth || '',
        citizenship:        personal?.citizenship        || '',
        passportNumber:     personal?.passportNumber     || '',
        passportIssueDate:  fmtDate(personal?.passportIssueDate),
        passportExpiryDate: fmtDate(personal?.passportExpiryDate),
        issuingCountry:     personal?.issuingCountry || '',
        documentType:       personal?.documentType   || '',
        passportUploaded:   documents.passportUploaded,
        photographUploaded: documents.photoUploaded,
        isEUCitizen: personal?.isEUCitizen ?? null,
        needVisa:    personal?.needVisa    || '',
        landline:               personal?.landline               || '',
        countryOfResidence:     personal?.countryOfResidence     || '',
        correspondenceLanguage: personal?.correspondenceLanguage || '',
        applicationStatus:  personal?.applicationStatus || 'draft',
        overviewStatus:     overview?.applicationStatus || null,
        isVerified:         personal?.isVerified        || false,
        eqheOriginalTitle:       lang.eqheOriginalTitle       || '',
        eqheCountry:             lang.eqheCountry             || '',
        eqheDate:                fmtDate(lang.eqheDate),
        eqheCity:                lang.eqheCity                || '',
        eqheCertificateFileName: lang.eqheCertificateFileName || '',
        hasAnotherEQHE:                 lang.hasAnotherEQHE                 || false,
        anotherEqheOriginalTitle:       lang.anotherEqheOriginalTitle       || '',
        anotherEqheCountry:             lang.anotherEqheCountry             || '',
        anotherEqheDate:                fmtDate(lang.anotherEqheDate),
        anotherEqheCity:                lang.anotherEqheCity                || '',
        anotherEqheCertificateFileName: lang.anotherEqheCertificateFileName || '',
        completionPercentage: documents.docsCompletionPct,
        isCompleted:          lang.isCompleted || false,
        documents,
        // ✅ selectedCourse always from Overview — correct university per application
        selectedCourse: selectedCourse ? {
          programId:      selectedCourse.programId      || '',
          programName:    selectedCourse.programName    || '',
          universityId:   selectedCourse.universityId   || '',
          universityName: selectedCourse.universityName || '',
          universityLogo: selectedCourse.universityLogo || '',
          campus:         selectedCourse.campus         || '',
          country:        selectedCourse.country        || '',
          intakeMonth:    selectedCourse.intakeMonth    || '',
          intakeYear:     selectedCourse.intakeYear     || '',
          applicationFee: selectedCourse.applicationFee ?? 0,
          tuitionFee:     selectedCourse.tuitionFee     ?? 0,
        } : null,
        universityName: selectedCourse?.universityName || '',
        programName:    selectedCourse?.programName    || '',
        education: eduRec ? {
          wasEnrolled:         eduRec.wasEnrolled         ?? null,
          isCurrentlyEnrolled: eduRec.isCurrentlyEnrolled ?? null,
          eduCompleted:        eduRec.isCompleted         || false,
          eduCompletionPct:    eduRec.completionPercentage || 0,
          entries:             eduRec.educationEntries    || [],
          institutionName:     firstEntry.institutionName  || '',
          degree:              firstEntry.degree           || '',
          specialisation:      firstEntry.specialisation   || '',
          country:             firstEntry.countryOfInitialRegistration || '',
          entryType:           firstEntry.entryType        || '',
          standardStudyPeriod: firstEntry.standardStudyPeriod || '',
          transcriptUploaded:  !!firstEntry.transcriptFileName,
        } : null,
        scores: scoreRec ? {
          satTotal:   scoreRec.satTotal   || '',
          satMath:    scoreRec.satMath    || '',
          satReading: scoreRec.satReading || '',
          ielts:      scoreRec.ielts      || '',
          toefl:      scoreRec.toefl      || '',
          pte:        scoreRec.pte        || '',
          duolingo:   scoreRec.duolingo   || '',
          act:        scoreRec.act        || '',
        } : null,
        specialNeeds: snRec ? {
          hasSpecialNeeds:      snRec.hasSpecialNeeds      || 'no',
          specialNeeds:         snRec.specialNeeds         || [],
          requiredArrangements: snRec.requiredArrangements || [],
          snStatus:             snRec.status               || '',
        } : null,
        accountStatus: account?.status || '',
        role:          account?.role   || '',
        joinDate:      fmtDate(account?.joinDate),
        lastLogin:     account?.lastLogin ? fmtDate(account.lastLogin) : '',
        createdAt: lang.createdAt,
        updatedAt: lang.updatedAt,
      },
    });

  } catch (error) {
    console.error('❌ getGusUniversityApplicationById Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch application detail.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/* =====================================================
   GET STATS SUMMARY
===================================================== */
export const getGusUniversityStats = async (req, res) => {
  try {
    const all = await ApplicationLanguage.find().select('completionPercentage').lean();
    const total    = all.length;
    let completed  = 0;
    let incomplete = 0;
    let inProgress = 0;
    all.forEach(({ completionPercentage: pct = 0 }) => {
      if (pct === 100)    completed++;
      else if (pct === 0) incomplete++;
      else                inProgress++;
    });
    return res.status(200).json({
      success: true,
      stats: { total, completed, incomplete, underReview: inProgress },
    });
  } catch (error) {
    console.error('❌ getGusUniversityStats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stats.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
/* =====================================================
   SEND DOCUMENT RE-UPLOAD EMAIL
===================================================== */
export const sendDocumentReuploadEmail = async (req, res) => {
  try {
    const { studentId, studentName, studentEmail, documentLabel, reason, adminNotes } = req.body;

    if (!studentEmail || !documentLabel) {
      return res.status(400).json({
        success: false,
        message: 'studentEmail and documentLabel are required.',
      });
    }

    const template = emailTemplates.documentCorrection({
      studentName:   studentName   || 'Student',
      documentName:  documentLabel,
      documentType:  documentLabel,
      reason:        reason        || 'other',
      adminNotes:    adminNotes    || '',
      deadlineDays:  7,
    });

    const result = await sendEmailEnhanced({
      to:      studentEmail,
      subject: template.subject,
      html:    template.html,
    });

    if (!result.success) {
      console.error('❌ Email send failed:', result.error);
      return res.status(500).json({
        success: false,
        message: `Failed to send email: ${result.error}`,
      });
    }

    return res.status(200).json({
      success:   true,
      message:   `Email sent successfully to ${studentEmail}`,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('❌ sendDocumentReuploadEmail Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending email.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};