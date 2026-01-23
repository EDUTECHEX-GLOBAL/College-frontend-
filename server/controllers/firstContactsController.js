import FirstContacts from "../models/firstContactsModel.js";
import mongoose from "mongoose";


// ================================
// 📥 Get Contacts Data
// ================================
export const getContacts = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const query = mongoose.Types.ObjectId.isValid(studentId)
  ? { studentId: new mongoose.Types.ObjectId(studentId) }
  : { studentId };

    if (!collegeId) {
      return res.status(400).json({
        success: false,
        message: "College ID is required",
      });
    }

    let contacts = await FirstContacts.findOne({
      studentId,
      collegeId,
    });

    // If no contacts record exists, create a default one
    if (!contacts) {
      contacts = await FirstContacts.create({
        studentId,
        collegeId,
        textMessagePermission: "",
        hasTwitter: "",
        twitterHandle: "",
        hasSnapchat: "",
        snapchatUsername: "",
        hasInstagram: "",
        instagramUsername: "",
        progress: 0,
        isComplete: false,
      });
    }

    res.status(200).json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error("❌ Error fetching contacts data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching contacts data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 💾 Save Contacts Data - FIXED VERSION
// ================================
export const saveContacts = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;
    const updateData = req.body;

    if (!collegeId) {
      return res.status(400).json({
        success: false,
        message: "College ID is required",
      });
    }

    // ✅ FIX: Use findOne + save() instead of findOneAndUpdate to trigger pre-save middleware
    let contacts = await FirstContacts.findOne({
      studentId,
      collegeId,
    });

    if (!contacts) {
      contacts = new FirstContacts({
        studentId,
        collegeId,
      });
    }

    // Update all fields
    contacts.textMessagePermission = updateData.textMessagePermission || "";
    contacts.hasTwitter = updateData.hasTwitter || "";
    contacts.twitterHandle = updateData.hasTwitter === "yes" ? (updateData.twitterHandle || "") : "";
    contacts.hasSnapchat = updateData.hasSnapchat || "";
    contacts.snapchatUsername = updateData.hasSnapchat === "yes" ? (updateData.snapchatUsername || "") : "";
    contacts.hasInstagram = updateData.hasInstagram || "";
    contacts.instagramUsername = updateData.hasInstagram === "yes" ? (updateData.instagramUsername || "") : "";

    // Validate social media handles when "yes" is selected
    if (updateData.hasTwitter === "yes" && (!updateData.twitterHandle || updateData.twitterHandle.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Twitter handle is required when 'Yes' is selected",
      });
    }

    if (updateData.hasSnapchat === "yes" && (!updateData.snapchatUsername || updateData.snapchatUsername.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Snapchat username is required when 'Yes' is selected",
      });
    }

    if (updateData.hasInstagram === "yes" && (!updateData.instagramUsername || updateData.instagramUsername.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Instagram username is required when 'Yes' is selected",
      });
    }

    // ✅ FIX: This will trigger the pre-save middleware and calculate progress
    const savedContacts = await contacts.save();

    res.status(200).json({
      success: true,
      message: "Contacts data saved successfully",
      contacts: savedContacts,
    });
  } catch (error) {
    console.error("❌ Error saving contacts data:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while saving contacts data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 🗑️ Clear Specific Field - FIXED VERSION
// ================================
export const clearContactField = async (req, res) => {
  try {
    const { collegeId, field } = req.params;
    const studentId = req.user.userId;

    if (!collegeId || !field) {
      return res.status(400).json({
        success: false,
        message: "College ID and field name are required",
      });
    }

    // Validate field name
    const allowedFields = [
      "textMessagePermission",
      "hasTwitter",
      "twitterHandle",
      "hasSnapchat",
      "snapchatUsername",
      "hasInstagram",
      "instagramUsername",
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field name",
      });
    }

    // ✅ FIX: Use findOne + save() instead of findOneAndUpdate
    const contacts = await FirstContacts.findOne({
      studentId,
      collegeId,
    });

    if (!contacts) {
      return res.status(404).json({
        success: false,
        message: "Contacts record not found",
      });
    }

    // Clear the specific field
    if (field === "twitterHandle" || field === "snapchatUsername" || field === "instagramUsername") {
      contacts[field] = "";
    } else if (field === "hasTwitter") {
      contacts.hasTwitter = "";
      contacts.twitterHandle = "";
    } else if (field === "hasSnapchat") {
      contacts.hasSnapchat = "";
      contacts.snapchatUsername = "";
    } else if (field === "hasInstagram") {
      contacts.hasInstagram = "";
      contacts.instagramUsername = "";
    } else {
      contacts[field] = "";
    }

    // ✅ FIX: This will trigger the pre-save middleware
    const updatedContacts = await contacts.save();

    res.status(200).json({
      success: true,
      message: `Field '${field}' cleared successfully`,
      contacts: updatedContacts,
    });
  } catch (error) {
    console.error("❌ Error clearing field:", error);
    res.status(500).json({
      success: false,
      message: "Server error while clearing field",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 📊 Get All Contacts for Student
// ================================
export const getAllStudentContacts = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const allContacts = await FirstContacts.find({ studentId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      contacts: allContacts,
      count: allContacts.length,
    });
  } catch (error) {
    console.error("❌ Error fetching all contacts:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching contacts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// ================================
// 📊 Get All Contacts for Admin
// ================================
export const getAllContactsForAdmin = async (req, res) => {
  try {
    console.log("🔹 Admin fetching all contacts records");

    const contactsRecords = await FirstContacts.find()
      .populate("studentId", "firstName lastName email") // if your user model is referenced
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: "All contacts records retrieved successfully",
      contactsRecords,
      count: contactsRecords.length,
    });
  } catch (error) {
    console.error("❌ Error fetching admin contacts records:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching contacts records",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

