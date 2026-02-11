import Overview from '../models/overviewModel.js';
import mongoose from 'mongoose';

// Get overview data for user
const getOverview = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let overview = await Overview.findOne({ userId });
    
    // If no overview exists, create one
    if (!overview) {
      overview = new Overview({
        userId,
        applicationStatus: 'not_started',
        progress: {
          percentage: 0,
          currentStep: 'personal'
        }
      });
      
      await overview.save();
    }
    
    res.status(200).json({
      success: true,
      overview
    });
    
  } catch (error) {
    console.error('❌ Error in getOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview data',
      error: error.message
    });
  }
};

// Update selected course
const updateSelectedCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const courseData = req.body;
    
    if (!courseData.programId || !courseData.programName) {
      return res.status(400).json({
        success: false,
        message: 'Program ID and name are required'
      });
    }
    
    const overview = await Overview.findOne({ userId });
    
    if (!overview) {
      return res.status(404).json({
        success: false,
        message: 'Overview not found'
      });
    }
    
    // Update course data
    overview.selectedCourse = {
      ...courseData,
      selectedAt: Date.now()
    };
    
    // Update steps to include course selection as completed
    const stepIndex = overview.steps.findIndex(step => step.stepId === 'courses');
    if (stepIndex !== -1) {
      overview.steps[stepIndex].completed = true;
      overview.steps[stepIndex].completedAt = Date.now();
    }
    
    await overview.save();
    
    res.status(200).json({
      success: true,
      message: 'Course selected successfully',
      overview
    });
    
  } catch (error) {
    console.error('❌ Error in updateSelectedCourse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course selection',
      error: error.message
    });
  }
};

// Update field completion status
const updateFieldCompletion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { section, field, isCompleted } = req.body;
    
    if (!section || !field) {
      return res.status(400).json({
        success: false,
        message: 'Section and field are required'
      });
    }
    
    const overview = await Overview.findOne({ userId });
    
    if (!overview) {
      return res.status(404).json({
        success: false,
        message: 'Overview not found'
      });
    }
    
    // Update the specific field
    if (overview.completedFields[section] && overview.completedFields[section][field] !== undefined) {
      overview.completedFields[section][field] = isCompleted;
      
      // Update step completion based on fields
      updateStepCompletion(overview, section);
      
      await overview.save();
      
      res.status(200).json({
        success: true,
        message: 'Field completion updated',
        overview
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid section or field'
      });
    }
    
  } catch (error) {
    console.error('❌ Error in updateFieldCompletion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update field completion',
      error: error.message
    });
  }
};

// Helper function to update step completion
const updateStepCompletion = (overview, section) => {
  const stepMapping = {
    personalInfo: 'personal',
    addressInfo: 'address',
    educationInfo: 'education',
    languageInfo: 'language'
  };
  
  const stepId = stepMapping[section];
  if (stepId) {
    const stepIndex = overview.steps.findIndex(step => step.stepId === stepId);
    if (stepIndex !== -1) {
      // Check if all fields in this section are completed
      const sectionFields = overview.completedFields[section];
      const allCompleted = Object.values(sectionFields).every(field => field === true);
      
      overview.steps[stepIndex].completed = allCompleted;
      if (allCompleted && !overview.steps[stepIndex].completedAt) {
        overview.steps[stepIndex].completedAt = Date.now();
      }
    }
  }
};

// Update current step
const updateCurrentStep = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { stepId } = req.body;
    
    if (!stepId) {
      return res.status(400).json({
        success: false,
        message: 'Step ID is required'
      });
    }
    
    const overview = await Overview.findOne({ userId });
    
    if (!overview) {
      return res.status(404).json({
        success: false,
        message: 'Overview not found'
      });
    }
    
    // Update current step
    overview.progress.currentStep = stepId;
    
    await overview.save();
    
    res.status(200).json({
      success: true,
      message: 'Current step updated',
      overview
    });
    
  } catch (error) {
    console.error('❌ Error in updateCurrentStep:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update current step',
      error: error.message
    });
  }
};

// Reset overview data
const resetOverview = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const overview = await Overview.findOne({ userId });
    
    if (!overview) {
      return res.status(404).json({
        success: false,
        message: 'Overview not found'
      });
    }
    
    // Reset all completion fields
    Object.keys(overview.completedFields.personalInfo).forEach(key => {
      overview.completedFields.personalInfo[key] = false;
    });
    
    Object.keys(overview.completedFields.addressInfo).forEach(key => {
      overview.completedFields.addressInfo[key] = false;
    });
    
    Object.keys(overview.completedFields.educationInfo).forEach(key => {
      overview.completedFields.educationInfo[key] = false;
    });
    
    Object.keys(overview.completedFields.languageInfo).forEach(key => {
      overview.completedFields.languageInfo[key] = false;
    });
    
    // Reset steps
    overview.steps.forEach(step => {
      step.completed = false;
      step.completedAt = null;
    });
    
    // Reset selected course
    overview.selectedCourse = null;
    
    // Reset progress
    overview.progress.percentage = 0;
    overview.progress.currentStep = 'personal';
    overview.applicationStatus = 'not_started';
    
    await overview.save();
    
    res.status(200).json({
      success: true,
      message: 'Overview reset successfully',
      overview
    });
    
  } catch (error) {
    console.error('❌ Error in resetOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset overview',
      error: error.message
    });
  }
};

// Get dashboard statistics (for admin)
const getDashboardStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const totalApplications = await Overview.countDocuments();
    const inProgress = await Overview.countDocuments({ applicationStatus: 'in_progress' });
    const completed = await Overview.countDocuments({ applicationStatus: 'completed' });
    const notStarted = await Overview.countDocuments({ applicationStatus: 'not_started' });
    
    // Get most popular courses
    const popularCourses = await Overview.aggregate([
      { $match: { 'selectedCourse.programId': { $exists: true } } },
      { $group: {
        _id: '$selectedCourse.programId',
        programName: { $first: '$selectedCourse.programName' },
        universityName: { $first: '$selectedCourse.universityName' },
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get completion rate statistics
    const completionStats = await Overview.aggregate([
      {
        $bucket: {
          groupBy: "$progress.percentage",
          boundaries: [0, 25, 50, 75, 100],
          default: "Other",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        byStatus: {
          notStarted,
          inProgress,
          completed
        },
        popularCourses,
        completionStats
      }
    });
    
  } catch (error) {
    console.error('❌ Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

export {
  getOverview,
  updateSelectedCourse,
  updateFieldCompletion,
  updateCurrentStep,
  resetOverview,
  getDashboardStats
};