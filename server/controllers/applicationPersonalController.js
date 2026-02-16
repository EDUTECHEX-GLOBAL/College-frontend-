// server/controllers/applicationPersonalController.js

import PersonalInfo from "../models/applicationModel.js";
import path from "path";
import fs from "fs";

/* ======================================================
   HELPER FUNCTION TO TRANSFORM FRONTEND DATA TO SCHEMA
====================================================== */
const transformFrontendData = (data) => {
  return {
    // Personal Details
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    title: data.title || '',
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    placeOfBirth: data.placeOfBirth || '',
    countryOfBirth: data.countryOfBirth || '',
    citizenship: data.citizenship || '',
    
    // Keep for backward compatibility
    countryOfResidence: data.countryOfBirth || '', // Using countryOfBirth as countryOfResidence
    
    // Passport Details
    passportNumber: data.passportNumber || '',
    passportIssueDate: data.passportIssueDate ? new Date(data.passportIssueDate) : null,
    passportExpiryDate: data.passportExpiryDate ? new Date(data.passportExpiryDate) : null,
    issuingCountry: data.issuingCountry || '',
    
    // Contact Information
    email: data.email || '',
    mobile: data.mobile || '',
    landline: data.landline || '',
    correspondenceLanguage: data.correspondenceLanguage || 'english',
    
    // Visa Information
    isEUCitizen: data.isEUCitizen !== undefined ? data.isEUCitizen : null,
    documentType: data.documentType || '',
    needVisa: data.needVisa || '',
    referFriend: data.referFriend || '',
    
    // File Information - PRESERVE EXISTING FILES if not in data
    passportFileName: data.passportFileName || '',
    passportFileUrl: data.passportFileUrl || '',
    passportOriginalName: data.passportOriginalName || '',
    passportFileType: data.passportFileType || '',
    passportFileSize: data.passportFileSize || 0,
    passportUploadedAt: data.passportUploadedAt || null,
    passportValidationStatus: data.passportValidationStatus || 'not_checked',
    
    photographFileName: data.photographFileName || '',
    photographFileUrl: data.photographFileUrl || '',
    photographOriginalName: data.photographOriginalName || '',
    photographFileType: data.photographFileType || '',
    photographFileSize: data.photographFileSize || 0,
    photographUploadedAt: data.photographUploadedAt || null,
    photographValidationStatus: data.photographValidationStatus || 'not_checked',
    
    // Application Status
    applicationStatus: data.applicationStatus || 'draft',
    
    // Timestamps
    lastUpdated: new Date()
  };
};

/* ======================================================
   HELPER FUNCTION TO TRANSFORM SCHEMA DATA TO FRONTEND
====================================================== */
const transformToFrontendFormat = (dbData) => {
  if (!dbData) return null;
  
  return {
    // Personal Details
    firstName: dbData.firstName || '',
    lastName: dbData.lastName || '',
    title: dbData.title || '',
    dateOfBirth: dbData.dateOfBirth ? dbData.dateOfBirth.toISOString().split('T')[0] : '',
    placeOfBirth: dbData.placeOfBirth || '',
    countryOfBirth: dbData.countryOfBirth || '',
    citizenship: dbData.citizenship || '',
    
    // Passport Details
    passportNumber: dbData.passportNumber || '',
    passportIssueDate: dbData.passportIssueDate ? dbData.passportIssueDate.toISOString().split('T')[0] : '',
    passportExpiryDate: dbData.passportExpiryDate ? dbData.passportExpiryDate.toISOString().split('T')[0] : '',
    issuingCountry: dbData.issuingCountry || '',
    
    // Contact Information
    email: dbData.email || '',
    mobile: dbData.mobile || '',
    landline: dbData.landline || '',
    correspondenceLanguage: dbData.correspondenceLanguage || 'english',
    
    // Visa Information
    isEUCitizen: dbData.isEUCitizen,
    documentType: dbData.documentType || '',
    needVisa: dbData.needVisa || '',
    referFriend: dbData.referFriend || '',
    
    // File Information - CRITICAL: Include all file fields
    passportFileName: dbData.passportFileName || '',
    passportFileUrl: dbData.passportFileUrl || '',
    passportOriginalName: dbData.passportOriginalName || '',
    passportFileType: dbData.passportFileType || '',
    passportFileSize: dbData.passportFileSize || 0,
    passportUploadedAt: dbData.passportUploadedAt ? dbData.passportUploadedAt.toISOString() : null,
    passportValidationStatus: dbData.passportValidationStatus || 'not_checked',
    
    photographFileName: dbData.photographFileName || '',
    photographFileUrl: dbData.photographFileUrl || '',
    photographOriginalName: dbData.photographOriginalName || '',
    photographFileType: dbData.photographFileType || '',
    photographFileSize: dbData.photographFileSize || 0,
    photographUploadedAt: dbData.photographUploadedAt ? dbData.photographUploadedAt.toISOString() : null,
    photographValidationStatus: dbData.photographValidationStatus || 'not_checked',
    
    // Status Information
    isVerified: dbData.isVerified || false,
    applicationStatus: dbData.applicationStatus || 'draft'
  };
};

