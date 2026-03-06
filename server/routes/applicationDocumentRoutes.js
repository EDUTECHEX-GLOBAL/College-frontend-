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
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";

const router = express.Router();

/* =====================================================
   ENSURE ALL DOCUMENT UPLOAD FOLDERS EXIST ON STARTUP
===================================================== */
const documentFolders = [
  "documents/cv",
  "documents/photo",
  "documents/personal",
  "documents/academic",
  "documents/certificates",
  "documents/optional",
  "documents/other",
];

documentFolders.forEach((folder) => {
  ensureDirectoryExists(folder);
  console.log(`✅ Document folder ready: ${folder}`);
});

/* =====================================================
   MULTER UPLOADER
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
        "/process-admin/all",
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
   ADMIN ROUTES (before authMiddleware)
===================================================== */

/**
 * @route   GET /api/application/documents/admin/all
 * @desc    Get all users' documents (paginated, filterable)
 * @access  Private/Admin
 */
router.get("/admin/all", authMiddleware, getAllDocuments);

/**
 * @route   GET /api/application/documents/process-admin/all
 * @desc    Get all users' documents for process admin dashboard
 * @access  Private/ProcessAdmin
 */
router.get("/process-admin/all", protectProcessAdmin, getAllDocuments);

/**
 * @route   GET /api/application/documents/admin/user/:userId
 * @desc    Get one user's documents by userId
 * @access  Private/Admin
 */
router.get("/admin/user/:userId", authMiddleware, getDocumentsByUserId);

/**
 * @route   PUT /api/application/documents/admin/verify/:id
 * @desc    Approve or reject a specific document
 * @access  Private/Admin
 */
router.put("/admin/verify/:id", authMiddleware, verifyDocument);

/**
 * @route   PUT /api/application/documents/admin/verify-all/:id
 * @desc    Mark all documents as verified for a user
 * @access  Private/Admin
 */
router.put("/admin/verify-all/:id", authMiddleware, verifyAllDocuments);

/* =====================================================
   ALL ROUTES BELOW REQUIRE AUTHENTICATION
===================================================== */
router.use(authMiddleware);

/* =====================================================
   USER ROUTES — Documents
===================================================== */

router.get("/", getDocumentsInfo);
router.get("/completion", checkDocumentsCompletion);
router.get("/files/:documentType", getDocumentFile);

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

router.delete("/files/:documentType", removeDocument);

/* =====================================================
   USER ROUTES — Certificate Expected Dates
===================================================== */

router.post("/cert-expected-date", saveCertExpectedDate);
router.delete("/cert-expected-date/:field", clearCertExpectedDate);

/* =====================================================
   USER ROUTES — Misc
===================================================== */

router.post("/portfolio-link", updatePortfolioLink);
router.post("/status", updateDocumentsStatus);

export default router;