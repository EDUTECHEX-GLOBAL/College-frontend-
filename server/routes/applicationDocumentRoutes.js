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
import { createUploader } from "../middleware/uploadMiddleware.js";
import { protectProcessAdmin } from "../middleware/processAdminAuth.js";

const router = express.Router();

// ✅ S3 uploader — files go to s3://ups-bucket-s3/documents/
// No local folder creation needed
const documentUpload = createUploader("documents", 10);

/* =====================================================
   TEST ROUTE
===================================================== */
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Application Documents API is working",
    timestamp: new Date().toISOString(),
    storage: "AWS S3",
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
router.get("/admin/all", authMiddleware, getAllDocuments);
router.get("/process-admin/all", protectProcessAdmin, getAllDocuments);
router.get("/admin/user/:userId", authMiddleware, getDocumentsByUserId);
router.put("/admin/verify/:id", authMiddleware, verifyDocument);
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