// controllers/gusuniversitycontroller.js

import mongoose               from 'mongoose';
import ApplicationLanguage    from '../models/ApplicationLanguageModel.js';
import PersonalInfo           from '../models/applicationModel.js';
import Account                from '../models/accountModel.js';
import ApplicationDocument    from '../models/applicationDocumentModel.js';
import ApplicationEducation   from '../models/applicationEducationModel.js';
import ApplicationScore       from '../models/ApplicationScore.js';
import ApplicationSpecialNeed from '../models/ApplicationSpecialNeed.js';

/* =====================================================
   HELPER — safe date formatter
===================================================== */
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; }
  catch { return ''; }
};

/* =====================================================
   HELPER — convert string → ObjectId safely
===================================================== */
const toObjectId = (id) => {
  if (!id) return null;
  const s = id.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
};

/* =====================================================
   HELPER — build lookup map
===================================================== */
const buildMap = (records, idField) => {
  const map = {};
  records.forEach((r) => {
    const raw = r[idField];
    if (raw) map[raw.toString()] = r;
  });
  return map;
};

/* =====================================================
   HELPER — resolve a single document field.
   Returns { uploaded: bool, status: string }
===================================================== */
const resolveDoc = (fieldObj, fallback = false) => {
  const hasFile = !!(fieldObj?.fileName && fieldObj.fileName !== '');
  if (!hasFile && !fallback) return { uploaded: false, status: 'not_uploaded' };
  if (!hasFile && fallback)  return { uploaded: true,  status: 'pending' };
  return {
    uploaded: true,
    status: fieldObj.documentStatus || 'pending',
  };
};

