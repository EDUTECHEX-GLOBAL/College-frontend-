import mongoose from 'mongoose';

const personalInfoSchema = new mongoose.Schema(
{
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  /* ================================
     PERSONAL DETAILS
  ================================= */
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },

  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },

 title: {
  type: String,
  enum: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'mr', 'mrs', 'ms', 'dr', 'prof', ''],
  default: ''
},

  dateOfBirth: {
    type: Date,
    required: true
  },

  placeOfBirth: {
    type: String,
    trim: true,
    default: ''
  },

  countryOfBirth: {
    type: String,
    required: true,
    trim: true
  },

  citizenship: {
    type: String,
    required: true,
    trim: true
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say', ''],
    default: ''
  },

  /* ================================
     COUNTRY OF RESIDENCE (for backward compatibility)
  ================================= */
  countryOfResidence: {
    type: String,
    trim: true,
    default: ''
  },

  /* ================================
     PASSPORT DETAILS
  ================================= */
  passportNumber: {
    type: String,
    trim: true,
    required: true
  },

  passportIssueDate: {
    type: Date,
    required: true
  },

  passportExpiryDate: {
    type: Date,
    required: true
  },

  issuingCountry: {
    type: String,
    trim: true,
    required: true
  },

  /* ================================
     VISA INFORMATION
  ================================= */
  isEUCitizen: {
    type: Boolean,
    default: null
  },

  documentType: {
    type: String,
    enum: ['passport', 'id_card', 'residence_permit', ''],
    default: ''
  },

  needVisa: {
    type: String,
    enum: ['yes', 'no', ''],
    default: ''
  },

  referFriend: {
    type: String,
    enum: ['yes', 'no', ''],
    default: ''
  },

  /* ================================
     CONTACT
  ================================= */
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email']
  },

  mobile: {
    type: String,
    required: true,
    trim: true
  },

  landline: {
    type: String,
    default: '',
    trim: true
  },

  correspondenceLanguage: {
    type: String,
    enum: ['english', 'german', ''],
    default: 'english'
  },

  /* ================================
     PASSPORT FILE - COMPLETE FIELDS
  ================================= */
  passportFileName: { 
    type: String, 
    default: '' 
  },
  passportFileUrl: { 
    type: String, 
    default: '' 
  },
  passportOriginalName: { 
    type: String, 
    default: '' 
  },
  passportFileType: {
    type: String,
    enum: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', ''],
    default: ''
  },
  passportFileSize: { 
    type: Number, 
    default: 0 
  },
  passportUploadedAt: { 
    type: Date, 
    default: null 
  },

  passportValidationStatus: {
    type: String,
    enum: ['pending', 'valid', 'invalid', 'not_checked'],
    default: 'not_checked'
  },

  passportValidationConfidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  passportValidationDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  /* ================================
     PHOTOGRAPH FILE - COMPLETE FIELDS
  ================================= */
  photographFileName: { 
    type: String, 
    default: '' 
  },
  photographFileUrl: { 
    type: String, 
    default: '' 
  },
  photographOriginalName: { 
    type: String, 
    default: '' 
  },
  photographFileType: {
    type: String,
    enum: ['jpg', 'jpeg', 'png', ''],
    default: ''
  },
  photographFileSize: { 
    type: Number, 
    default: 0 
  },
  photographUploadedAt: { 
    type: Date, 
    default: null 
  },

  photographValidationStatus: {
    type: String,
    enum: ['pending', 'valid', 'invalid', 'not_checked'],
    default: 'not_checked'
  },

  /* ================================
     APPLICATION STATUS
  ================================= */
  applicationStatus: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
    default: 'draft'
  },

  submittedAt: { 
    type: Date, 
    default: null 
  },

  isVerified: { 
    type: Boolean, 
    default: false 
  },
  verificationNotes: { 
    type: String, 
    default: '' 
  },
  verifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  verifiedAt: { 
    type: Date, 
    default: null 
  },

  completedAt: { 
    type: Date, 
    default: null 
  },

  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  version: { 
    type: Number, 
    default: 1 
  }
},
{
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}
);

