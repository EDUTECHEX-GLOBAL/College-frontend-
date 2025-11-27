// controllers/activitiestestController.js
import Activities from "../models/activitiestestModel.js";
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

  console.log(`📊 Activities progress: ${completedFields}/${totalFields} = ${progress}%`);
  console.log(`   Completed sections:`, Object.keys(activities.activitiesCompletion).filter(k => activities.activitiesCompletion[k]));

  return progress;
};

/**
 * 👤 Get Current Student's Activities (using JWT token)
 * GET /api/activities
 */
export const getCurrentActivities = async (req, res) => {
  try {
    const userId = req.user?.id;

    console.log("📥 Fetching activities data...");
    console.log("🔑 User ID from token:", userId);

    if (!userId) {
      console.warn("⚠️ No user ID in token");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
    }

    let activities = await Activities.findOne({ studentId: userId });

    // If no activities record exists, create a new one with default values
    if (!activities) {
      console.log("📝 No activities record found, creating new one...");
      activities = new Activities({
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
      console.log("✅ New activities record created");
    }

    console.log("✅ Activities data fetched successfully");

    // Calculate activities progress with auto-detection
    const activitiesProgress = calculateActivitiesProgress(activities);

    return res.status(200).json({
      success: true,
      activities: activities,
      activitiesProgress: activitiesProgress,
    });
  } catch (error) {
    console.error("❌ Error fetching activities:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching activities data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * 💾 Update Current Student's Activities (using JWT token)
 * PUT /api/activities
 */
export const updateCurrentActivities = async (req, res) => {
  try {
    const userId = req.user?.id;

    console.log("💾 Updating activities data...");
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
    let activities = await Activities.findOne({ studentId: userId });

    if (!activities) {
      console.log("📝 Creating new activities record...");
      activities = new Activities({
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

    console.log("✅ Activities data updated successfully");
    console.log("📊 New progress:", activitiesProgress + "%");

    return res.status(200).json({
      success: true,
      message: "Activities data updated successfully",
      activities: activities,
      activitiesProgress: activitiesProgress,
      progress: {
        activities: activitiesProgress,
      },
    });
  } catch (error) {
    console.error("❌ Error updating activities:", error);
    console.error("   Stack trace:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error updating activities data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * 🗑️ Delete Activities Record
 * DELETE /api/activities
 */
export const deleteActivities = async (req, res) => {
  try {
    const userId = req.user?.id;

    console.log("🗑️ Deleting activities record...");
    console.log("🔑 User ID from token:", userId);

    if (!userId) {
      console.warn("⚠️ No user ID in token");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
    }

    const activities = await Activities.findOneAndDelete({ studentId: userId });

    if (!activities) {
      return res.status(404).json({
        success: false,
        message: "Activities record not found",
      });
    }

    console.log("✅ Activities record deleted successfully");

    return res.status(200).json({
      success: true,
      message: "Activities record deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting activities:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting activities record",
    });
  }
};
