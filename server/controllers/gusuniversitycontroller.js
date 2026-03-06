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
   HELPER — safe date formatter → "YYYY-MM-DD"
===================================================== */
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; }
  catch { return ''; }
};

/* =====================================================
   HELPER — convert string → ObjectId safely
   Returns null when the value is not a valid ObjectId
===================================================== */
const toObjectId = (id) => {
  if (!id) return null;
  const s = id.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
};

/* =====================================================
   GET ALL GUS UNIVERSITY APPLICATIONS
   GET /api/application/process-admin/gus-university/applications

   Data flow:
     ApplicationLanguage.studentId  (String)  ← root source
       → PersonalInfo._id   (ObjectId — MUST convert String → ObjectId)
       → Account._id        (ObjectId — MUST convert String → ObjectId)
       → ApplicationDocument.userId
       → ApplicationEducation.userId
       → ApplicationScore.studentId
       → ApplicationSpecialNeed.studentId
===================================================== */
export const getGusUniversityApplications = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;

    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    // ── 1. Fetch paginated language records ──────────────────────
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

    // ── 2. Build ObjectId array — KEY FIX ────────────────────────
    // ApplicationLanguage.studentId is stored as a String.
    // MongoDB $in silently fails comparing String[] vs ObjectId _id.
    // We MUST convert to ObjectId before querying PersonalInfo / Account.
    const studentIdStrings = languageRecords.map((r) => r.studentId).filter(Boolean);

    const studentObjectIds = studentIdStrings
      .map(toObjectId)
      .filter(Boolean);   // drop any malformed ids

    // ── 3. Parallel fetch all 6 collections ─────────────────────
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
          'placeOfBirth countryOfBirth citizenship passportNumber '  +
          'passportIssueDate passportExpiryDate issuingCountry '      +
          'isEUCitizen needVisa documentType correspondenceLanguage '  +
          'applicationStatus isVerified landline countryOfResidence '  +
          'passportFileName photographFileName'
        )
        .lean(),

      Account.find({ _id: { $in: studentObjectIds } })
        .select('firstName lastName email phone birthDate joinDate lastLogin status role')
        .lean(),

      ApplicationDocument.find({ userId: { $in: studentObjectIds } })
        .select(
          'userId isCompleted completionPercentage portfolioLink ' +
          'cv photo passport transcript diploma '                   +
          'cert9th cert10th cert11th cert12th '                     +
          'testScores languageProficiency recommendationLetter'
        )
        .lean(),

      ApplicationEducation.find({ userId: { $in: studentObjectIds } })
        .select('userId wasEnrolled isCurrentlyEnrolled isCompleted completionPercentage educationEntries')
        .lean(),

      ApplicationScore.find({ studentId: { $in: studentObjectIds } })
        .select('studentId satTotal satMath satReading ielts toefl pte duolingo act ' +
                'grade9 grade10 grade11 grade12')
        .lean(),

      ApplicationSpecialNeed.find({ studentId: { $in: studentObjectIds } })
        .select('studentId hasSpecialNeeds specialNeeds requiredArrangements status')
        .lean(),
    ]);

    // ── 4. Build lookup maps  id-string → record ─────────────────
    const personalMap  = {};
    const accountMap   = {};
    const documentMap  = {};
    const educationMap = {};
    const scoreMap     = {};
    const specialMap   = {};

    personalRecords   .forEach((r) => { personalMap  [r._id.toString()]       = r; });
    accountRecords    .forEach((r) => { accountMap   [r._id.toString()]       = r; });
    documentRecords   .forEach((r) => { documentMap  [r.userId.toString()]    = r; });
    educationRecords  .forEach((r) => { educationMap [r.userId.toString()]    = r; });
    scoreRecords      .forEach((r) => { scoreMap     [r.studentId.toString()] = r; });
    specialNeedRecords.forEach((r) => { specialMap   [r.studentId.toString()] = r; });

    // ── 5. Assemble response objects ─────────────────────────────
    const data = languageRecords.map((lang) => {
      const sid      = lang.studentId?.toString() || '';
      const personal = personalMap  [sid] || {};
      const account  = accountMap   [sid] || {};
      const docRec   = documentMap  [sid] || {};
      const eduRec   = educationMap [sid] || {};
      const scoreRec = scoreMap     [sid] || {};
      const snRec    = specialMap   [sid] || {};

      const firstName = personal.firstName || account.firstName || '';
      const lastName  = personal.lastName  || account.lastName  || '';
      const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
      const phone     = personal.mobile || account.phone || '';
      const email     = personal.email  || account.email || '';

      // Documents summary
      const documents = {
        cvUploaded:          !!docRec.cv?.fileName,
        cvStatus:            docRec.cv?.documentStatus            || 'not_uploaded',
        photoUploaded:       !!docRec.photo?.fileName,
        photoStatus:         docRec.photo?.documentStatus         || 'not_uploaded',
        passportUploaded:    !!docRec.passport?.fileName          || !!personal.passportFileName,
        passportStatus:      docRec.passport?.documentStatus      || 'not_uploaded',
        transcriptUploaded:  !!docRec.transcript?.fileName,
        transcriptStatus:    docRec.transcript?.documentStatus    || 'not_uploaded',
        diplomaUploaded:     !!docRec.diploma?.fileName,
        diplomaStatus:       docRec.diploma?.documentStatus       || 'not_uploaded',
        cert9thUploaded:     !!docRec.cert9th?.fileName,
        cert9thStatus:       docRec.cert9th?.documentStatus       || 'not_uploaded',
        cert10thUploaded:    !!docRec.cert10th?.fileName,
        cert10thStatus:      docRec.cert10th?.documentStatus      || 'not_uploaded',
        cert11thUploaded:    !!docRec.cert11th?.fileName,
        cert11thStatus:      docRec.cert11th?.documentStatus      || 'not_uploaded',
        cert12thUploaded:    !!docRec.cert12th?.fileName,
        cert12thStatus:      docRec.cert12th?.documentStatus      || 'not_uploaded',
        testScoresUploaded:  !!docRec.testScores?.fileName,
        langProfUploaded:    !!docRec.languageProficiency?.fileName,
        recLetterUploaded:   !!docRec.recommendationLetter?.fileName,
        portfolioLink:       docRec.portfolioLink                 || '',
        docsCompletionPct:   docRec.completionPercentage          || 0,
        docsCompleted:       docRec.isCompleted                   || false,
      };

      // Education summary
      const firstEntry = eduRec.educationEntries?.[0] || {};
      const education = {
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
      };

      // Scores summary
      const scores = {
        satTotal:   scoreRec.satTotal   || '',
        satMath:    scoreRec.satMath    || '',
        satReading: scoreRec.satReading || '',
        ielts:      scoreRec.ielts      || '',
        toefl:      scoreRec.toefl      || '',
        pte:        scoreRec.pte        || '',
        duolingo:   scoreRec.duolingo   || '',
        act:        scoreRec.act        || '',
      };

      // Special needs summary
      const specialNeeds = {
        hasSpecialNeeds:      snRec.hasSpecialNeeds      || 'no',
        specialNeeds:         snRec.specialNeeds         || [],
        requiredArrangements: snRec.requiredArrangements || [],
        snStatus:             snRec.status               || '',
      };

      return {
        _id:           lang._id,
        applicationId: lang.applicationId || '',
        studentId:     sid,
        studentName:    fullName,
        title:          personal.title          || '',
        email,
        phone,
        gender:         personal.gender         || '',
        dateOfBirth:    fmtDate(personal.dateOfBirth),
        placeOfBirth:   personal.placeOfBirth   || '',
        countryOfBirth: personal.countryOfBirth || '',
        citizenship:        personal.citizenship        || '',
        passportNumber:     personal.passportNumber     || '',
        passportIssueDate:  fmtDate(personal.passportIssueDate),
        passportExpiryDate: fmtDate(personal.passportExpiryDate),
        issuingCountry:     personal.issuingCountry     || '',
        documentType:       personal.documentType       || '',
        passportUploaded:   !!personal.passportFileName   || !!docRec.passport?.fileName,
        photographUploaded: !!personal.photographFileName || !!docRec.photo?.fileName,
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
        completionPercentage: lang.completionPercentage || 0,
        isCompleted:          lang.isCompleted          || false,
        documents,
        education,
        scores,
        specialNeeds,
        accountStatus: account.status || '',
        role:          account.role   || '',
        joinDate:      fmtDate(account.joinDate),
        lastLogin:     account.lastLogin ? fmtDate(account.lastLogin) : '',
        createdAt: lang.createdAt,
        updatedAt: lang.updatedAt,
      };
    });

    // ── 6. Optional in-memory filters ────────────────────────────
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
        app.studentName?.toLowerCase().includes(q)    ||
        app.email?.toLowerCase().includes(q)          ||
        String(app.studentId).includes(q)             ||
        app.applicationId?.toLowerCase().includes(q)  ||
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
   GET /api/application/process-admin/gus-university/applications/:studentId
