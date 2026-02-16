import ApplicationDocument from "../models/applicationDocumentModel.js";
import {
  ensureDirectoryExists,
  deleteFileFromFolder,
  getDynamicFileUrl,
} from "../middleware/uploadMiddleware.js";
import path from "path";
import fs from "fs";

// Document type to folder mapping
const documentFolderMap = {
  cv: "documents/cv",
  photo: "documents/photo",
  eqhe: "documents/education",
  finalEqhe: "documents/education",
  bachelorTranscript: "documents/education",
  bachelorCertificate: "documents/education",
  germanCertificate: "documents/language",
  englishCertificate: "documents/language",
  portfolio: "documents/portfolio",
  noObjection: "documents/university",
  deRegistration: "documents/university",
  other: "documents/other",
};

// Required documents for completion
const REQUIRED_DOCUMENTS = ["cv", "photo", "eqhe", "englishCertificate", "portfolio"];

/* =====================================================
   HELPER FUNCTION TO CHECK IF USER IS ADMIN
===================================================== */
const isAdmin = (req) => {
  return req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
};

/* =====================================================
   GET DOCUMENTS INFO
===================================================== */
export const getDocumentsInfo = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    let documents = await ApplicationDocument.findOne({
      userId: req.userId,
    });

    if (!documents) {
      // Return empty template
      return res.status(200).json({
        success: true,
        documents: {
          userId: req.userId,
          cv: {},
          photo: {},
          eqhe: {},
          finalEqhe: {},
          bachelorTranscript: {},
          bachelorCertificate: {},
          germanCertificate: {},
          englishCertificate: {},
          portfolio: {},
          noObjection: {},
          deRegistration: {},
          other: {},
          portfolioLink: "",
          isCompleted: false,
        },
        completionPercentage: 0,
        documentCounts: {
          total: 12,
          uploaded: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          missing: 12
        },
        requiredDocumentsStatus: {
          cv: false,
          photo: false,
          eqhe: false,
          englishCertificate: false,
          portfolio: false,
        },
      });
    }

    const completionPercentage = documents.completionPercentage || 0;
    const documentCounts = documents.documentCounts || {};
    const requiredDocumentsStatus = documents.requiredDocumentsStatus || {};

    res.status(200).json({
      success: true,
      documents,
      completionPercentage,
      documentCounts,
      requiredDocumentsStatus,
    });
  } catch (error) {
    console.error("❌ Get Documents Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/* =====================================================
   UPLOAD DOCUMENT
===================================================== */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    const { documentType } = req.params;

    // Validate document type
    const validDocumentTypes = [
      "cv", "photo", "eqhe", "finalEqhe", "bachelorTranscript",
      "bachelorCertificate", "germanCertificate", "englishCertificate",
      "portfolio", "noObjection", "deRegistration", "other"
    ];

    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get folder for document type
    const folder = documentFolderMap[documentType] || "documents/other";
    
    // Ensure directory exists
    ensureDirectoryExists(folder);

    // Validate file type
    const allowedTypes = {
      images: ["image/jpeg", "image/jpg", "image/png"],
      pdf: ["application/pdf"],
    };

    const allAllowedTypes = [...allowedTypes.images, ...allowedTypes.pdf];
    
    if (!allAllowedTypes.includes(req.file.mimetype)) {
      // Delete invalid file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only PDF, JPG, and PNG are allowed.",
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      // Delete oversized file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "File size exceeds 5MB limit.",
      });
    }

    let documents = await ApplicationDocument.findOne({
      userId: req.userId,
    });

    if (!documents) {
      // Create new document record
      documents = new ApplicationDocument({
        userId: req.userId,
      });
    }

    // Get file extension
    const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    // Remove old file if exists
    const oldFile = documents[documentType]?.fileName;
    if (oldFile) {
      deleteFileFromFolder(oldFile, folder);
    }

    // Prepare file data
    const fileData = {
      fileName: req.file.filename,
      fileUrl: getDynamicFileUrl(req.file.filename, folder),
      originalName: req.file.originalname,
      fileType: fileExt,
      fileSize: req.file.size,
      uploadedAt: new Date(),
      documentStatus: "pending",
    };

    // Update document
    documents[documentType] = fileData;
    await documents.save();

    // Calculate updated completion
    const completionPercentage = documents.completionPercentage;

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      documentType,
      fileData,
      completionPercentage,
      requiredDocumentsStatus: documents.requiredDocumentsStatus,
    });
  } catch (error) {
    console.error("❌ Upload Document Error:", error);

    // Clean up uploaded file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message || "Upload failed",
    });
  }
};

