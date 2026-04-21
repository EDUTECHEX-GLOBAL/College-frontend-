import MasterDocument from "../models/masterdocumentmodel.js";
import { getDynamicFileUrl, deleteFile } from "../middleware/uploadMiddleware.js";

// 🔹 Get documents
export const getDocuments = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: userId missing",
      });
    }

    const documents = await MasterDocument.findOne({ userId });

    res.json({
      success: true,
      data: documents || {},
    });
  } catch (error) {
    console.error("❌ Error in getDocuments:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 🔹 Upload document
export const uploadDocument = async (req, res) => {
  try {
    const { field } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: userId missing",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Find existing document
    let doc = await MasterDocument.findOne({ userId });

    // Create new if not exists
    if (!doc) {
      doc = new MasterDocument({ userId });
    }

    const fileData = {
      fileName: req.file.key,
      fileKey: req.file.key,
      fileUrl: getDynamicFileUrl(req.file.key),
      originalName: req.file.originalname,
    };

    // Assign dynamically (passport, resume, etc.)
    doc[field] = fileData;

    await doc.save();

    res.json({
      success: true,
      message: "File uploaded successfully",
      fileData,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};

// 🔹 Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { field } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: userId missing",
      });
    }

    const doc = await MasterDocument.findOne({ userId });

    if (!doc || !doc[field]) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const fileKey = doc[field]?.fileKey;

    // Delete file from storage (S3/local/etc.)
    if (fileKey) {
      await deleteFile(fileKey);
    }

    // Remove from DB
    doc[field] = null;

    await doc.save();

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};