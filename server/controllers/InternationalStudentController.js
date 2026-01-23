import InternationalStudent from "../models/InternationalStudentModel.js";
import mongoose from "mongoose";

/**
 * ===============================
 * GET / CREATE INTERNATIONAL DATA (STUDENT)
 * ===============================
 */
export const getInternationalData = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;

    let international = await InternationalStudent.findOne({ studentId, collegeId });

    if (!international) {
      international = new InternationalStudent({
        studentId,
        collegeId,
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
    });
  }
};

/**
 * ===============================
 * SAVE INTERNATIONAL DATA (STUDENT)
 * ===============================
 */
export const saveInternationalData = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;
    const updateData = req.body;

    let international = await InternationalStudent.findOne({ studentId, collegeId });

    if (!international) {
      international = new InternationalStudent({
        studentId,
        collegeId,
        ...updateData,
      });
    } else {
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
        "thirdPartyPreparation",
      ];

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          international[field] = updateData[field];
        }
      });
    }

    await international.save();

    res.status(200).json({
      success: true,
      message: "International student data saved successfully",
      international,
    });
  } catch (error) {
    console.error("❌ Error saving international student data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving international student data",
    });
  }
};

/**
 * ===============================
 * CLEAR SINGLE FIELD (STUDENT)
 * ===============================
 */
export const clearInternationalField = async (req, res) => {
  try {
    const { collegeId, field } = req.params;
    const studentId = req.user.userId;

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
      "thirdPartyPreparation",
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, message: "Invalid field name" });
    }

    const international = await InternationalStudent.findOne({ studentId, collegeId });

    if (!international) {
      return res.status(404).json({
        success: false,
        message: "International student record not found",
      });
    }

    international[field] = field.includes("Date") ? null : "";
    await international.save();

    res.status(200).json({
      success: true,
      message: `Field ${field} cleared successfully`,
      international,
    });
  } catch (error) {
    console.error("❌ Error clearing field:", error);
    res.status(500).json({
      success: false,
      message: "Server error while clearing field",
    });
  }
};

/**
 * ===============================
 * GET ALL INTERNATIONAL RECORDS (STUDENT)
 * ===============================
 */
export const getAllStudentInternationalRecords = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const query = mongoose.Types.ObjectId.isValid(studentId)
      ? { studentId: new mongoose.Types.ObjectId(studentId) }
      : { studentId };

    const internationalRecords = await InternationalStudent.find(query)
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: "International records retrieved successfully",
      internationalRecords,
      count: internationalRecords.length,
    });
  } catch (error) {
    console.error("❌ Error fetching student records:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching international records",
    });
  }
};

/**
 * ===============================
 * GET ALL INTERNATIONAL RECORDS (ADMIN)
 * ===============================
 */
export const getAllInternationalRecordsForAdmin = async (req, res) => {
  try {
    console.log("🔹 Admin fetching international student records");

    const internationalRecords = await InternationalStudent.find()
      .populate("studentId", "firstName lastName email")

      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: "All international student records retrieved successfully",
      internationalRecords,
      count: internationalRecords.length,
    });
  } catch (error) {
    console.error("❌ Error fetching admin records:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching international student records",
    });
  }
};
