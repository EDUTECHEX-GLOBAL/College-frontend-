import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getDocumentsInfo,
  uploadDocument,
  removeDocument,
  saveCertExpectedDate,
  clearCertExpectedDate,
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
  ensureDirectoryExists,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================================
   ENSURE ALL DOCUMENT UPLOAD FOLDERS EXIST ON STARTUP
===================================================== */
const documentFolders = [
  "documents/cv",
  "documents/photo",
  "documents/personal",      // passport
  "documents/academic",      // transcript, diploma
  "documents/certificates",  // cert9th–cert12th
  "documents/optional",      // testScores, languageProficiency, recommendationLetter
  "documents/other",
];

documentFolders.forEach((folder) => {
  ensureDirectoryExists(folder);
  console.log(`✅ Document folder ready: ${folder}`);
});

/* =====================================================
   MULTER UPLOADER
   - Handles all document uploads
   - Max size enforced per-field in the controller
   - 10 MB ceiling here to accommodate academic/optional docs
===================================================== */
const documentUpload = createUploader("documents", 10);

/* =====================================================
   TEST ROUTE
===================================================== */
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Application Documents API is working",
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      GET: [
        "/",
        "/completion",
        "/files/:documentType",
        "/admin/all",
        "/admin/user/:userId",
        "/test",
      ],
      POST: [
        "/upload/:documentType",
        "/cert-expected-date",
        "/portfolio-link",
        "/status",
      ],
      DELETE: [
        "/files/:documentType",
        "/cert-expected-date/:field",
      ],
      PUT: [
        "/admin/verify/:id",
        "/admin/verify-all/:id",
      ],
    },
    validDocumentTypes: [
      "cv", "photo", "passport",
      "transcript", "diploma",
      "cert9th", "cert10th", "cert11th", "cert12th",
      "testScores", "languageProficiency", "recommendationLetter",
    ],
  });
});

/* =====================================================
   ALL ROUTES BELOW REQUIRE AUTHENTICATION
===================================================== */
router.use(authMiddleware);

/* =====================================================
   USER ROUTES — Documents
===================================================== */

/**
 * @route   GET /api/application/documents
 * @desc    Get all documents for the current user
 * @access  Private
 */
router.get("/", getDocumentsInfo);

/**
 * @route   GET /api/application/documents/completion
 * @desc    Check document completion status
 * @access  Private
 */
router.get("/completion", checkDocumentsCompletion);

/**
 * @route   GET /api/application/documents/files/:documentType
 * @desc    Serve a document file (streams file back)
 * @access  Private
 */
router.get("/files/:documentType", getDocumentFile);

/**
 * @route   POST /api/application/documents/upload/:documentType
 * @desc    Upload a document by field name
 * @access  Private
 * @valid   documentType must be one of the VALID_DOCUMENT_TYPES
 */
router.post(
  "/upload/:documentType",
  (req, res, next) => {
    console.log(`📤 Upload attempt — documentType: ${req.params.documentType}`);
    next();
  },
  documentUpload.single("file"),
  (req, res, next) => {
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }
    next();
  },
  uploadDocument
);

/**
 * @route   DELETE /api/application/documents/files/:documentType
 * @desc    Remove a document by field name
 * @access  Private
 */
router.delete("/files/:documentType", removeDocument);

/* =====================================================
   USER ROUTES — Certificate Expected Dates
   Used by the Yes/No availability flow in the frontend.
   When a student selects "No, not yet" for a grade cert,
   the Month + Year dropdowns send a "YYYY-MM" string.
===================================================== */

/**
 * @route   POST /api/application/documents/cert-expected-date
 * @desc    Save an expected receipt month/year for a grade certificate
 * @body    {
 *            field:        "cert9th" | "cert10th" | "cert11th" | "cert12th",
 *            expectedDate: "YYYY-MM"  ← e.g. "2025-06"
 *          }
 * @access  Private
 */
router.post("/cert-expected-date", saveCertExpectedDate);

/**
 * @route   DELETE /api/application/documents/cert-expected-date/:field
 * @desc    Clear an expected receipt date (when student resets their answer)
 * @access  Private
 */
router.delete("/cert-expected-date/:field", clearCertExpectedDate);

/* =====================================================
   USER ROUTES — Misc
===================================================== */

/**
 * @route   POST /api/application/documents/portfolio-link
 * @desc    Save a portfolio URL
 * @access  Private
 */
router.post("/portfolio-link", updatePortfolioLink);

/**
 * @route   POST /api/application/documents/status
 * @desc    Mark documents section as completed
 * @access  Private
 */
router.post("/status", updateDocumentsStatus);

/* =====================================================
   ADMIN ROUTES
===================================================== */

/**
 * @route   GET /api/application/documents/admin/all
 * @desc    Get all users' documents (paginated, filterable)
 * @query   page, limit, status, documentType, userId
 * @access  Private/Admin
 */
router.get("/admin/all", getAllDocuments);

/**
 * @route   GET /api/application/documents/admin/user/:userId
 * @desc    Get one user's documents by userId
 * @access  Private/Admin
 */
router.get("/admin/user/:userId", getDocumentsByUserId);

/**
 * @route   PUT /api/application/documents/admin/verify/:id
 * @desc    Approve or reject a specific document
 * @body    { documentType, status: "approved"|"rejected"|"pending", remark? }
 * @access  Private/Admin
 */
router.put("/admin/verify/:id", verifyDocument);

/**
 * @route   PUT /api/application/documents/admin/verify-all/:id
 * @desc    Mark all documents as verified for a user
 * @access  Private/Admin
 */
router.put("/admin/verify-all/:id", verifyAllDocuments);

export default router;