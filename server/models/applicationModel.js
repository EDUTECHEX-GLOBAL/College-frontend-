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

  dob: {
    type: Date,
    required: true
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    required: true
  },

  nationality: {
    type: String,
    required: true,
    trim: true
  },

  countryOfResidence: {
    type: String,
    required: true,
    trim: true
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

  alternateContact: {
    type: String,
    default: '',
    trim: true
  },

  /* ================================
     PASSPORT FILE
  ================================= */
  passportFileName: { type: String, default: '' },
  passportFileUrl: { type: String, default: '' },
  passportOriginalName: { type: String, default: '' },
  passportFileType: {
    type: String,
    enum: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', ''],
    default: ''
  },
  passportFileSize: { type: Number, default: 0 },
  passportUploadedAt: { type: Date, default: null },

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
     PHOTOGRAPH FILE
  ================================= */
  photographFileName: { type: String, default: '' },
  photographFileUrl: { type: String, default: '' },
  photographOriginalName: { type: String, default: '' },
  photographFileType: {
    type: String,
    enum: ['jpg', 'jpeg', 'png', ''],
    default: ''
  },
  photographFileSize: { type: Number, default: 0 },
  photographUploadedAt: { type: Date, default: null },

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

  submittedAt: { type: Date, default: null },

  isVerified: { type: Boolean, default: false },
  verificationNotes: { type: String, default: '' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null },

  lastUpdated: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
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

personalInfoSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

personalInfoSchema.virtual('age').get(function () {
  if (!this.dob) return null;
  const today = new Date();
  const birth = new Date(this.dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

personalInfoSchema.virtual('hasPassport').get(function () {
  return !!this.passportFileName;
});

personalInfoSchema.virtual('hasPhotograph').get(function () {
  return !!this.photographFileName;
});

personalInfoSchema.virtual('isComplete').get(function () {
  return (
    this.firstName &&
    this.lastName &&
    this.dob &&
    this.gender &&
    this.nationality &&
    this.countryOfResidence &&
    this.email &&
    this.mobile &&
    this.passportFileName &&
    this.photographFileName
  );
});

/* =====================================================
   MIDDLEWARE
===================================================== */

personalInfoSchema.pre('save', function (next) {
  this.lastUpdated = new Date();

  if (!this.isNew) {
    this.version += 1;
  }

  next();
});

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

/* =====================================================
   STATIC METHODS
===================================================== */

personalInfoSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

personalInfoSchema.statics.findPendingVerification = function () {
  return this.find({
    isVerified: false,
    applicationStatus: 'submitted'
  });
};

/* =====================================================
   INSTANCE METHODS
===================================================== */

personalInfoSchema.methods.updatePassportValidation = function (result) {
  this.passportValidationStatus = result.valid ? 'valid' : 'invalid';
  this.passportValidationConfidence = result.confidence || 0;
  this.passportValidationDetails = {
    ...result,
    validatedAt: new Date()
  };
  return this.save();
};

personalInfoSchema.methods.updatePhotographValidation = function (isValid) {
  this.photographValidationStatus = isValid ? 'valid' : 'invalid';
  return this.save();
};

personalInfoSchema.methods.submitApplication = function () {
  if (!this.isComplete) {
    throw new Error('Application incomplete');
  }

  this.applicationStatus = 'submitted';
  this.submittedAt = new Date();
  return this.save();
};

personalInfoSchema.methods.verifyApplication = function (adminId, notes = '') {
  this.isVerified = true;
  this.verificationNotes = notes;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  return this.save();
};

const PersonalInfo = mongoose.model('PersonalInfo', personalInfoSchema);

export default PersonalInfo;
