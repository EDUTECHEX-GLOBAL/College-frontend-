import InternationalStudent from "../models/InternationalStudentModel.js";

// Get or create international student data for a specific college
export const getInternationalData = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;

    let international = await InternationalStudent.findOne({ studentId, collegeId });

    // If no record exists, create a new one with defaults
    if (!international) {
      international = new InternationalStudent({
        studentId,
        collegeId,
        highSchoolGraduated: "",
        attendedClassesSinceGraduation: "",
        addAnotherSchool: "",
        schoolName: "",
        schoolStartDate: null,
        schoolEndDate: null,
        requestedImmigrationStatus: "",
        currentlyInUS: "",
        currentImmigrationStatus: "",
        hearAboutKU: "",
        applicationFeeAgreement: "",
        certificationAgreement: "",
        thirdPartyPreparation: "",
        progress: 0,
        status: "not-started",
      });
      await international.save();
    }

    res.status(200).json({
      success: true,
      message: "International student data retrieved successfully",
      international,
    });
  } catch (error) {
    console.error("❌ Error fetching international student data:", error);
    
    res.status(500).json({
      success: false,
      message: "Server error while fetching international student data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Save international student data - simplified approach
export const saveInternationalData = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;
    const updateData = req.body;

    // Find or create the document
    let international = await InternationalStudent.findOne({ studentId, collegeId });
    
    if (!international) {
      // Create new document with the update data and defaults
      international = new InternationalStudent({
        studentId,
        collegeId,
        highSchoolGraduated: "",
        attendedClassesSinceGraduation: "",
        addAnotherSchool: "",
        schoolName: "",
        schoolStartDate: null,
        schoolEndDate: null,
        requestedImmigrationStatus: "",
        currentlyInUS: "",
        currentImmigrationStatus: "",
        hearAboutKU: "",
        applicationFeeAgreement: "",
        certificationAgreement: "",
        thirdPartyPreparation: "",
        progress: 0,
        status: "not-started",
        ...updateData // Spread the update data to override defaults
      });
    } else {
      // Update existing document - only update fields that are provided
      const allowedFields = [
        "highSchoolGraduated",
        "attendedClassesSinceGraduation",
        "addAnotherSchool",
        "schoolName",
        "schoolStartDate",
        "schoolEndDate",
        "requestedImmigrationStatus",
        "currentlyInUS",
        "currentImmigrationStatus",
        "hearAboutKU",
        "applicationFeeAgreement",
        "certificationAgreement",
        "thirdPartyPreparation"
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          international[field] = updateData[field];
        }
      });
    }

    // Progress is automatically calculated in pre-save middleware
    await international.save();

    res.status(200).json({
      success: true,
      message: "International student data saved successfully",
      international,
    });
  } catch (error) {
    console.error("❌ Error saving international student data:", error);
    
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error: Please check your input data",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while saving international student data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Clear specific field
export const clearInternationalField = async (req, res) => {
  try {
    const { collegeId, field } = req.params;
    const studentId = req.user.userId;

    // Validate field name
    const allowedFields = [
      "highSchoolGraduated",
      "attendedClassesSinceGraduation",
      "addAnotherSchool",
      "schoolName",
      "schoolStartDate",
      "schoolEndDate",
      "requestedImmigrationStatus",
      "currentlyInUS",
      "currentImmigrationStatus",
      "hearAboutKU",
      "applicationFeeAgreement",
      "certificationAgreement",
      "thirdPartyPreparation"
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field name",
      });
    }

    let international = await InternationalStudent.findOne({ studentId, collegeId });

    if (!international) {
      return res.status(404).json({
        success: false,
        message: "International student record not found",
      });
    }

    // Determine the value to set based on field type
    const valueToSet = field.includes("Date") ? null : "";
    international[field] = valueToSet;

    // Progress is automatically calculated in pre-save middleware
    await international.save();

    res.status(200).json({
      success: true,
      message: `Field ${field} cleared successfully`,
      international,
    });
  } catch (error) {
    console.error("❌ Error clearing international student field:", error);
    res.status(500).json({
      success: false,
      message: "Server error while clearing field",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all international student records for a student
export const getAllStudentInternationalRecords = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const internationalRecords = await InternationalStudent.find({ studentId }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "All international student records retrieved successfully",
      internationalRecords,
      count: internationalRecords.length,
    });
  } catch (error) {
    console.error("❌ Error fetching all international student records:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching international student records",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};