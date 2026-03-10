import mongoose from 'mongoose';

// Define a sub-schema for detailed program information
const programDetailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  program_name: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    enum: ['Bachelor', 'Master', 'PhD', 'Foundation', 'Diploma', 'Certificate'],
    default: 'Bachelor'
  },
  duration: {
    type: String,
    trim: true
  },
  studyMode: {
    type: String,
    enum: ['On Campus', 'Online', 'Hybrid', 'Distance Learning'],
    default: 'On Campus'
  },
  description: {
    type: String,
    trim: true
  },
  requirements: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Computer Science & IT',
      'Engineering',
      'Business & Management',
      'Arts & Humanities',
      'Social Sciences',
      'Natural Sciences',
      'Medical & Health Sciences',
      'Law',
      'Education',
      'Architecture',
      'Journalism',
      'Psychology',
      'Economics',
      'Political Science',
      'Other'
    ],
    default: 'Other'
  }
}, { 
  _id: false,  // Don't create _id for sub-documents
  timestamps: false 
});

const bachelorsUniversitySchema = new mongoose.Schema({
  // Basic Information
  universityName: {
    type: String,
    required: [true, 'University name is required'],
    trim: true,
    index: true
  },
  universityCode: {
    type: String,
    required: [true, 'University code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  establishedYear: {
    type: Number,
    required: [true, 'Established year is required'],
    min: [1000, 'Year must be at least 1000'],
    max: [new Date().getFullYear(), `Year cannot be greater than ${new Date().getFullYear()}`]
  },
  universityType: {
    type: String,
    required: [true, 'University type is required'],
    enum: [
      'Public University',
      'Private University',
      'Ivy League',
      'Liberal Arts College',
      'Research University',
      'Community College',
      'Technical Institute',
      'Art School'
    ]
  },
  accreditation: {
    type: String,
    trim: true
  },
  ranking: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    required: [true, 'Website is required'],
    trim: true,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please enter a valid URL'
    ]
  },
  
  // Location (USA focused)
  country: {
    type: String,
    default: 'United States',
    enum: ['United States']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    enum: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
      "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
      "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
      "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
      "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
      "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
      "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
      "Rhode Island", "South Carolina", "South Dakota", "Tennessee",
      "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
      "Wisconsin", "Wyoming", "District of Columbia"
    ]
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    index: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  zipCode: {
    type: String,
    required: [true, 'ZIP code is required'],
    trim: true
  },
  
  // Contact
  adminEmail: {
    type: String,
    required: [true, 'Admin email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  adminPhone: {
    type: String,
    required: [true, 'Admin phone is required'],
    trim: true
  },
  admissionEmail: {
    type: String,
    required: [true, 'Admission email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  admissionPhone: {
    type: String,
    trim: true
  },
  
  // Academic Details - UPDATED to support both formats
  // Keep simple program categories for backward compatibility
  programCategories: [{
    type: String,
    enum: [
      'Computer Science & IT',
      'Engineering',
      'Business & Management',
      'Arts & Humanities',
      'Social Sciences',
      'Natural Sciences',
      'Medical & Health Sciences',
      'Law',
      'Education',
      'Architecture',
      'Journalism',
      'Psychology',
      'Economics',
      'Political Science'
    ]
  }],
  
  // NEW: Detailed program information
  programs: [programDetailSchema],
  
  intakes: [{
    type: String,
    trim: true
  }],
  applicationDeadlines: {
    earlyDecision: String,
    earlyAction: String,
    regularDecision: String,
    rolling: String
  },
  tuitionFees: {
    inState: {
      type: String,
      required: [true, 'In-state tuition is required'],
      trim: true
    },
    outOfState: String,
    international: String,
    roomAndBoard: String
  },
  
  // Requirements
  minimumGPA: String,
  satRequirements: {
    math: String,
    reading: String,
    total: String
  },
  actRequirements: {
    composite: String
  },
  
  // UPDATED: Added more English test options
  englishTests: [{
    type: String,
    enum: [
      'TOEFL iBT', 
      'IELTS Academic', 
      'PTE Academic', 
      'Duolingo English Test',
      'Cambridge English',
      'GRE',
      'GMAT',
      'SAT',
      'ACT'
    ]
  }],
  
  // UPDATED: Application requirements can now be objects or strings
  applicationRequirements: [{
    type: String,
    trim: true
  }],
  
  // Media
  universityLogo: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  createdBy: {
    type: String,
    default: 'admin'
  },
  programCount: {
    type: Number,
    default: 0
  },
  
  // To track which format is being used
  dataFormat: {
    type: String,
    enum: ['simple', 'detailed'],
    default: 'detailed'
  }
}, {
  timestamps: true
});

// Update timestamp and program count on save
bachelorsUniversitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate program count from detailed programs if available
  if (this.programs && Array.isArray(this.programs)) {
    this.programCount = this.programs.length;
  } else if (this.programCategories && Array.isArray(this.programCategories)) {
    this.programCount = this.programCategories.length;
  }
  
  next();
});

// Index for search - updated to include program details
bachelorsUniversitySchema.index({ 
  universityName: 'text', 
  city: 'text',
  'programs.name': 'text',
  'programs.description': 'text'
});

// Virtual for getting program names (useful for display)
bachelorsUniversitySchema.virtual('programNames').get(function() {
  if (this.programs && Array.isArray(this.programs)) {
    return this.programs.map(p => p.name);
  }
  return this.programCategories || [];
});

// Use a different model name to avoid conflict
const BachelorsUniversity = mongoose.models.BachelorsUniversity || mongoose.model('BachelorsUniversity', bachelorsUniversitySchema);

export default BachelorsUniversity;