// server/models/firstTestingModel.js
import mongoose from "mongoose";

const firstTestingSchema = new mongoose.Schema(
  {
    // Reference to the account (one Testing document per Account)
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    // =============================
    // 📋 TESTS TAKEN SECTION
    // =============================
    selfReportScores: {
      type: String,
      enum: ["yes", "no", ""],
      default: "",
    },
    testsToReport: [
      {
        type: String,
        enum: [
          "act-tests",
          "sat-tests",
          "sat-subject-tests",
          "ap-subject-tests",
          "ib-subject-tests",
          "cambridge",
          "toefl-ibt",
          "pte-academic-tests",
          "ielts",
          "duolingo-english-test",
          "senior-secondary-exams",
        ],
      },
    ],
    internationalPromotionExams: {
      type: String,
      enum: ["yes", "no", ""],
      default: "",
    },

    // =============================
    // 📊 ACT TESTS
    // =============================
    pastACTScores: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", ""],
      default: "",
    },
    futureACTSittings: {
      type: String,
      enum: ["0", "1", "2", "3", ""],
      default: "",
    },
    highestCompositeScore: { type: String },
    highestCompositeDate: { type: String },
    highestMathScore: { type: String },
    highestMathDate: { type: String },
    highestEnglishScore: { type: String },
    highestEnglishDate: { type: String },
    highestReadingScore: { type: String },
    highestReadingDate: { type: String },
    reportScienceScore: {
      type: String,
      enum: ["yes", "no", ""],
      default: "",
    },
    highestScienceScore: { type: String },
    highestScienceDate: { type: String },
    reportWritingScore: {
      type: String,
      enum: ["yes", "no", ""],
      default: "",
    },
    highestWritingScore: { type: String },
    highestWritingDate: { type: String },
    futureTestDate1: { type: String },
    futureTestDate2: { type: String },
    futureTestDate3: { type: String },

    // =============================
    // 📊 SAT TESTS
    // =============================
    pastSATScores: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", ""],
      default: "",
    },
    futureSATSittings: {
      type: String,
      enum: ["0", "1", "2", "3", ""],
      default: "",
    },
    satHighestMathScore: { type: String },
    satHighestMathDate: { type: String },
    satHighestReadingScore: { type: String },
    satHighestReadingDate: { type: String },
    satHighestWritingScore: { type: String },
    satHighestWritingDate: { type: String },
    satHighestTotalScore: { type: String },
    satHighestTotalDate: { type: String },
    satFutureTestDate1: { type: String },
    satFutureTestDate2: { type: String },
    satFutureTestDate3: { type: String },

    // =============================
    // 📚 SAT SUBJECT TESTS
    // =============================
    satSubjectTests: [
      {
        subject: { type: String, trim: true },
        score: { type: String },
        date: { type: String },
        _id: false,
      },
    ],

    // =============================
    // 🎯 AP SUBJECT TESTS
    // =============================
    apSubjectTests: [
      {
        name: { type: String, trim: true },
        score: { type: String },
        year: { type: String },
        _id: false,
      },
    ],

    // =============================
    // 🌍 IB SUBJECT TESTS
    // =============================
    ibSubjectTests: [
      {
        subject: { type: String, trim: true },
        // ✅ ACCEPT BOTH SHORT + LABEL VALUES
        level: {
          type: String,
          enum: [
            "sl",
            "hl",
            "Standard level (SL)",
            "Higher level (HL)",
            "",
          ],
        },
        score: { type: String },
        year: { type: String },
        _id: false,
      },
    ],

    // =============================
    // 🏛️ CAMBRIDGE EXAMS
    // =============================
    cambridgeNumberOfTests: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", ""],
      default: "",
    },
    cambridgeTests: [
      {
        subject: { type: String, trim: true },
        level: { type: String, enum: ["as", "a", "o", ""] },
        grade: { type: String },
        date: { type: String },
        _id: false,
      },
    ],
    cambridgeCertificateReport: {
      type: String,
      enum: ["yes", "no", ""],
      default: "",
    },
    cambridgeCertificateDetails: {
      level: { type: String },
      date: { type: String },
    },

    // =============================
    // 🌐 TOEFL iBT
    // =============================
    toeflPastTests: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", ""],
      default: "",
    },
    toeflFutureSittings: {
      type: String,
      enum: ["0", "1", "2", "3", ""],
      default: "",
    },
    toeflHighestReadingScore: { type: String },
    toeflReadingScoreDate: { type: String },
    toeflHighestSpeakingScore: { type: String },
    toeflSpeakingScoreDate: { type: String },
    toeflHighestListeningScore: { type: String },
    toeflListeningScoreDate: { type: String },
    toeflHighestWritingScore: { type: String },
    toeflWritingScoreDate: { type: String },
    toeflHighestTotalScore: { type: String },
    toeflTotalScoreDate: { type: String },
    toeflFutureTestDate1: { type: String },
    toeflFutureTestDate2: { type: String },
    toeflFutureTestDate3: { type: String },

    // =============================
    // 📝 PTE ACADEMIC TESTS
    // =============================
    ptePastTests: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", ""],
      default: "",
    },
    pteFutureSittings: {
      type: String,
      enum: ["0", "1", "2", "3", ""],
      default: "",
    },
    pteHighestListeningScore: { type: String },
    pteListeningScoreDate: { type: String },
    pteHighestReadingScore: { type: String },
    pteReadingScoreDate: { type: String },
    pteHighestSpeakingScore: { type: String },
    pteSpeakingScoreDate: { type: String },
    pteHighestWritingScore: { type: String },
    pteWritingScoreDate: { type: String },
    pteHighestGrammarScore: { type: String },
    pteGrammarScoreDate: { type: String },
    pteHighestOralFluencyScore: { type: String },
    pteOralFluencyScoreDate: { type: String },
    pteHighestPronunciationScore: { type: String },
    ptePronunciationScoreDate: { type: String },
    pteHighestSpellingScore: { type: String },
    pteSpellingScoreDate: { type: String },
    pteHighestVocabularyScore: { type: String },
    pteVocabularyScoreDate: { type: String },
    pteHighestWrittenDiscourseScore: { type: String },
    pteWrittenDiscourseScoreDate: { type: String },
    pteFutureTestDate1: { type: String },
    pteFutureTestDate2: { type: String },
    pteFutureTestDate3: { type: String },

    // =============================
    // 🇬🇧 IELTS
    // =============================
    ieltsPastTests: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", ""],
      default: "",
    },
    ieltsFutureSittings: {
      type: String,
      enum: ["0", "1", "2", "3", ""],
      default: "",
    },
    ieltsHighestListeningScore: { type: String },
    ieltsListeningScoreDate: { type: String },
    ieltsHighestReadingScore: { type: String },
    ieltsReadingScoreDate: { type: String },
    ieltsHighestWritingScore: { type: String },
    ieltsWritingScoreDate: { type: String },
    ieltsHighestSpeakingScore: { type: String },
    ieltsSpeakingScoreDate: { type: String },
    ieltsHighestOverallScore: { type: String },
    ieltsOverallScoreDate: { type: String },
    ieltsFutureTestDate1: { type: String },
    ieltsFutureTestDate2: { type: String },
    ieltsFutureTestDate3: { type: String },

    // =============================
    // 🦉 DUOLINGO ENGLISH TEST
    // =============================
    duolingoPastTests: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", ""],
      default: "",
    },
    duolingoFutureSittings: {
      type: String,
      enum: ["0", "1", "2", "3", ""],
      default: "",
    },
    duolingoHighestLiteracyScore: { type: String },
    duolingoLiteracyScoreDate: { type: String },
    duolingoHighestComprehensionScore: { type: String },
    duolingoComprehensionScoreDate: { type: String },
    duolingoHighestConversationScore: { type: String },
    duolingoConversationScoreDate: { type: String },
    duolingoHighestProductionScore: { type: String },
    duolingoProductionScoreDate: { type: String },
    duolingoHighestTotalScore: { type: String },
    duolingoTotalScoreDate: { type: String },
    duolingoFutureTestDate1: { type: String },
    duolingoFutureTestDate2: { type: String },
    duolingoFutureTestDate3: { type: String },

    // =============================
    // 🎓 SENIOR SECONDARY EXAMS
    // =============================
    seniorSecondaryExams: [
      {
        examType: { type: String, trim: true },
        subject: { type: String, trim: true },
        score: { type: String },
        year: { type: String },
        board: { type: String, trim: true },
        _id: false,
      },
    ],

    // =============================
    // 📈 TESTING COMPLETION TRACKING
    // =============================
    // Use Mixed to avoid boolean cast errors from "", etc.
    testingCompletion: {
      testsTaken: { type: mongoose.Schema.Types.Mixed, default: false },
      actTests: { type: mongoose.Schema.Types.Mixed, default: false },
      satTests: { type: mongoose.Schema.Types.Mixed, default: false },
      satSubjectTests: { type: mongoose.Schema.Types.Mixed, default: false },
      apSubjectTests: { type: mongoose.Schema.Types.Mixed, default: false },
      ibSubjectTests: { type: mongoose.Schema.Types.Mixed, default: false },
      cambridge: { type: mongoose.Schema.Types.Mixed, default: false },
      toeflIbt: { type: mongoose.Schema.Types.Mixed, default: false },
      pteAcademic: { type: mongoose.Schema.Types.Mixed, default: false },
      ielts: { type: mongoose.Schema.Types.Mixed, default: false },
      duolingo: { type: mongoose.Schema.Types.Mixed, default: false },
      seniorSecondary: { type: mongoose.Schema.Types.Mixed, default: false },
    },

    // Overall testing progress percentage
    testingProgress: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "firsttestings", // separate collection
  }
);

// Ensure one document per account
firstTestingSchema.index({ account: 1 }, { unique: true });

const FirstTesting = mongoose.model("FirstTesting", firstTestingSchema);
export default FirstTesting;
