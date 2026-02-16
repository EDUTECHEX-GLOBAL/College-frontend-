import ApplicationEducation from "../models/applicationEducationModel.js";
import {
  ensureDirectoryExists,
  deleteFileFromFolder,
  getDynamicFileUrl,
} from "../middleware/uploadMiddleware.js";
import path from "path";
import fs from "fs";

/* =====================================================
   GET EDUCATION INFO (GUS PORTAL FORMAT)
===================================================== */
export const getEducationInfo = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    let education = await ApplicationEducation.findOne({
      userId: req.userId,
    });

    if (!education) {
      // Return empty template
      education = {
        userId: req.userId,
        wasEnrolled: null,
        educationEntries: [{
          countryOfInitialRegistration: "",
          semesterOfInitialRegistration: "",
          entryType: "",
          degree: "",
          specialisation: "",
          standardStudyPeriod: "",
          city: "",
          remarks: "",
          institutionName: "",
          startDate: null,
          endDate: null,
          isCurrentEnrollment: false,
          transcriptFileName: "",
          transcriptFileUrl: "",
        }],
        isCurrentlyEnrolled: null,
        isCompleted: false,
      };
    }

    const completionPercentage = education.completionPercentage || 0;

    res.status(200).json({
      success: true,
      educationInfo: education,
      completionPercentage,
    });
  } catch (error) {
    console.error("❌ Get Education Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   SAVE / UPDATE EDUCATION DETAILS (GUS PORTAL FORMAT)
===================================================== */
export const saveEducationInfo = async (req, res) => {
  try {
    const { wasEnrolled, educationEntries, isCurrentlyEnrolled } = req.body;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    // Validate required fields
    if (wasEnrolled === null || wasEnrolled === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please indicate if you were enrolled at an institute of higher education",
      });
    }

    if (isCurrentlyEnrolled === null || isCurrentlyEnrolled === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please indicate if you are currently enrolled in another university",
      });
    }

    // Validate education entries if wasEnrolled is true
    if (wasEnrolled === true) {
      if (!Array.isArray(educationEntries) || educationEntries.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Education entries are required",
        });
      }

      // Validate first entry has required fields
      const firstEntry = educationEntries[0];
      const missingFields = [];

      if (!firstEntry.countryOfInitialRegistration) missingFields.push('countryOfInitialRegistration');
      if (!firstEntry.semesterOfInitialRegistration) missingFields.push('semesterOfInitialRegistration');
      if (!firstEntry.entryType) missingFields.push('entryType');
      if (!firstEntry.degree) missingFields.push('degree');
      if (!firstEntry.specialisation) missingFields.push('specialisation');
      if (!firstEntry.standardStudyPeriod) missingFields.push('standardStudyPeriod');

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Required fields missing in first education entry",
          missingFields,
        });
      }
    }

    let education = await ApplicationEducation.findOne({
      userId: req.userId,
    });

    if (!education) {
      // Create new education record
      education = new ApplicationEducation({
        userId: req.userId,
        wasEnrolled,
        educationEntries: wasEnrolled ? educationEntries : [],
        isCurrentlyEnrolled,
      });
    } else {
      // Update existing record
      education.wasEnrolled = wasEnrolled;
      education.isCurrentlyEnrolled = isCurrentlyEnrolled;
      
      if (wasEnrolled) {
        // Update or add entries
        if (educationEntries && educationEntries.length > 0) {
          education.educationEntries = educationEntries;
        }
      } else {
        // Clear entries if not enrolled
        education.educationEntries = [];
      }
    }

    await education.save();

    res.status(200).json({
      success: true,
      message: "Education saved successfully",
      educationInfo: education,
      completionPercentage: education.completionPercentage,
    });
  } catch (error) {
    console.error("❌ Save Education Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   UPLOAD TRANSCRIPT FOR SPECIFIC ENTRY
===================================================== */
export const uploadTranscript = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only PDF, JPG, and PNG are allowed.",
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "File size exceeds 10MB limit.",
      });
    }

    ensureDirectoryExists("education");

    const { entryIndex = 0 } = req.body; // Default to first entry

    let education = await ApplicationEducation.findOne({
      userId: req.userId,
    });

    if (!education) {
      // Create new education record with placeholder
      education = new ApplicationEducation({
        userId: req.userId,
        wasEnrolled: true,
        educationEntries: [{}],
        isCurrentlyEnrolled: null,
      });
    }

    // Ensure educationEntries array exists
    if (!education.educationEntries || education.educationEntries.length === 0) {
      education.educationEntries = [{}];
    }

    // Get file extension
    const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    // Remove old file if exists
    const oldFile = education.educationEntries[entryIndex]?.transcriptFileName;
    if (oldFile) {
      deleteFileFromFolder(oldFile, "education");
    }

    // Update with new file info
    education.educationEntries[entryIndex] = {
      ...education.educationEntries[entryIndex],
      transcriptFileName: req.file.filename,
      transcriptFileUrl: getDynamicFileUrl(req.file.filename, "education"),
      transcriptOriginalName: req.file.originalname,
      transcriptFileSize: req.file.size,
      transcriptFileType: fileExt,
      transcriptUploadedAt: new Date(),
      documentStatus: "pending",
    };

    await education.save();

    res.status(200).json({
      success: true,
      message: "Transcript uploaded successfully",
      fileUrl: education.educationEntries[entryIndex].transcriptFileUrl,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: fileExt,
    });
  } catch (error) {
    console.error("❌ Upload Transcript Error:", error);

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
   REMOVE TRANSCRIPT
===================================================== */
export const removeTranscript = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    const { entryIndex = 0 } = req.params;

    const education = await ApplicationEducation.findOne({
      userId: req.userId,
    });

    if (!education || !education.educationEntries || education.educationEntries.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Education entry not found",
      });
    }

    const file = education.educationEntries[entryIndex]?.transcriptFileName;

    if (file) {
      deleteFileFromFolder(file, "education");
    }

    // Clear file fields
    education.educationEntries[entryIndex] = {
      ...education.educationEntries[entryIndex],
      transcriptFileName: "",
      transcriptFileUrl: "",
      transcriptOriginalName: "",
      transcriptFileSize: 0,
      transcriptFileType: "",
      transcriptUploadedAt: null,
      documentStatus: "not_uploaded",
    };

    await education.save();

    res.status(200).json({
      success: true,
      message: "Transcript removed successfully",
    });
  } catch (error) {
    console.error("❌ Remove Transcript Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   CHECK EDUCATION COMPLETION
===================================================== */
export const checkEducationCompletion = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    const education = await ApplicationEducation.findOne({
      userId: req.userId,
    });

    if (!education) {
      return res.status(200).json({
        success: true,
        isCompleted: false,
        completionPercentage: 0,
        completionDetails: {
          wasEnrolledAnswered: false,
          currentlyEnrolledAnswered: false,
          hasCompleteEntry: false,
        },
      });
    }

    res.status(200).json({
      success: true,
      isCompleted: education.isEducationComplete,
      completionPercentage: education.completionPercentage,
      completionDetails: {
        wasEnrolledAnswered: education.wasEnrolled !== null,
        currentlyEnrolledAnswered: education.isCurrentlyEnrolled !== null,
        hasCompleteEntry: education.educationEntries.some(entry => 
          entry.countryOfInitialRegistration &&
          entry.semesterOfInitialRegistration &&
          entry.entryType &&
          entry.degree &&
          entry.specialisation &&
          entry.standardStudyPeriod
        ),
        transcriptUploaded: education.educationEntries.some(entry => 
          entry.transcriptFileName
        ),
      },
    });
  } catch (error) {
    console.error("❌ Check Education Completion Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   ADMIN GET ALL EDUCATION RECORDS
===================================================== */
export const getAllEducationInfo = async (req, res) => {
  try {
    const { page = 1, limit = 20, completed, verified } = req.query;
    
    let query = {};
    
    if (completed !== undefined) {
      query.isCompleted = completed === 'true';
    }
    
    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await ApplicationEducation.find(query)
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApplicationEducation.countDocuments(query);

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
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   ADMIN VERIFY EDUCATION
===================================================== */
export const verifyEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, remarks } = req.body;

    const education = await ApplicationEducation.findById(id);

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education record not found",
      });
    }

    education.isVerified = verified;
    if (remarks) {
      if (education.educationEntries && education.educationEntries.length > 0) {
        education.educationEntries[0].adminRemark = remarks;
      }
    }
    education.verifiedAt = new Date();
    education.verifiedBy = req.userId;

    await education.save();

    res.status(200).json({
      success: true,
      message: `Education ${verified ? 'verified' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error("❌ Admin Verify Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};