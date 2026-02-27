import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// =====================================================
// Resolve __dirname (ESM)
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// UPLOAD DIRECTORY - PATH AGNOSTIC (WORKS EVERYWHERE)
// =====================================================
// Use path relative to server directory - this works on any machine!
const DOCUMENT_UPLOAD_DIR = path.join(__dirname, "..", "uploads", "documents");

// Create directory if it doesn't exist
if (!fs.existsSync(DOCUMENT_UPLOAD_DIR)) {
  fs.mkdirSync(DOCUMENT_UPLOAD_DIR, { recursive: true });
  console.log("📂 Created document upload directory:", DOCUMENT_UPLOAD_DIR);
} else {
  console.log("📂 Using existing document upload directory:", DOCUMENT_UPLOAD_DIR);
}

// =====================================================
// MULTER STORAGE
// =====================================================
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, DOCUMENT_UPLOAD_DIR),

  filename: (_, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();

    const cleanName = file.originalname
      .replace(ext, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 40);

    cb(null, `${timestamp}-${random}-${cleanName}${ext}`);
  },
});

// =====================================================
// FILE FILTER (PDF, IMAGES, DOCS)
// =====================================================
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // ✅ MIME TYPE CHECK
  if (!allowedMimeTypes.includes(file.mimetype)) {
    req.fileValidationError = "Only PDF, JPG, PNG, DOC, and DOCX files are allowed.";
    return cb(null, false);
  }

  // ✅ EXTENSION CHECK
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    req.fileValidationError = "Only .pdf, .jpg, .jpeg, .png, .doc, and .docx files are allowed";
    return cb(null, false);
  }

  cb(null, true);
};

// =====================================================
// MULTER INSTANCE
// =====================================================
export const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// =====================================================
// FILE URL HELPER - PATH AGNOSTIC
// =====================================================
export const getDocumentFileUrl = (filename) => {
  // Always return relative URL - works everywhere!
  return `/uploads/documents/${filename}`;
};

// =====================================================
// DELETE FILE - PATH AGNOSTIC
// =====================================================
export const deleteDocumentFile = (filename) => {
  if (!filename) return false;

  const filePath = path.join(DOCUMENT_UPLOAD_DIR, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ Deleted document file:", filename);
      return true;
    }
    return false;
  } catch (err) {
    console.error("❌ Document file delete error:", err);
    return false;
  }
};

// =====================================================
// VALIDATION MIDDLEWARE
// =====================================================
export const validateDocumentFileUpload = (req, res, next) => {
  if (req.fileValidationError) {
    return res.status(400).json({
      success: false,
      message: req.fileValidationError,
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  next();
};

export default {
  documentUpload,
  getDocumentFileUrl,
  deleteDocumentFile,
  DOCUMENT_UPLOAD_DIR,
  validateDocumentFileUpload,
};