/* =====================================================
   KEY FIX — map ACTUAL DB field names to the display
   labels used in GusUniversity.jsx

   Your real ApplicationDocument schema uses:
     cv, photo, eqhe, finalEqhe, bachelorTranscript,
     bachelorCertificate, germanCertificate,
     englishCertificate, noObjection, deRegistration,
     portfolio, other

   The frontend expects:
     cv, photo, passport, transcript, diploma,
     cert9th, cert10th, cert11th, cert12th,
     testScores, languageProficiency, recommendationLetter
===================================================== */
const mapDocuments = (docRec, personal) => {
  const empty = {
    cvUploaded: false,         cvStatus: 'not_uploaded',
    photoUploaded: false,      photoStatus: 'not_uploaded',
    passportUploaded: false,   passportStatus: 'not_uploaded',
    transcriptUploaded: false, transcriptStatus: 'not_uploaded',
    diplomaUploaded: false,    diplomaStatus: 'not_uploaded',
    cert9thUploaded: false,    cert9thStatus: 'not_uploaded',
    cert10thUploaded: false,   cert10thStatus: 'not_uploaded',
    cert11thUploaded: false,   cert11thStatus: 'not_uploaded',
    cert12thUploaded: false,   cert12thStatus: 'not_uploaded',
    testScoresUploaded: false,
    langProfUploaded: false,
    recLetterUploaded: false,
    portfolioLink: '',
    docsCompletionPct: 0,
    docsCompleted: false,
  };

  if (!docRec) return empty;

  // Resolve each actual DB field
  const cv          = resolveDoc(docRec.cv);
  const photo       = resolveDoc(docRec.photo,              !!(personal?.photographFileName));
  // eqhe         → used as Passport/ID in this schema
  const passport    = resolveDoc(docRec.eqhe,               !!(personal?.passportFileName));
  // finalEqhe    → used as Transcript
  const transcript  = resolveDoc(docRec.finalEqhe);
  // bachelorTranscript → Diploma
  const diploma     = resolveDoc(docRec.bachelorTranscript);
  // bachelorCertificate → 12th Grade Cert
  const cert12      = resolveDoc(docRec.bachelorCertificate);
  // germanCertificate → 11th Grade Cert
  const cert11      = resolveDoc(docRec.germanCertificate);
  // deRegistration → 10th Grade Cert
  const cert10      = resolveDoc(docRec.deRegistration);
  // No direct mapping for 9th grade in this schema
  const cert9       = { uploaded: false, status: 'not_uploaded' };
  // englishCertificate → Test Scores
  const testScores  = resolveDoc(docRec.englishCertificate);
  // englishCertificate → Language Proficiency (same doc, dual purpose)
  const langProf    = resolveDoc(docRec.englishCertificate);
  // noObjection → Recommendation Letter
  const recLetter   = resolveDoc(docRec.noObjection);

  // Calculate real completion from actual uploaded fields
  const uploadedCount = [cv, photo, passport, transcript, diploma, cert12, cert11, cert10]
    .filter(d => d.uploaded).length;
  const docsCompletionPct = docRec.completionPercentage
    || Math.round((uploadedCount / 8) * 100);

  return {
    cvUploaded:         cv.uploaded,        cvStatus:         cv.status,
    photoUploaded:      photo.uploaded,     photoStatus:      photo.status,
    passportUploaded:   passport.uploaded,  passportStatus:   passport.status,
    transcriptUploaded: transcript.uploaded,transcriptStatus: transcript.status,
    diplomaUploaded:    diploma.uploaded,   diplomaStatus:    diploma.status,
    cert9thUploaded:    cert9.uploaded,     cert9thStatus:    cert9.status,
    cert10thUploaded:   cert10.uploaded,    cert10thStatus:   cert10.status,
    cert11thUploaded:   cert11.uploaded,    cert11thStatus:   cert11.status,
    cert12thUploaded:   cert12.uploaded,    cert12thStatus:   cert12.status,
    testScoresUploaded: testScores.uploaded,
    langProfUploaded:   langProf.uploaded,
    recLetterUploaded:  recLetter.uploaded,
    portfolioLink:      docRec.portfolioLink || '',
    docsCompletionPct,
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

      // Query with BOTH ObjectId and String — handles mixed storage types
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
    ]);

    const personalMap  = buildMap(personalRecords,    '_id');
    const accountMap   = buildMap(accountRecords,     '_id');
    const documentMap  = buildMap(documentRecords,    'userId');
    const educationMap = buildMap(educationRecords,   'userId');
    const scoreMap     = buildMap(scoreRecords,       'studentId');
    const specialMap   = buildMap(specialNeedRecords, 'studentId');

    const data = languageRecords.map((lang) => {
      const sid      = lang.studentId?.toString() || '';
      const personal = personalMap [sid] || {};
      const account  = accountMap  [sid] || {};
      const docRec   = documentMap [sid] || null;
      const eduRec   = educationMap[sid] || {};
      const scoreRec = scoreMap    [sid] || {};
      const snRec    = specialMap  [sid] || {};

      const firstName = personal.firstName || account.firstName || '';
      const lastName  = personal.lastName  || account.lastName  || '';

      // ★ This is the core fix — map actual DB fields correctly
      const documents = mapDocuments(docRec, personal);

      const firstEntry = eduRec.educationEntries?.[0] || {};

      const computedCompletion =
        documents.docsCompletionPct ||
        lang.completionPercentage   ||
        0;

      return {
        _id:           lang._id,
        applicationId: lang.applicationId || '',
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
        isVerified:        personal.isVerified        || false,
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
        completionPercentage: computedCompletion,
        isCompleted:          lang.isCompleted || false,
        documents,
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
        app.studentName?.toLowerCase().includes(q)   ||
        app.email?.toLowerCase().includes(q)         ||
        String(app.studentId).includes(q)            ||
        app.applicationId?.toLowerCase().includes(q) ||
        app.passportNumber?.toLowerCase().includes(q)
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

    const [lang, personal, account, docRec, eduRec, scoreRec, snRec] = await Promise.all([
      ApplicationLanguage.findOne({ studentId }).lean(),
      PersonalInfo.findById(objectId).lean(),
      Account.findById(objectId)
        .select('firstName lastName email phone birthDate joinDate lastLogin status role')
        .lean(),
      ApplicationDocument.findOne({
        $or: [{ userId: objectId }, { userId: studentId }],
      }).lean(),
      ApplicationEducation.findOne({
        $or: [{ userId: objectId }, { userId: studentId }],
      }).lean(),
      ApplicationScore.findOne({
        $or: [{ studentId: objectId }, { studentId: studentId }],
      }).lean(),
      ApplicationSpecialNeed.findOne({
        $or: [{ studentId: objectId }, { studentId: studentId }],
      }).lean(),
    ]);

    if (!lang) {
      return res.status(404).json({
        success: false,
        message: 'No EQHE application found for this student.',
      });
    }

    const firstName  = personal?.firstName || account?.firstName || '';
    const lastName   = personal?.lastName  || account?.lastName  || '';
    const firstEntry = eduRec?.educationEntries?.[0] || {};

    const documents = mapDocuments(docRec, personal);

    const computedCompletion =
      documents.docsCompletionPct ||
      lang.completionPercentage   ||
      0;

    return res.status(200).json({
      success: true,
      data: {
        _id:           lang._id,
        applicationId: lang.applicationId || '',
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
        applicationStatus: personal?.applicationStatus || 'draft',
        isVerified:        personal?.isVerified        || false,
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
        completionPercentage: computedCompletion,
        isCompleted:          lang.isCompleted || false,
        documents,
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
    const all = await ApplicationLanguage.find()
      .select('completionPercentage')
      .lean();

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