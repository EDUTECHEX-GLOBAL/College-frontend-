// src/controllers/userprofilecontroller.js
import UserProfile from '../models/userprofilemodel.js';

// Create or update user profile
export const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.userId; // From your auth middleware
    const profileData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    console.log('Creating/Updating profile for userId:', userId);
    console.log('Profile data received:', JSON.stringify(profileData, null, 2));

    // Check if profile already exists
    let profile = await UserProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile = await UserProfile.findOneAndUpdate(
        { userId },
        {
          ...profileData,
          lastUpdated: Date.now()
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile
      });
    } else {
      // Create new profile
      const newProfile = new UserProfile({
        userId,
        ...profileData
      });

      await newProfile.save();

      return res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        data: newProfile
      });
    }
  } catch (error) {
    console.error('Error in createOrUpdateProfile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to save profile',
      error: error.message
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Get profile by email (for admin or verification)
export const getProfileByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const profile = await UserProfile.findOne({ 'basicInfo.email': email });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error in getProfileByEmail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update profile image
export const updateProfileImage = async (req, res) => {
  try {
    const userId = req.userId;
    const { profileImage } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { profileImage, lastUpdated: Date.now() },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error in updateProfileImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile image',
      error: error.message
    });
  }
};

// Check if profile exists
export const checkProfileStatus = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    const profile = await UserProfile.findOne({ userId });

    return res.status(200).json({
      success: true,
      exists: !!profile,
      completed: profile ? profile.profileCompleted : false,
      data: profile ? {
        profileCompleted: profile.profileCompleted,
        completedAt: profile.completedAt,
        lastUpdated: profile.lastUpdated
      } : null
    });
  } catch (error) {
    console.error('Error in checkProfileStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check profile status',
      error: error.message
    });
  }
};

// Delete profile
export const deleteProfile = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    const profile = await UserProfile.findOneAndDelete({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete profile',
      error: error.message
    });
  }
};

// Get all profiles (admin only)
export const getAllProfiles = async (req, res) => {
  try {
    // You can add role check here if needed from req.user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const profiles = await UserProfile.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await UserProfile.countDocuments();

    return res.status(200).json({
      success: true,
      data: profiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllProfiles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profiles',
      error: error.message
    });
  }
};

// Get profiles by eligibility program
export const getProfilesByProgram = async (req, res) => {
  try {
    const { program } = req.params;
    
    if (!['Bachelor', 'Master', 'PhD'].includes(program)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid program. Must be Bachelor, Master, or PhD'
      });
    }

    const profiles = await UserProfile.find({ eligibleProgram: program });

    return res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles
    });
  } catch (error) {
    console.error('Error in getProfilesByProgram:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profiles',
      error: error.message
    });
  }
};

// Get profile statistics
export const getProfileStats = async (req, res) => {
  try {
    const totalProfiles = await UserProfile.countDocuments();
    
    const programStats = await UserProfile.aggregate([
      {
        $group: {
          _id: '$eligibleProgram',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentProfiles = await UserProfile.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('basicInfo.fullName basicInfo.email eligibleProgram createdAt');

    return res.status(200).json({
      success: true,
      data: {
        total: totalProfiles,
        programStats,
        recentProfiles
      }
    });
  } catch (error) {
    console.error('Error in getProfileStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile statistics',
      error: error.message
    });
  }
};