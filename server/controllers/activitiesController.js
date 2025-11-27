import Activities from "../models/activitiesModel.js";
import Account from "../models/accountModel.js";

// Get activities data
export const getActivities = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let activitiesData = await Activities.findOne({ studentId: userId });
    
    // If no activities data exists, create default one
    if (!activitiesData) {
      activitiesData = await Activities.create({
        studentId: userId,
        hasActivities: null,
        activities: []
      });
    }

    res.status(200).json({
      success: true,
      activitiesData: {
        hasActivities: activitiesData.hasActivities,
        activities: activitiesData.activities
      }
    });
  } catch (error) {
    console.error("❌ Error fetching activities data:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching activities data" 
    });
  }
};

// Save hasActivities preference
export const saveHasActivities = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { hasActivities } = req.body;

    // Update or create activities data
    const activitiesData = await Activities.findOneAndUpdate(
      { studentId: userId },
      { 
        hasActivities: hasActivities,
        // If user selects "No", clear any existing activities
        ...(hasActivities === false && { activities: [] })
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );

    // Update application progress in Account
    let progressValue = 0;
    if (hasActivities === false) {
      progressValue = 100;
    } else if (hasActivities === true) {
      progressValue = 10;
    }

    await Account.findByIdAndUpdate(
      userId,
      { "applicationProgress.activities": progressValue }
    );

    res.status(200).json({
      success: true,
      message: "Activities preference saved successfully",
      activitiesData: {
        hasActivities: activitiesData.hasActivities,
        activities: activitiesData.activities
      }
    });
  } catch (error) {
    console.error("❌ Error saving activities preference:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error saving activities preference" 
    });
  }
};

// Save activities details
export const saveActivitiesDetails = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { activities } = req.body;

    const activitiesData = await Activities.findOneAndUpdate(
      { studentId: userId },
      { 
        activities: activities,
        hasActivities: true
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );

    // Update application progress to 100%
    await Account.findByIdAndUpdate(
      userId,
      { "applicationProgress.activities": 100 }
    );

    res.status(200).json({
      success: true,
      message: "Activities details saved successfully",
      activitiesData: {
        hasActivities: activitiesData.hasActivities,
        activities: activitiesData.activities
      }
    });
  } catch (error) {
    console.error("❌ Error saving activities details:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error saving activities details" 
    });
  }
};

// Clear hasActivities answer
export const clearHasActivities = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const activitiesData = await Activities.findOneAndUpdate(
      { studentId: userId },
      { 
        hasActivities: null,
        activities: []
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );

    // Reset application progress
    await Account.findByIdAndUpdate(
      userId,
      { "applicationProgress.activities": 0 }
    );

    res.status(200).json({
      success: true,
      message: "Activities answer cleared successfully",
      activitiesData: {
        hasActivities: activitiesData.hasActivities,
        activities: activitiesData.activities
      }
    });
  } catch (error) {
    console.error("❌ Error clearing activities answer:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error clearing activities answer" 
    });
  }
};