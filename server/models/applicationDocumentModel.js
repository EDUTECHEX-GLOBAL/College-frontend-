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
      enum: ["pdf", "jpg", "jpeg", "png", "doc", "docx", ""],
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
    generated: {
      type: Boolean,
      default: false,
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

    // ── Personal Documents ──────────────────────────────────────
    cv: {
      type: documentSchema,
      default: () => ({}),
    },
    photo: {
      type: documentSchema,
      default: () => ({}),
    },
    passport: {
      type: documentSchema,
      default: () => ({}),
    },

    // ── Academic Documents ──────────────────────────────────────
    transcript: {
      type: documentSchema,
      default: () => ({}),
    },
    diploma: {
      type: documentSchema,
      default: () => ({}),
    },

    // ── Grade Certificates ──────────────────────────────────────
    cert9th: {
      type: documentSchema,
      default: () => ({}),
    },
    cert10th: {
      type: documentSchema,
      default: () => ({}),
    },
    cert11th: {
      type: documentSchema,
      default: () => ({}),
    },
    cert12th: {
      type: documentSchema,
      default: () => ({}),
    },

    // ── Optional Documents ──────────────────────────────────────
    testScores: {
      type: documentSchema,
      default: () => ({}),
    },
    languageProficiency: {
      type: documentSchema,
      default: () => ({}),
    },
    recommendationLetter: {
      type: documentSchema,
      default: () => ({}),
    },

    // ── Certificate expected dates ──────────────────────────────
    // Stored as "YYYY-MM" string (e.g. "2025-06")
    // Set by the frontend Month/Year dropdowns when student
    // selects "No, not yet" for a grade certificate.
    cert9th_expectedDate: {
      type: String,
      default: "",
    },
    cert10th_expectedDate: {
      type: String,
      default: "",
    },
    cert11th_expectedDate: {
      type: String,
      default: "",
    },
    cert12th_expectedDate: {
      type: String,
      default: "",
    },

    // ── CV metadata ─────────────────────────────────────────────
    portfolioLink: {
      type: String,
      default: "",
      trim: true,
    },

    // ── Completion tracking ─────────────────────────────────────
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // ── Verification ────────────────────────────────────────────
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
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =====================================================
   CONSTANTS
===================================================== */

// All document field names
const ALL_DOC_FIELDS = [
  "cv", "photo", "passport",
  "transcript", "diploma",
  "cert9th", "cert10th", "cert11th", "cert12th",
  "testScores", "languageProficiency", "recommendationLetter",
];

// Required document fields
// A cert counts as "handled" if a file is uploaded OR an expected date is set
const REQUIRED_DOC_FIELDS = [
  "cv", "photo", "passport",
  "transcript", "diploma",
  "cert9th", "cert10th", "cert11th", "cert12th",
];

// Certificate fields that support the Yes/No + expected date flow
const CERT_FIELDS = ["cert9th", "cert10th", "cert11th", "cert12th"];

/* =====================================================
   VIRTUALS
===================================================== */

// All uploaded documents list
applicationDocumentSchema.virtual("uploadedDocuments").get(function () {
  const documents = [];
  ALL_DOC_FIELDS.forEach((field) => {
    if (this[field] && this[field].fileName) {
      documents.push({ type: field, ...this[field].toObject() });
    }
  });
  return documents;
});

// Required documents upload status map
// A cert is "done" if file uploaded OR expectedDate is set (e.g. "2025-06")
applicationDocumentSchema.virtual("requiredDocumentsStatus").get(function () {
  const status = {};
  REQUIRED_DOC_FIELDS.forEach((doc) => {
    const hasFile        = !!(this[doc] && this[doc].fileName);
    const hasPendingDate = CERT_FIELDS.includes(doc) && !!this[`${doc}_expectedDate`];
    status[doc] = hasFile || hasPendingDate;
  });
  return status;
});

// Whether all required docs are uploaded or declared pending
applicationDocumentSchema.virtual("areRequiredDocumentsUploaded").get(function () {
  return REQUIRED_DOC_FIELDS.every((doc) => {
    if (this[doc] && this[doc].fileName) return true;
    if (CERT_FIELDS.includes(doc) && this[`${doc}_expectedDate`]) return true;
    return false;
  });
});

// Completion percentage based on required docs
// expectedDate of format "YYYY-MM" counts as handled
applicationDocumentSchema.virtual("completionPercentage").get(function () {
  const handledCount = REQUIRED_DOC_FIELDS.filter((doc) => {
    if (this[doc] && this[doc].fileName) return true;
    if (CERT_FIELDS.includes(doc) && this[`${doc}_expectedDate`]) return true;
    return false;
  }).length;

  return Math.round((handledCount / REQUIRED_DOC_FIELDS.length) * 100);
});

// Document counts summary
applicationDocumentSchema.virtual("documentCounts").get(function () {
  const total = ALL_DOC_FIELDS.length;
  let uploaded = 0;
  let pending  = 0;
  let approved = 0;
  let rejected = 0;

  ALL_DOC_FIELDS.forEach((field) => {
    if (this[field] && this[field].fileName) {
      uploaded++;
      if (this[field].documentStatus === "approved") approved++;
      if (this[field].documentStatus === "rejected") rejected++;
      if (this[field].documentStatus === "pending")  pending++;
    }
  });

  return { total, uploaded, pending, approved, rejected, missing: total - uploaded };
});

/* =====================================================
   MIDDLEWARE
===================================================== */

applicationDocumentSchema.pre("save", function (next) {
  this.lastUpdated = new Date();

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
  return this.find({ isVerified: false, isCompleted: true }).populate(
    "userId",
    "email firstName lastName"
  );
};

applicationDocumentSchema.statics.findByDocumentStatus = function (status) {
  const query = {
    $or: ALL_DOC_FIELDS.map((field) => ({
      [`${field}.documentStatus`]: status,
    })),
  };
  return this.find(query).populate("userId", "email firstName lastName");
};

/* =====================================================
   INSTANCE METHODS
===================================================== */

applicationDocumentSchema.methods.updateDocument = function (documentType, fileData) {
  if (!this[documentType]) {
    this[documentType] = {};
  }
  this[documentType] = {
    ...this[documentType].toObject?.(),
    ...fileData,
    uploadedAt:     new Date(),
    documentStatus: "pending",
  };
  return this.save();
};

applicationDocumentSchema.methods.removeDocument = function (documentType) {
  if (this[documentType] !== undefined) {
    this[documentType] = {
      fileName:       "",
      fileUrl:        "",
      originalName:   "",
      fileType:       "",
      fileSize:       0,
      uploadedAt:     null,
      documentStatus: "not_uploaded",
      adminRemark:    "",
      generated:      false,
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
  return Promise.reject(
    new Error("Required documents are not all uploaded or declared")
  );
};

applicationDocumentSchema.methods.verifyAll = function (adminId) {
  this.isVerified  = true;
  this.verifiedBy  = adminId;
  this.verifiedAt  = new Date();
  return this.save();
};

const ApplicationDocument = mongoose.model(
  "ApplicationDocument",
  applicationDocumentSchema
);

export default ApplicationDocument;