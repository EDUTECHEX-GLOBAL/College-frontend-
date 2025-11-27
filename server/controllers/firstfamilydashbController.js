import firstfamilydashb from "../models/firstfamilydashbModel.js";
import Account from "../models/accountModel.js";

// ================================
// 🏠 Get Family Data
// ================================
export const getFamilyData = async (req, res) => {
  try {
    const studentId = req.user.userId;

    let familyData = await firstfamilydashb.findOne({ studentId });

    if (!familyData) {
      // Create initial family data if not exists
      familyData = await firstfamilydashb.create({
        studentId,
        household: {},
        parent1: {},
        parent2: {},
        siblings: { siblingsList: [] },
        completionStatus: {
          household: false,
          parent1: false,
          parent2: false,
          sibling: false,
        },
        overallProgress: 0,
      });
    }

    res.status(200).json({
      success: true,
      message: "Family data retrieved successfully",
      familyData,
    });
  } catch (error) {
    console.error("❌ Error fetching family data:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching family data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 🏠 Save Household Data
// ================================
export const saveHouseholdData = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const householdData = req.body;

    // Validate required fields
    if (!householdData.parentsMaritalStatus || !householdData.permanentHomeWith) {
      return res.status(400).json({
        success: false,
        message: "Parents' marital status and permanent home are required",
      });
    }

    const familyData = await firstfamilydashb.findOneAndUpdate(
      { studentId },
      {
        $set: {
          "household": householdData,
          "completionStatus.household": true,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Update application progress in Account
    await updateFamilyProgress(studentId, familyData.overallProgress);

    res.status(200).json({
      success: true,
      message: "Household data saved successfully",
      familyData,
    });
  } catch (error) {
    console.error("❌ Error saving household data:", error);
    res.status(500).json({
      success: false,
      message: "Server error saving household data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 👨‍👩‍👧‍👦 Save Parent 1 Data
// ================================
export const saveParent1Data = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const parent1Data = req.body;

    // Validate required fields
    if (!parent1Data.parentType) {
      return res.status(400).json({
        success: false,
        message: "Parent type is required",
      });
    }

    const familyData = await firstfamilydashb.findOneAndUpdate(
      { studentId },
      {
        $set: {
          "parent1": parent1Data,
          "completionStatus.parent1": true,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Update application progress in Account
    await updateFamilyProgress(studentId, familyData.overallProgress);

    res.status(200).json({
      success: true,
      message: "Parent 1 data saved successfully",
      familyData,
    });
  } catch (error) {
    console.error("❌ Error saving parent 1 data:", error);
    res.status(500).json({
      success: false,
      message: "Server error saving parent 1 data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 👨‍👩‍👧‍👦 Save Parent 2 Data
// ================================
export const saveParent2Data = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const parent2Data = req.body;

    // Validate required fields
    if (!parent2Data.parentType) {
      return res.status(400).json({
        success: false,
        message: "Parent type is required",
      });
    }

    const familyData = await firstfamilydashb.findOneAndUpdate(
      { studentId },
      {
        $set: {
          "parent2": parent2Data,
          "completionStatus.parent2": true,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Update application progress in Account
    await updateFamilyProgress(studentId, familyData.overallProgress);

    res.status(200).json({
      success: true,
      message: "Parent 2 data saved successfully",
      familyData,
    });
  } catch (error) {
    console.error("❌ Error saving parent 2 data:", error);
    res.status(500).json({
      success: false,
      message: "Server error saving parent 2 data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 👨‍👧‍👦 Save Sibling Data
// ================================
export const saveSiblingData = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const siblingData = req.body;

    // Validate required fields
    if (siblingData.siblingsCount === undefined || siblingData.siblingsCount === null) {
      return res.status(400).json({
        success: false,
        message: "Siblings count is required",
      });
    }

    // Validate siblings list if count > 0
    if (siblingData.siblingsCount > 0) {
      if (!siblingData.siblingsList || siblingData.siblingsList.length !== siblingData.siblingsCount) {
        return res.status(400).json({
          success: false,
          message: "Siblings list must match the specified count",
        });
      }

      // Validate required fields for each sibling
      for (let i = 0; i < siblingData.siblingsList.length; i++) {
        const sibling = siblingData.siblingsList[i];
        if (!sibling.firstName || !sibling.lastName) {
          return res.status(400).json({
            success: false,
            message: `Sibling ${i + 1}: First name and last name are required`,
          });
        }
      }
    }

    const familyData = await firstfamilydashb.findOneAndUpdate(
      { studentId },
      {
        $set: {
          "siblings": siblingData,
          "completionStatus.sibling": true,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Update application progress in Account
    await updateFamilyProgress(studentId, familyData.overallProgress);

    res.status(200).json({
      success: true,
      message: "Sibling data saved successfully",
      familyData,
    });
  } catch (error) {
    console.error("❌ Error saving sibling data:", error);
    res.status(500).json({
      success: false,
      message: "Server error saving sibling data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 📊 Update Family Progress in Account
// ================================
const updateFamilyProgress = async (studentId, progress) => {
  try {
    await Account.findByIdAndUpdate(
      studentId,
      {
        $set: {
          "applicationProgress.family": progress,
        },
      },
      { new: true }
    );
    console.log(`✅ Updated family progress for student ${studentId}: ${progress}%`);
  } catch (error) {
    console.error("❌ Error updating family progress in account:", error);
  }
};

// ================================
// 🎯 Get Family Progress
// ================================
export const getFamilyProgress = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const familyData = await firstfamilydashb.findOne({ studentId });
    const progress = familyData ? familyData.overallProgress : 0;

    res.status(200).json({
      success: true,
      message: "Family progress retrieved successfully",
      progress,
    });
  } catch (error) {
    console.error("❌ Error fetching family progress:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching family progress",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================================
// 🗑️ Clear Family Section
// ================================
export const clearFamilyData = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const familyData = await firstfamilydashb.findOneAndUpdate(
      { studentId },
      {
        $set: {
          household: {},
          parent1: {},
          parent2: {},
          siblings: { siblingsList: [] },
          completionStatus: {
            household: false,
            parent1: false,
            parent2: false,
            sibling: false,
          },
          overallProgress: 0,
        },
      },
      { new: true }
    );

    // Reset progress in Account
    await updateFamilyProgress(studentId, 0);

    res.status(200).json({
      success: true,
      message: "Family data cleared successfully",
      familyData,
    });
  } catch (error) {
    console.error("❌ Error clearing family data:", error);
    res.status(500).json({
      success: false,
      message: "Server error clearing family data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};