/* =====================================================
   VIRTUALS
===================================================== */

// Full name with title
personalInfoSchema.virtual('fullName').get(function () {
  const titlePrefix = this.title ? `${this.title}. ` : '';
  return `${titlePrefix}${this.firstName} ${this.lastName}`;
});

// Age calculation
personalInfoSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

// Check if passport is uploaded (checks both fileName and originalName)
personalInfoSchema.virtual('hasPassport').get(function () {
  return !!(this.passportFileName || this.passportOriginalName);
});

// Check if photograph is uploaded (checks both fileName and originalName)
personalInfoSchema.virtual('hasPhotograph').get(function () {
  return !!(this.photographFileName || this.photographOriginalName);
});

// Check if passport is valid (not expired)
personalInfoSchema.virtual('isPassportValid').get(function () {
  if (!this.passportExpiryDate) return false;
  return new Date(this.passportExpiryDate) > new Date();
});

// Check if application is complete with all required fields
personalInfoSchema.virtual('isComplete').get(function () {
  // Check all required text fields
  const textFieldsComplete = !!(
    this.firstName &&
    this.lastName &&
    this.dateOfBirth &&
    this.countryOfBirth &&
    this.citizenship &&
    this.passportNumber &&
    this.passportIssueDate &&
    this.passportExpiryDate &&
    this.issuingCountry &&
    this.email &&
    this.mobile &&
    this.correspondenceLanguage
  );

  // Check if files are uploaded (using the virtual that checks both fields)
  const filesComplete = this.hasPassport && this.hasPhotograph;

  // Check visa requirement if not EU citizen
  let visaComplete = true;
  if (this.isEUCitizen === false) {
    visaComplete = !!this.needVisa;
  }

  return textFieldsComplete && filesComplete && visaComplete;
});

// Get passport display name
personalInfoSchema.virtual('passportDisplayName').get(function () {
  return this.passportOriginalName || this.passportFileName || 'Passport';
});

// Get photograph display name
personalInfoSchema.virtual('photographDisplayName').get(function () {
  return this.photographOriginalName || this.photographFileName || 'Photograph';
});

// Check if visa is required
personalInfoSchema.virtual('visaRequired').get(function () {
  return this.isEUCitizen === false && this.needVisa === 'yes';
});

// Calculate completion percentage
personalInfoSchema.virtual('completionPercentage').get(function () {
  const requiredFields = [
    'firstName', 'lastName', 'dateOfBirth', 'countryOfBirth', 'citizenship',
    'passportNumber', 'passportIssueDate', 'passportExpiryDate', 'issuingCountry',
    'email', 'mobile', 'correspondenceLanguage'
  ];
  
  let completed = requiredFields.filter(field => !!this[field]).length;
  let total = requiredFields.length;
  
  // Add file fields
  if (this.hasPassport) completed++;
  total++;
  
  if (this.hasPhotograph) completed++;
  total++;
  
  // Add visa field if not EU citizen
  if (this.isEUCitizen === false) {
    if (this.needVisa) completed++;
    total++;
  }
  
  return Math.round((completed / total) * 100);
});

/* =====================================================
   BACKWARD COMPATIBILITY VIRTUALS
===================================================== */

// For any existing code that uses 'dob'
personalInfoSchema.virtual('dob').get(function () {
  return this.dateOfBirth;
});

// For any existing code that uses 'nationality'
personalInfoSchema.virtual('nationality').get(function () {
  return this.citizenship;
});

// For any existing code that uses 'alternateContact'
personalInfoSchema.virtual('alternateContact').get(function () {
  return this.landline;
});

/* =====================================================
   MIDDLEWARE
===================================================== */

