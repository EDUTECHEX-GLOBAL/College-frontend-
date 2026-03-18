// src/controllers/userprofilecontroller.js
import UserProfile from '../models/userprofilemodel.js';
import { createUniversityRequestNotification } from './notificationController.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: process a single university from the request body
// ─────────────────────────────────────────────────────────────────────────────
const processUniversityData = (uniData) => {
  if (!uniData) return null;

  // ✅ A university needs NO courses when ANY of these is true:
  //    1. isKansas flag set explicitly
  //    2. isDirectApply flag set explicitly  ← was missing before
  //    3. Name contains "kansas"
  const isKansas = (
    uniData.isKansas      === true ||
    uniData.isDirectApply === true ||
    (uniData.INSTNM || '').toLowerCase().includes('kansas') ||
    (uniData.name   || '').toLowerCase().includes('kansas')
  );

  const city  = uniData.city  || uniData.CITY  || uniData.location?.city  || '';
  const state = uniData.state || uniData.STABBR || uniData.location?.state || '';

  const locationStr = uniData.location && typeof uniData.location === 'string'
    ? uniData.location
    : city + (city && state ? ', ' : '') + state;

  const rawCourses = uniData.selectedCourses || [];
  const processedCourses = rawCourses.map(c => ({
    id:           c.id           || `course-${Date.now()}-${Math.random()}`,
    title:        c.title        || c.program_name || 'Program',
    program_name: c.program_name || c.title        || '',
    level:        c.level        || '',
    studyMode:    c.studyMode    || '',
    duration:     c.duration     || '',
    locations:    Array.isArray(c.locations) ? c.locations : [],
    majorArea:    c.majorArea    || '',
    description:  c.description  || '',
    credits:      c.credits      || null,
    fees:         c.fees         || '',
  }));

  return {
    id:           uniData.id     || uniData.UNITID?.toString() || uniData._id?.toString() || '',
    unitid:       uniData.unitid || uniData.UNITID || null,
    name:         uniData.name   || uniData.INSTNM || 'Unknown University',
    location:     locationStr    || 'Location not specified',
    city,
    state,
    country:      uniData.country || uniData.COUNTRY || uniData.location?.country || 'USA',
    isKansas,          // ✅ true for Kansas AND any direct-apply university
    isDirectApply: isKansas,  // keep both flags in sync
    selectedCourses: processedCourses,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE OR UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const profileData = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID not found in token' });
    }

    console.log('📝 Creating/Updating profile for userId:', userId);
    console.log('📦 Profile data keys:', Object.keys(profileData));

    if (!profileData.basicInfo)
      return res.status(400).json({ success: false, message: 'basicInfo is required' });
    if (!profileData.education)
      return res.status(400).json({ success: false, message: 'education is required' });
    if (!profileData.eligibleProgram)
      return res.status(400).json({ success: false, message: 'eligibleProgram is required' });
    if (!['Bachelor', 'Master', 'PhD'].includes(profileData.eligibleProgram))
      return res.status(400).json({ success: false, message: `Invalid eligibleProgram: "${profileData.eligibleProgram}"` });
    if (!profileData.selectedUniversities || !Array.isArray(profileData.selectedUniversities))
      return res.status(400).json({ success: false, message: 'selectedUniversities must be an array' });
    if (profileData.selectedUniversities.length < 3 || profileData.selectedUniversities.length > 5)
      return res.status(400).json({ success: false, message: `Please select between 3 and 5 universities (received ${profileData.selectedUniversities.length})` });

    const processedUniversities = [];
    for (const uni of profileData.selectedUniversities) {
      const processed = processUniversityData(uni);

      if (!processed)
        return res.status(400).json({ success: false, message: 'Invalid university data in selectedUniversities' });
      if (!processed.id)
        return res.status(400).json({ success: false, message: `University "${processed.name}" is missing an id` });
      if (!processed.name || processed.name === 'Unknown University')
        return res.status(400).json({ success: false, message: 'University name is required' });

      // ✅ Only require courses for non-direct-apply universities
      if (!processed.isKansas && processed.selectedCourses.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Please select at least one course for ${processed.name}`,
        });
      }
      if (processed.selectedCourses.length > 2) {
        return res.status(400).json({
          success: false,
          message: `Maximum 2 courses can be selected for ${processed.name}`,
        });
      }

      processedUniversities.push(processed);
    }

    profileData.selectedUniversities = processedUniversities;
    delete profileData.fullData;

    if (profileData.selectedCourses && typeof profileData.selectedCourses === 'object' && !Array.isArray(profileData.selectedCourses)) {
      profileData.selectedCourses = new Map(Object.entries(profileData.selectedCourses));
    } else {
      profileData.selectedCourses = new Map();
    }

    let profile = await UserProfile.findOne({ userId });

    if (profile) {
      profile = await UserProfile.findOneAndUpdate(
        { userId },
        { ...profileData, lastUpdated: Date.now() },
        { new: true, runValidators: false }
      );
      console.log('✅ Profile updated successfully for:', userId);
      return res.status(200).json({ success: true, message: 'Profile updated successfully', data: profile });
    } else {
      const newProfile = new UserProfile({ userId, ...profileData });
      await newProfile.save();
      console.log('✅ Profile created successfully for:', userId);
      return res.status(201).json({ success: true, message: 'Profile created successfully', data: newProfile });
    }
  } catch (error) {
    console.error('❌ Error in createOrUpdateProfile:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors });
    }
    if (error.message?.includes('Please select'))
      return res.status(400).json({ success: false, message: error.message });
    if (error.code === 11000)
      return res.status(409).json({ success: false, message: 'Profile already exists for this user' });
    return res.status(500).json({ success: false, message: 'Failed to save profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: 'User ID not found in token' });

    const profile = await UserProfile.findOne({ userId });
    if (!profile)
      return res.status(404).json({ success: false, message: 'Profile not found' });

    const profileObj = profile.toObject();
    if (profileObj.selectedCourses instanceof Map || profileObj.selectedCourses) {
      try { profileObj.selectedCourses = Object.fromEntries(profileObj.selectedCourses); }
      catch { profileObj.selectedCourses = {}; }
    }

    console.log(`✅ Profile fetched for user: ${userId}`);
    console.log(`📚 Selected universities: ${profileObj.selectedUniversities?.length || 0}`);
    return res.status(200).json({ success: true, data: profileObj });
  } catch (error) {
    console.error('❌ Error in getProfile:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE BY EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export const getProfileByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const profile = await UserProfile.findOne({ 'basicInfo.email': email });
    if (!profile)
      return res.status(404).json({ success: false, message: 'Profile not found' });

    const profileObj = profile.toObject();
    if (profileObj.selectedCourses) {
      try { profileObj.selectedCourses = Object.fromEntries(profileObj.selectedCourses); }
      catch { profileObj.selectedCourses = {}; }
    }
    return res.status(200).json({ success: true, data: profileObj });
  } catch (error) {
    console.error('❌ Error in getProfileByEmail:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE IMAGE
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfileImage = async (req, res) => {
  try {
    const userId = req.userId;
    const { profileImage } = req.body;
    if (!userId)       return res.status(401).json({ success: false, message: 'User ID not found in token' });
    if (!profileImage) return res.status(400).json({ success: false, message: 'profileImage is required' });

    const profile = await UserProfile.findOneAndUpdate(
      { userId }, { profileImage, lastUpdated: Date.now() }, { new: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    return res.status(200).json({ success: true, message: 'Profile image updated successfully', data: profile });
  } catch (error) {
    console.error('❌ Error in updateProfileImage:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile image', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHECK PROFILE STATUS
// ─────────────────────────────────────────────────────────────────────────────
export const checkProfileStatus = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'User ID not found in token' });

    const profile = await UserProfile.findOne({ userId });
    return res.status(200).json({
      success: true,
      exists:    !!profile,
      completed: profile ? profile.profileCompleted : false,
      data: profile ? {
        profileCompleted:          profile.profileCompleted,
        completedAt:               profile.completedAt,
        lastUpdated:               profile.lastUpdated,
        selectedUniversitiesCount: profile.selectedUniversities?.length || 0,
      } : null,
    });
  } catch (error) {
    console.error('❌ Error in checkProfileStatus:', error);
    return res.status(500).json({ success: false, message: 'Failed to check profile status', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'User ID not found in token' });

    const profile = await UserProfile.findOneAndDelete({ userId });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    return res.status(200).json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('❌ Error in deleteProfile:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PROFILES (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllProfiles = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const profiles = await UserProfile.find().skip(skip).limit(limit).sort({ createdAt: -1 });
    const profilesObj = profiles.map(p => {
      const prof = p.toObject();
      if (prof.selectedCourses) {
        try { prof.selectedCourses = Object.fromEntries(prof.selectedCourses); }
        catch { prof.selectedCourses = {}; }
      }
      return prof;
    });

    const total = await UserProfile.countDocuments();
    return res.status(200).json({
      success: true, data: profilesObj,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('❌ Error in getAllProfiles:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profiles', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILES BY PROGRAM (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getProfilesByProgram = async (req, res) => {
  try {
    const { program } = req.params;
    if (!['Bachelor', 'Master', 'PhD'].includes(program))
      return res.status(400).json({ success: false, message: 'Invalid program' });

    const profiles = await UserProfile.find({ eligibleProgram: program });
    const profilesObj = profiles.map(p => {
      const prof = p.toObject();
      if (prof.selectedCourses) {
        try { prof.selectedCourses = Object.fromEntries(prof.selectedCourses); }
        catch { prof.selectedCourses = {}; }
      }
      return prof;
    });
    return res.status(200).json({ success: true, count: profiles.length, data: profilesObj });
  } catch (error) {
    console.error('❌ Error in getProfilesByProgram:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profiles', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE STATS (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getProfileStats = async (req, res) => {
  try {
    const totalProfiles = await UserProfile.countDocuments();
    const programStats = await UserProfile.aggregate([{ $group: { _id: '$eligibleProgram', count: { $sum: 1 } } }]);
    const universitySelectionStats = await UserProfile.aggregate([
      { $unwind: '$selectedUniversities' },
      { $group: { _id: '$selectedUniversities.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ]);
    const courseSelectionStats = await UserProfile.aggregate([
      { $unwind: '$selectedUniversities' },
      { $unwind: '$selectedUniversities.selectedCourses' },
      { $group: { _id: '$selectedUniversities.selectedCourses.title', university: { $first: '$selectedUniversities.name' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ]);
    const recentProfiles = await UserProfile.find()
      .sort({ createdAt: -1 }).limit(5)
      .select('basicInfo.fullName basicInfo.email eligibleProgram selectedUniversities createdAt');

    return res.status(200).json({
      success: true,
      data: { total: totalProfiles, programStats, universitySelectionStats, courseSelectionStats, recentProfiles },
    });
  } catch (error) {
    console.error('❌ Error in getProfileStats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile statistics', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK UPDATE PROFILES (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const bulkUpdateProfiles = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates))
      return res.status(400).json({ success: false, message: 'Updates must be an array' });

    const results = [];
    for (const update of updates) {
      const { userId, ...updateData } = update;
      const profile = await UserProfile.findOneAndUpdate(
        { userId }, { ...updateData, lastUpdated: Date.now() }, { new: true }
      );
      results.push({ userId, success: !!profile, data: profile });
    }
    return res.status(200).json({ success: true, message: 'Bulk update completed', data: results });
  } catch (error) {
    console.error('❌ Error in bulkUpdateProfiles:', error);
    return res.status(500).json({ success: false, message: 'Failed to bulk update profiles', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE WITH COURSES
// ─────────────────────────────────────────────────────────────────────────────
export const getProfileWithCourses = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'User ID not found in token' });

    const profile = await UserProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const profileObj = profile.toObject();
    if (profileObj.selectedCourses) {
      try { profileObj.selectedCourses = Object.fromEntries(profileObj.selectedCourses); }
      catch { profileObj.selectedCourses = {}; }
    }

    const coursesByUniversity = {};
    for (const uni of profileObj.selectedUniversities || []) {
      if (uni.selectedCourses?.length > 0)
        coursesByUniversity[uni.name] = uni.selectedCourses;
    }

    return res.status(200).json({ success: true, data: { ...profileObj, coursesByUniversity } });
  } catch (error) {
    console.error('❌ Error in getProfileWithCourses:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile with courses', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT UNIVERSITY REQUEST
// ─────────────────────────────────────────────────────────────────────────────
export const submitUniversityRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { universityName, country, interestedCourses } = req.body;

    if (!userId)                return res.status(401).json({ success: false, message: 'User ID not found in token' });
    if (!universityName?.trim()) return res.status(400).json({ success: false, message: 'University name is required' });
    if (!country?.trim())        return res.status(400).json({ success: false, message: 'Country is required' });
    if (!Array.isArray(interestedCourses) || interestedCourses.length === 0)
      return res.status(400).json({ success: false, message: 'Please provide at least one course of interest' });
    if (interestedCourses.length > 5)
      return res.status(400).json({ success: false, message: 'Maximum 5 courses allowed' });

    await createUniversityRequestNotification({
      userId,
      universityName: universityName.trim(),
      country:        country.trim(),
      courses:        interestedCourses,
    });

    return res.status(201).json({
      success: true,
      message: 'University request submitted successfully. Our team will review it shortly.',
    });
  } catch (error) {
    console.error('❌ Error in submitUniversityRequest:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit university request', error: error.message });
  }
};

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
  getProfileWithCourses,
  submitUniversityRequest,
};