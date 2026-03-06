import mongoose from "mongoose";

// Schema for individual education entry (GUS portal format)
const educationEntrySchema = new mongoose.Schema(
  {
    // Basic enrollment info
    countryOfInitialRegistration: {
      type: String,
      default: "",
      trim: true,
    },
    semesterOfInitialRegistration: {
      type: String,
      default: "",
      trim: true,
    },
    
    // Program details
    entryType: {
      type: String,
      enum: ["", "freshman", "transfer", "exchange", "graduate"],
      default: "",
    },
    degree: {
      type: String,
      enum: ["", "bachelor", "master", "diploma", "phd"],
      default: "",
    },
    specialisation: {
      type: String,
      default: "",
      trim: true,
    },
    standardStudyPeriod: {
      type: String,
      enum: ["", "2 years", "3 years", "4 years", "5 years"],
      default: "",
    },
    
    // Location and remarks
    city: {
      type: String,
      default: "",
      trim: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    
    // Institution details (for backward compatibility)
    institutionName: {
      type: String,
      default: "",
      trim: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isCurrentEnrollment: {
      type: Boolean,
      default: false,
    },

    // Transcript file
    transcriptFileName: {
      type: String,
      default: "",
    },
    transcriptFileUrl: {
      type: String,
      default: "",
    },
    transcriptOriginalName: {
      type: String,
      default: "",
    },
    transcriptFileSize: {
      type: Number,
      default: 0,
    },
    transcriptFileType: {
      type: String,
      enum: ["pdf", "jpg", "jpeg", "png", ""],
      default: "",
    },
    transcriptUploadedAt: {
      type: Date,
      default: null,
    },

    // Document status for admin review
    documentStatus: {
      type: String,
      enum: ["pending", "approved", "reupload_required", "not_uploaded"],
      default: "not_uploaded",
    },
    adminRemark: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Whether user was enrolled at an institute of higher education
    wasEnrolled: {
      type: Boolean,
      default: null,
    },

    // Array of education entries
    educationEntries: {
      type: [educationEntrySchema],
      default: [],
    },

    // Whether currently enrolled in another university
    isCurrentlyEnrolled: {
      type: Boolean,
      default: null,
    },

    // Completion tracking
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // Verification status
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =====================================================
   VIRTUALS
===================================================== */

// Check if education section is complete
educationSchema.virtual("isEducationComplete").get(function () {
  if (this.wasEnrolled === null) return false;
  
  if (this.wasEnrolled === false) {
    // If not enrolled, just need to answer the question
    return this.isCurrentlyEnrolled !== null;
  }
  
  // If enrolled, need at least one complete entry
  if (this.educationEntries.length === 0) return false;
  
  // Check if any entry is complete
  const hasCompleteEntry = this.educationEntries.some(entry => 
    entry.countryOfInitialRegistration &&
    entry.semesterOfInitialRegistration &&
    entry.entryType &&
    entry.degree &&
    entry.specialisation &&
    entry.standardStudyPeriod
  );
  
  return hasCompleteEntry && this.isCurrentlyEnrolled !== null;
});

// Calculate completion percentage
educationSchema.virtual("completionPercentage").get(function () {
  let totalFields = 2; // wasEnrolled and isCurrentlyEnrolled
  let completedFields = 0;
  
  if (this.wasEnrolled !== null) completedFields++;
  
  if (this.wasEnrolled === true) {
    // Add fields from first education entry
    const entry = this.educationEntries[0];
    if (entry) {
      const entryFields = [
        'countryOfInitialRegistration',
        'semesterOfInitialRegistration',
        'entryType',
        'degree',
        'specialisation',
        'standardStudyPeriod'
      ];
      
      entryFields.forEach(field => {
        totalFields++;
        if (entry[field]) completedFields++;
      });
    }
  }
  
  if (this.isCurrentlyEnrolled !== null) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
});

/* =====================================================
   MIDDLEWARE
===================================================== */

educationSchema.pre("save", function (next) {
  this.lastUpdated = new Date();

  if (this.isEducationComplete && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }

  if (!this.isNew) {
    this.version += 1;
  }

  next();
});

educationSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastUpdated: new Date() });
  next();
});

/* =====================================================
   INDEXES
===================================================== */

educationSchema.index({ userId: 1 });
educationSchema.index({ isCompleted: 1 });
educationSchema.index({ isVerified: 1 });

/* =====================================================
   STATIC METHODS
===================================================== */

educationSchema.statics.findByUserId = function (userId) {
  return this.findOne({ userId });
};

educationSchema.statics.findPendingVerification = function () {
  return this.find({ isVerified: false, isCompleted: true });
};

/* =====================================================
   INSTANCE METHODS
===================================================== */

educationSchema.methods.markAsCompleted = function () {
  if (this.isEducationComplete) {
    this.isCompleted = true;
    this.completedAt = new Date();
    return this.save();
  }
  return Promise.reject(new Error("Education information is incomplete"));
};

educationSchema.methods.verify = function (adminId) {
  this.isVerified = true;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  return this.save();
};

educationSchema.methods.addEducationEntry = function (entryData) {
  this.educationEntries.push(entryData);
  return this.save();
};

educationSchema.methods.updateEducationEntry = function (index, entryData) {
  if (index >= 0 && index < this.educationEntries.length) {
    Object.assign(this.educationEntries[index], entryData);
    return this.save();
  }
  return Promise.reject(new Error("Invalid entry index"));
};

educationSchema.methods.removeEducationEntry = function (index) {
  if (index >= 0 && index < this.educationEntries.length) {
    this.educationEntries.splice(index, 1);
    return this.save();
  }
  return Promise.reject(new Error("Invalid entry index"));
};

const ApplicationEducation = mongoose.model("ApplicationEducation", educationSchema);

export default ApplicationEducation;