/* ======================================================
   GET PERSONAL INFO (UPDATED)
====================================================== */
export const getPersonalInfo = async (req, res) => {
  try {
    const userId = req.user.userId;

    let personalInfo = await PersonalInfo.findById(userId).lean();

    if (!personalInfo) {
      // Return empty structure with all frontend fields
      return res.status(200).json({
        success: true,
        personalInfo: {
          _id: userId,
          firstName: "",
          lastName: "",
          title: "",
          dateOfBirth: "",
          placeOfBirth: "",
          countryOfBirth: "",
          citizenship: "",
          passportNumber: "",
          passportIssueDate: "",
          passportExpiryDate: "",
          issuingCountry: "",
          email: "",
          mobile: "",
          landline: "",
          correspondenceLanguage: "english",
          isEUCitizen: null,
          documentType: "",
          needVisa: "",
          referFriend: "",
          // File fields - all empty
          passportFileName: "",
          passportFileUrl: "",
          passportOriginalName: "",
          passportFileType: "",
          passportFileSize: 0,
          passportUploadedAt: null,
          passportValidationStatus: "not_checked",
          photographFileName: "",
          photographFileUrl: "",
          photographOriginalName: "",
          photographFileType: "",
          photographFileSize: 0,
          photographUploadedAt: null,
          photographValidationStatus: "not_checked",
          isVerified: false,
          applicationStatus: "draft"
        }
      });
    }

    // Transform to frontend format
    const frontendData = transformToFrontendFormat(personalInfo);

    res.status(200).json({
      success: true,
      personalInfo: {
        ...frontendData,
        _id: personalInfo._id
      }
    });

  } catch (error) {
    console.error("❌ getPersonalInfo:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch personal information",
    });
  }
};

/* ======================================================
   SAVE PERSONAL INFO
====================================================== */
export const savePersonalInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = req.body;

    console.log('📥 Received data to save:', data);

    // First, get existing record to preserve file data if not sent
    const existingRecord = await PersonalInfo.findById(userId);

    // Transform frontend data to match schema, but preserve file data from existing record
    const transformedData = transformFrontendData(data);
    
    // Preserve file data from existing record if not in new data
    if (existingRecord) {
      if (!data.passportFileName && existingRecord.passportFileName) {
        transformedData.passportFileName = existingRecord.passportFileName;
        transformedData.passportFileUrl = existingRecord.passportFileUrl;
        transformedData.passportOriginalName = existingRecord.passportOriginalName;
        transformedData.passportFileType = existingRecord.passportFileType;
        transformedData.passportFileSize = existingRecord.passportFileSize;
        transformedData.passportUploadedAt = existingRecord.passportUploadedAt;
        transformedData.passportValidationStatus = existingRecord.passportValidationStatus;
      }
      
      if (!data.photographFileName && existingRecord.photographFileName) {
        transformedData.photographFileName = existingRecord.photographFileName;
        transformedData.photographFileUrl = existingRecord.photographFileUrl;
        transformedData.photographOriginalName = existingRecord.photographOriginalName;
        transformedData.photographFileType = existingRecord.photographFileType;
        transformedData.photographFileSize = existingRecord.photographFileSize;
        transformedData.photographUploadedAt = existingRecord.photographUploadedAt;
        transformedData.photographValidationStatus = existingRecord.photographValidationStatus;
      }
    }

    console.log('🔄 Transformed data with preserved files:', {
      passportFileName: transformedData.passportFileName,
      photographFileName: transformedData.photographFileName
    });

    // Use findByIdAndUpdate with upsert to handle both create and update
    const updatedInfo = await PersonalInfo.findByIdAndUpdate(
      userId,
      {
        $set: transformedData
      },
      {
        new: true,           // Return updated document
        upsert: true,        // Create if doesn't exist
        runValidators: true, // Run validation with new schema
        setDefaultsOnInsert: true
      }
    ).lean();

    console.log('✅ Successfully saved for user:', userId);
    console.log('✅ Saved file data:', {
      passportFileName: updatedInfo.passportFileName,
      photographFileName: updatedInfo.photographFileName
    });

    // Transform back to frontend format for response
    const responseData = transformToFrontendFormat(updatedInfo);

    res.status(200).json({
      success: true,
      message: "Personal information saved successfully",
      personalInfo: responseData
    });

  } catch (error) {
    console.error("❌ savePersonalInfo ERROR:", error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry. This record already exists."
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to save personal information",
    });
  }
};

