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

    // ✅ FIX: Generate fresh presigned URLs for all uploaded fields before sending
    if (documents) {
      const DOCUMENT_FIELDS = [
        "passport", "photo", "cert10th", "cert12th",
        "bachelorTranscript", "bachelorDegree", "provisionalCertificate",
        "consolidatedMarksheet", "resumeCv", "statementOfPurpose",
        "lettersOfRecommendation", "englishCertificate", "testScores", "workExperience",
      ];

      for (const field of DOCUMENT_FIELDS) {
        if (documents[field]?.fileKey) {
          documents[field].fileUrl = await getDynamicFileUrl(documents[field].fileKey);
        }
      }
    }

    // ✅ FIX: key must be `documents`, not `data` — frontend checks result.documents
    res.json({
      success: true,
      documents: documents || {},  // was: data
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

    let doc = await MasterDocument.findOne({ userId });

    if (!doc) {
      doc = new MasterDocument({ userId });
    }

    const fileData = {
      fileName: req.file.key,
      fileKey: req.file.key,
      fileUrl: await getDynamicFileUrl(req.file.key),
      originalName: req.file.originalname,
    };

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

    if (fileKey) {
      await deleteFile(fileKey);
    }

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