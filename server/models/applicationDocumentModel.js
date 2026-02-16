import mongoose from "mongoose";

// Schema for individual document
const documentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      default: "",
      trim: true,
    },
    fileUrl: {
      type: String,
      default: "",
      trim: true,
    },
    originalName: {
      type: String,
      default: "",
      trim: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "jpg", "jpeg", "png", ""],
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
    documentStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_uploaded"],
      default: "not_uploaded",
    },
    adminRemark: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const applicationDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Personal Documents
    cv: {
      type: documentSchema,
      default: () => ({}),
    },
    photo: {
      type: documentSchema,
      default: () => ({}),
    },

    // Education Documents
    eqhe: {
      type: documentSchema,
      default: () => ({}),
    },
    finalEqhe: {
      type: documentSchema,
      default: () => ({}),
    },
    bachelorTranscript: {
      type: documentSchema,
      default: () => ({}),
    },
    bachelorCertificate: {
      type: documentSchema,
      default: () => ({}),
    },

    // Language Certificates
    germanCertificate: {
      type: documentSchema,
      default: () => ({}),
    },
    englishCertificate: {
      type: documentSchema,
      default: () => ({}),
    },

    // Program Specific
    portfolio: {
      type: documentSchema,
      default: () => ({}),
    },

    // University Documents
    noObjection: {
      type: documentSchema,
      default: () => ({}),
    },
    deRegistration: {
      type: documentSchema,
      default: () => ({}),
    },

    // Additional Documents
    other: {
      type: documentSchema,
      default: () => ({}),
    },

    // Metadata for portfolio link
    portfolioLink: {
      type: String,
      default: "",
      trim: true,
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

// Get all uploaded documents
applicationDocumentSchema.virtual("uploadedDocuments").get(function () {
  const documents = [];
  const docFields = [
    "cv", "photo", "eqhe", "finalEqhe", "bachelorTranscript",
    "bachelorCertificate", "germanCertificate", "englishCertificate",
    "portfolio", "noObjection", "deRegistration", "other"
  ];

  docFields.forEach(field => {
    if (this[field] && this[field].fileName) {
      documents.push({
        type: field,
        ...this[field].toObject()
      });
    }
  });

  return documents;
});

// Get required documents status
applicationDocumentSchema.virtual("requiredDocumentsStatus").get(function () {
  const requiredDocs = ["cv", "photo", "eqhe", "englishCertificate", "portfolio"];
  const status = {};

  requiredDocs.forEach(doc => {
    status[doc] = !!(this[doc] && this[doc].fileName);
  });

  return status;
});

// Check if all required documents are uploaded
applicationDocumentSchema.virtual("areRequiredDocumentsUploaded").get(function () {
  const requiredDocs = ["cv", "photo", "eqhe", "englishCertificate", "portfolio"];
  
  return requiredDocs.every(doc => this[doc] && this[doc].fileName);
});

// Calculate completion percentage
applicationDocumentSchema.virtual("completionPercentage").get(function () {
  const requiredDocs = ["cv", "photo", "eqhe", "englishCertificate", "portfolio"];
  const uploadedCount = requiredDocs.filter(doc => this[doc] && this[doc].fileName).length;
  
  return Math.round((uploadedCount / requiredDocs.length) * 100);
});

// Get document counts
applicationDocumentSchema.virtual("documentCounts").get(function () {
  const total = 12; // Total document types
  let uploaded = 0;
  let pending = 0;
  let approved = 0;
  let rejected = 0;

  const docFields = [
    "cv", "photo", "eqhe", "finalEqhe", "bachelorTranscript",
    "bachelorCertificate", "germanCertificate", "englishCertificate",
    "portfolio", "noObjection", "deRegistration", "other"
  ];

  docFields.forEach(field => {
    if (this[field] && this[field].fileName) {
      uploaded++;
      if (this[field].documentStatus === "approved") approved++;
      if (this[field].documentStatus === "rejected") rejected++;
      if (this[field].documentStatus === "pending") pending++;
    }
  });

  return {
    total,
    uploaded,
    pending,
    approved,
    rejected,
    missing: total - uploaded
  };
});

/* =====================================================
   MIDDLEWARE
===================================================== */

applicationDocumentSchema.pre("save", function (next) {
  this.lastUpdated = new Date();

  // Check if all required documents are uploaded
  if (this.areRequiredDocumentsUploaded && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }

  if (!this.isNew) {
    this.version += 1;
  }

  next();
});

applicationDocumentSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastUpdated: new Date() });
  next();
});

/* =====================================================
   INDEXES
===================================================== */

applicationDocumentSchema.index({ userId: 1 });
applicationDocumentSchema.index({ isCompleted: 1 });
applicationDocumentSchema.index({ isVerified: 1 });
applicationDocumentSchema.index({ "cv.documentStatus": 1 });
applicationDocumentSchema.index({ "photo.documentStatus": 1 });

/* =====================================================
   STATIC METHODS
===================================================== */

applicationDocumentSchema.statics.findByUserId = function (userId) {
  return this.findOne({ userId });
};

applicationDocumentSchema.statics.findPendingVerification = function () {
  return this.find({ 
    isVerified: false, 
    isCompleted: true 
  }).populate("userId", "email firstName lastName");
};

applicationDocumentSchema.statics.findByDocumentStatus = function (status) {
  const query = {
    $or: [
      { "cv.documentStatus": status },
      { "photo.documentStatus": status },
      { "eqhe.documentStatus": status },
      { "englishCertificate.documentStatus": status },
      { "portfolio.documentStatus": status }
    ]
  };
  return this.find(query).populate("userId", "email firstName lastName");
};

/* =====================================================
   INSTANCE METHODS
===================================================== */

applicationDocumentSchema.methods.updateDocument = function (
  documentType,
  fileData
) {
  if (!this[documentType]) {
    this[documentType] = {};
  }

  this[documentType] = {
    ...this[documentType].toObject?.(),
    ...fileData,
    uploadedAt: new Date(),
    documentStatus: "pending",
  };

  return this.save();
};

applicationDocumentSchema.methods.removeDocument = function (documentType) {
  if (this[documentType]) {
    this[documentType] = {
      fileName: "",
      fileUrl: "",
      originalName: "",
      fileType: "",
      fileSize: 0,
      uploadedAt: null,
      documentStatus: "not_uploaded",
      adminRemark: "",
    };
  }
  return this.save();
};

applicationDocumentSchema.methods.verifyDocument = function (
  documentType,
  status,
  remark = ""
) {
  if (this[documentType]) {
    this[documentType].documentStatus = status;
    if (remark) {
      this[documentType].adminRemark = remark;
    }
  }
  return this.save();
};

applicationDocumentSchema.methods.markAsCompleted = function () {
  if (this.areRequiredDocumentsUploaded) {
    this.isCompleted = true;
    this.completedAt = new Date();
    return this.save();
  }
  return Promise.reject(new Error("Required documents are not uploaded"));
};

applicationDocumentSchema.methods.verifyAll = function (adminId) {
  this.isVerified = true;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  return this.save();
};

const ApplicationDocument = mongoose.model("ApplicationDocument", applicationDocumentSchema);

export default ApplicationDocument;