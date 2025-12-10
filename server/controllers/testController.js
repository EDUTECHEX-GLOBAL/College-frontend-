// controllers/testController.js
import Testing from '../models/testModel.js';
import TransferStudent from '../models/transferModel.js';

/**
 * @desc    Get testing data for a student
 * @route   GET /api/testing
 * @access  Private
 */
export const getTestingData = async (req, res) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unable to determine student identity from token"
      });
    }

    console.log('📥 Fetching testing data for student:', studentId);

    // Validate student exists in TransferStudent collection
    const student = await TransferStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get or create testing data
    let testingData = await Testing.findOne({ studentId });

    if (!testingData) {
      testingData = await Testing.create({ studentId });
      console.log('✅ Created new testing document for student:', studentId);
    }

    return res.status(200).json({
      success: true,
      testing: testingData
    });

  } catch (error) {
    console.error('❌ Error fetching testing data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching testing data',
      error: error.message
    });
  }
};

/**
 * @desc    Update testing data for a student
 * @route   PUT /api/testing
 * @access  Private
 */
export const updateTestingData = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const testingData = req.body;

    console.log('📝 Updating testing data for student:', studentId);
    console.log('📦 Testing data received:', JSON.stringify(testingData, null, 2));

    // Validate student
    const student = await TransferStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update or create testing data
    const updatedTesting = await Testing.findOneAndUpdate(
      { studentId },
      { 
        ...testingData,
        studentId 
      },
      { 
        new: true,
        upsert: true,
        runValidators: true 
      }
    );

    console.log('✅ Testing data updated successfully');

    res.status(200).json({
      success: true,
      message: 'Testing data updated successfully',
      testing: updatedTesting
    });

  } catch (error) {
    console.error('❌ Error updating testing data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating testing data',
      error: error.message
    });
  }
};

/**
 * @desc    Delete specific test entry
 * @route   DELETE /api/testing/:testType/:index
 * @access  Private
 */
export const deleteTestEntry = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const { testType, index } = req.params;

    console.log(`🗑️ Deleting ${testType} entry at index ${index} for student:`, studentId);

    const testingData = await Testing.findOne({ studentId });

    if (!testingData) {
      return res.status(404).json({
        success: false,
        message: 'Testing data not found'
      });
    }

    const testArray = testingData[testType];

    if (testArray && testArray.length > index) {
      testArray.splice(index, 1);

      const countField = `${testType}Count`;
      if (testingData[countField] !== undefined) {
        testingData[countField] = testArray.length;
      }

      await testingData.save();

      console.log('✅ Test entry deleted successfully');

      return res.status(200).json({
        success: true,
        message: 'Test entry deleted successfully',
        testing: testingData
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Test entry not found'
    });

  } catch (error) {
    console.error('❌ Error deleting test entry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting test entry',
      error: error.message
    });
  }
};

/**
 * @desc    Get all testing data (Admin)
 * @route   GET /api/testing/all
 * @access  Private/Admin
 */
export const getAllTestingData = async (req, res) => {
  try {
    console.log('📥 Fetching all testing data');

    const allTestingData = await Testing.find()
      .populate('studentId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: allTestingData.length,
      testing: allTestingData
    });

  } catch (error) {
    console.error('❌ Error fetching all testing data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching all testing data',
      error: error.message
    });
  }
};

/**
 * @desc    Delete all testing data for a student
 * @route   DELETE /api/testing
 * @access  Private
 */
export const deleteAllTestingData = async (req, res) => {
  try {
    const studentId = req.user?.id;

    console.log('🗑️ Deleting all testing data for student:', studentId);

    await Testing.findOneAndDelete({ studentId });

    console.log('✅ All testing data deleted successfully');

    res.status(200).json({
      success: true,
      message: 'All testing data deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting testing data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting testing data',
      error: error.message
    });
  }
};

export default {
  getTestingData,
  updateTestingData,
  deleteTestEntry,
  getAllTestingData,
  deleteAllTestingData
};
