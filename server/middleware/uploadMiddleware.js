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
// CREATE ALL UPLOAD DIRECTORIES
// =====================================================
const createUploadDirs = () => {
  const baseDir = path.join(process.cwd(), "uploads");
  const folders = ['passport', 'photograph', 'education', 'nationalId'];

  
  // Create base uploads directory
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log("📂 Created base upload directory:", baseDir);
  }
  
  // Create subdirectories
  folders.forEach(folder => {
    const dirPath = path.join(baseDir, folder);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📂 Created upload directory: ${dirPath}`);
    }
  });
};

// Initialize directories
createUploadDirs();

// =====================================================
// UPLOAD DIRECTORY
// =====================================================
export const UPLOAD_DIR = process.env.EDU_UPLOAD_DIR || path.join(process.cwd(), "uploads", "education");

// =====================================================
// FILE FILTER (MIME CHECK) - FIXED VERSION
// =====================================================
const fileFilter = (req, file, cb) => {
  console.log('🔍 Checking file:', file.originalname, 'MIME:', file.mimetype);
  
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error("Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX");
    req.fileValidationError = error.message;
    console.log('❌ File rejected:', error.message);
    return cb(error, false);
  }

  // Check file extension
  const allowedExtensions = /\.(pdf|jpg|jpeg|png|doc|docx)$/i;
  if (!allowedExtensions.test(file.originalname)) {
    const error = new Error("Unsupported file extension");
    req.fileValidationError = error.message;
    console.log('❌ File extension rejected:', file.originalname);
    return cb(error, false);
  }

  console.log('✅ File accepted:', file.originalname);
  cb(null, true);
};

// =====================================================
// DEFAULT STORAGE CONFIG (for backward compatibility)
// =====================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "education");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${timestamp}-${random}${ext}`;
    cb(null, filename);
  },
});

// =====================================================
// SIMPLIFIED STORAGE CREATOR - FIXED VERSION
// =====================================================
const createStorage = (folderName) => {
  const uploadDir = path.join(process.cwd(), "uploads", folderName);
  
  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📂 Created directory: ${uploadDir}`);
  }
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      console.log(`📁 Destination: ${uploadDir} for ${file.originalname}`);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      try {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        
        // SIMPLE FIX: Use only timestamp and random number
        const filename = `${timestamp}-${random}${ext}`;
        
        console.log(`📁 Generated: ${filename} from ${file.originalname}`);
        cb(null, filename);
        
      } catch (error) {
        console.error('❌ Filename generation error:', error);
        // Fallback
        const fallbackName = `${folderName}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, fallbackName);
      }
    },
  });
};

// =====================================================
// DEFAULT UPLOAD INSTANCE (for backward compatibility)
// =====================================================
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.EDU_UPLOAD_MAX_MB || "10", 10) * 1024 * 1024,
  },
});

// =====================================================
// CREATE UPLOADER FOR SPECIFIC FOLDER
// =====================================================
export const createUploader = (folderName, maxSizeMB = 10) => {
  return multer({
    storage: createStorage(folderName),
    fileFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  });
};

// =====================================================
// PRE-CONFIGURED UPLOADERS
// =====================================================
export const passportUpload = createUploader("passport", 10);
export const photographUpload = createUploader("photograph", 2);
export const educationUpload = createUploader("education", 10);
export const nationalIdUpload = createUploader("nationalId", 10);


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
// DYNAMIC FILE URL HELPER
// =====================================================
export const getDynamicFileUrl = (filename, folder = "education") => {
  const base = process.env.UPLOAD_BASE_URL || "";
  return base
    ? `${base}/${folder}/${filename}`
    : `/uploads/${folder}/${filename}`;
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
// DYNAMIC DELETE FILE UTILITY
// =====================================================
export const deleteFileFromFolder = (filename, folder = "education") => {
  if (!filename) return;

  const filePath = path.join(process.cwd(), "uploads", folder, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ File deleted from ${folder}:`, filePath);
      return true;
    } else {
      console.warn(`⚠️ File not found in ${folder}:`, filePath);
      return false;
    }
  } catch (err) {
    console.error(`❌ File deletion error for ${folder}:`, err);
    return false;
  }
};

// =====================================================
// VALIDATE UPLOADED DOCUMENT
// =====================================================
export const validateUploadedDocument = async (filePath, expectedType) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found for validation");
    }

    const validationResult = await validateDocumentType(filePath, expectedType);

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
// VALIDATE UPLOADED DOCUMENT WITH FOLDER SUPPORT
// =====================================================
export const validateUploadedDocumentInFolder = async (filePath, expectedType, folder = "education") => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found for validation");
    }

    const validationResult = await validateDocumentType(filePath, expectedType);

    if (!validationResult.valid) {
      const filename = path.basename(filePath);
      deleteFileFromFolder(filename, folder);
      console.warn(`❌ Validation failed. Removed file from ${folder}: ${filename}`);
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

// =====================================================
// GET FILE PATH HELPER
// =====================================================
export const getFilePath = (filename, folder = "education") => {
  return path.join(process.cwd(), "uploads", folder, filename);
};

// =====================================================
// ENSURE DIRECTORY EXISTS
// =====================================================
export const ensureDirectoryExists = (folderName) => {
  const dirPath = path.join(process.cwd(), "uploads", folderName);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📂 Created directory: ${dirPath}`);
  }
  return dirPath;
};

// =====================================================
// QUICK FILE VALIDATION
// =====================================================
export const quickValidateFile = async (filePath, fileType) => {
  try {
    console.log(`🔍 Quick validating ${fileType}...`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    
    if (fileType === 'passport' || fileType === 'photograph') {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      if (stats.size > 10 * 1024 * 1024) {
        return {
          valid: false,
          message: `File too large (${(stats.size / 1024 / 1024).toFixed(2)}MB). Max 10MB.`
        };
      }
      
      const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
      if (!allowedImageTypes.includes(ext)) {
        return {
          valid: false,
          message: `Invalid file type. Allowed: ${allowedImageTypes.join(', ')}`
        };
      }
      
      return {
        valid: true,
        message: 'Basic validation passed',
        fileInfo: {
          size: stats.size,
          type: ext,
          name: path.basename(filePath)
        }
      };
    }
    
    return { valid: true, message: 'File exists' };
    
  } catch (error) {
    console.error('Quick validation error:', error);
    return {
      valid: false,
      message: error.message
    };
  }
};

// =====================================================
// CHECK IF UPLOAD DIRECTORIES ARE WRITABLE
// =====================================================
export const checkUploadPermissions = () => {
  const folders = ['passport', 'photograph', 'education'];
  
  folders.forEach(folder => {
    const dirPath = path.join(process.cwd(), "uploads", folder);
    try {
      fs.accessSync(dirPath, fs.constants.W_OK);
      console.log(`✅ ${dirPath} is writable`);
    } catch (error) {
      console.error(`❌ ${dirPath} is NOT writable:`, error.message);
    }
  });
};

// Check permissions on startup
checkUploadPermissions();

// Default export (for backward compatibility)
// =====================================================
// DEFAULT EXPORT (for backward compatibility)
// =====================================================
export default { 
  upload: createUploader,  // ← FIXED: export the function, not the object
  passportUpload,
  photographUpload,
  educationUpload,
  getFileUrl,
  getDynamicFileUrl,
  nationalIdUpload,
  deleteFile,
  deleteFileFromFolder,
  validateUploadedDocument,
  validateUploadedDocumentInFolder,
  validateFileUpload,
  getFilePath,
  ensureDirectoryExists,
  quickValidateFile,
  checkUploadPermissions,
  UPLOAD_DIR
};