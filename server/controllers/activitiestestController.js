// controllers/activitiestestController.js
import TransferActivities from "../models/activitiestestModel.js"; // ✅ Updated import
import dotenv from "dotenv";

dotenv.config();

/**
 * 📊 Helper: Check if a section has meaningful data
 */
const isSectionComplete = (section, sectionName) => {
  if (!section) return false;

  switch (sectionName) {
    case 'activities':
      return !!(section.hasActivities && section.hasActivities !== '');
    
    case 'responsibilities':
      return !!(
        section.selectedResponsibilities && 
        section.selectedResponsibilities.length > 0 &&
        section.selectedCircumstances &&
        section.selectedCircumstances.length > 0
      );
    
    default:
      return false;
  }
};

/**
 * 📊 Helper: Calculate activities completion progress with auto-detection
 */
const calculateActivitiesProgress = (activities) => {
  let completedFields = 0;
  let totalFields = 2; // 2 main sections

  // Auto-detect completion based on data presence
  const autoCompletion = {
    activities: isSectionComplete(activities.activities, 'activities'),
    responsibilities: isSectionComplete(activities.responsibilities, 'responsibilities'),
  };

  // Update the activitiesCompletion object
  Object.keys(autoCompletion).forEach(key => {
    if (autoCompletion[key] && !activities.activitiesCompletion[key]) {
      activities.activitiesCompletion[key] = true;
    }
  });

  // Count completed sections
  completedFields = Object.values(activities.activitiesCompletion).filter(Boolean).length;

  const progress = Math.round((completedFields / totalFields) * 100);

  console.log(`📊 Transfer Activities progress: ${completedFields}/${totalFields} = ${progress}%`);
  console.log(`   Completed sections:`, Object.keys(activities.activitiesCompletion).filter(k => activities.activitiesCompletion[k]));

  return progress;
};

/**
 * 👤 Get Current Student's Activities (using JWT token)
 * GET /api/transfer/activities
 */
export const getCurrentActivities = async (req, res) => {
  try {
    const userId = req.user?.id;

    console.log("📥 Fetching transfer activities data...");
    console.log("🔑 User ID from token:", userId);

    if (!userId) {
      console.warn("⚠️ No user ID in token");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
    }

    let activities = await TransferActivities.findOne({ studentId: userId }); // ✅ Updated model

    // If no activities record exists, create a new one with default values
    if (!activities) {
      console.log("📝 No transfer activities record found, creating new one...");
      activities = new TransferActivities({ // ✅ Updated model
        studentId: userId,
        activities: {
          hasActivities: '',
          activitiesList: [],
        },
        responsibilities: {
          selectedResponsibilities: [],
          selectedCircumstances: [],
        },
        activitiesCompletion: {
          activities: false,
          responsibilities: false,
        },
      });
      await activities.save();
      console.log("✅ New transfer activities record created");
    }

    console.log("✅ Transfer activities data fetched successfully");

    // Calculate activities progress with auto-detection
    const activitiesProgress = calculateActivitiesProgress(activities);

    return res.status(200).json({
      success: true,
      activities: activities,
      activitiesProgress: activitiesProgress,
    });
  } catch (error) {
    console.error("❌ Error fetching transfer activities:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching transfer activities data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * 💾 Update Current Student's Activities (using JWT token)
 * PUT /api/transfer/activities
 */
export const updateCurrentActivities = async (req, res) => {
  try {
    const userId = req.user?.id;

    console.log("💾 Updating transfer activities data...");
    console.log("🔑 User ID from token:", userId);
    console.log("📦 Update data keys:", Object.keys(req.body));

    if (!userId) {
      console.warn("⚠️ No user ID in token");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
    }

    // Find existing activities record or create new one
    let activities = await TransferActivities.findOne({ studentId: userId }); // ✅ Updated model

    if (!activities) {
      console.log("📝 Creating new transfer activities record...");
      activities = new TransferActivities({ // ✅ Updated model
        studentId: userId,
        ...req.body,
      });
    } else {
      // Update existing record
      Object.keys(req.body).forEach((key) => {
        activities[key] = req.body[key];
      });
    }

    // Calculate updated activities progress with auto-detection
    const activitiesProgress = calculateActivitiesProgress(activities);

    // Save after calculating progress (so activitiesCompletion is updated)
    await activities.save();

    console.log("✅ Transfer activities data updated successfully");
    console.log("📊 New progress:", activitiesProgress + "%");

    return res.status(200).json({
      success: true,
      message: "Transfer activities data updated successfully",
      activities: activities,
      activitiesProgress: activitiesProgress,
      progress: {
        activities: activitiesProgress,
      },
    });
  } catch (error) {
    console.error("❌ Error updating transfer activities:", error);
    console.error("   Stack trace:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error updating transfer activities data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * 🗑️ Delete Activities Record
 * DELETE /api/transfer/activities
 */
export const deleteActivities = async (req, res) => {
  try {
    const userId = req.user?.id;

    console.log("🗑️ Deleting transfer activities record...");
    console.log("🔑 User ID from token:", userId);

    if (!userId) {
      console.warn("⚠️ No user ID in token");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
    }

    const activities = await TransferActivities.findOneAndDelete({ studentId: userId }); // ✅ Updated model

    if (!activities) {
      return res.status(404).json({
        success: false,
        message: "Transfer activities record not found",
      });
    }

    console.log("✅ Transfer activities record deleted successfully");

    return res.status(200).json({
      success: true,
      message: "Transfer activities record deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting transfer activities:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting transfer activities record",
    });
  }
};