===================================================== */
export const getGusUniversityApplicationById = async (req, res) => {
  try {
    const { studentId } = req.params;

    // KEY FIX: validate + convert before any query
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
      ApplicationDocument.findOne({ userId: objectId }).lean(),
      ApplicationEducation.findOne({ userId: objectId }).lean(),
      ApplicationScore.findOne({ studentId: objectId }).lean(),
      ApplicationSpecialNeed.findOne({ studentId: objectId }).lean(),
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

    return res.status(200).json({
      success: true,
      data: {
        _id:           lang._id,
        applicationId: lang.applicationId || '',
        studentId,
        studentName:    [firstName, lastName].filter(Boolean).join(' ') || 'Unknown',
        title:          personal?.title          || '',
        email:          personal?.email          || account?.email || '',
        phone:          personal?.mobile         || account?.phone || '',
        gender:         personal?.gender         || '',
        dateOfBirth:    fmtDate(personal?.dateOfBirth),
        placeOfBirth:   personal?.placeOfBirth   || '',
        countryOfBirth: personal?.countryOfBirth || '',
        citizenship:        personal?.citizenship        || '',
        passportNumber:     personal?.passportNumber     || '',
        passportIssueDate:  fmtDate(personal?.passportIssueDate),
        passportExpiryDate: fmtDate(personal?.passportExpiryDate),
        issuingCountry:     personal?.issuingCountry     || '',
        documentType:       personal?.documentType       || '',
        passportUploaded:   !!personal?.passportFileName   || !!docRec?.passport?.fileName,
        photographUploaded: !!personal?.photographFileName || !!docRec?.photo?.fileName,
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
        completionPercentage: lang.completionPercentage || 0,
        isCompleted:          lang.isCompleted          || false,
        documents: docRec ? {
          cvUploaded:         !!docRec.cv?.fileName,
          cvStatus:           docRec.cv?.documentStatus          || 'not_uploaded',
          photoUploaded:      !!docRec.photo?.fileName,
          photoStatus:        docRec.photo?.documentStatus        || 'not_uploaded',
          passportUploaded:   !!docRec.passport?.fileName,
          passportStatus:     docRec.passport?.documentStatus     || 'not_uploaded',
          transcriptUploaded: !!docRec.transcript?.fileName,
          transcriptStatus:   docRec.transcript?.documentStatus   || 'not_uploaded',
          diplomaUploaded:    !!docRec.diploma?.fileName,
          diplomaStatus:      docRec.diploma?.documentStatus      || 'not_uploaded',
          cert9thUploaded:    !!docRec.cert9th?.fileName,
          cert9thStatus:      docRec.cert9th?.documentStatus      || 'not_uploaded',
          cert10thUploaded:   !!docRec.cert10th?.fileName,
          cert10thStatus:     docRec.cert10th?.documentStatus     || 'not_uploaded',
          cert11thUploaded:   !!docRec.cert11th?.fileName,
          cert11thStatus:     docRec.cert11th?.documentStatus     || 'not_uploaded',
          cert12thUploaded:   !!docRec.cert12th?.fileName,
          cert12thStatus:     docRec.cert12th?.documentStatus     || 'not_uploaded',
          testScoresUploaded: !!docRec.testScores?.fileName,
          langProfUploaded:   !!docRec.languageProficiency?.fileName,
          recLetterUploaded:  !!docRec.recommendationLetter?.fileName,
          portfolioLink:      docRec.portfolioLink                || '',
          docsCompletionPct:  docRec.completionPercentage         || 0,
          docsCompleted:      docRec.isCompleted                  || false,
        } : null,
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
          grade9:     scoreRec.grade9     || {},
          grade10:    scoreRec.grade10    || {},
          grade11:    scoreRec.grade11    || {},
          grade12:    scoreRec.grade12    || {},
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
   GET /api/application/process-admin/gus-university/stats
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