import mongoose from 'mongoose';

const personalInfoSchema = new mongoose.Schema({
  // Personal Details
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  dob: { type: Date, default: null },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'], 
    default: 'Prefer not to say' 
  },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  nationality: { type: String, default: '' },
  
  // Address
  currentAddress: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  
  // Passport/ID
  passportNumber: { type: String, default: '' },
  passportExpiry: { type: Date, default: null },
  idType: { type: String, enum: ['Passport', 'National ID', 'Driver License'], default: 'Passport' }
});

const educationInfoSchema = new mongoose.Schema({
  // High School/Secondary Education
  qualificationLevel: { type: String, default: '' },
  institutionName: { type: String, default: '' },
  countryOfEducation: { type: String, default: '' },
  yearOfCompletion: { type: Number, default: null },
  gradingSystem: { type: String, default: '' },
  grade: { type: String, default: '' },
  gpa: { type: Number, default: null },
  percentage: { type: Number, default: null },
  qualificationType: { type: String, default: '' },
  majorSubject: { type: String, default: '' }
});

const englishTestSchema = new mongoose.Schema({
  englishTestType: { 
    type: String, 
    enum: ['IELTS', 'TOEFL', 'PTE', 'Duolingo', 'None'], 
    default: 'None' 
  },
  testScore: { type: Number, default: null },
  listeningScore: { type: Number, default: null },
  readingScore: { type: Number, default: null },
  writingScore: { type: Number, default: null },
  speakingScore: { type: Number, default: null },
  overallBand: { type: Number, default: null },
  testDate: { type: Date, default: null },
  trfNumber: { type: String, default: '' }
});

const programSchema = new mongoose.Schema({
  programId: { type: String, required: true },
  programName: { type: String, required: true },
  universityId: { type: String, required: true },
  universityName: { type: String, required: true },
  campus: { type: String, default: '' },
  intakeMonth: { type: String, default: '' },
  intakeYear: { type: Number, default: new Date().getFullYear() },
  level: { type: String, default: '' },
  duration: { type: String, default: '' },
  studyMode: { type: String, default: 'Full Time' },
  tuitionFee: { type: Number, default: null },
  applicationFee: { type: Number, default: null },
  selectedAt: { type: Date, default: Date.now }
});

const documentSchema = new mongoose.Schema({
  documentType: { type: String, required: true },
  documentName: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Pending', 'Uploaded', 'Verified', 'Rejected'], 
    default: 'Pending' 
  }
});

const firstApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  applicationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  personalInfo: {
    type: personalInfoSchema,
    default: () => ({})
  },
  educationInfo: {
    type: educationInfoSchema,
    default: () => ({})
  },
  englishTest: {
    type: englishTestSchema,
    default: () => ({})
  },
  selectedPrograms: [programSchema],
  documents: [documentSchema],
  
  // Application Status & Progress
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlisted'],
    default: 'draft'
  },
  currentStep: {
    type: String,
    default: 'personal'
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: {
    type: Date,
    default: null
  }
});

// Generate application number before save
firstApplicationSchema.pre('save', function(next) {
  if (this.isNew && !this.applicationNumber) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.applicationNumber = `APP-${year}-${randomNum}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Update completion percentage before save
firstApplicationSchema.pre('save', function(next) {
  let completedFields = 0;
  let totalFields = 0;

  // Personal Info Fields
  const personalFields = ['firstName', 'lastName', 'dob', 'email', 'phone', 'nationality', 'currentAddress', 'city', 'country'];
  totalFields += personalFields.length;
  completedFields += personalFields.filter(field => this.personalInfo[field] && this.personalInfo[field].toString().trim() !== '').length;

  // Education Fields
  const educationFields = ['qualificationLevel', 'institutionName', 'countryOfEducation', 'yearOfCompletion'];
  totalFields += educationFields.length;
  completedFields += educationFields.filter(field => this.educationInfo[field] && this.educationInfo[field].toString().trim() !== '').length;

  // English Test Fields
  if (this.englishTest.englishTestType !== 'None') {
    const englishFields = ['testScore', 'testDate'];
    totalFields += englishFields.length;
    completedFields += englishFields.filter(field => this.englishTest[field] && this.englishTest[field].toString().trim() !== '').length;
  } else {
    totalFields += 1;
    completedFields += 1; // "None" is considered complete
  }

  // Selected Programs
  totalFields += 1;
  if (this.selectedPrograms && this.selectedPrograms.length > 0) {
    completedFields += 1;
  }

  this.completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  next();
});

const FirstApplication = mongoose.model('FirstApplication', firstApplicationSchema);

export default FirstApplication;