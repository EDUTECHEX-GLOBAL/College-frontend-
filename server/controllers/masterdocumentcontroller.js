// server/controllers/masterdocumentcontroller.js
import MasterDocument from "../models/masterdocumentmodel.js";
import { getDynamicFileUrl, deleteFile } from "../middleware/uploadMiddleware.js";

// 🔹 Get documents
export const getDocuments = async (req, res) => {
  try {
    let doc = await MasterDocument.findOne({ userId: req.user.id });

    if (!doc) {
      doc = await MasterDocument.create({ userId: req.user.id });
    }

    res.json({ success: true, documents: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 Upload document
export const uploadDocument = async (req, res) => {
  try {
    const { field } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    let doc = await MasterDocument.findOne({ userId: req.user.id });

    if (!doc) {
      doc = new MasterDocument({ userId: req.user.id });
    }

    const fileData = {
      fileName: req.file.key,
      fileKey: req.file.key,
      fileUrl: getDynamicFileUrl(req.file.key),
      originalName: req.file.originalname,
    };

    doc[field] = fileData;

    await doc.save();

    res.json({
      success: true,
      fileData,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// 🔹 Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { field } = req.params;

    const doc = await MasterDocument.findOne({ userId: req.user.id });

    if (!doc || !doc[field]) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const fileKey = doc[field]?.fileKey;

    if (fileKey) {
      await deleteFile(fileKey);
    }

    doc[field] = null;
    await doc.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false });
  }
};