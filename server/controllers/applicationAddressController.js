import ApplicationAddress from "../models/applicationAddressModels.js";
import fs from "fs";
import path from "path";

/* =====================================================
   GET ADDRESS INFO
===================================================== */
export const getAddressInfo = async (req, res) => {
  try {
    const address = await ApplicationAddress.findOne({
      userId: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address info not found",
      });
    }

    res.json({
      success: true,
      addressInfo: address,
    });
  } catch (error) {
    console.error("Get Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   SAVE ADDRESS INFO
===================================================== */
export const saveAddressInfo = async (req, res) => {
  try {
    const {
      currentAddress,
      permanentAddress,
      city,
      state,
      country,
      postalCode,
    } = req.body;

    if (
      !currentAddress ||
      !permanentAddress ||
      !city ||
      !state ||
      !country ||
      !postalCode
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    let address = await ApplicationAddress.findOne({
      userId: req.user.id,
    });

    if (address) {
      address.currentAddress = currentAddress;
      address.permanentAddress = permanentAddress;
      address.city = city;
      address.state = state;
      address.country = country;
      address.postalCode = postalCode;
    } else {
      address = new ApplicationAddress({
        userId: req.user.id,
        currentAddress,
        permanentAddress,
        city,
        state,
        country,
        postalCode,
      });
    }

    await address.save();

    res.json({
      success: true,
      message: "Address saved successfully",
      addressInfo: address,
    });
  } catch (error) {
    console.error("Save Address Error:", error);
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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    let address = await ApplicationAddress.findOne({
      userId: req.user.id,
    });

    if (!address) {
      address = new ApplicationAddress({
        userId: req.user.id,
        currentAddress: "temp",
        permanentAddress: "temp",
        city: "temp",
        state: "temp",
        country: "temp",
        postalCode: "temp",
      });
    }

    address.nationalIdFileName = req.file.filename;
    address.nationalIdFileUrl = `/uploads/nationalId/${req.file.filename}`;

    await address.save();

    res.json({
      success: true,
      message: "National ID uploaded successfully",
      fileName: req.file.filename,
      fileUrl: address.nationalIdFileUrl,
    });
  } catch (error) {
    console.error("Upload National ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};

/* =====================================================
   REMOVE NATIONAL ID
===================================================== */
export const removeNationalId = async (req, res) => {
  try {
    const address = await ApplicationAddress.findOne({
      userId: req.user.id,
    });

    if (!address || !address.nationalIdFileName) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const filePath = path.join(
      "uploads/nationalId",
      address.nationalIdFileName
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    address.nationalIdFileName = "";
    address.nationalIdFileUrl = "";

    await address.save();

    res.json({
      success: true,
      message: "National ID removed",
    });
  } catch (error) {
    console.error("Remove National ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   ADMIN GET ALL
===================================================== */
export const getAllAddressInfo = async (req, res) => {
  try {
    const data = await ApplicationAddress.find().populate("userId", "email");

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin Get All Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
