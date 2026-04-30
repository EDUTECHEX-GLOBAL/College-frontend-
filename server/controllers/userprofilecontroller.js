// src/controllers/userprofilecontroller.js
import UserProfile from '../models/userprofilemodel.js';
import { createUniversityRequestNotification } from './notificationController.js';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPER: fix Map → plain object for selectedCourses at ALL levels
// ─────────────────────────────────────────────────────────────────────────────
export const fixCoursesOnProfile = (profileObj) => {
  if (profileObj.selectedCourses) {
    try { profileObj.selectedCourses = Object.fromEntries(profileObj.selectedCourses); }
    catch { profileObj.selectedCourses = {}; }
  }

  if (Array.isArray(profileObj.selectedUniversities)) {
    profileObj.selectedUniversities = profileObj.selectedUniversities.map((uni) => {
      if (uni.selectedCourses && !Array.isArray(uni.selectedCourses)) {
        try {
          uni.selectedCourses = Object.values(Object.fromEntries(uni.selectedCourses));
        } catch {
          uni.selectedCourses = [];
        }
      }
      return uni;
    });
  }

  return profileObj;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: process a single university from the request body
// ─────────────────────────────────────────────────────────────────────────────
const processUniversityData = (uniData) => {
  if (!uniData) return null;

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
    id:            uniData.id     || uniData.UNITID?.toString() || uniData._id?.toString() || '',
    unitid:        uniData.unitid || uniData.UNITID || null,
    name:          uniData.name   || uniData.INSTNM || 'Unknown University',
    location:      locationStr    || 'Location not specified',
    city,
    state,
    country:       uniData.country || uniData.COUNTRY || uniData.location?.country || 'USA',
    isKansas,
    isDirectApply: isKansas,
    selectedCourses: processedCourses,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: validate and sanitise selectedSegment from request body
// ─────────────────────────────────────────────────────────────────────────────
const processSegmentData = (segmentData) => {
  if (!segmentData) return null;

  const id   = (segmentData.id   || '').toString().trim();
  const name = (segmentData.name || '').toString().trim();

  if (!id || !name) return null;

  return { id, name };
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE OR UPDATE PROFILE
// POST /api/user/profile
// ─────────────────────────────────────────────────────────────────────────────
export const createOrUpdateProfile = async (req, res) => {
  try {
    const userId      = req.userId;
    const profileData = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: 'User ID not found in token' });

    console.log('📝 Creating/Updating profile for userId:', userId);
    console.log('📦 Profile data keys:', Object.keys(profileData));

    // ── Required field checks ──────────────────────────────────────────────
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

    // ── Process universities ───────────────────────────────────────────────
    const processedUniversities = [];
    for (const uni of profileData.selectedUniversities) {
      const processed = processUniversityData(uni);

      if (!processed)
        return res.status(400).json({ success: false, message: 'Invalid university data in selectedUniversities' });
      if (!processed.id)
        return res.status(400).json({ success: false, message: `University "${processed.name}" is missing an id` });
      if (!processed.name || processed.name === 'Unknown University')
        return res.status(400).json({ success: false, message: 'University name is required' });
      if (!processed.isKansas && processed.selectedCourses.length === 0)
        return res.status(400).json({ success: false, message: `Please select at least one course for ${processed.name}` });
      if (processed.selectedCourses.length > 2)
        return res.status(400).json({ success: false, message: `Maximum 2 courses can be selected for ${processed.name}` });

      processedUniversities.push(processed);
    }

    profileData.selectedUniversities = processedUniversities;

    // ── Process selectedSegment (optional) ────────────────────────────────
    const processedSegment = processSegmentData(profileData.selectedSegment);
    profileData.selectedSegment = processedSegment;

    if (processedSegment) {
      console.log(`🎯 Segment saved: [${processedSegment.id}] ${processedSegment.name}`);
      console.log(`📖 Field of study: ${profileData.education?.field || 'N/A'}`);
    }

    // ── Cleanup ───────────────────────────────────────────────────────────
    delete profileData.fullData;

    if (
      profileData.selectedCourses &&
      typeof profileData.selectedCourses === 'object' &&
      !Array.isArray(profileData.selectedCourses)
    ) {
      profileData.selectedCourses = new Map(Object.entries(profileData.selectedCourses));
    } else {
      profileData.selectedCourses = new Map();
    }

    // ── Upsert ────────────────────────────────────────────────────────────
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
// GET PROFILE  (student — own profile)
// GET /api/user/profile
//
// FIX: Previously returned HTTP 404 when no profile existed yet, which the
//      frontend treated as an error. Now returns HTTP 200 with
//      { success: false, exists: false } so new users land on the profile
//      creation form instead of seeing an error banner.
// ─────────────────────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: 'User ID not found in token' });

    const profile = await UserProfile.findOne({ userId });

    // ── New user: no profile yet — return a clean "not found" at HTTP 200
    //    so the frontend can simply check res.data.exists === false and show
    //    the creation form rather than treating it as a network error.
    if (!profile) {
      console.log(`ℹ️  No profile found for user: ${userId} (new user)`);
      return res.status(200).json({
        success: false,
        exists:  false,
        message: 'Profile not found — please complete your profile',
        data:    null,
      });
    }

    const profileObj = fixCoursesOnProfile(profile.toObject());

    console.log(`✅ Profile fetched for user: ${userId}`);
    console.log(`📚 Selected universities: ${profileObj.selectedUniversities?.length || 0}`);
    console.log(`🎯 Segment: ${profileObj.selectedSegment?.name || 'None'}`);
    console.log(`📖 Field: ${profileObj.education?.field || 'None'}`);

    return res.status(200).json({ success: true, exists: true, data: profileObj });
  } catch (error) {
    console.error('❌ Error in getProfile:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE BY EMAIL
// GET /api/user/profile/email/:email
// ─────────────────────────────────────────────────────────────────────────────
export const getProfileByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const profile = await UserProfile.findOne({ 'basicInfo.email': email });
    if (!profile)
      return res.status(404).json({ success: false, message: 'Profile not found' });

    return res.status(200).json({ success: true, data: fixCoursesOnProfile(profile.toObject()) });
  } catch (error) {
    console.error('❌ Error in getProfileByEmail:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE IMAGE
// PATCH /api/user/profile/image
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfileImage = async (req, res) => {
  try {
    const userId = req.userId;
    const { profileImage } = req.body;
    if (!userId)       return res.status(401).json({ success: false, message: 'User ID not found in token' });
    if (!profileImage) return res.status(400).json({ success: false, message: 'profileImage is required' });

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { profileImage, lastUpdated: Date.now() },
      { new: true }
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
// GET /api/user/profile/status
// ─────────────────────────────────────────────────────────────────────────────
export const checkProfileStatus = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'User ID not found in token' });

    const profile = await UserProfile.findOne({ userId });
    return res.status(200).json({
      success:   true,
      exists:    !!profile,
      completed: profile ? profile.profileCompleted : false,
      data: profile ? {
        profileCompleted:          profile.profileCompleted,
        completedAt:               profile.completedAt,
        lastUpdated:               profile.lastUpdated,
        selectedUniversitiesCount: profile.selectedUniversities?.length || 0,
        selectedSegment:           profile.selectedSegment || null,
        fieldOfStudy:              profile.education?.field || null,
      } : null,
    });
  } catch (error) {
    console.error('❌ Error in checkProfileStatus:', error);
    return res.status(500).json({ success: false, message: 'Failed to check profile status', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE PROFILE
// DELETE /api/user/profile
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
// GET ALL PROFILES  (admin)
// GET /api/user/admin/profiles
// ─────────────────────────────────────────────────────────────────────────────
export const getAllProfiles = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const query = {};
    if (req.query.segment) query['selectedSegment.id'] = req.query.segment;
    if (req.query.program) {
      if (!['Bachelor', 'Master', 'PhD'].includes(req.query.program))
        return res.status(400).json({ success: false, message: 'Invalid program. Use Bachelor, Master or PhD.' });
      query.eligibleProgram = req.query.program;
    }

    const [profiles, total] = await Promise.all([
      UserProfile.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      UserProfile.countDocuments(query),
    ]);

    const profilesObj = profiles.map(fixCoursesOnProfile);

    return res.status(200).json({
      success: true,
      data: profilesObj,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('❌ Error in getAllProfiles:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profiles', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILES BY PROGRAM  (admin)
// GET /api/user/admin/profiles/program/:program
// ─────────────────────────────────────────────────────────────────────────────
export const getProfilesByProgram = async (req, res) => {
  try {
    const { program } = req.params;
    if (!['Bachelor', 'Master', 'PhD'].includes(program))
      return res.status(400).json({ success: false, message: 'Invalid program' });

    const profiles = await UserProfile.find({ eligibleProgram: program }).lean();
    return res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles.map(fixCoursesOnProfile),
    });
  } catch (error) {
    console.error('❌ Error in getProfilesByProgram:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profiles', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILES BY SEGMENT  (admin)
// GET /api/user/admin/profiles/segment/:segmentId
// ─────────────────────────────────────────────────────────────────────────────
export const getProfilesBySegment = async (req, res) => {
  try {
    const { segmentId } = req.params;
    if (!segmentId)
      return res.status(400).json({ success: false, message: 'segmentId is required' });

    const profiles = await UserProfile.find({ 'selectedSegment.id': segmentId }).lean();
    return res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles.map(fixCoursesOnProfile),
    });
  } catch (error) {
    console.error('❌ Error in getProfilesBySegment:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profiles by segment', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE STATS  (admin)
// GET /api/user/admin/stats
// ─────────────────────────────────────────────────────────────────────────────
export const getProfileStats = async (req, res) => {
  try {
    const [
      totalProfiles,
      programStats,
      segmentStats,
      fieldStats,
      universitySelectionStats,
      courseSelectionStats,
      recentProfiles,
    ] = await Promise.all([

      UserProfile.countDocuments(),

      UserProfile.aggregate([
        { $group: { _id: '$eligibleProgram', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      UserProfile.aggregate([
        { $match: { selectedSegment: { $ne: null } } },
        {
          $group: {
            _id:   '$selectedSegment.id',
            name:  { $first: '$selectedSegment.name' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      UserProfile.aggregate([
        { $match: { 'education.field': { $exists: true, $ne: '' } } },
        { $group: { _id: '$education.field', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      UserProfile.aggregate([
        { $unwind: '$selectedUniversities' },
        { $group: { _id: '$selectedUniversities.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      UserProfile.aggregate([
        { $unwind: '$selectedUniversities' },
        { $unwind: '$selectedUniversities.selectedCourses' },
        {
          $group: {
            _id:        '$selectedUniversities.selectedCourses.title',
            university: { $first: '$selectedUniversities.name' },
            count:      { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      UserProfile.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('basicInfo.fullName basicInfo.email eligibleProgram selectedSegment education.field selectedUniversities createdAt')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total: totalProfiles,
        programStats,
        segmentStats,
        fieldStats,
        universitySelectionStats,
        courseSelectionStats,
        recentProfiles,
      },
    });
  } catch (error) {
    console.error('❌ Error in getProfileStats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile statistics', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK UPDATE PROFILES  (admin)
// PUT /api/user/admin/profiles/bulk
// ─────────────────────────────────────────────────────────────────────────────
export const bulkUpdateProfiles = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates))
      return res.status(400).json({ success: false, message: 'Updates must be an array' });

    const results = await Promise.all(
      updates.map(async ({ userId, ...updateData }) => {
        const profile = await UserProfile.findOneAndUpdate(
          { userId },
          { ...updateData, lastUpdated: Date.now() },
          { new: true }
        );
        return { userId, success: !!profile, data: profile };
      })
    );

    return res.status(200).json({ success: true, message: 'Bulk update completed', data: results });
  } catch (error) {
    console.error('❌ Error in bulkUpdateProfiles:', error);
    return res.status(500).json({ success: false, message: 'Failed to bulk update profiles', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE WITH COURSES
// GET /api/user/profile/courses
// ─────────────────────────────────────────────────────────────────────────────
export const getProfileWithCourses = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'User ID not found in token' });

    const profile = await UserProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const profileObj = fixCoursesOnProfile(profile.toObject());

    const coursesByUniversity = {};
    for (const uni of profileObj.selectedUniversities || []) {
      if (uni.selectedCourses?.length > 0)
        coursesByUniversity[uni.name] = uni.selectedCourses;
    }

    return res.status(200).json({
      success: true,
      data: { ...profileObj, coursesByUniversity },
    });
  } catch (error) {
    console.error('❌ Error in getProfileWithCourses:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile with courses', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE FOR ANALYTICS  (admin)
// GET /api/user/analytics/profile/:userId
// ─────────────────────────────────────────────────────────────────────────────
export const getProfileForAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId)
      return res.status(400).json({ success: false, message: 'userId param is required' });

    const profile = await UserProfile.findOne({ userId }).lean();
    if (!profile)
      return res.status(404).json({ success: false, message: 'Profile not found' });

    return res.status(200).json({ success: true, data: fixCoursesOnProfile(profile) });
  } catch (error) {
    console.error('❌ Error in getProfileForAnalytics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT UNIVERSITY REQUEST
// POST /api/user/university/request
// ─────────────────────────────────────────────────────────────────────────────
export const submitUniversityRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { universityName, country, interestedCourses } = req.body;

    if (!userId)                 return res.status(401).json({ success: false, message: 'User ID not found in token' });
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
  getProfilesBySegment,
  getProfileStats,
  bulkUpdateProfiles,
  getProfileWithCourses,
  getProfileForAnalytics,
  submitUniversityRequest,
  fixCoursesOnProfile,
};