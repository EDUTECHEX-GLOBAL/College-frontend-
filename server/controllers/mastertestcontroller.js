import mongoose from 'mongoose';
import MasterTest from '../models/mastertestmodel.js';

// 🎯 Allowed fields (IMPORTANT)
const allowedFields = [
  'ielts',
  'toefl',
  'pte',
  'gre',
  'gmat',
  'sat',
  'act',
  'duolingo'
];

/**
 * 📥 GET Test Scores
 */
export const getMasterTest = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const data = await MasterTest.findOne({ userId });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'No test data found'
      });
    }

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Get Master Test Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching test data'
    });
  }
};


/**
 * 💾 CREATE / UPDATE Test Scores
 */
export const saveMasterTest = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const requestData = req.body;

    // ✅ Filter only allowed test fields
    const filteredData = {};
    allowedFields.forEach(field => {
      if (requestData[field] !== undefined && requestData[field] !== '') {
        filteredData[field] = Number(requestData[field]);
      }
    });

    // ⚠️ If nothing selected → clear record
    if (Object.keys(filteredData).length === 0) {
      await MasterTest.findOneAndDelete({ userId });

      return res.status(200).json({
        success: true,
        message: 'All test data cleared'
      });
    }

    // 🔄 Upsert
    const updated = await MasterTest.findOneAndUpdate(
      { userId },
      filteredData,
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Test scores saved successfully',
      data: updated
    });

  } catch (error) {
    console.error('❌ Save Master Test Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving test data'
    });
  }
};