// Pre-save middleware
personalInfoSchema.pre('save', function (next) {
  this.lastUpdated = new Date();

  // Update version
  if (!this.isNew) {
    this.version += 1;
  }

  // Set completedAt if application is complete
  if (this.isComplete && !this.completedAt) {
    this.completedAt = new Date();
  }

  next();
});

// Pre-findOneAndUpdate middleware
personalInfoSchema.pre('findOneAndUpdate', function (next) {
  this.set({ lastUpdated: new Date() });
  next();
});

/* =====================================================
   INDEXES
===================================================== */

personalInfoSchema.index({ email: 1 });
personalInfoSchema.index({ applicationStatus: 1 });
personalInfoSchema.index({ isVerified: 1 });
personalInfoSchema.index({ passportValidationStatus: 1 });
personalInfoSchema.index({ passportNumber: 1 });
personalInfoSchema.index({ isEUCitizen: 1 });
personalInfoSchema.index({ citizenship: 1 });
personalInfoSchema.index({ countryOfBirth: 1 });

/* =====================================================
   STATIC METHODS
===================================================== */

// Find by email
personalInfoSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Find pending verification
personalInfoSchema.statics.findPendingVerification = function () {
  return this.find({
    isVerified: false,
    applicationStatus: 'submitted'
  });
};

// Find by passport number
personalInfoSchema.statics.findByPassportNumber = function (passportNumber) {
  return this.findOne({ passportNumber });
};

// Find non-EU citizens needing visa
personalInfoSchema.statics.findVisaRequired = function () {
  return this.find({
    isEUCitizen: false,
    needVisa: 'yes'
  });
};

// Find applications with missing documents
personalInfoSchema.statics.findMissingDocuments = function () {
  return this.find({
    $or: [
      { passportFileName: '', passportOriginalName: '' },
      { photographFileName: '', photographOriginalName: '' }
    ]
  });
};

// Get statistics
personalInfoSchema.statics.getStats = async function () {
  const total = await this.countDocuments();
  const completed = await this.countDocuments({ isComplete: true });
  const verified = await this.countDocuments({ isVerified: true });
  const pending = await this.countDocuments({ applicationStatus: 'submitted', isVerified: false });
  
  return {
    total,
    completed,
    verified,
    pending,
    completionRate: total ? Math.round((completed / total) * 100) : 0
  };
};

/* =====================================================
   INSTANCE METHODS
===================================================== */

// Update passport validation
personalInfoSchema.methods.updatePassportValidation = function (result) {
  this.passportValidationStatus = result.valid ? 'valid' : 'invalid';
  this.passportValidationConfidence = result.confidence || 0;
  this.passportValidationDetails = {
    ...result,
    validatedAt: new Date()
  };
  return this.save();
};

// Update photograph validation
personalInfoSchema.methods.updatePhotographValidation = function (isValid) {
  this.photographValidationStatus = isValid ? 'valid' : 'invalid';
  return this.save();
};

// Submit application
personalInfoSchema.methods.submitApplication = function () {
  if (!this.isComplete) {
    const missing = [];
    if (!this.firstName) missing.push('First name');
    if (!this.lastName) missing.push('Last name');
    if (!this.dateOfBirth) missing.push('Date of birth');
    if (!this.countryOfBirth) missing.push('Country of birth');
    if (!this.citizenship) missing.push('Citizenship');
    if (!this.passportNumber) missing.push('Passport number');
    if (!this.passportIssueDate) missing.push('Passport issue date');
    if (!this.passportExpiryDate) missing.push('Passport expiry date');
    if (!this.issuingCountry) missing.push('Issuing country');
    if (!this.email) missing.push('Email');
    if (!this.mobile) missing.push('Mobile');
    if (!this.correspondenceLanguage) missing.push('Correspondence language');
    if (!this.hasPassport) missing.push('Passport document');
    if (!this.hasPhotograph) missing.push('Photograph');
    if (this.isEUCitizen === false && !this.needVisa) missing.push('Visa requirement');
    
    throw new Error(`Application incomplete. Missing: ${missing.join(', ')}`);
  }

  this.applicationStatus = 'submitted';
  this.submittedAt = new Date();
  return this.save();
};

