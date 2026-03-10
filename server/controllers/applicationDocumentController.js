import ApplicationDocument from "../models/applicationDocumentModel.js";
import {
  deleteFileFromFolder,
  getDynamicFileUrl,
} from "../middleware/uploadMiddleware.js";
import path from "path";

/* =====================================================
   CONSTANTS - must mirror the model
===================================================== */
const VALID_DOCUMENT_TYPES = [
  "cv", "photo", "passport",
  "transcript", "diploma",
  "cert9th", "cert10th", "cert11th", "cert12th",
  "testScores", "languageProficiency", "recommendationLetter",
];

const REQUIRED_DOCUMENTS = [
  "cv", "photo", "passport",
  "transcript", "diploma",
  "cert9th", "cert10th", "cert11th", "cert12th",
];

const CERT_FIELDS = ["cert9th", "cert10th", "cert11th", "cert12th"];

const documentFolderMap = {
  cv:                   "documents/cv",
  photo:                "documents/photo",
  passport:             "documents/personal",
  transcript:           "documents/academic",
  diploma:              "documents/academic",
  cert9th:              "documents/certificates",
  cert10th:             "documents/certificates",
  cert11th:             "documents/certificates",
  cert12th:             "documents/certificates",
  testScores:           "documents/optional",
  languageProficiency:  "documents/optional",
  recommendationLetter: "documents/optional",
};

const MAX_FILE_SIZE_MB = {
  cv:                   5,
  photo:                5,
  passport:             10,
  transcript:           10,
  diploma:              10,
  cert9th:              5,
  cert10th:             5,
  cert11th:             5,
  cert12th:             5,
  testScores:           10,
  languageProficiency:  10,
  recommendationLetter: 10,
};

/* =====================================================
   HELPER — validate "YYYY-MM" format
===================================================== */
const isValidYearMonth = (value) => {
  if (!value || typeof value !== "string") return false;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const year = parseInt(value.split("-")[0], 10);
  const currentYear = new Date().getFullYear();
  if (year < currentYear || year > currentYear + 10) return false;
  return true;
};

/* =====================================================
   HELPER — build empty document template
===================================================== */
const buildEmptyDocuments = () => {
  const empty = { portfolioLink: "", isCompleted: false };
  VALID_DOCUMENT_TYPES.forEach((field) => { empty[field] = null; });
  CERT_FIELDS.forEach((field) => { empty[`${field}_expectedDate`] = ""; });
  return empty;
};

/* =====================================================
   HELPER — check if requester is admin or process admin
===================================================== */
const isAdmin = (req) =>
  (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) ||
  !!req.processAdmin;

/* =====================================================
   GET DOCUMENTS INFO
===================================================== */
export const getDocumentsInfo = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    let documents = await ApplicationDocument.findOne({ userId: req.userId });

    if (!documents) {
      return res.status(200).json({
        success: true,
        documents: { userId: req.userId, ...buildEmptyDocuments() },
        completionPercentage: 0,
        documentCounts: {
          total: VALID_DOCUMENT_TYPES.length,
          uploaded: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          missing: VALID_DOCUMENT_TYPES.length,
        },
        requiredDocumentsStatus: Object.fromEntries(
          REQUIRED_DOCUMENTS.map((d) => [d, false])
        ),
      });
    }

    return res.status(200).json({
      success: true,
      documents,
      completionPercentage: documents.completionPercentage,
      documentCounts: documents.documentCounts,
      requiredDocumentsStatus: documents.requiredDocumentsStatus,
    });
  } catch (error) {
    console.error("❌ Get Documents Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/* =====================================================
   UPLOAD DOCUMENT  ✅ UPDATED FOR S3
===================================================== */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { documentType } = req.params;

    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid document type. Allowed: ${VALID_DOCUMENT_TYPES.join(", ")}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    // ✅ S3 file properties (replaces req.file.path / req.file.filename)
    const s3Key      = req.file.key;        // e.g. "documents/cv/1234-567.pdf"
    const s3Url      = req.file.location;   // e.g. "https://bucket.s3.region.amazonaws.com/..."
    const fileSize   = req.file.size;
    const mimetype   = req.file.mimetype;
    const origName   = req.file.originalname;

    // Validate MIME type
    const allowedMimeTypes = [
      "image/jpeg", "image/jpg", "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedMimeTypes.includes(mimetype)) {
      // Delete from S3 if wrong type slipped through
      await deleteFileFromFolder(s3Key, "");
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX.",
      });
    }

    // Validate file size
    const maxBytes = (MAX_FILE_SIZE_MB[documentType] || 5) * 1024 * 1024;
    if (fileSize > maxBytes) {
      await deleteFileFromFolder(s3Key, "");
      return res.status(400).json({
        success: false,
        message: `File size exceeds ${MAX_FILE_SIZE_MB[documentType] || 5}MB limit.`,
      });
    }

    let documents = await ApplicationDocument.findOne({ userId: req.userId });
    if (!documents) {
      documents = new ApplicationDocument({ userId: req.userId });
    }

    // ✅ Remove old S3 file if it exists
    const oldFileKey = documents[documentType]?.fileKey;
    if (oldFileKey) {
      await deleteFileFromFolder(oldFileKey, "");
      console.log(`🗑️ Deleted old S3 file: ${oldFileKey}`);
    }

    const fileExt = path.extname(origName).toLowerCase().replace(".", "");

    // ✅ Store S3 key + URL instead of local filename
    const fileData = {
      fileName:       path.basename(s3Key),   // just the filename part
      fileKey:        s3Key,                   // full S3 key for deletion
      fileUrl:        s3Url,                   // full S3 URL for access
      originalName:   origName,
      fileType:       fileExt,
      fileSize:       fileSize,
      uploadedAt:     new Date(),
      documentStatus: "pending",
      generated:      false,
    };

    documents[documentType] = fileData;

    // Clear expected date now that the actual file is uploaded
    if (CERT_FIELDS.includes(documentType)) {
      documents[`${documentType}_expectedDate`] = "";
    }

    await documents.save();

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      documentType,
      fileData,
      completionPercentage: documents.completionPercentage,
      requiredDocumentsStatus: documents.requiredDocumentsStatus,
    });

  } catch (error) {
    console.error("❌ Upload Document Error:", error);
    // ✅ Clean up S3 file on error
    if (req.file?.key) {
      await deleteFileFromFolder(req.file.key, "").catch(() => {});
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Upload failed.",
    });
  }
};