/* ======================================================
   UPLOAD FILES (FIXED VERSION)
====================================================== */
export const uploadFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileType } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!["passport", "photograph"].includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type",
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        success: false,
        message: "File size exceeds 5MB limit",
      });
    }

    // Validate file type
    const allowedTypes = {
      passport: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
      photograph: ['image/jpeg', 'image/jpg', 'image/png']
    };

    if (!allowedTypes[fileType].includes(file.mimetype)) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed: ${allowedTypes[fileType].join(', ')}`,
      });
    }

    const fileUrl = `/uploads/${fileType}/${file.filename}`;
    const fileExt = path.extname(file.originalname).toLowerCase().replace('.', '');

    // Prepare update data with ALL fields properly set
    const updateData = fileType === "passport"
      ? {
          passportFileName: file.filename,           // ← CRITICAL: This was missing!
          passportFileUrl: fileUrl,
          passportOriginalName: file.originalname,
          passportFileType: fileExt,
          passportFileSize: file.size,
          passportUploadedAt: new Date(),
          passportValidationStatus: "pending",
        }
      : {
          photographFileName: file.filename,         // ← CRITICAL: This was missing!
          photographFileUrl: fileUrl,
          photographOriginalName: file.originalname,
          photographFileType: fileExt,
          photographFileSize: file.size,
          photographUploadedAt: new Date(),
          photographValidationStatus: "pending",
        };

    console.log(`📤 Updating ${fileType} with data:`, updateData);

    // Use findByIdAndUpdate with upsert to ensure record exists
    const updatedDoc = await PersonalInfo.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: false, // Keep false for file operations
      }
    );

    console.log(`✅ ${fileType} uploaded successfully:`, {
      fileName: file.filename,
      originalName: file.originalname,
      size: file.size,
      savedFileName: updatedDoc.passportFileName || updatedDoc.photographFileName
    });

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      fileName: file.filename,
      fileUrl,
      originalName: file.originalname,
      fileSize: file.size,
      fileType: fileExt,
    });

  } catch (error) {
    console.error("❌ uploadFiles ERROR:", error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message || "File upload failed",
    });
  }
};

/* ======================================================
   REMOVE FILE (ENHANCED)
====================================================== */
export const removeFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileType } = req.params;

    if (!["passport", "photograph"].includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type",
      });
    }

    const personalInfo = await PersonalInfo.findById(userId);

    if (!personalInfo) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    const uploadDir = path.join(process.cwd(), "uploads", fileType);
    const fileName = fileType === "passport" 
      ? personalInfo.passportFileName 
      : personalInfo.photographFileName;

    // Delete physical file if exists
    if (fileName) {
      const filePath = path.join(uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
      }
    }

    // Clear ALL file fields in database
    const updateData = fileType === "passport" 
      ? {
          passportFileName: "",
          passportFileUrl: "",
          passportOriginalName: "",
          passportFileType: "",
          passportFileSize: 0,
          passportUploadedAt: null,
          passportValidationStatus: "not_checked"
        }
      : {
          photographFileName: "",
          photographFileUrl: "",
          photographOriginalName: "",
          photographFileType: "",
          photographFileSize: 0,
          photographUploadedAt: null,
          photographValidationStatus: "not_checked"
        };

    await PersonalInfo.findByIdAndUpdate(userId, { $set: updateData });

    res.status(200).json({
      success: true,
      message: "File removed successfully",
    });

  } catch (error) {
    console.error("❌ removeFile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove file",
    });
  }
};

/* ======================================================
   CHECK FILES EXIST (ENHANCED)
====================================================== */
export const checkFilesExist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const personalInfo = await PersonalInfo.findById(userId);

    const files = {
      passport: {
        exists: !!(personalInfo?.passportFileName || personalInfo?.passportOriginalName),
        fileName: personalInfo?.passportFileName || null,
        originalName: personalInfo?.passportOriginalName || null,
        fileUrl: personalInfo?.passportFileUrl || null,
        fileType: personalInfo?.passportFileType || null,
        fileSize: personalInfo?.passportFileSize || 0,
        uploadedAt: personalInfo?.passportUploadedAt || null,
        validationStatus: personalInfo?.passportValidationStatus || 'not_checked'
      },
      photograph: {
        exists: !!(personalInfo?.photographFileName || personalInfo?.photographOriginalName),
        fileName: personalInfo?.photographFileName || null,
        originalName: personalInfo?.photographOriginalName || null,
        fileUrl: personalInfo?.photographFileUrl || null,
        fileType: personalInfo?.photographFileType || null,
        fileSize: personalInfo?.photographFileSize || 0,
        uploadedAt: personalInfo?.photographUploadedAt || null,
        validationStatus: personalInfo?.photographValidationStatus || 'not_checked'
      }
    };

    res.status(200).json({
      success: true,
      files,
      allRequired: files.passport.exists && files.photograph.exists
    });

  } catch (error) {
    console.error("❌ checkFilesExist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check files",
    });
  }
};

/* ======================================================
   GET FILE (KEPT AS IS)
====================================================== */
export const getFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileKey } = req.params;

    if (!["passport", "photograph"].includes(fileKey)) {
      return res.status(400).send("Invalid file key");
    }

    const personalInfo = await PersonalInfo.findById(userId);

    if (!personalInfo) {
      return res.status(404).send("Record not found");
    }

    const fileName = fileKey === "passport"
      ? personalInfo.passportFileName
      : personalInfo.photographFileName;

    if (!fileName) {
      return res.status(404).send("File not found");
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      fileKey,
      fileName
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    res.sendFile(filePath);
    
  } catch (error) {
    console.error("❌ getFile:", error);
    res.status(500).send("Failed to retrieve file");
  }
};

/* ======================================================
   ADMIN VERIFY
====================================================== */
export const verifyPersonalInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.userId;

    const personalInfo = await PersonalInfo.findById(userId);

    if (!personalInfo) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // Check if files exist before verifying
    const hasPassport = !!(personalInfo.passportFileName || personalInfo.passportOriginalName);
    const hasPhotograph = !!(personalInfo.photographFileName || personalInfo.photographOriginalName);

    if (!hasPassport || !hasPhotograph) {
      return res.status(400).json({
        success: false,
        message: "Cannot verify: Missing required files",
        missing: {
          passport: !hasPassport,
          photograph: !hasPhotograph
        }
      });
    }

    personalInfo.isVerified = true;
    personalInfo.verificationNotes = notes || '';
    personalInfo.verifiedBy = adminId;
    personalInfo.verifiedAt = new Date();
    personalInfo.applicationStatus = 'approved';
    
    await personalInfo.save();

    res.status(200).json({
      success: true,
      message: "Personal information verified successfully",
      verifiedAt: personalInfo.verifiedAt
    });

  } catch (error) {
    console.error("❌ verifyPersonalInfo:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};

/* ======================================================
   ADMIN GET ALL
====================================================== */
export const getAllPersonalInfo = async (req, res) => {
  try {
    const { status, verified, page = 1, limit = 20 } = req.query;
    
    // Build query filters
    const query = {};
    if (status) query.applicationStatus = status;
    if (verified !== undefined) query.isVerified = verified === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await PersonalInfo.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await PersonalInfo.countDocuments(query);

    // Transform each record to frontend format
    const transformedRecords = records.map(record => ({
      ...transformToFrontendFormat(record),
      _id: record._id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: transformedRecords.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transformedRecords,
    });

  } catch (error) {
    console.error("❌ getAllPersonalInfo:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch records",
    });
  }
};

/* ======================================================
   GET APPLICATION SUMMARY
====================================================== */
export const getApplicationSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const personalInfo = await PersonalInfo.findById(userId);

    if (!personalInfo) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    const summary = {
      personalInfo: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        email: personalInfo.email,
        dateOfBirth: personalInfo.dateOfBirth,
        citizenship: personalInfo.citizenship
      },
      documents: {
        passport: !!(personalInfo.passportFileName || personalInfo.passportOriginalName),
        photograph: !!(personalInfo.photographFileName || personalInfo.photographOriginalName)
      },
      visaRequirement: personalInfo.needVisa || 'not_determined',
      applicationStatus: personalInfo.applicationStatus,
      isVerified: personalInfo.isVerified,
      completedAt: personalInfo.completedAt
    };

    res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {
    console.error("❌ getApplicationSummary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get application summary"
    });
  }
};

/* ======================================================
   CHECK VISA REQUIREMENT
====================================================== */
export const checkVisaRequirement = async (req, res) => {
  try {
    const userId = req.user.userId;
    const personalInfo = await PersonalInfo.findById(userId);

    if (!personalInfo) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    const visaInfo = {
      isEUCitizen: personalInfo.isEUCitizen,
      needVisa: personalInfo.needVisa || 'not_determined',
      requiresVisa: personalInfo.isEUCitizen === false ? true : false,
      message: personalInfo.isEUCitizen 
        ? "EU citizens do not require a visa" 
        : "Non-EU citizens may require a visa"
    };

    res.status(200).json({
      success: true,
      ...visaInfo
    });

  } catch (error) {
    console.error("❌ checkVisaRequirement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check visa requirement"
    });
  }
};