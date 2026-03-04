import mongoose from "mongoose";
import PersonalInfo from "../models/applicationModel.js";
import ApplicationAddress from "../models/applicationAddressModels.js";
import ApplicationEducation from "../models/applicationEducationModel.js";
import ApplicationLanguage from "../models/ApplicationLanguageModel.js";
import ApplicationSpecialNeed from "../models/ApplicationSpecialNeed.js";
import ApplicationScore from "../models/ApplicationScore.js";

const GRADE_KEYS = ["grade9", "grade10", "grade11", "grade12"];

/**
 * Convert the DB grade format back to frontend-friendly shape
 * DB:       { grade9: { subjects: [{ subject, marks }] }, ... }
 * Frontend: { gradeSubjects: { grade9: ["Math"] }, subjectMarks: { grade9: { Math: "98" } } }
 */
const parseGradePayload = (scoreDoc) => {
  const gradeSubjects = {};
  const subjectMarks  = {};

  GRADE_KEYS.forEach((grade) => {
    const subjects = scoreDoc?.[grade]?.subjects || [];
    gradeSubjects[grade] = subjects.map((s) => s.subject);
    subjectMarks[grade]  = {};
    subjects.forEach((s) => {
      subjectMarks[grade][s.subject] = s.marks;
    });
  });

  return { gradeSubjects, subjectMarks };
};

/**
 * @route   GET /api/application/resume
 * @desc    Build resume from JWT student (includes score data)
 * @access  Private
 */
export const getResume = async (req, res) => {
  try {
    const studentId = req.userId;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Student ID not found in token. Please sign in again.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID from token",
      });
    }

    const userId = new mongoose.Types.ObjectId(studentId);

    // ── Fetch all data in parallel (score included) ──────────────
    const [
      personal,
      address,
      education,
      language,
      specialNeed,
      scoreDoc,
    ] = await Promise.all([
      PersonalInfo.findById(userId).lean(),
      ApplicationAddress.findOne({ userId }).lean(),
      ApplicationEducation.findOne({ userId }).lean(),
      ApplicationLanguage.findOne({ studentId }).lean(),
      ApplicationSpecialNeed.findOne({ studentId: userId }).lean(),
      ApplicationScore.findOne({ studentId: userId }).lean(),
    ]);

    const educationEntry =
      education?.educationEntries?.length > 0
        ? education.educationEntries[0]
        : null;

    // ── Parse grade subjects/marks from DB format ─────────────────
    const { gradeSubjects, subjectMarks } = parseGradePayload(scoreDoc);

    const resume = {
      // ── Basic personal ─────────────────────────────────────────
      firstName: personal?.firstName || "",
      lastName:  personal?.lastName  || "",
      email:     personal?.email     || "",
      mobile:    personal?.mobile    || "",

      // ── Personal info ──────────────────────────────────────────
      title:                  personal?.title                  || "",
      dateOfBirth:            personal?.dateOfBirth            || "",
      placeOfBirth:           personal?.placeOfBirth           || "",
      countryOfBirth:         personal?.countryOfBirth         || "",
      citizenship:            personal?.citizenship            || "",
      gender:                 personal?.gender                 || "",
      correspondenceLanguage: personal?.correspondenceLanguage || "",
      isEUCitizen:            personal?.isEUCitizen            ?? null,
      needVisa:               personal?.needVisa               || "",

      // ── Passport ───────────────────────────────────────────────
      passportNumber:     personal?.passportNumber     || "",
      passportIssueDate:  personal?.passportIssueDate  || "",
      passportExpiryDate: personal?.passportExpiryDate || "",
      issuingCountry:     personal?.issuingCountry     || "",

      // ── Address ────────────────────────────────────────────────
      permanentAddress: address?.fullPermanentAddress || "",
      currentAddress:   address?.streetAndHouseNumber || address?.fullPermanentAddress || "",
      city:             address?.city       || "",
      state:            address?.state      || address?.stateProvince || "",
      postalCode:       address?.postalCode || address?.postcode      || "",
      country:          address?.country    || "",

      // ── Education ──────────────────────────────────────────────
      education: educationEntry
        ? {
            degree:          educationEntry.degree          || "",
            institutionName: educationEntry.institutionName || "",
            boardUniversity: educationEntry.boardUniversity || educationEntry.specialisation || "",
            countryOfStudy:  educationEntry.countryOfStudy  || "",
            startYear:       educationEntry.startYear       || "",
            endYear:         educationEntry.endYear         || "",
            score:           educationEntry.score           || educationEntry.remarks || "",
            resultStatus:    educationEntry.resultStatus    || "",
            gradingSystem:   educationEntry.gradingSystem   || "",
          }
        : null,

      // ── Language / EQHE ────────────────────────────────────────
      language: language
        ? {
            eqheOriginalTitle: language.eqheOriginalTitle || "",
            eqheCountry:       language.eqheCountry       || "",
            testScore:         language.testScore         || "",
            testDate:          language.testDate          || language.eqheDate || "",
            listeningScore:    language.listeningScore    || "",
            readingScore:      language.readingScore      || "",
            writingScore:      language.writingScore      || "",
            speakingScore:     language.speakingScore     || "",
          }
        : null,

      // ── Special Needs ──────────────────────────────────────────
      specialNeeds: specialNeed
        ? { hasSpecialNeeds: specialNeed.hasSpecialNeeds || "no" }
        : null,

      // ── Academic Scores (NEW) ──────────────────────────────────
      scores: scoreDoc
        ? {
            // Grade-wise subject marks (frontend shape)
            gradeSubjects,
            subjectMarks,

            // SAT
            satTotal:   scoreDoc.satTotal   || "",
            satMath:    scoreDoc.satMath     || "",
            satReading: scoreDoc.satReading  || "",
            satDate:    scoreDoc.satDate     || "",

            // PSAT
            psatTotal:   scoreDoc.psatTotal   || "",
            psatMath:    scoreDoc.psatMath     || "",
            psatReading: scoreDoc.psatReading  || "",
            psatDate:    scoreDoc.psatDate     || "",

            // ACT
            act:     scoreDoc.act     || "",
            actDate: scoreDoc.actDate || "",

            // TOEFL
            toefl:     scoreDoc.toefl     || "",
            toeflDate: scoreDoc.toeflDate || "",

            // IELTS
            ielts:     scoreDoc.ielts     || "",
            ieltsDate: scoreDoc.ieltsDate || "",

            // AP
            ap:     scoreDoc.ap     || "",
            apDate: scoreDoc.apDate || "",

            // PTE
            pte:     scoreDoc.pte     || "",
            pteDate: scoreDoc.pteDate || "",

            // Duolingo
            duolingo:     scoreDoc.duolingo     || "",
            duolingoDate: scoreDoc.duolingoDate || "",
          }
        : null,
    };

    return res.status(200).json({ success: true, resume });

  } catch (error) {
    console.error("❌ Resume Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to build resume",
    });
  }
};