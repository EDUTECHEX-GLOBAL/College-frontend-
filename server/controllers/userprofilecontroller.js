// src/controllers/userprofilecontroller.js
import UserProfile from '../models/userprofilemodel.js';

// Helper function to process university data with courses
const processUniversityData = (uniData) => {
  if (!uniData) return null;

  const isKansas = uniData.INSTNM?.toLowerCase().includes('kansas') || false;
  const city = uniData.location?.city || uniData.CITY || '';
  const state = uniData.location?.state || uniData.STABBR || '';
  const locationStr = city + (city && state ? ', ' : '') + state;

  return {
    id: uniData.id || uniData.UNITID?.toString() || uniData._id?.toString(),
    unitid: uniData.UNITID,
    name: uniData.INSTNM || uniData.name || 'Unknown University',
    location: locationStr || uniData.location || 'Location not specified',
    city: city,
    state: state,
    country: uniData.location?.country || uniData.COUNTRY || 'USA',
    isKansas: isKansas,
    selectedCourses: uniData.selectedCourses || [],
    fullData: uniData.fullData || uniData
  };
};

// Create or update user profile
export const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const profileData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    console.log('📝 Creating/Updating profile for userId:', userId);
    console.log('📦 Profile data received keys:', Object.keys(profileData));

    // Process selected universities with courses
    if (profileData.selectedUniversities && Array.isArray(profileData.selectedUniversities)) {
      profileData.selectedUniversities = profileData.selectedUniversities.map(uni => {
        // If university has fullData, use it
        if (uni.fullData) {
          return processUniversityData({
            ...uni,
            ...uni.fullData,
            selectedCourses: uni.selectedCourses || []
          });
        }
        
        // If university is a simple object, process it directly
        return processUniversityData({
          ...uni,
          selectedCourses: uni.selectedCourses || []
        });
      });

      // Validate course counts
      for (const uni of profileData.selectedUniversities) {
        if (!uni.isKansas && (!uni.selectedCourses || uni.selectedCourses.length === 0)) {
          return res.status(400).json({
            success: false,
            message: `Please select at least one course for ${uni.name}`
          });
        }
        if (uni.selectedCourses && uni.selectedCourses.length > 2) {
          return res.status(400).json({
            success: false,
            message: `Maximum 2 courses can be selected for ${uni.name}`
          });
        }
      }
    }

    // Process selectedCourses map for backward compatibility
    if (profileData.selectedCourses && typeof profileData.selectedCourses === 'object') {
      // Ensure it's stored as a Map
      profileData.selectedCourses = new Map(Object.entries(profileData.selectedCourses));
    }

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

      console.log('✅ Profile updated successfully');
      
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

      console.log('✅ Profile created successfully');
      
      return res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        data: newProfile
      });
    }
  } catch (error) {
    console.error('❌ Error in createOrUpdateProfile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors
      });
    }

    // Handle custom validation errors
    if (error.message.includes('Please select at least one course')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Profile already exists for this user'
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

    // Convert to object and handle Maps
    const profileObj = profile.toObject();
    if (profileObj.selectedCourses) {
      profileObj.selectedCourses = Object.fromEntries(profileObj.selectedCourses);
    }

    console.log(`✅ Profile fetched for user: ${userId}`);
    console.log(`📚 Selected universities: ${profileObj.selectedUniversities?.length || 0}`);
    
    return res.status(200).json({
      success: true,
      data: profileObj
    });
  } catch (error) {
    console.error('❌ Error in getProfile:', error);
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

    // Convert to object and handle Maps
    const profileObj = profile.toObject();
    if (profileObj.selectedCourses) {
      profileObj.selectedCourses = Object.fromEntries(profileObj.selectedCourses);
    }

    console.log(`✅ Profile fetched for email: ${email}`);
    
    return res.status(200).json({
      success: true,
      data: profileObj
    });
  } catch (error) {
    console.error('❌ Error in getProfileByEmail:', error);
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
      { 
        profileImage, 
        lastUpdated: Date.now() 
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    console.log(`✅ Profile image updated for user: ${userId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('❌ Error in updateProfileImage:', error);
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

    console.log(`✅ Profile status checked for user: ${userId}`);
    
    return res.status(200).json({
      success: true,
      exists: !!profile,
      completed: profile ? profile.profileCompleted : false,
      data: profile ? {
        profileCompleted: profile.profileCompleted,
        completedAt: profile.completedAt,
        lastUpdated: profile.lastUpdated,
        selectedUniversitiesCount: profile.selectedUniversities?.length || 0
      } : null
    });
  } catch (error) {
    console.error('❌ Error in checkProfileStatus:', error);
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

    console.log(`✅ Profile deleted for user: ${userId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error in deleteProfile:', error);
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const profiles = await UserProfile.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Convert selectedCourses Maps to objects for JSON response
    const profilesObj = profiles.map(profile => {
      const prof = profile.toObject();
      if (prof.selectedCourses) {
        prof.selectedCourses = Object.fromEntries(prof.selectedCourses);
      }
      return prof;
    });

    const total = await UserProfile.countDocuments();

    console.log(`✅ Fetched ${profiles.length} profiles (page ${page} of ${Math.ceil(total / limit)})`);
    
    return res.status(200).json({
      success: true,
      data: profilesObj,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error in getAllProfiles:', error);
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

    // Convert selectedCourses Maps to objects for JSON response
    const profilesObj = profiles.map(profile => {
      const prof = profile.toObject();
      if (prof.selectedCourses) {
        prof.selectedCourses = Object.fromEntries(prof.selectedCourses);
      }
      return prof;
    });

    console.log(`✅ Found ${profiles.length} profiles for program: ${program}`);
    
    return res.status(200).json({
      success: true,
      count: profiles.length,
      data: profilesObj
    });
  } catch (error) {
    console.error('❌ Error in getProfilesByProgram:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profiles',
      error: error.message
    });
  }
};

// Get profile statistics with course data
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

    // Get university selection statistics
    const universitySelectionStats = await UserProfile.aggregate([
      { $unwind: '$selectedUniversities' },
      {
        $group: {
          _id: '$selectedUniversities.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get course selection statistics
    const courseSelectionStats = await UserProfile.aggregate([
      { $unwind: '$selectedUniversities' },
      { $unwind: '$selectedUniversities.selectedCourses' },
      {
        $group: {
          _id: '$selectedUniversities.selectedCourses.title',
          university: { $first: '$selectedUniversities.name' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const recentProfiles = await UserProfile.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('basicInfo.fullName basicInfo.email eligibleProgram selectedUniversities createdAt');

    console.log('✅ Profile statistics generated');
    
    return res.status(200).json({
      success: true,
      data: {
        total: totalProfiles,
        programStats,
        universitySelectionStats,
        courseSelectionStats,
        recentProfiles
      }
    });
  } catch (error) {
    console.error('❌ Error in getProfileStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile statistics',
      error: error.message
    });
  }
};

// Bulk update profiles (admin only)
export const bulkUpdateProfiles = async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be an array'
      });
    }

    const results = [];
    for (const update of updates) {
      const { userId, ...updateData } = update;
      
      const profile = await UserProfile.findOneAndUpdate(
        { userId },
        { ...updateData, lastUpdated: Date.now() },
        { new: true }
      );
      
      results.push({
        userId,
        success: !!profile,
        data: profile
      });
    }

    console.log(`✅ Bulk updated ${results.filter(r => r.success).length} profiles`);
    
    return res.status(200).json({
      success: true,
      message: 'Bulk update completed',
      data: results
    });
  } catch (error) {
    console.error('❌ Error in bulkUpdateProfiles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to bulk update profiles',
      error: error.message
    });
  }
};

// Get profile with courses (detailed view)
export const getProfileWithCourses = async (req, res) => {
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

    // Convert to object
    const profileObj = profile.toObject();
    if (profileObj.selectedCourses) {
      profileObj.selectedCourses = Object.fromEntries(profileObj.selectedCourses);
    }

    // Group courses by university for easier frontend consumption
    const coursesByUniversity = {};
    for (const uni of profileObj.selectedUniversities || []) {
      if (uni.selectedCourses && uni.selectedCourses.length > 0) {
        coursesByUniversity[uni.name] = uni.selectedCourses;
      }
    }

    console.log(`✅ Profile with courses fetched for user: ${userId}`);
    
    return res.status(200).json({
      success: true,
      data: {
        ...profileObj,
        coursesByUniversity
      }
    });
  } catch (error) {
    console.error('❌ Error in getProfileWithCourses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile with courses',
      error: error.message
    });
  }
};

// Export all functions
export default {
  createOrUpdateProfile,
  getProfile,
  getProfileByEmail,
  updateProfileImage,
  checkProfileStatus,
  deleteProfile,
  getAllProfiles,
  getProfilesByProgram,
  getProfileStats,
  bulkUpdateProfiles,
  getProfileWithCourses
};