/* =====================================================
   REMOVE DOCUMENT
===================================================== */
export const removeDocument = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    const { documentType } = req.params;

    // Validate document type
    const validDocumentTypes = [
      "cv", "photo", "eqhe", "finalEqhe", "bachelorTranscript",
      "bachelorCertificate", "germanCertificate", "englishCertificate",
      "portfolio", "noObjection", "deRegistration", "other"
    ];

    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    const documents = await ApplicationDocument.findOne({
      userId: req.userId,
    });

    if (!documents) {
      return res.status(404).json({
        success: false,
        message: "Documents record not found",
      });
    }

    if (!documents[documentType] || !documents[documentType].fileName) {
      return res.status(200).json({
        success: true,
        message: "No file to remove",
        completionPercentage: documents.completionPercentage,
      });
    }

    // Get folder for document type
    const folder = documentFolderMap[documentType] || "documents/other";

    // Delete file from server
    const fileName = documents[documentType].fileName;
    deleteFileFromFolder(fileName, folder);

    // Remove document from database using the model method
    await documents.removeDocument(documentType);

    res.status(200).json({
      success: true,
      message: "Document removed successfully",
      completionPercentage: documents.completionPercentage,
      requiredDocumentsStatus: documents.requiredDocumentsStatus,
    });
  } catch (error) {
    console.error("❌ Remove Document Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   UPDATE PORTFOLIO LINK
===================================================== */
export const updatePortfolioLink = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    const { portfolioLink } = req.body;

    let documents = await ApplicationDocument.findOne({
      userId: req.userId,
    });

    if (!documents) {
      documents = new ApplicationDocument({
        userId: req.userId,
      });
    }

    documents.portfolioLink = portfolioLink;
    await documents.save();

    res.status(200).json({
      success: true,
      message: "Portfolio link updated successfully",
      portfolioLink,
    });
  } catch (error) {
    console.error("❌ Update Portfolio Link Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   UPDATE DOCUMENTS STATUS
===================================================== */
export const updateDocumentsStatus = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    const { completed } = req.body;

    const documents = await ApplicationDocument.findOne({
      userId: req.userId,
    });

    if (!documents) {
      return res.status(404).json({
        success: false,
        message: "Documents record not found",
      });
    }

    if (completed) {
      const allRequiredUploaded = REQUIRED_DOCUMENTS.every(
        doc => documents[doc] && documents[doc].fileName
      );

      if (allRequiredUploaded) {
        documents.isCompleted = true;
        documents.completedAt = new Date();
        await documents.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Documents status updated successfully",
      isCompleted: documents.isCompleted,
      completionPercentage: documents.completionPercentage,
    });
  } catch (error) {
    console.error("❌ Update Documents Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   CHECK DOCUMENTS COMPLETION
===================================================== */
export const checkDocumentsCompletion = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    const documents = await ApplicationDocument.findOne({
      userId: req.userId,
    });

    if (!documents) {
      return res.status(200).json({
        success: true,
        isCompleted: false,
        completionPercentage: 0,
        requiredDocumentsStatus: {
          cv: false,
          photo: false,
          eqhe: false,
          englishCertificate: false,
          portfolio: false,
        },
        uploadedDocuments: [],
      });
    }

    // Get list of uploaded documents
    const uploadedDocs = [];
    for (const doc of REQUIRED_DOCUMENTS) {
      if (documents[doc] && documents[doc].fileName) {
        uploadedDocs.push({
          type: doc,
          ...documents[doc].toObject?.() || documents[doc]
        });
      }
    }

    res.status(200).json({
      success: true,
      isCompleted: documents.isCompleted,
      completionPercentage: documents.completionPercentage,
      requiredDocumentsStatus: documents.requiredDocumentsStatus,
      documentCounts: documents.documentCounts,
      uploadedDocuments: uploadedDocs,
    });
  } catch (error) {
    console.error("❌ Check Documents Completion Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   GET DOCUMENT FILE
===================================================== */
export const getDocumentFile = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    const { documentType } = req.params;

    const documents = await ApplicationDocument.findOne({
      userId: req.userId,
    });

    if (!documents || !documents[documentType]?.fileName) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const folder = documentFolderMap[documentType] || "documents/other";
    const filePath = path.join(
      process.cwd(),
      "uploads",
      folder,
      documents[documentType].fileName
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("❌ Get Document File Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   ADMIN GET ALL DOCUMENTS
===================================================== */
export const getAllDocuments = async (req, res) => {
  try {
    // Check if user is admin
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const { page = 1, limit = 20, status, documentType, userId } = req.query;
    
    let query = {};
    
    // Filter by userId if provided
    if (userId) {
      query.userId = userId;
    }
    
    // Filter by document status
    if (status) {
      if (documentType) {
        query[`${documentType}.documentStatus`] = status;
      } else {
        query.$or = [
          { "cv.documentStatus": status },
          { "photo.documentStatus": status },
          { "eqhe.documentStatus": status },
          { "englishCertificate.documentStatus": status },
          { "portfolio.documentStatus": status }
        ];
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await ApplicationDocument.find(query)
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApplicationDocument.countDocuments(query);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("❌ Admin Get All Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   ADMIN GET DOCUMENTS BY USER ID
===================================================== */
export const getDocumentsByUserId = async (req, res) => {
  try {
    // Check if user is admin
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const { userId } = req.params;

    const documents = await ApplicationDocument.findOne({ userId })
      .populate("userId", "email firstName lastName");

    if (!documents) {
      return res.status(404).json({
        success: false,
        message: "Documents not found for this user",
      });
    }

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("❌ Admin Get By User ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   ADMIN VERIFY DOCUMENT
===================================================== */
export const verifyDocument = async (req, res) => {
  try {
    // Check if user is admin
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const { id } = req.params;
    const { documentType, status, remark } = req.body;

    const documents = await ApplicationDocument.findById(id);

    if (!documents) {
      return res.status(404).json({
        success: false,
        message: "Documents record not found",
      });
    }

    if (!documents[documentType]) {
      return res.status(404).json({
        success: false,
        message: "Document type not found",
      });
    }

    await documents.verifyDocument(documentType, status, remark);

    res.status(200).json({
      success: true,
      message: `Document ${status} successfully`,
    });
  } catch (error) {
    console.error("❌ Admin Verify Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   ADMIN VERIFY ALL DOCUMENTS
===================================================== */
export const verifyAllDocuments = async (req, res) => {
  try {
    // Check if user is admin
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const { id } = req.params;

    const documents = await ApplicationDocument.findById(id);

    if (!documents) {
      return res.status(404).json({
        success: false,
        message: "Documents record not found",
      });
    }

    await documents.verifyAll(req.userId);

    res.status(200).json({
      success: true,
      message: "All documents verified successfully",
    });
  } catch (error) {
    console.error("❌ Admin Verify All Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};