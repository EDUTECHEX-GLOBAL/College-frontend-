import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getDocumentsInfo,
  uploadDocument,
  removeDocument,
  updatePortfolioLink,
  updateDocumentsStatus,
  checkDocumentsCompletion,
  getDocumentFile,
  getAllDocuments,
  getDocumentsByUserId,
  verifyDocument,
  verifyAllDocuments,
} from "../controllers/applicationDocumentController.js";
import { 
  createUploader, 
  ensureDirectoryExists 
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================================
   ENSURE DOCUMENT UPLOAD FOLDERS EXIST
===================================================== */
const documentFolders = [
  "documents/cv",
  "documents/photo",
  "documents/education",
  "documents/language",
  "documents/portfolio",
  "documents/university",
  "documents/other",
];

// Create all document folders
documentFolders.forEach(folder => {
  ensureDirectoryExists(folder);
  console.log(`✅ Document folder ready: ${folder}`);
});

/* =====================================================
   MULTER UPLOADER FOR DOCUMENTS
   - Max size: 5MB
   - Accepts: PDF, JPG, PNG
===================================================== */
const documentUpload = createUploader("documents", 5);

/* =====================================================
   TEST ROUTE - To verify API is working
===================================================== */
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Application Documents API is working",
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      GET: ["/", "/completion", "/files/:documentType", "/admin/all", "/admin/user/:userId", "/test"],
      POST: ["/upload/:documentType", "/portfolio-link", "/status"],
      DELETE: ["/files/:documentType"],
      PUT: ["/admin/verify/:id", "/admin/verify-all/:id"]
    }
  });
});

/* =====================================================
   PROTECTED ROUTES - All routes require authentication
===================================================== */
router.use(authMiddleware);

/* =====================================================
   USER ROUTES
===================================================== */

/**
 * @route   GET /api/application/documents
 * @desc    Get all documents for current user
 * @access  Private
 */
router.get("/", getDocumentsInfo);

/**
 * @route   GET /api/application/documents/completion
 * @desc    Check documents completion status
 * @access  Private
 */
router.get("/completion", checkDocumentsCompletion);

/**
 * @route   POST /api/application/documents/upload/:documentType
 * @desc    Upload a document by type
 * @access  Private
 */
router.post(
  "/upload/:documentType",
  (req, res, next) => {
    // Log upload attempt
    console.log(`📤 Upload attempt for document type: ${req.params.documentType}`);
    next();
  },
  documentUpload.single("file"),
  (req, res, next) => {
    // Check for multer errors
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    next();
  },
  uploadDocument
);

/**
 * @route   POST /api/application/documents/portfolio-link
 * @desc    Update portfolio link
 * @access  Private
 */
router.post("/portfolio-link", updatePortfolioLink);

/**
 * @route   POST /api/application/documents/status
 * @desc    Update documents status
 * @access  Private
 */
router.post("/status", updateDocumentsStatus);

/**
 * @route   GET /api/application/documents/files/:documentType
 * @desc    Get document file by type
 * @access  Private
 */
router.get("/files/:documentType", getDocumentFile);

/**
 * @route   DELETE /api/application/documents/files/:documentType
 * @desc    Remove document by type
 * @access  Private
 */
router.delete("/files/:documentType", removeDocument);

/* =====================================================
   ADMIN ROUTES
===================================================== */

/**
 * @route   GET /api/application/documents/admin/all
 * @desc    Get all documents (admin only)
 * @access  Private/Admin
 */
router.get("/admin/all", getAllDocuments);

/**
 * @route   GET /api/application/documents/admin/user/:userId
 * @desc    Get documents by user ID (admin only)
 * @access  Private/Admin
 */
router.get("/admin/user/:userId", getDocumentsByUserId);

/**
 * @route   PUT /api/application/documents/admin/verify/:id
 * @desc    Verify a specific document
 * @access  Private/Admin
 */
router.put("/admin/verify/:id", verifyDocument);

/**
 * @route   PUT /api/application/documents/admin/verify-all/:id
 * @desc    Verify all documents for a user
 * @access  Private/Admin
 */
router.put("/admin/verify-all/:id", verifyAllDocuments);

export default router;