// Verify application
personalInfoSchema.methods.verifyApplication = function (adminId, notes = '') {
  this.isVerified = true;
  this.verificationNotes = notes;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  this.applicationStatus = 'approved';
  return this.save();
};

// Reject application
personalInfoSchema.methods.rejectApplication = function (adminId, reason = '') {
  this.isVerified = false;
  this.verificationNotes = reason;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  this.applicationStatus = 'rejected';
  return this.save();
};

// Check visa requirement
personalInfoSchema.methods.checkVisaRequirement = function () {
  if (this.isEUCitizen === null) {
    return {
      requiresVisa: null,
      message: 'EU citizenship status not specified'
    };
  }
  
  if (this.isEUCitizen === true) {
    return {
      requiresVisa: false,
      message: 'EU citizens do not require a visa'
    };
  }
  
  return {
    requiresVisa: true,
    needVisa: this.needVisa,
    message: this.needVisa === 'yes' 
      ? 'Visa is required for this application' 
      : 'Visa requirement not specified'
  };
};

// Get application summary
personalInfoSchema.methods.getApplicationSummary = function () {
  return {
    fullName: this.fullName,
    email: this.email,
    dateOfBirth: this.dateOfBirth,
    citizenship: this.citizenship,
    passportNumber: this.passportNumber,
    applicationStatus: this.applicationStatus,
    completionPercentage: this.completionPercentage,
    isComplete: this.isComplete,
    files: {
      passport: {
        uploaded: this.hasPassport,
        name: this.passportDisplayName,
        size: this.passportFileSize,
        uploadedAt: this.passportUploadedAt
      },
      photograph: {
        uploaded: this.hasPhotograph,
        name: this.photographDisplayName,
        size: this.photographFileSize,
        uploadedAt: this.photographUploadedAt
      }
    },
    visa: this.checkVisaRequirement(),
    verification: {
      isVerified: this.isVerified,
      verifiedAt: this.verifiedAt,
      notes: this.verificationNotes
    }
  };
};

// Update file information
personalInfoSchema.methods.updateFileInfo = function (fileType, fileData) {
  const updateData = {};
  
  if (fileType === 'passport') {
    updateData.passportFileName = fileData.fileName;
    updateData.passportFileUrl = fileData.fileUrl;
    updateData.passportOriginalName = fileData.originalName;
    updateData.passportFileType = fileData.fileType;
    updateData.passportFileSize = fileData.fileSize;
    updateData.passportUploadedAt = new Date();
    updateData.passportValidationStatus = 'pending';
  } else if (fileType === 'photograph') {
    updateData.photographFileName = fileData.fileName;
    updateData.photographFileUrl = fileData.fileUrl;
    updateData.photographOriginalName = fileData.originalName;
    updateData.photographFileType = fileData.fileType;
    updateData.photographFileSize = fileData.fileSize;
    updateData.photographUploadedAt = new Date();
    updateData.photographValidationStatus = 'pending';
  }
  
  Object.assign(this, updateData);
  return this.save();
};

// Clear file information
personalInfoSchema.methods.clearFileInfo = function (fileType) {
  if (fileType === 'passport') {
    this.passportFileName = '';
    this.passportFileUrl = '';
    this.passportOriginalName = '';
    this.passportFileType = '';
    this.passportFileSize = 0;
    this.passportUploadedAt = null;
    this.passportValidationStatus = 'not_checked';
  } else if (fileType === 'photograph') {
    this.photographFileName = '';
    this.photographFileUrl = '';
    this.photographOriginalName = '';
    this.photographFileType = '';
    this.photographFileSize = 0;
    this.photographUploadedAt = null;
    this.photographValidationStatus = 'not_checked';
  }
  
  return this.save();
};

const PersonalInfo = mongoose.model('PersonalInfo', personalInfoSchema);

export default PersonalInfo;