/* =====================================================
   REMOVE DOCUMENT  ✅ UPDATED FOR S3
===================================================== */
export const removeDocument = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { documentType } = req.params;

    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({ success: false, message: "Invalid document type." });
    }

    const documents = await ApplicationDocument.findOne({ userId: req.userId });
    if (!documents) {
      return res.status(404).json({ success: false, message: "Documents record not found." });
    }

    if (!documents[documentType]?.fileName) {
      return res.status(200).json({
        success: true,
        message: "No file to remove.",
        completionPercentage: documents.completionPercentage,
      });
    }

    // ✅ Delete from S3 using fileKey (full S3 key)
    const fileKey = documents[documentType]?.fileKey;
    if (fileKey) {
      await deleteFileFromFolder(fileKey, "");
      console.log(`🗑️ Deleted from S3: ${fileKey}`);
    }

    await documents.removeDocument(documentType);

    return res.status(200).json({
      success: true,
      message: "Document removed successfully.",
      completionPercentage: documents.completionPercentage,
      requiredDocumentsStatus: documents.requiredDocumentsStatus,
    });
  } catch (error) {
    console.error("❌ Remove Document Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* =====================================================
   SAVE CERT EXPECTED DATE
===================================================== */
export const saveCertExpectedDate = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { field, expectedDate } = req.body;

    if (!CERT_FIELDS.includes(field)) {
      return res.status(400).json({
        success: false,
        message: `Invalid cert field. Allowed: ${CERT_FIELDS.join(", ")}`,
      });
    }

    if (!expectedDate) {
      return res.status(400).json({ success: false, message: "Expected date is required." });
    }

    if (!isValidYearMonth(expectedDate)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid format. Expected 'YYYY-MM' (e.g. '2025-06'). " +
          "Year must be current year or within the next 10 years.",
      });
    }

    let documents = await ApplicationDocument.findOne({ userId: req.userId });
    if (!documents) {
      documents = new ApplicationDocument({ userId: req.userId });
    }

    documents[`${field}_expectedDate`] = expectedDate;
    await documents.save();

    return res.status(200).json({
      success: true,
      message: "Expected date saved.",
      field,
      expectedDate,
      completionPercentage: documents.completionPercentage,
      requiredDocumentsStatus: documents.requiredDocumentsStatus,
    });
  } catch (error) {
    console.error("❌ Save Cert Expected Date Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* =====================================================
   CLEAR CERT EXPECTED DATE
===================================================== */
export const clearCertExpectedDate = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { field } = req.params;

    if (!CERT_FIELDS.includes(field)) {
      return res.status(400).json({ success: false, message: "Invalid cert field." });
    }

    const documents = await ApplicationDocument.findOne({ userId: req.userId });
    if (!documents) {
      return res.status(404).json({ success: false, message: "Documents record not found." });
    }

    documents[`${field}_expectedDate`] = "";
    await documents.save();

    return res.status(200).json({
      success: true,
      message: "Expected date cleared.",
      completionPercentage: documents.completionPercentage,
    });
  } catch (error) {
    console.error("❌ Clear Cert Expected Date Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* =====================================================
   UPDATE DOCUMENTS STATUS
===================================================== */
export const updateDocumentsStatus = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { completed } = req.body;

    const documents = await ApplicationDocument.findOne({ userId: req.userId });
    if (!documents) {
      return res.status(404).json({ success: false, message: "Documents record not found." });
    }

    if (completed && documents.areRequiredDocumentsUploaded) {
      documents.isCompleted = true;
      documents.completedAt = new Date();
      await documents.save();
    }

    return res.status(200).json({
      success: true,
      message: "Documents status updated.",
      isCompleted: documents.isCompleted,
      completionPercentage: documents.completionPercentage,
    });
  } catch (error) {
    console.error("❌ Update Documents Status Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* =====================================================
   CHECK DOCUMENTS COMPLETION
===================================================== */
export const checkDocumentsCompletion = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const documents = await ApplicationDocument.findOne({ userId: req.userId });

    if (!documents) {
      return res.status(200).json({
        success: true,
        isCompleted: false,
        completionPercentage: 0,
        requiredDocumentsStatus: Object.fromEntries(
          REQUIRED_DOCUMENTS.map((d) => [d, false])
        ),
        uploadedDocuments: [],
      });
    }

    const uploadedDocuments = REQUIRED_DOCUMENTS
      .filter((doc) => documents[doc]?.fileName)
      .map((doc) => ({ type: doc, ...documents[doc].toObject?.() || documents[doc] }));

    return res.status(200).json({
      success: true,
      isCompleted: documents.isCompleted,
      completionPercentage: documents.completionPercentage,
      requiredDocumentsStatus: documents.requiredDocumentsStatus,
      documentCounts: documents.documentCounts,
      uploadedDocuments,
    });
  } catch (error) {
    console.error("❌ Check Documents Completion Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* =====================================================
   GET DOCUMENT FILE  ✅ UPDATED FOR S3
   Now redirects to S3 URL instead of sending local file
===================================================== */
export const getDocumentFile = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { documentType } = req.params;

    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({ success: false, message: "Invalid document type." });
    }

    const documents = await ApplicationDocument.findOne({ userId: req.userId });

    if (!documents || !documents[documentType]?.fileUrl) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    // ✅ Redirect to S3 URL instead of sending local file
    return res.status(200).json({
      success: true,
      fileUrl: documents[documentType].fileUrl,
      fileName: documents[documentType].fileName,
      originalName: documents[documentType].originalName,
      fileType: documents[documentType].fileType,
    });

  } catch (error) {
    console.error("❌ Get Document File Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* =====================================================
   UPDATE PORTFOLIO LINK
===================================================== */
export const updatePortfolioLink = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { portfolioLink } = req.body;

    let documents = await ApplicationDocument.findOne({ userId: req.userId });
    if (!documents) {
      documents = new ApplicationDocument({ userId: req.userId });
    }

    documents.portfolioLink = portfolioLink || "";
    await documents.save();

    return res.status(200).json({
      success: true,
      message: "Portfolio link updated.",
      portfolioLink,
    });
  } catch (error) {
    console.error("❌ Update Portfolio Link Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* =====================================================
   ADMIN — GET ALL DOCUMENTS
===================================================== */
export const getAllDocuments = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { page = 1, limit = 20, status, documentType, userId } = req.query;
    let query = {};

    if (userId) query.userId = userId;

    if (status) {
      if (documentType && VALID_DOCUMENT_TYPES.includes(documentType)) {
        query[`${documentType}.documentStatus`] = status;
      } else {
        query.$or = VALID_DOCUMENT_TYPES.map((field) => ({
          [`${field}.documentStatus`]: status,
        }));
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const data = await ApplicationDocument.find(query)
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApplicationDocument.countDocuments(query);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page:  parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("❌ Admin Get All Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* =====================================================
   ADMIN — GET DOCUMENTS BY USER ID
===================================================== */
export const getDocumentsByUserId = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { userId } = req.params;
    const documents = await ApplicationDocument.findOne({ userId }).populate(
      "userId", "email firstName lastName"
    );

    if (!documents) {
      return res.status(404).json({
        success: false,
        message: "Documents not found for this user.",
      });
    }

    return res.status(200).json({ success: true, data: documents });
  } catch (error) {
    console.error("❌ Admin Get By User ID Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* =====================================================
   ADMIN — VERIFY DOCUMENT
===================================================== */
export const verifyDocument = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { id } = req.params;
    const { documentType, status, remark } = req.body;

    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({ success: false, message: "Invalid document type." });
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: approved, rejected, pending.",
      });
    }

    const documents = await ApplicationDocument.findById(id);
    if (!documents) {
      return res.status(404).json({ success: false, message: "Documents record not found." });
    }

    if (!documents[documentType]) {
      return res.status(404).json({ success: false, message: "Document type not found." });
    }

    await documents.verifyDocument(documentType, status, remark);

    return res.status(200).json({
      success: true,
      message: `Document ${status} successfully.`,
    });
  } catch (error) {
    console.error("❌ Admin Verify Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* =====================================================
   ADMIN — VERIFY ALL DOCUMENTS
===================================================== */
export const verifyAllDocuments = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { id } = req.params;
    const documents = await ApplicationDocument.findById(id);

    if (!documents) {
      return res.status(404).json({ success: false, message: "Documents record not found." });
    }

    await documents.verifyAll(req.userId);

    return res.status(200).json({
      success: true,
      message: "All documents verified successfully.",
    });
  } catch (error) {
    console.error("❌ Admin Verify All Error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};