// src/models/userprofilemodel.js
import mongoose from 'mongoose';

const selectedUniversitySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'USA'
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
    type: String, // Changed from ObjectId to String to avoid User model reference
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
  selectedUniversities: [selectedUniversitySchema],
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

// Index for faster queries
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ 'basicInfo.email': 1 });
userProfileSchema.index({ eligibleProgram: 1 });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;