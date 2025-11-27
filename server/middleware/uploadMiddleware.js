// server/middleware/uploadMiddleware.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { validateDocumentType } from "../utils/pdfValidator.js";

// =====================================================
// Resolve __dirname for ES Modules
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// UPLOAD DIRECTORY
// =====================================================
export const UPLOAD_DIR = process.env.EDU_UPLOAD_DIR || path.join(process.cwd(), "uploads", "education");

// Create uploads directory if not available
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("📂 Created upload directory:", UPLOAD_DIR);
}

// =====================================================
// MULTER STORAGE CONFIG
// =====================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);

    // Sanitize name (remove spaces + unsafe chars) - from previous version
    const cleanName = file.originalname
      .replace(ext, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 40); // limit length for safety

    cb(null, `${timestamp}-${random}-${cleanName}${ext}`);
  },
});

// =====================================================
// FILE FILTER (MIME CHECK)
// =====================================================
const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req, file, cb) => {
  // Check MIME types from previous version
  if (!allowedMimeTypes.includes(file.mimetype)) {
    req.fileValidationError = "Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX";
    return cb(null, false);
  }

  // Also check file extension from current version for extra security
  const allowedExtensions = /pdf|jpg|jpeg|png|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.test(ext.slice(1))) {
    req.fileValidationError = "Unsupported file type";
    return cb(new Error("Unsupported file type"), false);
  }

  cb(null, true);
};

// =====================================================
// MULTER UPLOAD INSTANCE
// =====================================================
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.EDU_UPLOAD_MAX_MB || "10", 10) * 1024 * 1024, // from current version
  },
});

// =====================================================
// FILE URL HELPER
// =====================================================
export const getFileUrl = (filename) => {
  const base = process.env.UPLOAD_BASE_URL || "";
  return base
    ? `${base}/education/${filename}`
    : `/uploads/education/${filename}`;
};

// =====================================================
// DELETE FILE UTILITY
// =====================================================
export const deleteFile = (filename) => {
  if (!filename) return;

  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ File deleted:", filePath);
      return true;
    } else {
      console.warn("⚠️ File not found to delete:", filePath);
      return false;
    }
  } catch (err) {
    console.error("❌ File deletion error:", err);
    return false;
  }
};

// =====================================================
// VALIDATE UPLOADED DOCUMENT (PDF/IMAGE/PASSPORT/etc)
// =====================================================
export const validateUploadedDocument = async (filePath, expectedType) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found for validation");
    }

    // Call your universal validator
    const validationResult = await validateDocumentType(filePath, expectedType);

    // If invalid → auto-delete
    if (!validationResult.valid) {
      const filename = path.basename(filePath);
      deleteFile(filename);
      console.warn(`❌ Validation failed. Removed file: ${filename}`);
    }

    return validationResult;
  } catch (err) {
    console.error("❌ Validation error:", err);

    return {
      valid: false,
      confidence: 0,
      expectedType,
      message: err.message || "Document validation failed",
    };
  }
};

// =====================================================
// FILE VALIDATION MIDDLEWARE
// =====================================================
export const validateFileUpload = (req, res, next) => {
  if (req.fileValidationError) {
    return res.status(400).json({
      success: false,
      message: req.fileValidationError
    });
  }
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded"
    });
  }
  
  next();
};

// (optional) default export object — you can keep or remove this
export default { 
  upload, 
  getFileUrl, 
  deleteFile, 
  UPLOAD_DIR,
  validateUploadedDocument,
  validateFileUpload
};