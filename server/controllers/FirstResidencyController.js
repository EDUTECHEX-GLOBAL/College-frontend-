import FirstResidency from "../models/FirstResidencyModel.js";
import mongoose from "mongoose";

// Get or create residency data for a specific college
export const getResidencyData = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;

    let residency = await FirstResidency.findOne({ studentId, collegeId });

    // If no residency record exists, create a default one
    if (!residency) {
      residency = await FirstResidency.create({
        studentId,
        collegeId,
        qualifyInStateTuition: "",
        kansasResident: "",
        livedInKansasSinceBirth: "",
        everLivedInKansas: "",
        kansasResidenceStartDate: null,
        kansasResidenceEndDate: null,
        progress: 0,
        status: "not-started",
      });
    }

    res.status(200).json({
      success: true,
      message: "Residency data retrieved successfully",
      residency,
    });
  } catch (error) {
    console.error("❌ Error fetching residency data:", error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Race condition occurred - try to fetch the existing record
      try {
        const { collegeId } = req.params;
        const studentId = req.user.userId;
        
        const existingResidency = await FirstResidency.findOne({ 
          studentId, 
          collegeId 
        });
        
        if (existingResidency) {
          return res.status(200).json({
            success: true,
            message: "Residency data retrieved successfully",
            residency: existingResidency,
          });
        }
      } catch (fetchError) {
        console.error("❌ Error fetching existing residency after race condition:", fetchError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: "Server error while fetching residency data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Save residency data
export const saveResidencyData = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;
    const updateData = req.body;

    // First, find existing record or create if doesn't exist
    let residency = await FirstResidency.findOne({ studentId, collegeId });

    if (residency) {
      // Update existing record
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          residency[key] = updateData[key];
        }
      });
    } else {
      // Create new record with the update data
      residency = new FirstResidency({
        studentId,
        collegeId,
        ...updateData,
        // Ensure defaults for required fields
        qualifyInStateTuition: updateData.qualifyInStateTuition || "",
        kansasResident: updateData.kansasResident || "",
        livedInKansasSinceBirth: updateData.livedInKansasSinceBirth || "",
        everLivedInKansas: updateData.everLivedInKansas || "",
        kansasResidenceStartDate: updateData.kansasResidenceStartDate || null,
        kansasResidenceEndDate: updateData.kansasResidenceEndDate || null,
      });
    }

    // Recalculate progress and save
    residency.calculateProgress();
    await residency.save();

    res.status(200).json({
      success: true,
      message: "Residency data saved successfully",
      residency,
    });
  } catch (error) {
    console.error("❌ Error saving residency data:", error);
    
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error: Please check your input data",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    if (error.code === 11000) {
      // Handle duplicate key error by finding the existing record and updating it
      try {
        const { collegeId } = req.params;
        const studentId = req.user.userId;
        
        const existingResidency = await FirstResidency.findOne({ studentId, collegeId });
        if (existingResidency) {
          // Update the existing record with new data
          Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
              existingResidency[key] = updateData[key];
            }
          });
          
          existingResidency.calculateProgress();
          await existingResidency.save();
          
          return res.status(200).json({
            success: true,
            message: "Residency data saved successfully",
            residency: existingResidency,
          });
        }
      } catch (fetchError) {
        console.error("❌ Error handling duplicate residency:", fetchError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error while saving residency data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Clear specific field
export const clearResidencyField = async (req, res) => {
  try {
    const { collegeId, field } = req.params;
    const studentId = req.user.userId;

    // Validate field name
    const allowedFields = [
      "qualifyInStateTuition",
      "kansasResident",
      "livedInKansasSinceBirth",
      "everLivedInKansas",
      "kansasResidenceStartDate",
      "kansasResidenceEndDate",
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field name",
      });
    }

    const residency = await FirstResidency.findOne({ studentId, collegeId });

    if (!residency) {
      return res.status(404).json({
        success: false,
        message: "Residency record not found",
      });
    }

    // Clear the field
    residency[field] = field.includes("Date") ? null : "";
    
    // Recalculate progress and save
    residency.calculateProgress();
    await residency.save();

    res.status(200).json({
      success: true,
      message: `Field ${field} cleared successfully`,
      residency,
    });
  } catch (error) {
    console.error("❌ Error clearing residency field:", error);
    res.status(500).json({
      success: false,
      message: "Server error while clearing field",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all residency records for a student
export const getAllStudentResidencies = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const residencies = await FirstResidency.find({ studentId }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "All residency records retrieved successfully",
      residencies,
      count: residencies.length,
    });
  } catch (error) {
    console.error("❌ Error fetching all residencies:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching residency records",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Alternative atomic save method using findOneAndUpdate (without conflicting operators)
export const saveResidencyDataAtomic = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;
    const updateData = req.body;

    // Prepare update object without conflicting operators
    const updateObject = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateObject[key] = updateData[key];
      }
    });

    // First try to update existing record
    let residency = await FirstResidency.findOneAndUpdate(
      { studentId, collegeId },
      updateObject,
      { new: true, runValidators: true }
    );

    // If no record exists, create one
    if (!residency) {
      residency = await FirstResidency.create({
        studentId,
        collegeId,
        ...updateObject,
        // Ensure defaults
        qualifyInStateTuition: updateObject.qualifyInStateTuition || "",
        kansasResident: updateObject.kansasResident || "",
        livedInKansasSinceBirth: updateObject.livedInKansasSinceBirth || "",
        everLivedInKansas: updateObject.everLivedInKansas || "",
        kansasResidenceStartDate: updateObject.kansasResidenceStartDate || null,
        kansasResidenceEndDate: updateObject.kansasResidenceEndDate || null,
      });
    }

    // Recalculate progress and save
    residency.calculateProgress();
    await residency.save();

    res.status(200).json({
      success: true,
      message: "Residency data saved successfully",
      residency,
    });
  } catch (error) {
    console.error("❌ Error in atomic save residency data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving residency data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Get all residency records for admin (like InternationalStudent admin)
export const getAllResidencyRecordsForAdmin = async (req, res) => {
  try {
    const residencies = await FirstResidency.find()
      .populate("studentId", "firstName lastName email phone") // populate student info
      .sort({ updatedAt: -1 });

    // Map to frontend-friendly structure
    const mappedResidencies = residencies.map((residency) => ({
      _id: residency._id,
      collegeId: residency.collegeId,
      status:
        residency.progress === 100
          ? "completed"
          : residency.progress > 0
          ? "in-progress"
          : "not-started",
      progress: residency.progress || 0,
      submittedAt: residency.updatedAt || residency.createdAt,
      student: {
        name: residency.studentId
          ? `${residency.studentId.firstName || ""} ${residency.studentId.lastName || ""}`.trim()
          : "N/A",
        email: residency.studentId?.email || "N/A",
        phone: residency.studentId?.phone || "N/A",
      },
      details: residency,
      type: "residency",
    }));

    res.status(200).json({
      success: true,
      message: "All residency records retrieved successfully",
      residencyRecords: mappedResidencies,
      count: mappedResidencies.length,
    });
  } catch (error) {
    console.error("❌ Error fetching all residency records for admin:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching all residency records",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
