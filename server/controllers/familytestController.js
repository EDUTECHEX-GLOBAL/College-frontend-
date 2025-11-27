// controllers/familyController.js
import Family from '../models/familytestModel.js';

// Get family data for authenticated student
export const getFamilyData = async (req, res) => {
  try {
    const studentId = req.user.id;

    console.log('📥 Fetching family data for student:', studentId);

    let familyData = await Family.findOne({ studentId });

    // If no family record exists, create a default one
    if (!familyData) {
      console.log('📝 Creating new family record for student:', studentId);
      familyData = await Family.create({
        studentId,
        household: {},
        parent1: {},
        parent2: {},
        siblings: {
          siblingsList: []
        },
        familyCompletion: {
          household: false,
          parent1: false,
          parent2: false,
          sibling: false,
        },
      });
    }

    // Calculate completion progress
    const completionCount = Object.values(familyData.familyCompletion).filter(Boolean).length;
    const totalSections = 4;
    const familyProgress = Math.round((completionCount / totalSections) * 100);

    console.log('✅ Family data retrieved successfully');
    console.log('📊 Progress:', familyProgress + '%');

    res.status(200).json({
      success: true,
      family: familyData,
      familyProgress,
    });
  } catch (error) {
    console.error('❌ Error fetching family data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching family data',
      error: error.message,
    });
  }
};

// Update family data
export const updateFamilyData = async (req, res) => {
  try {
    const studentId = req.user.id;
    const familyData = req.body;

    console.log('💾 Updating family data for student:', studentId);

    const updatedFamily = await Family.findOneAndUpdate(
      { studentId },
      { $set: familyData },
      { new: true, upsert: true, runValidators: true }
    );

    // Calculate completion progress
    const completionCount = Object.values(updatedFamily.familyCompletion).filter(Boolean).length;
    const totalSections = 4;
    const familyProgress = Math.round((completionCount / totalSections) * 100);

    console.log('✅ Family data updated successfully');
    console.log('📊 New progress:', familyProgress + '%');

    res.status(200).json({
      success: true,
      message: 'Family data updated successfully',
      family: updatedFamily,
      progress: {
        family: familyProgress,
      },
    });
  } catch (error) {
    console.error('❌ Error updating family data:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating family data',
      error: error.message,
    });
  }
};
