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
      enum: ["0", "1", "2", "3", ""],
      default: "",
    },
    futureACTSittings: {
      type: String,
      enum: ["0", "1", "2", "3", ""],
      default: "",
    },
    futureTestDate1: { type: String },
    futureTestDate2: { type: String },
    futureTestDate3: { type: String },
    // Dynamic attempt-based ACT scores
    actAttempts: [
      {
        date: { type: String },
        composite: { type: String },
        english: { type: String },
        math: { type: String },
        reading: { type: String },
        science: { type: String },
        writing: { type: String },
        percentile: { type: String },
        _id: false,
      },
    ],

    // =============================
    // 📊 SAT TESTS
    // =============================
    pastSATScores: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", ""],
      default: "",
    },
    // Dynamic attempt-based SAT scores
    satAttempts: [
      {
        date: { type: String },
        total: { type: String },
        math: { type: String },
        reading: { type: String },
        writing: { type: String },
        percentile: { type: String },
        _id: false,
      },
    ],

    // =============================
    // 📚 SAT SUBJECT TESTS
    // =============================
    numberOfSATSubjectTests: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", ""],
      default: "",
    },
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
    numberOfAPTests: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", ""],
      default: "",
    },
    apSubjectTests: [
      {
        subject: { type: String, trim: true },
        score: { type: String },
        month: { type: String },
        year: { type: String },
        _id: false,
      },
    ],

    // =============================
    // 🌍 IB SUBJECT TESTS
    // =============================
    numberOfIBTests: {
      type: String,
      enum: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", ""],
      default: "",
    },
    ibSubjectTests: [
      {
        subject: { type: String, trim: true },
        level: { type: String, enum: ["SL", "HL", ""], default: "" },
        score: { type: String },
        year: { type: String },
        _id: false,
      },
    ],

    // =============================
    // 🏛️ CAMBRIDGE EXAMS
    // =============================
    cambridgeNumberOfTests: {
  type: Number,
  default: 0,
},
    cambridgeTests: [
      {
        subject: { type: String, trim: true },
        level: { type: String, enum: ["AS", "A", "O", ""], default: "" },
        grade: { type: String },
        date: { type: String },
        _id: false,
      },
    ],

    // =============================
    // 🌐 TOEFL iBT
    // =============================
    toeflPastTests: {
      type: String,
      enum: ["0", "1", ""],
      default: "",
    },
    toeflTestDate: { type: String },
    toeflReadingScore: { type: String },
    toeflListeningScore: { type: String },
    toeflSpeakingScore: { type: String },
    toeflWritingScore: { type: String },
    toeflTotalScore: { type: String },

    // =============================
    // 📝 PTE ACADEMIC TESTS
    // =============================
    ptePastTests: {
      type: String,
      enum: ["0", "1", ""],
      default: "",
    },
    pteTestDate: { type: String },
    pteListeningScore: { type: String },
    pteReadingScore: { type: String },
    pteSpeakingScore: { type: String },
    pteWritingScore: { type: String },
    pteGrammarScore: { type: String },
    pteVocabularyScore: { type: String },

    // =============================
    // 🇬🇧 IELTS
    // =============================
    ieltsPastTests: {
      type: String,
      enum: ["0", "1", ""],
      default: "",
    },
    ieltsTestDate: { type: String },
    ieltsListeningScore: { type: String },
    ieltsReadingScore: { type: String },
    ieltsWritingScore: { type: String },
    ieltsSpeakingScore: { type: String },
    ieltsOverallBandScore: { type: String },

    // =============================
    // 🦉 DUOLINGO ENGLISH TEST
    // =============================
    duolingoPastTests: {
      type: String,
      enum: ["0", "1", ""],
      default: "",
    },
    duolingoTestDate: { type: String },
    duolingoLiteracyScore: { type: String },
    duolingoComprehensionScore: { type: String },
    duolingoConversationScore: { type: String },
    duolingoProductionScore: { type: String },
    duolingoTotalScore: { type: String },

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
    collection: "firsttestings",
  }
);

// Ensure one document per account
firstTestingSchema.index({ account: 1 }, { unique: true });

const FirstTesting = mongoose.model("FirstTesting", firstTestingSchema);
export default FirstTesting;