// src/controllers/userprofilecontroller.js
import UserProfile from '../models/userprofilemodel.js';
import { createUniversityRequestNotification } from './notificationController.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const deriveEligibleProgram = (qualification) => {
  if (!qualification) return null;
  const q = qualification.toLowerCase();
  if (q.includes('12th') || q.includes('high school')) return 'Bachelor';
  if (q.includes('bachelor'))                           return 'Master';
  if (q.includes('master'))                             return 'PhD';
  return null;
};

// ✅ FIX: derive programStream from programType (sent directly by frontend)
//    Falls back to eligibleProgram derivation for backwards compatibility.
const deriveProgramStream = (programType, eligibleProgram) => {
  if (programType === 'UG') return 'UG';
  if (programType === 'PG') return 'PG';
  // fallback
  return eligibleProgram === 'Bachelor' ? 'UG' : 'PG';
};

export const fixCoursesOnProfile = (profileObj) => {
  // selectedCourses at top-level was stored as Map — convert to plain object if needed
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
// processUniversityData
// ─────────────────────────────────────────────────────────────────────────────
const processUniversityData = (uniData) => {
  if (!uniData) return null;

  const rawCourses = Array.isArray(uniData.selectedCourses)
    ? uniData.selectedCourses
    : [];

  const processedCourses = rawCourses.map((c) => {
    const courseId = (c.id || c._id?.toString() || '').trim();
    const courseTitle = (c.title || c.name || c.program_name || '').trim();

    return {
      id: courseId || `course-${Date.now()}`,
      title: courseTitle || 'Course',
    };
  });

  // ✅ ADD THIS BLOCK (IMPORTANT)
  const resolvedId = (
    uniData.id ||
    uniData.UNITID?.toString() ||
    uniData._id?.toString() ||
    ''
  ).trim() || `uni-${Date.now()}`;

  return {
    id: resolvedId,   // ✅ THIS FIXES YOUR ERROR
    name: uniData.name || 'Unknown University',
    selectedCourses: processedCourses,
  };
};

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

    // ── Basic validation ───────────────────────────────────────────────────
    if (!profileData.basicInfo)
      return res.status(400).json({ success: false, message: 'basicInfo is required' });
    if (!profileData.education)
      return res.status(400).json({ success: false, message: 'education is required' });

    // ✅ FIX: programType is sent directly from the frontend Step 2 selection
    //    Accept it as the primary source of truth; also validate it.
    const programType = profileData.programType;
    if (!programType || !['UG', 'PG'].includes(programType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid programType: "${programType}". Must be UG or PG.`,
      });
    }

    // Auto-derive eligibleProgram from qualification
    if (!profileData.eligibleProgram) {
      profileData.eligibleProgram = deriveEligibleProgram(profileData.education?.qualification);
    }

    // eligibleProgram can still be null for edge cases — warn but don't block
    if (profileData.eligibleProgram && !['Bachelor', 'Master', 'PhD'].includes(profileData.eligibleProgram)) {
      return res.status(400).json({
        success: false,
        message: `Invalid eligibleProgram: "${profileData.eligibleProgram}". Must be Bachelor, Master, or PhD.`,
      });
    }

    // ✅ FIX: derive programStream from programType first (not eligibleProgram)
    profileData.programStream = deriveProgramStream(programType, profileData.eligibleProgram);

    // ── interestedCourses (Step 3 optional field) ─────────────────────────
    // ✅ NEW: sanitize and cap at 5
    if (!Array.isArray(profileData.interestedCourses)) {
      profileData.interestedCourses = [];
    }
    profileData.interestedCourses = profileData.interestedCourses
      .map((c) => (typeof c === 'string' ? c.trim() : ''))
      .filter(Boolean)
      .slice(0, 5);

    // ── Universities ───────────────────────────────────────────────────────
    if (!profileData.selectedUniversities) {
      profileData.selectedUniversities = [];
    }
    if (!Array.isArray(profileData.selectedUniversities)) {
      return res.status(400).json({ success: false, message: 'selectedUniversities must be an array' });
    }

    const processedUniversities = [];
    for (const uni of profileData.selectedUniversities) {
      const processed = processUniversityData(uni);

      if (!processed) {
        return res.status(400).json({ success: false, message: 'Invalid university data' });
      }

      if (!processed.id) {
        return res.status(400).json({
          success: false,
          message: `University "${processed.name}" is missing an id`,
        });
      }

      if (!processed.name || processed.name === 'Unknown University') {
        return res.status(400).json({ success: false, message: 'University name is required' });
      }

      // ✅ Warn on type mismatch but don't reject — universityType may be missing in DB
      const uniType = (processed.universityType || '').toLowerCase();
      if (uniType) {
        if (programType === 'UG' && uniType !== 'bachelor') {
          console.warn(`⚠️ "${processed.name}" universityType mismatch — expected bachelor, got ${uniType}`);
        }
        if (programType === 'PG' && uniType !== 'master') {
          console.warn(`⚠️ "${processed.name}" universityType mismatch — expected master, got ${uniType}`);
        }
      } else {
        console.warn(`⚠️ University "${processed.name}" has no universityType — skipping type check`);
      }

      if (!processed.isKansas && processed.selectedCourses.length === 0) {
        console.warn(`⚠️ No course selected for ${processed.name}`);
      }

      if (processed.selectedCourses.length > 1) {
        return res.status(400).json({
          success: false,
          message: `Maximum 1 course can be selected for ${processed.name}`,
        });
      }

      processedUniversities.push(processed);
    }

    profileData.selectedUniversities = processedUniversities;

    // ── Process segment ────────────────────────────────────────────────────
    profileData.selectedSegment = processSegmentData(profileData.selectedSegment);

    // ── Cleanup ───────────────────────────────────────────────────────────
    delete profileData.fullData;

    // ✅ FIX: removed Map conversion — selectedCourses at top level is not needed
    //    (courses live inside each university's selectedCourses array).
    //    Keeping it as empty object is harmless but the Map conversion was breaking things.
    delete profileData.selectedCourses;

    // ── Upsert ────────────────────────────────────────────────────────────
    let profile = await UserProfile.findOne({ userId });

    if (profile) {
      profile = await UserProfile.findOneAndUpdate(
        { userId },
        { ...profileData, lastUpdated: Date.now() },
        { new: true, runValidators: false }
      );
      console.log('✅ Profile updated for:', userId, '| programType:', programType, '| stream:', profileData.programStream);
      return res.status(200).json({ success: true, message: 'Profile updated successfully', data: profile });
    } else {
      const newProfile = new UserProfile({ userId, ...profileData });
      await newProfile.save();
      console.log('✅ Profile created for:', userId, '| programType:', programType, '| stream:', profileData.programStream);
      return res.status(201).json({ success: true, message: 'Profile created successfully', data: newProfile });
    }
  } catch (error) {
    console.error('❌ Error in createOrUpdateProfile:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors });
    }
    if (error.message?.includes('Please select') || error.message?.includes('Select'))
      return res.status(400).json({ success: false, message: error.message });
    if (error.code === 11000)
      return res.status(409).json({ success: false, message: 'Profile already exists for this user' });
    return res.status(500).json({ success: false, message: 'Failed to save profile', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PROFILE
// GET /api/user/profile
// ─────────────────────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: 'User ID not found in token' });

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(200).json({
        success: false,
        exists:  false,
        message: 'Profile not found — please complete your profile',
        data:    null,
      });
    }

    const profileObj = fixCoursesOnProfile(profile.toObject());
    console.log(`✅ Profile fetched for: ${userId} | programType: ${profileObj.programType} | stream: ${profileObj.programStream}`);
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
        programType:               profile.programType,
        eligibleProgram:           profile.eligibleProgram,
        programStream:             profile.programStream,
        selectedUniversitiesCount: profile.selectedUniversities?.length || 0,
        selectedSegment:           profile.selectedSegment || null,
        fieldOfStudy:              profile.education?.field || null,
        // ✅ NEW: include interestedCourses in status response
        interestedCourses:         profile.interestedCourses || [],
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
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;

    const query = {};
    if (req.query.segment) query['selectedSegment.id'] = req.query.segment;
    if (req.query.program) {
      if (!['Bachelor', 'Master', 'PhD'].includes(req.query.program))
        return res.status(400).json({ success: false, message: 'Invalid program. Use Bachelor, Master or PhD.' });
      query.eligibleProgram = req.query.program;
    }
    if (req.query.stream) {
      if (!['UG', 'PG'].includes(req.query.stream))
        return res.status(400).json({ success: false, message: 'Invalid stream. Use UG or PG.' });
      query.programStream = req.query.stream;
    }
    // ✅ NEW: filter by programType directly
    if (req.query.programType) {
      if (!['UG', 'PG'].includes(req.query.programType))
        return res.status(400).json({ success: false, message: 'Invalid programType. Use UG or PG.' });
      query.programType = req.query.programType;
    }

    const [profiles, total] = await Promise.all([
      UserProfile.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      UserProfile.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data:    profiles.map(fixCoursesOnProfile),
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
      count:   profiles.length,
      data:    profiles.map(fixCoursesOnProfile),
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
      count:   profiles.length,
      data:    profiles.map(fixCoursesOnProfile),
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
      programTypeStats,
      programStats,
      streamStats,
      segmentStats,
      fieldStats,
      interestedCourseStats,
      universitySelectionStats,
      courseSelectionStats,
      recentProfiles,
    ] = await Promise.all([

      UserProfile.countDocuments(),

      // ✅ NEW: stats by programType (UG/PG direct selection)
      UserProfile.aggregate([
        { $group: { _id: '$programType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      UserProfile.aggregate([
        { $group: { _id: '$eligibleProgram', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      UserProfile.aggregate([
        { $group: { _id: '$programStream', count: { $sum: 1 } } },
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

      // ✅ NEW: most common interested courses across all profiles
      UserProfile.aggregate([
        { $unwind: '$interestedCourses' },
        { $group: { _id: '$interestedCourses', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      UserProfile.aggregate([
        { $unwind: '$selectedUniversities' },
        {
          $group: {
            _id:   '$selectedUniversities.name',
            type:  { $first: '$selectedUniversities.universityType' },
            count: { $sum: 1 },
          },
        },
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
        .select('basicInfo.fullName basicInfo.email programType eligibleProgram programStream selectedSegment education.field interestedCourses selectedUniversities createdAt')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total: totalProfiles,
        programTypeStats,
        programStats,
        streamStats,
        segmentStats,
        fieldStats,
        interestedCourseStats,
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
      data:    { ...profileObj, coursesByUniversity },
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
// ✅ FIX: frontend calls POST /api/admin/university-request
//         Make sure your router also registers this at that path.
//         Controller logic is unchanged — just ensure routes match.
// POST /api/admin/university-request  (and/or /api/user/university/request)
// ─────────────────────────────────────────────────────────────────────────────
export const submitUniversityRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { universityName, country, interestedCourses, programType } = req.body;

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
      // ✅ NEW: pass programType through so admin knows UG vs PG request
      programType:    programType || null,
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