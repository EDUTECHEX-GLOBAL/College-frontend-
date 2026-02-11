import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    index: true
  },
  
  programId: {
    type: String,
    required: [true, 'Program ID is required'],
    unique: true,
    index: true
  },
  
  // University Reference
  universityId: {
    type: String,
    required: [true, 'University ID is required'],
    index: true
  },
  
  universityName: {
    type: String,
    required: [true, 'University name is required'],
    index: true
  },
  
  universityUnitId: {
    type: String,
    required: [true, 'University UNITID is required']
  },
  
  // Program Details
  description: {
    type: String,
    required: [true, 'Course description is required']
  },
  
  level: {
    type: String,
    enum: ['Undergraduate', 'Graduate', 'Postgraduate', 'Doctorate', 'Diploma', 'Certificate', 'Foundation'],
    default: 'Undergraduate',
    index: true
  },
  
  studyMode: {
    type: String,
    enum: ['On Campus', 'Online', 'Hybrid', 'Distance Learning', 'Evening', 'Weekend'],
    default: 'On Campus',
    index: true
  },
  
  duration: {
    type: String,
    default: '3-4 years'
  },
  
  // Locations
  locations: [{
    type: String,
    default: []
  }],
  
  campus: {
    type: String,
    default: 'Main Campus'
  },
  
  // Fees Structure
  fees: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['per year', 'per semester', 'total', 'per credit', 'per month'],
      default: 'per year'
    },
    displayText: {
      type: String
    },
    additionalFees: [{
      name: String,
      amount: Number,
      description: String
    }],
    scholarshipAvailable: {
      type: Boolean,
      default: false
    },
    financialAidAvailable: {
      type: Boolean,
      default: false
    }
  },
  
  // Requirements
  requirements: {
    academic: [{
      type: String
    }],
    language: [{
      name: String,
      minimumScore: String,
      required: {
        type: Boolean,
        default: false
      }
    }],
    documents: [{
      type: String
    }],
    minimumGPA: {
      type: Number,
      min: 0,
      max: 4.0
    },
    minimumPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    entranceExam: {
      required: {
        type: Boolean,
        default: false
      },
      exams: [String]
    },
    workExperience: {
      required: {
        type: Boolean,
        default: false
      },
      years: Number
    },
    description: {
      type: String,
      default: 'High school diploma or equivalent'
    }
  },
  
  // Major Area
  majorArea: {
    type: String,
    required: [true, 'Major area is required'],
    index: true
  },
  
  // Specializations
  specializations: [{
    type: String
  }],
  
  // Application Details
  intakeMonths: [{
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December']
  }],
  
  applicationDeadline: {
    type: Date
  },
  
  startDate: {
    type: Date
  },
  
  // Status Flags
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isAvailableForInternational: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Application Statistics
  totalApplications: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalAccepted: {
    type: Number,
    default: 0,
    min: 0
  },
  
  acceptanceRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Views/Engagement
  views: {
    type: Number,
    default: 0
  },
  
  saves: {
    type: Number,
    default: 0
  },
  
  // SEO & Metadata
  keywords: [{
    type: String
  }],
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  
  metaDescription: {
    type: String
  },
  
  // Contact Information
  contactEmail: {
    type: String
  },
  
  contactPhone: {
    type: String
  },
  
  website: {
    type: String
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Text index for search
courseSchema.index({ 
  title: 'text', 
  description: 'text', 
  majorArea: 'text', 
  universityName: 'text',
  specializations: 'text' 
});

// Compound indexes for common queries
courseSchema.index({ universityId: 1, isActive: 1 });
courseSchema.index({ level: 1, studyMode: 1, majorArea: 1 });

// Virtual for application deadline status
courseSchema.virtual('applicationStatus').get(function() {
  if (!this.applicationDeadline) return 'Open';
  const now = new Date();
  return now < this.applicationDeadline ? 'Open' : 'Closed';
});

// Virtual for next intake
courseSchema.virtual('nextIntake').get(function() {
  if (!this.intakeMonths || this.intakeMonths.length === 0) return null;
  
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Find next intake month
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth + i) % 12;
    if (this.intakeMonths.includes(monthNames[monthIndex])) {
      return monthNames[monthIndex];
    }
  }
  
  return this.intakeMonths[0];
});

// Pre-save middleware
courseSchema.pre('save', function(next) {
  // Generate slug if not exists
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  }
  
  // Calculate acceptance rate
  if (this.totalApplications > 0) {
    this.acceptanceRate = (this.totalAccepted / this.totalApplications) * 100;
  }
  
  this.updatedAt = new Date();
  next();
});

// Instance method to get formatted fees
courseSchema.methods.getFormattedFees = function() {
  if (this.fees.displayText) {
    return this.fees.displayText;
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.fees.currency || 'USD'
  });
  
  return `${formatter.format(this.fees.amount)} ${this.fees.period}`;
};

// Instance method to check if application is open
courseSchema.methods.isApplicationOpen = function() {
  if (!this.applicationDeadline) return true;
  return new Date() < this.applicationDeadline;
};

// Instance method to get total fees including additional fees
courseSchema.methods.getTotalFees = function() {
  let total = this.fees.amount || 0;
  
  if (this.fees.additionalFees && this.fees.additionalFees.length > 0) {
    total += this.fees.additionalFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
  }
  
  return total;
};

// Static method to get all major areas
courseSchema.statics.getMajorAreas = async function(universityId = null) {
  const query = universityId ? { universityId, isActive: true } : { isActive: true };
  return await this.distinct('majorArea', query);
};

// Static method to get all study modes
courseSchema.statics.getStudyModes = async function(universityId = null) {
  const query = universityId ? { universityId, isActive: true } : { isActive: true };
  return await this.distinct('studyMode', query);
};

// Static method to get all levels
courseSchema.statics.getLevels = async function(universityId = null) {
  const query = universityId ? { universityId, isActive: true } : { isActive: true };
  return await this.distinct('level', query);
};

const Course = mongoose.model('Course', courseSchema);

export default Course;