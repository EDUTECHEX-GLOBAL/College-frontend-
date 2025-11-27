import FirstFamily from "../models/firstFamilyModel.js";
import Account from "../models/accountModel.js";

// ================================
// 🟢 Get Family Application Data
// ================================
export const getFamilyApplication = async (req, res) => {
  try {
    const { collegeId } = req.params;
    // ✅ FIXED: Changed from userId to studentId
    const studentId = req.user.userId;

    console.log(`📋 Fetching family application for college: ${collegeId}, student: ${studentId}`);

    if (!collegeId) {
      return res.status(400).json({
        success: false,
        message: "College ID is required",
      });
    }

    let familyApplication = await FirstFamily.findOne({
      // ✅ FIXED: Changed from userId to studentId
      studentId,
      collegeId,
    });

    // If no existing record, create a default one
    if (!familyApplication) {
      familyApplication = new FirstFamily({
        // ✅ FIXED: Changed from userId to studentId
        studentId,
        collegeId,
        parentGuardianAddress: "",
        parent1Address: {
          street1: "",
          street2: "",
          street3: "",
          city: "",
          state: "",
          country: "",
          zip: "",
        },
        parent2Address: {
          street1: "",
          street2: "",
          street3: "",
          city: "",
          state: "",
          country: "",
          zip: "",
        },
        showParent2Address: false,
        kuGraduates: [],
        kuEmployeeDependent: "",
        kuEmployeeName: "",
        kuEmployeeLocation: "",
        militaryDependent: "",
        militaryStatus: "",
        vaBenefitsIntent: "",
        progress: 0,
      });

      await familyApplication.save();
      console.log(`🆕 Created new family application for college: ${collegeId}`);
    }

    res.status(200).json({
      success: true,
      familyApplication,
    });
  } catch (error) {
    console.error("❌ Error fetching family application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching family application",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 💾 Save Family Application Data
// ================================
export const saveFamilyApplication = async (req, res) => {
  try {
    const { collegeId } = req.params;
    // ✅ FIXED: Changed from userId to studentId
    const studentId = req.user.userId;
    const updateData = req.body;

    console.log(`💾 Saving family application for college: ${collegeId}, student: ${studentId}`);

    if (!collegeId) {
      return res.status(400).json({
        success: false,
        message: "College ID is required",
      });
    }

    // Find existing record or create new one
    let familyApplication = await FirstFamily.findOne({
      // ✅ FIXED: Changed from userId to studentId
      studentId,
      collegeId,
    });

    if (!familyApplication) {
      familyApplication = new FirstFamily({
        // ✅ FIXED: Changed from userId to studentId
        studentId,
        collegeId,
        ...updateData,
      });
    } else {
      // Update existing record
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          // Handle nested address objects
          if (key === 'parent1Address' || key === 'parent2Address') {
            familyApplication[key] = {
              ...familyApplication[key],
              ...updateData[key]
            };
          } else {
            familyApplication[key] = updateData[key];
          }
        }
      });
    }

    // Save the application
    const savedApplication = await familyApplication.save();

    // Update user's overall application progress
    await updateUserApplicationProgress(studentId);

    console.log(`✅ Family application saved successfully for college: ${collegeId}`);
    
    res.status(200).json({
      success: true,
      message: "Family application saved successfully",
      familyApplication: savedApplication,
    });
  } catch (error) {
    console.error("❌ Error saving family application:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error: Please check your input data",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate family application found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while saving family application",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 🗑️ Clear Specific Field
// ================================
export const clearFamilyField = async (req, res) => {
  try {
    const { collegeId, field } = req.params;
    // ✅ FIXED: Changed from userId to studentId
    const studentId = req.user.userId;

    console.log(`🗑️ Clearing field '${field}' for college: ${collegeId}, student: ${studentId}`);

    if (!collegeId || !field) {
      return res.status(400).json({
        success: false,
        message: "College ID and field name are required",
      });
    }

    const familyApplication = await FirstFamily.findOne({
      // ✅ FIXED: Changed from userId to studentId
      studentId,
      collegeId,
    });

    if (!familyApplication) {
      return res.status(404).json({
        success: false,
        message: "Family application not found",
      });
    }

    // Define clear values for different field types
    const clearValues = {
      // Address selection
      parentGuardianAddress: "",
      
      // Parent addresses
      parent1Address: {
        street1: "",
        street2: "",
        street3: "",
        city: "",
        state: "",
        country: "",
        zip: "",
      },
      parent2Address: {
        street1: "",
        street2: "",
        street3: "",
        city: "",
        state: "",
        country: "",
        zip: "",
      },
      
      // Toggle fields
      showParent2Address: false,
      
      // Array fields
      kuGraduates: [],
      
      // KU employee fields
      kuEmployeeDependent: "",
      kuEmployeeName: "",
      kuEmployeeLocation: "",
      
      // Military fields
      militaryDependent: "",
      militaryStatus: "",
      vaBenefitsIntent: "",
    };

    // Clear the specific field
    if (clearValues.hasOwnProperty(field)) {
      familyApplication[field] = clearValues[field];
      
      // If clearing KU employee dependent, also clear related fields
      if (field === 'kuEmployeeDependent') {
        familyApplication.kuEmployeeName = "";
        familyApplication.kuEmployeeLocation = "";
      }
      
      // If clearing military dependent, also clear related fields
      if (field === 'militaryDependent') {
        familyApplication.militaryStatus = "";
        familyApplication.vaBenefitsIntent = "";
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Invalid field name: ${field}`,
      });
    }

    const updatedApplication = await familyApplication.save();

    // Update user's overall application progress
    await updateUserApplicationProgress(studentId);

    console.log(`✅ Field '${field}' cleared successfully`);

    res.status(200).json({
      success: true,
      message: `Field '${field}' cleared successfully`,
      familyApplication: updatedApplication,
    });
  } catch (error) {
    console.error("❌ Error clearing family field:", error);
    res.status(500).json({
      success: false,
      message: "Server error while clearing field",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 🔍 Get All Family Applications for User
// ================================
export const getUserFamilyApplications = async (req, res) => {
  try {
    // ✅ FIXED: Changed from userId to studentId
    const studentId = req.user.userId;

    console.log(`📋 Fetching all family applications for student: ${studentId}`);

    const familyApplications = await FirstFamily.find({ studentId }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      familyApplications,
      count: familyApplications.length,
    });
  } catch (error) {
    console.error("❌ Error fetching user family applications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching family applications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 🗑️ Delete Family Application
// ================================
export const deleteFamilyApplication = async (req, res) => {
  try {
    const { collegeId } = req.params;
    // ✅ FIXED: Changed from userId to studentId
    const studentId = req.user.userId;

    console.log(`🗑️ Deleting family application for college: ${collegeId}, student: ${studentId}`);

    if (!collegeId) {
      return res.status(400).json({
        success: false,
        message: "College ID is required",
      });
    }

    const result = await FirstFamily.findOneAndDelete({
      // ✅ FIXED: Changed from userId to studentId
      studentId,
      collegeId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Family application not found",
      });
    }

    // Update user's overall application progress
    await updateUserApplicationProgress(studentId);

    console.log(`✅ Family application deleted successfully for college: ${collegeId}`);

    res.status(200).json({
      success: true,
      message: "Family application deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting family application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting family application",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 🔄 Update User Application Progress (Helper Function)
// ================================
const updateUserApplicationProgress = async (studentId) => {
  try {
    // Get all family applications for the student
    const familyApplications = await FirstFamily.find({ studentId });
    
    if (familyApplications.length === 0) {
      // No family applications, set progress to 0
      await Account.findByIdAndUpdate(studentId, {
        "applicationProgress.family": 0,
      });
      return;
    }

    // Calculate average progress across all family applications
    const totalProgress = familyApplications.reduce((sum, app) => sum + app.progress, 0);
    const averageProgress = Math.round(totalProgress / familyApplications.length);

    // Update user's family progress
    await Account.findByIdAndUpdate(studentId, {
      "applicationProgress.family": averageProgress,
    });

    console.log(`📊 Updated family progress for student ${studentId}: ${averageProgress}%`);
  } catch (error) {
    console.error("❌ Error updating user application progress:", error);
  }
};