import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  programId: { type: String, required: true },
  programName: { type: String, required: true },
  universityId: { type: String, required: true },
  universityName: { type: String, required: true },
  universityLogo: { type: String, default: '' },
  campus: { type: String, default: '' },
  country: { type: String, default: '' },
  ranking: { type: String, default: '' },
  programDetails: {
    level: { type: String, default: 'Undergraduate' },
    duration: { type: String, default: '3-4 years' },
    studyMode: { type: String, default: 'Full Time' }
  },
  intakeMonth: { type: String, default: 'September' },
  intakeYear: { type: Number, default: new Date().getFullYear() },
  deadline: { type: String, default: '31 August 2024' },
  tuitionFee: { type: Number, default: 0 },
  applicationFee: { type: Number, default: 0 },
  selectedAt: { type: Date, default: Date.now }
});

const progressStepSchema = new mongoose.Schema({
  stepId: { type: String, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  route: { type: String, default: '' }
});

const overviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Selected Course
  selectedCourse: {
    type: courseSchema,
    default: null
  },
  
  // Application Progress Tracking
  progress: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now },
    currentStep: { type: String, default: 'personal' }
  },
  
  // Steps Progress
  steps: [progressStepSchema],
  
  // Field Completion Tracking
  completedFields: {
    personalInfo: {
      firstName: { type: Boolean, default: false },
      lastName: { type: Boolean, default: false },
      dob: { type: Boolean, default: false },
      email: { type: Boolean, default: false }
    },
    addressInfo: {
      currentAddress: { type: Boolean, default: false },
      city: { type: Boolean, default: false },
      country: { type: Boolean, default: false }
    },
    educationInfo: {
      qualificationLevel: { type: Boolean, default: false },
      institutionName: { type: Boolean, default: false }
    },
    languageInfo: {
      englishTestType: { type: Boolean, default: false },
      testScore: { type: Boolean, default: false }
    }
  },
  
  // Application Status
  applicationStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'submitted'],
    default: 'not_started'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate progress before save
overviewSchema.pre('save', function(next) {
  // Calculate percentage based on completed fields
  let completedCount = 0;
  let totalCount = 0;
  
  // Count personal info fields
  Object.values(this.completedFields.personalInfo).forEach(field => {
    totalCount++;
    if (field) completedCount++;
  });
  
  // Count address info fields
  Object.values(this.completedFields.addressInfo).forEach(field => {
    totalCount++;
    if (field) completedCount++;
  });
  
  // Count education info fields
  Object.values(this.completedFields.educationInfo).forEach(field => {
    totalCount++;
    if (field) completedCount++;
  });
  
  // Count language info fields
  Object.values(this.completedFields.languageInfo).forEach(field => {
    totalCount++;
    if (field) completedCount++;
  });
  
  // Update progress percentage
  this.progress.percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Update application status based on progress
  if (this.progress.percentage === 0) {
    this.applicationStatus = 'not_started';
  } else if (this.progress.percentage > 0 && this.progress.percentage < 100) {
    this.applicationStatus = 'in_progress';
  } else if (this.progress.percentage === 100) {
    this.applicationStatus = 'completed';
  }
  
  // Update timestamp
  this.updatedAt = Date.now();
  this.progress.lastUpdated = Date.now();
  
  next();
});

// Initialize steps if not present
overviewSchema.pre('save', function(next) {
  if (this.steps.length === 0) {
    this.steps = [
      { stepId: 'personal', title: 'Personal Information', route: '/firstyear/dashboard/application/personal' },
      { stepId: 'address', title: 'Address & ID', route: '/firstyear/dashboard/application/address' },
      { stepId: 'education', title: 'Education', route: '/firstyear/dashboard/application/firsteducation' },
      { stepId: 'language', title: 'Language Proficiency', route: '/firstyear/dashboard/application/language' },
      { stepId: 'courses', title: 'Course Selection', route: '/firstyear/dashboard/application/firstcourses' }
    ];
  }
  next();
});

const Overview = mongoose.model('Overview', overviewSchema);

export default Overview;