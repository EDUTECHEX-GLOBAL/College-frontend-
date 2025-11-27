// models/testModel.js
import mongoose from 'mongoose';

const testingSchema = new mongoose.Schema({
  // Reference to the student
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransferStudent',
    required: true,
    unique: true
  },

  // Tests Taken Section
  selfReportTests: { 
    type: Boolean, 
    default: false 
  },
  selectedTests: [{ 
    type: String 
  }],
  internationalApplicant: { 
    type: Boolean, 
    default: null 
  },

  // ACT Tests
  actTestsCount: { 
    type: Number, 
    default: 0 
  },
  actTests: [{
    compositeScore: { type: String },
    testDate: { type: String },
    englishScore: { type: String },
    mathScore: { type: String },
    readingScore: { type: String },
    scienceScore: { type: String },
    writingScore: { type: String },
    englishLanguageArtsScore: { type: String },
    stemScore: { type: String },
    futureTestsCount: { type: Number, default: 0 },
    futureTestDates: [{ type: String }]
  }],

  // SAT Tests
  satTestsCount: { 
    type: Number, 
    default: 0 
  },
  satTests: [{
    totalScore: { type: String },
    testDate: { type: String },
    readingWritingScore: { type: String },
    mathScore: { type: String },
    essayReading: { type: String },
    essayAnalysis: { type: String },
    essayWriting: { type: String },
    reportEssay: { type: Boolean, default: false },
    futureTestsCount: { type: Number, default: 0 },
    futureTestDates: [{ type: String }]
  }],

  // SAT Subject Tests
  satSubjectTestsCount: { 
    type: Number, 
    default: 0 
  },
  satSubjectTests: [{
    subject: { type: String },
    score: { type: String },
    testDate: { type: String }
  }],

  // AP Tests
  apTestsCount: { 
    type: Number, 
    default: 0 
  },
  apTests: [{
    subject: { type: String },
    score: { type: String },
    testDate: { type: String }
  }],

  // IB Tests
  ibTestsCount: { 
    type: Number, 
    default: 0 
  },
  ibTests: [{
    subject: { type: String },
    level: { type: String }, // HL or SL
    score: { type: String },
    testDate: { type: String },
    predicted: { type: Boolean, default: false }
  }],

  // Cambridge Tests
  cambridgeTestsCount: { 
    type: Number, 
    default: 0 
  },
  cambridgeTests: [{
    examType: { type: String },
    subject: { type: String },
    grade: { type: String },
    testDate: { type: String },
    predicted: { type: Boolean, default: false }
  }],

  // TOEFL iBT Tests
  toeflTestsCount: { 
    type: Number, 
    default: 0 
  },
  toeflTests: [{
    readingScore: { type: String },
    readingDate: { type: String },
    speakingScore: { type: String },
    speakingDate: { type: String },
    listeningScore: { type: String },
    listeningDate: { type: String },
    writingScore: { type: String },
    writingDate: { type: String },
    totalScore: { type: String },
    totalScoreDate: { type: String },
    futureTestsCount: { type: Number, default: 0 }
  }],

  // PTE Academic Tests
  pteTestsCount: { 
    type: Number, 
    default: 0 
  },
  pteTests: [{
    overallScore: { type: String },
    listeningScore: { type: String },
    readingScore: { type: String },
    speakingScore: { type: String },
    writingScore: { type: String },
    testDate: { type: String },
    planFutureTest: { type: Boolean, default: false },
    futureTestDate: { type: String }
  }],

  // IELTS Tests
  ieltsTestsCount: { 
    type: Number, 
    default: 0 
  },
  ieltsTests: [{
    testType: { type: String, enum: ['Academic', 'General Training'], default: 'Academic' },
    overallBand: { type: String },
    listeningBand: { type: String },
    readingBand: { type: String },
    writingBand: { type: String },
    speakingBand: { type: String },
    testDate: { type: String },
    planFutureTest: { type: Boolean, default: false },
    futureTestDate: { type: String }
  }],

  // Duolingo English Tests
  duolingoTestsCount: { 
    type: Number, 
    default: 0 
  },
  duolingoTests: [{
    overallScore: { type: String },
    literacyScore: { type: String },
    comprehensionScore: { type: String },
    conversationScore: { type: String },
    productionScore: { type: String },
    testDate: { type: String },
    planFutureTest: { type: Boolean, default: false },
    futureTestDate: { type: String }
  }],

  // Senior Secondary Leaving Examinations
  seniorSecondaryExamsCount: { 
    type: Number, 
    default: 0 
  },
  seniorSecondaryExams: [{
    examName: { type: String },
    country: { type: String },
    subject: { type: String },
    grade: { type: String },
    testDate: { type: String }
  }],

  // Progress tracking
  testingCompletion: {
    testsTaken: { type: Boolean, default: false },
    actTests: { type: Boolean, default: false },
    satTests: { type: Boolean, default: false },
    satSubjectTests: { type: Boolean, default: false },
    apTests: { type: Boolean, default: false },
    ibTests: { type: Boolean, default: false },
    cambridgeTests: { type: Boolean, default: false },
    toeflTests: { type: Boolean, default: false },
    pteTests: { type: Boolean, default: false },
    ieltsTests: { type: Boolean, default: false },
    duolingoTests: { type: Boolean, default: false },
    seniorSecondaryExams: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Create index on studentId for faster queries
testingSchema.index({ studentId: 1 });

const Testing = mongoose.model('Testing', testingSchema);

export default Testing;
