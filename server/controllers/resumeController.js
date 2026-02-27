import mongoose from "mongoose";
import PersonalInfo from "../models/applicationModel.js";
import ApplicationAddress from "../models/applicationAddressModels.js";
import ApplicationEducation from "../models/applicationEducationModel.js";
import ApplicationLanguage from "../models/ApplicationLanguageModel.js";
import ApplicationSpecialNeed from "../models/ApplicationSpecialNeed.js";

/**
 * @route   GET /api/application/resume
 * @desc    Build resume from JWT student
 * @access  Private
 */
export const getResume = async (req, res) => {
  try {
    // ✅ studentId comes from JWT middleware (req.userId is resolved in authMiddleware)
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

    const [
      personal,
      address,
      education,
      language,
      specialNeed,
    ] = await Promise.all([
      PersonalInfo.findById(userId).lean(),
      ApplicationAddress.findOne({ userId }).lean(),
      ApplicationEducation.findOne({ userId }).lean(),
      ApplicationLanguage.findOne({ studentId: studentId }).lean(),
      ApplicationSpecialNeed.findOne({ studentId: userId }).lean(),
    ]);

    const educationEntry =
      education?.educationEntries?.length > 0
        ? education.educationEntries[0]
        : null;

    const resume = {
      // ── Basic personal ─────────────────────────────────────────
      firstName:   personal?.firstName   || "",
      lastName:    personal?.lastName    || "",
      email:       personal?.email       || "",
      mobile:      personal?.mobile      || "",

      // ── Personal info fields (now included) ────────────────────
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
      city:             address?.city        || "",
      state:            address?.state       || address?.stateProvince || "",
      postalCode:       address?.postalCode  || address?.postcode      || "",
      country:          address?.country     || "",

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
        ? {
            hasSpecialNeeds: specialNeed.hasSpecialNeeds || "no",
          }
        : null,
    };

    return res.status(200).json({
      success: true,
      resume,
    });
  } catch (error) {
    console.error("❌ Resume Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to build resume",
    });
  }
};