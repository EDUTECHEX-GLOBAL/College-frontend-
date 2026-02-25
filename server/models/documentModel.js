import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: [
      'transcript',
      'diploma',
      'test_scores',
      'language_proficiency',
      'recommendation',
      'resume',
      'passport',
      'financial_documents',
      'other',
      'recommendation_letter',
      'personal_statement',
      'id_proof',
      'marksheet_9th',
      'marksheet_10th',
      'marksheet_12th'
    ],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  storedFileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String
  },
  status: {
    type: String,
    enum: [
      'pending', 
      'uploading', 
      'uploaded', 
      'reviewing', 
      'approved', 
      'rejected',
      'processing',
      'validated',
      'expired'
    ],
    default: 'pending'
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: {
    type: Date
  },
  reviewNotes: {
    type: String
  },
  // ADD THESE NEW FIELDS FOR EMAIL NOTIFICATIONS
  rejectionReason: {
    type: String,
    enum: [
      'incorrect_format',
      'suspicious_document',
      'fake_document',
      'blurry',
      'incomplete',
      'wrong_document',
      'other'
    ]
  },
  rejectionNotes: {
    type: String
  },
  correctionEmailSent: {
    type: Boolean,
    default: false
  },
  correctionEmailDate: {
    type: Date
  },
  correctionEmailReason: {
    type: String
  },
  // END OF NEW FIELDS
  validationResults: {
    isValid: Boolean,
    confidence: Number,
    matches: Number,
    totalKeywords: Number,
    foundKeywords: [String],
    reason: String
  },
  reviewStatus: {
    type: String,
    enum: [
      'pending', 
      'auto_approved', 
      'needs_review', 
      'manually_approved', 
      'rejected',
      'approved'
    ],
    default: 'pending'
  },
  version: {
    type: Number,
    default: 1
  },
  expiresAt: {
    type: Date
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  // Add grade-specific fields
  grade: {
    type: String,
    enum: ['9th', '10th', '12th', null],
    default: null
  },
  yearOfPassing: {
    type: Number
  },
  board: {
    type: String,
    trim: true
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  division: {
    type: String,
    enum: ['First', 'Second', 'Third', 'Pass', null]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ applicationId: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ reviewStatus: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
documentSchema.index({ grade: 1 });
documentSchema.index({ yearOfPassing: 1 });
documentSchema.index({ userId: 1, grade: 1, documentType: 1 });
// Add index for rejection queries
documentSchema.index({ rejectionReason: 1 });
documentSchema.index({ correctionEmailSent: 1 });

// Virtual for formatted file size
documentSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for days until expiration
documentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const expiryDate = new Date(this.expiresAt);
  const diffTime = expiryDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual to determine if it's a marksheet document
documentSchema.virtual('isMarksheet').get(function() {
  return ['marksheet_9th', 'marksheet_10th', 'marksheet_12th'].includes(this.documentType);
});

// Virtual to check if document needs re-upload
documentSchema.virtual('needsReupload').get(function() {
  return this.reviewStatus === 'rejected' && !this.correctionEmailSent;
});

// Method to check if document is expired
documentSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > new Date(this.expiresAt);
};

// Method to update review status with email tracking
documentSchema.methods.updateReview = function(status, userId, notes = '', reason = null) {
  this.reviewStatus = status;
  this.reviewedBy = userId;
  this.reviewDate = new Date();
  
  if (notes) {
    this.reviewNotes = notes;
  }
  
  if (reason && status === 'rejected') {
    this.rejectionReason = reason;
    this.correctionEmailSent = false;
  }
  
  return this.save();
};

// Method to mark correction email as sent
documentSchema.methods.markCorrectionEmailSent = function(reason) {
  this.correctionEmailSent = true;
  this.correctionEmailDate = new Date();
  this.correctionEmailReason = reason;
  return this.save();
};

// Method to extract grade from document type
documentSchema.methods.extractGrade = function() {
  if (this.documentType === 'marksheet_9th') return '9th';
  if (this.documentType === 'marksheet_10th') return '10th';
  if (this.documentType === 'marksheet_12th') return '12th';
  return null;
};

// Static method to get documents that need correction emails
documentSchema.statics.findDocumentsNeedingCorrection = function() {
  return this.find({
    reviewStatus: 'rejected',
    correctionEmailSent: false,
    rejectionReason: { $exists: true }
  }).populate('userId', 'firstName lastName email');
};

// Static method to get documents by user
documentSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.applicationId) {
    query.applicationId = options.applicationId;
  }
  
  if (options.documentType) {
    query.documentType = options.documentType;
  }
  
  if (options.grade) {
    query.grade = options.grade;
  }
  
  if (options.reviewStatus) {
    query.reviewStatus = options.reviewStatus;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.isMarksheet) {
    query.documentType = { $in: ['marksheet_9th', 'marksheet_10th', 'marksheet_12th'] };
  }
  
  return this.find(query)
    .sort({ 
      grade: options.sortByGrade ? 1 : 0,
      createdAt: -1 
    })
    .populate('applicationId', 'university program intake')
    .populate('reviewedBy', 'name email');
};

// Static method to get user's marksheets
documentSchema.statics.findUserMarksheets = function(userId) {
  return this.find({
    userId: userId,
    documentType: { $in: ['marksheet_9th', 'marksheet_10th', 'marksheet_12th'] }
  }).sort({ 
    grade: 1,
    yearOfPassing: -1 
  });
};

// Static method to get document statistics with marksheet breakdown
documentSchema.statics.getStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: { userId: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$reviewStatus',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        avgSize: { $avg: '$fileSize' }
      }
    }
  ]);
  
  const marksheetStats = await this.aggregate([
    {
      $match: { 
        userId: mongoose.Types.ObjectId(userId),
        documentType: { $in: ['marksheet_9th', 'marksheet_10th', 'marksheet_12th'] }
      }
    },
    {
      $group: {
        _id: '$grade',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  const total = await this.countDocuments({ userId });
  const totalSizeResult = await this.aggregate([
    {
      $match: { userId: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$fileSize' }
      }
    }
  ]);
  
  const totalSize = totalSizeResult[0]?.totalSize || 0;
  
  return {
    total,
    totalSize,
    byStatus: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        totalSize: stat.totalSize,
        avgSize: stat.avgSize
      };
      return acc;
    }, {}),
    marksheets: marksheetStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        totalSize: stat.totalSize
      };
      return acc;
    }, {})
  };
};

// Middleware to set grade based on document type
documentSchema.pre('save', function(next) {
  // Extract grade from document type if it's a marksheet
  if (this.documentType.startsWith('marksheet_')) {
    if (this.documentType === 'marksheet_9th') {
      this.grade = '9th';
    } else if (this.documentType === 'marksheet_10th') {
      this.grade = '10th';
    } else if (this.documentType === 'marksheet_12th') {
      this.grade = '12th';
    }
  }
  
  // Set default status based on reviewStatus
  if (this.reviewStatus === 'auto_approved' || this.reviewStatus === 'manually_approved' || this.reviewStatus === 'approved') {
    this.status = 'validated';
  } else if (this.reviewStatus === 'rejected') {
    this.status = 'rejected';
  } else if (this.reviewStatus === 'needs_review') {
    this.status = 'reviewing';
  }
  
  // Set expiration date if not set (default: 1 year)
  if (!this.expiresAt && this.documentType !== 'passport' && this.documentType !== 'id_proof') {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    this.expiresAt = oneYearFromNow;
  }
  
  next();
});

const Document = mongoose.model('Document', documentSchema);

export default Document;