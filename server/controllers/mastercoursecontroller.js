import mongoose from 'mongoose';
import MasterCourse from '../models/mastercoursemodel.js';

/**
 * 📥 GET Master Course Data (for logged-in user)
 */
export const getMasterCourse = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing user ID'
      });
    }

    const data = await MasterCourse.findOne({ userId });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'No course data found'
      });
    }

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Get Master Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course data'
    });
  }
};


/**
 * 💾 CREATE or UPDATE Master Course Data
 */
export const saveMasterCourse = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing user ID'
      });
    }

    const {
      preferredCourse,
      specialization,
      intake,
      modeOfStudy
    } = req.body;

    // ✅ Validation
    if (!preferredCourse || !intake || !modeOfStudy) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    // 🔄 Upsert (update if exists, else create)
    const updated = await MasterCourse.findOneAndUpdate(
      { userId },
      {
        preferredCourse,
        specialization,
        intake,
        modeOfStudy
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Course data saved successfully',
      data: updated
    });

  } catch (error) {
    console.error('❌ Save Master Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving course data'
    });
  }
};