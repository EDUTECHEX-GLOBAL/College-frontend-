// server/controllers/applicationPersonalController.js

import PersonalInfo from "../models/applicationModel.js";
import path from "path";
import fs from "fs";

/* ======================================================
   GET PERSONAL INFO
====================================================== */
export const getPersonalInfo = async (req, res) => {
  try {
    const userId = req.user.userId;

    let personalInfo = await PersonalInfo.findById(userId).lean();

    if (!personalInfo) {
      personalInfo = {
        _id: userId,
        firstName: "",
        lastName: "",
        dob: null,
        gender: "",
        nationality: "",
        countryOfResidence: "",
        email: "",
        mobile: "",
        alternateContact: "",
        passportFileName: "",
        passportFileUrl: "",
        photographFileName: "",
        photographFileUrl: "",
        isVerified: false,
      };
    }

    res.status(200).json({
      success: true,
      personalInfo,
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

    let personalInfo = await PersonalInfo.findById(userId);

    if (personalInfo) {
      Object.assign(personalInfo, data);
    } else {
      personalInfo = new PersonalInfo({
        _id: userId,
        ...data,
      });
    }

    await personalInfo.save();

    res.status(200).json({
      success: true,
      message: "Personal information saved successfully",
    });
  } catch (error) {
    console.error("❌ savePersonalInfo:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save personal information",
    });
  }
};

/* ======================================================
   UPLOAD FILES (FINAL SAFE VERSION)
====================================================== */
/* ======================================================
   UPLOAD FILES (FIXED & SAFE VERSION)
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

    const fileUrl = `/uploads/${fileType}/${file.filename}`;

    const updateData =
      fileType === "passport"
        ? {
            passportFileName: file.filename,
            passportFileUrl: fileUrl,
          }
        : {
            photographFileName: file.filename,
            photographFileUrl: fileUrl,
          };

    // 🔥 IMPORTANT FIX — upsert without validation
    await PersonalInfo.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: false, // bypass required fields
      }
    );

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      fileName: file.filename,
      fileUrl,
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
   REMOVE FILE
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

    const fileName =
      fileType === "passport"
        ? personalInfo.passportFileName
        : personalInfo.photographFileName;

    if (fileName) {
      const filePath = path.join(uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (fileType === "passport") {
      personalInfo.passportFileName = "";
      personalInfo.passportFileUrl = "";
    }

    if (fileType === "photograph") {
      personalInfo.photographFileName = "";
      personalInfo.photographFileUrl = "";
    }

    await personalInfo.save();

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
   CHECK FILES EXIST
====================================================== */
export const checkFilesExist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const personalInfo = await PersonalInfo.findById(userId);

    res.status(200).json({
      success: true,
      files: {
        passport: !!personalInfo?.passportFileName,
        photograph: !!personalInfo?.photographFileName,
      },
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
   GET FILE
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

    const fileName =
      fileKey === "passport"
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

    const personalInfo = await PersonalInfo.findById(userId);

    if (!personalInfo) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    personalInfo.isVerified = true;
    await personalInfo.save();

    res.status(200).json({
      success: true,
      message: "Personal information verified",
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
    const records = await PersonalInfo.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("❌ getAllPersonalInfo:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch records",
    });
  }
};
