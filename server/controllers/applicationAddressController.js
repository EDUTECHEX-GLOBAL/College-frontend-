import mongoose from "mongoose";
import ApplicationAddress from "../models/applicationAddressModels.js";
import { ensureDirectoryExists, deleteFileFromFolder } from "../middleware/uploadMiddleware.js";
import path from "path";
import fs from "fs";

/* =====================================================
   GET ADDRESS INFO FOR CURRENT USER (GUS PORTAL)
===================================================== */
export const getAddressInfo = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID missing.",
      });
    }

    let address = await ApplicationAddress.findOne({ userId: req.userId });

    if (!address) {
      // Return empty template for GUS portal structure
      address = {
        userId: req.userId,
        careOf: "",
        streetAndHouseNumber: "",
        city: "",
        country: "India",
        stateProvince: "",
        postcode: "",
        hasDifferentCorrespondenceAddress: false,
        correspondenceCareOf: "",
        correspondenceStreetAndHouseNumber: "",
        correspondenceCity: "",
        correspondenceCountry: "India",
        correspondenceStateProvince: "",
        correspondencePostcode: "",
        nationalIdFileName: "",
        nationalIdFileUrl: "",
        isCompleted: false,
      };
    }

    // Calculate completion status
    const isCompleted = address.streetAndHouseNumber && 
                       address.city && 
                       address.country && 
                       address.stateProvince && 
                       address.postcode ? true : false;

    res.status(200).json({
      success: true,
      addressInfo: address,
      isCompleted,
    });
  } catch (error) {
    console.error("❌ Get Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   SAVE OR UPDATE ADDRESS INFO (GUS PORTAL FORMAT)
===================================================== */
export const saveAddressInfo = async (req, res) => {
  try {
    const {
      careOf,
      streetAndHouseNumber,
      city,
      country,
      stateProvince,
      postcode,
      hasDifferentCorrespondenceAddress,
      correspondenceCareOf,
      correspondenceStreetAndHouseNumber,
      correspondenceCity,
      correspondenceCountry,
      correspondenceStateProvince,
      correspondencePostcode,
    } = req.body;

    if (!req.userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized. User ID missing." 
      });
    }

    // Validate required fields
    const missingFields = [];
    if (!streetAndHouseNumber) missingFields.push('streetAndHouseNumber');
    if (!city) missingFields.push('city');
    if (!country) missingFields.push('country');
    if (!stateProvince) missingFields.push('stateProvince');
    if (!postcode) missingFields.push('postcode');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
        missingFields,
      });
    }

    // Validate correspondence address if different
    if (hasDifferentCorrespondenceAddress) {
      const correspondenceMissing = [];
      if (!correspondenceStreetAndHouseNumber) correspondenceMissing.push('correspondenceStreetAndHouseNumber');
      if (!correspondenceCity) correspondenceMissing.push('correspondenceCity');
      if (!correspondenceCountry) correspondenceMissing.push('correspondenceCountry');
      if (!correspondenceStateProvince) correspondenceMissing.push('correspondenceStateProvince');
      if (!correspondencePostcode) correspondenceMissing.push('correspondencePostcode');

      if (correspondenceMissing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Correspondence address fields are required",
          missingFields: correspondenceMissing,
        });
      }
    }

    let address = await ApplicationAddress.findOne({ userId: req.userId });

    const addressData = {
      userId: req.userId,
      careOf: careOf || "",
      streetAndHouseNumber,
      city,
      country: country || "India",
      stateProvince,
      postcode,
      hasDifferentCorrespondenceAddress: hasDifferentCorrespondenceAddress || false,
    };

    // Add correspondence address if different
    if (hasDifferentCorrespondenceAddress) {
      addressData.correspondenceCareOf = correspondenceCareOf || "";
      addressData.correspondenceStreetAndHouseNumber = correspondenceStreetAndHouseNumber;
      addressData.correspondenceCity = correspondenceCity;
      addressData.correspondenceCountry = correspondenceCountry || "India";
      addressData.correspondenceStateProvince = correspondenceStateProvince;
      addressData.correspondencePostcode = correspondencePostcode;
    } else {
      // Clear correspondence fields
      addressData.correspondenceCareOf = "";
      addressData.correspondenceStreetAndHouseNumber = "";
      addressData.correspondenceCity = "";
      addressData.correspondenceCountry = "";
      addressData.correspondenceStateProvince = "";
      addressData.correspondencePostcode = "";
    }

    if (address) {
      // Update existing address
      Object.assign(address, addressData);
    } else {
      // Create new address
      address = new ApplicationAddress(addressData);
    }

    await address.save();

    res.status(200).json({
      success: true,
      message: "Address saved successfully",
      addressInfo: address,
      isCompleted: address.isAddressComplete,
    });
  } catch (error) {
    console.error("❌ Save Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   UPLOAD NATIONAL ID
===================================================== */
export const uploadNationalId = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User ID missing." });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or invalid file type",
      });
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete invalid file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only PNG, JPG, or PDF allowed.",
      });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      // Delete oversized file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "File size exceeds 10MB limit.",
      });
    }

    ensureDirectoryExists("nationalId");

    let address = await ApplicationAddress.findOne({ userId: req.userId });

    if (!address) {
      // Delete the file if no address record
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Please save your address details before uploading National ID.",
      });
    }

    // Remove old National ID if exists
    if (address.nationalIdFileName) {
      deleteFileFromFolder(address.nationalIdFileName, "nationalId");
    }

    // Get file extension
    const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    // Save new file info
    address.nationalIdFileName = req.file.filename;
    address.nationalIdFileUrl = `/uploads/nationalId/${req.file.filename}`;
    address.nationalIdOriginalName = req.file.originalname;
    address.nationalIdFileSize = req.file.size;
    address.nationalIdFileType = fileExt;
    address.nationalIdUploadedAt = new Date();

    await address.save();

    res.status(200).json({
      success: true,
      message: "National ID uploaded successfully",
      fileName: req.file.filename,
      fileUrl: address.nationalIdFileUrl,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: fileExt,
    });
  } catch (error) {
    console.error("❌ Upload National ID Error:", error);
    
    // Clean up on error
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
   REMOVE NATIONAL ID
===================================================== */
export const removeNationalId = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User ID missing." });
    }

    const address = await ApplicationAddress.findOne({ userId: req.userId });

    if (!address || !address.nationalIdFileName) {
      return res.status(200).json({
        success: true,
        message: "No file to remove",
      });
    }

    // Delete file from server
    deleteFileFromFolder(address.nationalIdFileName, "nationalId");

    // Clear file fields
    address.nationalIdFileName = "";
    address.nationalIdFileUrl = "";
    address.nationalIdOriginalName = "";
    address.nationalIdFileSize = 0;
    address.nationalIdFileType = "";
    address.nationalIdUploadedAt = null;

    await address.save();

    res.status(200).json({
      success: true,
      message: "National ID removed successfully",
    });
  } catch (error) {
    console.error("❌ Remove National ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   CHECK ADDRESS COMPLETION STATUS
===================================================== */
export const checkAddressCompletion = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized. User ID missing." 
      });
    }

    const address = await ApplicationAddress.findOne({ userId: req.userId });

    if (!address) {
      return res.status(200).json({
        success: true,
        isCompleted: false,
        completionDetails: {
          streetAndHouseNumber: false,
          city: false,
          country: false,
          stateProvince: false,
          postcode: false,
          hasDifferentCorrespondenceAddress: false,
          nationalIdUploaded: false,
        }
      });
    }

    res.status(200).json({
      success: true,
      isCompleted: address.isAddressComplete,
      completionDetails: {
        streetAndHouseNumber: !!address.streetAndHouseNumber,
        city: !!address.city,
        country: !!address.country,
        stateProvince: !!address.stateProvince,
        postcode: !!address.postcode,
        hasDifferentCorrespondenceAddress: address.hasDifferentCorrespondenceAddress,
        correspondenceComplete: address.hasDifferentCorrespondenceAddress ? 
          !!(address.correspondenceStreetAndHouseNumber && 
             address.correspondenceCity && 
             address.correspondenceCountry && 
             address.correspondenceStateProvince && 
             address.correspondencePostcode) : true,
        nationalIdUploaded: !!address.nationalIdFileName,
      }
    });
  } catch (error) {
    console.error("❌ Check Address Completion Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   GET NATIONAL ID FILE
===================================================== */
export const getNationalIdFile = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized. User ID missing." 
      });
    }

    const address = await ApplicationAddress.findOne({ userId: req.userId });

    if (!address || !address.nationalIdFileName) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const filePath = path.join(process.cwd(), "uploads", "nationalId", address.nationalIdFileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("❌ Get National ID File Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   ADMIN GET ALL ADDRESSES
===================================================== */
export const getAllAddressInfo = async (req, res) => {
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

    const data = await ApplicationAddress.find(query)
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApplicationAddress.countDocuments(query);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
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
   ADMIN VERIFY ADDRESS
===================================================== */
export const verifyAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, notes } = req.body;

    const address = await ApplicationAddress.findById(id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    address.isVerified = verified;
    address.verificationNotes = notes || '';
    address.verifiedAt = new Date();
    address.verifiedBy = req.userId;

    await address.save();

    res.status(200).json({
      success: true,
      message: `Address ${verified ? 'verified' : 'rejected'} successfully`,
      data: address,
    });
  } catch (error) {
    console.error("❌ Admin Verify Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};