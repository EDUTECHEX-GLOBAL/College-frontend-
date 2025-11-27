// server/controllers/educationController.js
import Education from "../models/educationModel.js";
import Account from "../models/accountModel.js";
import path from "path";
import { getFileUrl, deleteFile, UPLOAD_DIR } from "../middleware/uploadMiddleware.js";
import fs from "fs";

// Validation helper for completion
const validateEducationSection = (section, data) => {
  switch (section) {
    case "currentSchool":
      return !!(data && (data.schoolName || data.dateOfEntry));
    case "otherSchools":
      return !!(data && Array.isArray(data.schools) && data.schools.length > 0);
    case "colleges":
      return !!(data && Array.isArray(data.collegesList) && data.collegesList.length > 0);
    case "grades":
      return !!(data && data.cumulativeGPA && data.gpaScale);
    case "currentCourses":
      return !!(data && Array.isArray(data.courses) && data.courses.length > 0);
    case "honors":
      return (data && data.reportHonors === "no") || (data && Array.isArray(data.honorsList) && data.honorsList.length > 0);
    case "communityOrganizations":
      return true; // optional, treat as complete even if empty
    case "futurePlans":
      return !!(data && data.highestDegree && data.careerInterest);
    case "documents":
      return !!(data && data.passport && data.tenthMarksheet);
    default:
      return false;
  }
};

// GET /api/education - return (or create) education doc for user
export const getEducation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    let education = await Education.findOne({ userId });
    if (!education) {
      education = await Education.create({ userId });
    }

    return res.status(200).json({ success: true, education });
  } catch (error) {
    console.error("❌ Error fetching education:", error);
    return res.status(500).json({ success:false, message: "Server error fetching education" });
  }
};

// PUT /api/education/update - update a section with partial data
export const updateEducationSection = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { section, data } = req.body;

    if (!userId) return res.status(401).json({ success:false, message: "Unauthorized" });
    if (!section || typeof data !== "object") {
      return res.status(400).json({ success:false, message: "section and data are required" });
    }

    let education = await Education.findOne({ userId });
    if (!education) education = await Education.create({ userId });

    // Merge for nested objects: preserve fields if not provided
    const currentSectionValue = education[section] || {};
    education[section] = { ...currentSectionValue, ...data };

    // Update completion flag for that section
    const isComplete = validateEducationSection(section, education[section]);
    education.educationCompletion[section] = !!isComplete;

    // Recalculate overallProgress
    const values = Object.values(education.educationCompletion || {});
    const completed = values.filter(Boolean).length;
    const total = values.length || 1;
    education.overallProgress = Math.round((completed / total) * 100);

    await education.save();

    // update the Account.applicationProgress.education
    await Account.findByIdAndUpdate(userId, {
      "applicationProgress.education": education.overallProgress
    });

    return res.status(200).json({
      success: true,
      message: `${section} updated`,
      education,
      progress: education.overallProgress
    });
  } catch (error) {
    console.error("❌ Error updating education section:", error);
    return res.status(500).json({ success:false, message: "Server error updating education section" });
  }
};

// GET /api/education/summary
export const getEducationSummary = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success:false, message: "Unauthorized" });

    const education = await Education.findOne({ userId }).lean();
    if (!education) return res.status(404).json({ success:false, message: "Education not found" });

    return res.status(200).json({
      success: true,
      summary: {
        completion: education.educationCompletion,
        progress: education.overallProgress
      }
    });
  } catch (error) {
    console.error("❌ Error fetching education summary:", error);
    return res.status(500).json({ success:false, message: "Server error fetching summary" });
  }
};

// POST /api/education/documents/upload?type=passport OR ?field=tenthMarksheet OR ?field=additional
// upload.single('file') used in route
export const uploadDocument = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success:false, message: "Unauthorized" });

    if (!req.file) return res.status(400).json({ success:false, message: "No file uploaded" });

    const field = req.query.field || req.query.type;
    if (!field) {
      // remove uploaded file (invalid request)
      try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch(e){/* ignore */ }
      return res.status(400).json({ success:false, message: "Missing field parameter" });
    }

    const education = await Education.findOne({ userId }) || await Education.create({ userId });

    const fileMeta = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: getFileUrl(req.file.filename),
      uploadedAt: new Date()
    };

    if (field === "additional") {
      education.documents.additionalDocuments = education.documents.additionalDocuments || [];
      education.documents.additionalDocuments.push(fileMeta);
    } else if (["passport", "tenthMarksheet", "twelfthMarksheet"].includes(field)) {
      // If existing file exists, delete it from disk
      const existing = education.documents[field];
      if (existing && existing.filename) {
        const fullPath = path.join(UPLOAD_DIR, existing.filename);
        try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch(e){ console.warn("Failed to delete old file", e); }
      }
      education.documents[field] = fileMeta;
    } else {
      // invalid
      try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch(e){/* ignore */ }
      return res.status(400).json({ success:false, message: "Invalid field value" });
    }

    // update documents completion state
    const docsComplete = !!(education.documents.passport && education.documents.tenthMarksheet);
    education.educationCompletion.documents = docsComplete;

    // recompute overall progress
    const values = Object.values(education.educationCompletion || {});
    education.overallProgress = Math.round((values.filter(Boolean).length / (values.length || 1)) * 100);

    await education.save();

    // mirror to Account
    await Account.findByIdAndUpdate(userId, {"applicationProgress.education": education.overallProgress});

    return res.status(200).json({ success:true, message: "File uploaded", file: fileMeta, education, progress: education.overallProgress });
  } catch (error) {
    console.error("❌ Error uploading document:", error);
    return res.status(500).json({ success:false, message: "Server error uploading document" });
  }
};

// DELETE /api/education/documents?field=passport or ?field=additional&id=<id index>
// remove a file record and delete disk file
export const removeDocument = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success:false, message: "Unauthorized" });

    const { field, id } = req.query;
    if (!field) return res.status(400).json({ success:false, message: "field query required" });

    const education = await Education.findOne({ userId });
    if (!education) return res.status(404).json({ success:false, message: "Education not found" });

    if (field === "additional") {
      if (!id) return res.status(400).json({ success:false, message: "id query required for additional documents" });
      const idx = parseInt(id, 10);
      const doc = education.documents.additionalDocuments?.[idx];
      if (!doc) return res.status(404).json({ success:false, message: "Document not found" });

      // delete file from disk
      const filePath = path.join(UPLOAD_DIR, doc.filename);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e){ console.warn("Failed to remove file", e); }

      education.documents.additionalDocuments.splice(idx, 1);
    } else if (["passport","tenthMarksheet","twelfthMarksheet"].includes(field)) {
      const doc = education.documents[field];
      if (doc && doc.filename) {
        const filePath = path.join(UPLOAD_DIR, doc.filename);
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e){ console.warn("Failed to remove file", e); }
      }
      education.documents[field] = undefined;
    } else {
      return res.status(400).json({ success:false, message: "Invalid field" });
    }

    // update documents completion
    education.educationCompletion.documents = !!(education.documents.passport && education.documents.tenthMarksheet);

    // recompute overall progress
    const vals = Object.values(education.educationCompletion || {});
    education.overallProgress = Math.round((vals.filter(Boolean).length / (vals.length || 1)) * 100);

    await education.save();
    await Account.findByIdAndUpdate(userId, { "applicationProgress.education": education.overallProgress });

    return res.status(200).json({ success:true, message: "Document removed", education, progress: education.overallProgress });
  } catch (error) {
    console.error("❌ Error removing document:", error);
    return res.status(500).json({ success:false, message: "Server error removing document" });
  }
};
