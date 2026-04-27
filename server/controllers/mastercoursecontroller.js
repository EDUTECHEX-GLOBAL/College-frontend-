import mongoose from 'mongoose';
import MasterCourse from '../models/mastercoursemodel.js';

/**
 * 📥 GET Master Course Data (for logged-in user)
 */
export const getMasterCourse = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id; // ✅ support both patterns

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing user ID'
      });
    }

    const data = await MasterCourse.findOne({ userId });

    // ✅ Instead of 404, return empty (better for frontend UX)
    if (!data) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Get Master Course Error:', error);
    return res.status(500).json({
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
    const userId = req.userId || req.user?.id; // ✅ support both middleware styles

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing user ID'
      });
    }

    let {
      preferredCourse,
      specialization,
      intake,
      modeOfStudy
    } = req.body;

    // ✅ Normalize inputs (avoid empty string issues)
    preferredCourse = preferredCourse?.trim();
    specialization  = specialization?.trim() || '';
    intake          = intake?.trim();
    modeOfStudy     = modeOfStudy?.trim();

    // ✅ Strong validation
    if (!preferredCourse || !intake || !modeOfStudy) {
      return res.status(400).json({
        success: false,
        message: 'Preferred course, intake, and mode of study are required'
      });
    }

    // 🔒 Allowed values (extra safety)
    const validIntakes = ['Fall', 'Spring', 'Summer'];
    const validModes   = ['Full-time', 'Part-time', 'Online', 'Hybrid'];

    if (!validIntakes.includes(intake)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid intake value'
      });
    }

    if (!validModes.includes(modeOfStudy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mode of study'
      });
    }

    // 🔄 Upsert (update or create)
    const updated = await MasterCourse.findOneAndUpdate(
      { userId }, // 🔒 ensures one record per user
      {
        userId, // ✅ always store userId
        preferredCourse,
        specialization,
        intake,
        modeOfStudy
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Course data saved successfully',
      data: updated
    });

  } catch (error) {
    console.error('❌ Save Master Course Error:', error);

    // ✅ Handle duplicate key error safely
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry detected for this user'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while saving course data'
    });
  }
};