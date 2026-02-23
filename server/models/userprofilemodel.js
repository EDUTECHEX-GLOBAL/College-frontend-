// src/models/userprofilemodel.js
import mongoose from 'mongoose';

// Schema for selected courses
const selectedCourseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  program_name: {
    type: String
  },
  level: {
    type: String,
    enum: ['Bachelor', 'Master', 'PhD', 'Undergraduate', 'Graduate', 'Diploma', 'Certificate'],
    default: 'Undergraduate'
  },
  studyMode: {
    type: String,
    enum: ['On Campus', 'Online', 'Hybrid', 'Distance Learning'],
    default: 'On Campus'
  },
  duration: {
    type: String
  },
  locations: [{
    type: String
  }],
  majorArea: {
    type: String
  },
  description: {
    type: String
  },
  credits: {
    type: Number
  },
  fees: {
    type: String
  }
}, { _id: false });

// Updated university schema with course support
const selectedUniversitySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  unitid: {
    type: Number
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  country: {
    type: String,
    default: 'USA'
  },
  isKansas: {
    type: Boolean,
    default: false
  },
  // Selected courses for this university
  selectedCourses: {
    type: [selectedCourseSchema],
    validate: {
      validator: function(courses) {
        // Kansas universities can have 0 courses, others max 2
        if (this.isKansas) return courses.length <= 2;
        return courses.length <= 2;
      },
      message: 'Maximum 2 courses can be selected per university'
    },
    default: []
  },
  // Store the full university data for reference
  fullData: {
    type: mongoose.Schema.Types.Mixed
  }
});

const basicInfoSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  dob: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say']
  },
  nationality: {
    type: String,
    required: true,
    trim: true
  },
  residence: {
    type: String,
    required: true,
    trim: true
  }
});

const educationSchema = new mongoose.Schema({
  qualification: {
    type: String,
    required: true,
    enum: ['12th', 'Bachelor', 'Master']
  },
  institution: {
    type: String,
    required: true,
    trim: true
  },
  field: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: true,
    trim: true
  },
  cgpa: {
    type: String,
    required: true,
    trim: true
  }
});

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  profileImage: {
    type: String,
    default: null
  },
  basicInfo: {
    type: basicInfoSchema,
    required: true
  },
  education: {
    type: educationSchema,
    required: true
  },
  eligibleProgram: {
    type: String,
    required: true,
    enum: ['Bachelor', 'Master', 'PhD']
  },
  selectedUniversities: {
    type: [selectedUniversitySchema],
    validate: {
      validator: function(unis) {
        return unis.length >= 3 && unis.length <= 5;
      },
      message: 'Please select between 3 and 5 universities'
    },
    default: []
  },
  // For backward compatibility
  selectedCourses: {
    type: Map,
    of: [selectedCourseSchema],
    default: {}
  },
  profileCompleted: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated on save
userProfileSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Validate that non-Kansas universities have at least one course
userProfileSchema.pre('save', function(next) {
  for (const uni of this.selectedUniversities) {
    if (!uni.isKansas && (!uni.selectedCourses || uni.selectedCourses.length === 0)) {
      next(new Error(`Please select at least one course for ${uni.name}`));
      return;
    }
  }
  next();
});

// Index for faster queries
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ 'basicInfo.email': 1 });
userProfileSchema.index({ eligibleProgram: 1 });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;