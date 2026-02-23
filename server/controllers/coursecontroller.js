import Course from '../models/coursemodels.js';

// Helper function to map studyMode to valid enum values
const mapStudyMode = (studyMode) => {
  if (!studyMode) return 'On Campus';
  
  const mode = studyMode.toString().toLowerCase().trim();
  
  // Map common study mode variations to valid enum values
  if (mode.includes('&') || mode.includes('and') || mode.includes('hybrid') || mode.includes('blended')) {
    return 'Hybrid';
  } else if (mode.includes('online') || mode.includes('virtual') || mode.includes('remote') || mode.includes('digital')) {
    return 'Online';
  } else if (mode.includes('distance') || mode.includes('correspondence')) {
    return 'Distance Learning';
  } else if (mode.includes('evening') || mode.includes('night')) {
    return 'Evening';
  } else if (mode.includes('weekend')) {
    return 'Weekend';
  } else if (mode.includes('campus') || mode.includes('onsite') || mode.includes('physical') || mode.includes('in-person')) {
    return 'On Campus';
  }
  
  // Default fallback
  return 'On Campus';
};

// Helper function to validate and sanitize course data
const sanitizeCourseData = (data) => {
  const sanitized = { ...data };
  
  // Map studyMode to valid enum
  if (sanitized.studyMode) {
    sanitized.studyMode = mapStudyMode(sanitized.studyMode);
  }
  
  // Ensure level is valid
  const validLevels = ['Undergraduate', 'Graduate', 'Postgraduate', 'Doctorate', 'Diploma', 'Certificate', 'Foundation'];
  if (sanitized.level && !validLevels.includes(sanitized.level)) {
    sanitized.level = 'Undergraduate';
  }
  
  // Ensure fees structure is valid
  if (!sanitized.fees || typeof sanitized.fees !== 'object') {
    sanitized.fees = {
      amount: 0,
      currency: 'USD',
      period: 'per year',
      displayText: 'Contact university for fee details'
    };
  }
  
  // Ensure requirements structure is valid
  if (!sanitized.requirements || typeof sanitized.requirements !== 'object') {
    sanitized.requirements = {
      academic: [],
      language: [],
      documents: [],
      description: 'High school diploma or equivalent'
    };
  }
  
  return sanitized;
};

// @desc    Get all courses/programs for a university
// @route   GET /api/courses/university/:universityId
// @access  Public
export const getCoursesByUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;
    const {
      search,
      majorArea,
      studyMode,
      level,
      page = 1,
      limit = 10,
      sortBy = 'title',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { universityId, isActive: true };
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { majorArea: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Major area filter
    if (majorArea && majorArea !== 'All') {
      query.majorArea = majorArea;
    }
    
    // Study mode filter - map to valid enum if needed
    if (studyMode && studyMode !== 'All') {
      const mappedStudyMode = mapStudyMode(studyMode);
      query.studyMode = mappedStudyMode;
    }
    
    // Level filter
    if (level && level !== 'All') {
      query.level = level;
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const courses = await Course.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await Course.countDocuments(query);

    // Get distinct values for filters
    const majorAreas = await Course.distinct('majorArea', { universityId, isActive: true });
    const studyModes = await Course.distinct('studyMode', { universityId, isActive: true });
    const levels = await Course.distinct('level', { universityId, isActive: true });

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      filters: {
        majorAreas: ['All', ...majorAreas],
        studyModes: ['All', ...studyModes],
        levels: ['All', ...levels]
      },
      data: courses
    });
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single course/program
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findOne({ 
      $or: [
        { _id: req.params.id },
        { programId: req.params.id }
      ],
      isActive: true
    }).select('-__v');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Increment views
    course.views = (course.views || 0) + 1;
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('❌ Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new course/program
// @route   POST /api/courses
// @access  Private/Admin
export const createCourse = async (req, res) => {
  try {
    console.log('📥 Received course creation request:', req.body);
    
    const {
      title,
      programId,
      universityId,
      universityName,
      universityUnitId,
      description,
      level,
      studyMode,
      duration,
      locations,
      campus,
      fees,
      majorArea,
      intakeMonths,
      applicationDeadline,
      startDate,
      requirements
    } = req.body;

    // Check required fields
    if (!title || !programId || !universityId || !universityName || !universityUnitId || !majorArea) {
      console.log('❌ Missing required fields:', {
        title: !!title,
        programId: !!programId,
        universityId: !!universityId,
        universityName: !!universityName,
        universityUnitId: !!universityUnitId,
        majorArea: !!majorArea
      });
      
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Title, programId, universityId, universityName, universityUnitId, and majorArea are required.'
      });
    }

    // Check if course already exists
    const existingCourse = await Course.findOne({ 
      $or: [
        { programId },
        { title, universityId }
      ]
    });

    if (existingCourse) {
      console.log('⚠️ Course already exists:', { programId, title, universityId });
      return res.status(409).json({
        success: false,
        message: 'Course already exists'
      });
    }

    // Sanitize and validate data
    const sanitizedData = sanitizeCourseData({
      title,
      programId,
      universityId,
      universityName,
      universityUnitId,
      description,
      level,
      studyMode,
      duration,
      locations,
      campus,
      fees,
      majorArea,
      intakeMonths,
      applicationDeadline,
      startDate,
      requirements
    });

    console.log('🔄 Sanitized data for creation:', {
      originalStudyMode: studyMode,
      mappedStudyMode: sanitizedData.studyMode,
      level: sanitizedData.level
    });

    // Create new course
    const course = await Course.create({
      title: sanitizedData.title,
      programId: sanitizedData.programId,
      universityId: sanitizedData.universityId,
      universityName: sanitizedData.universityName,
      universityUnitId: sanitizedData.universityUnitId,
      description: sanitizedData.description || `${sanitizedData.title} program at ${sanitizedData.universityName}`,
      level: sanitizedData.level || 'Undergraduate',
      studyMode: sanitizedData.studyMode,
      duration: sanitizedData.duration || '3-4 years',
      locations: sanitizedData.locations || [],
      campus: sanitizedData.campus || 'Main Campus',
      fees: sanitizedData.fees,
      majorArea: sanitizedData.majorArea,
      intakeMonths: sanitizedData.intakeMonths || [],
      applicationDeadline: sanitizedData.applicationDeadline ? new Date(sanitizedData.applicationDeadline) : null,
      startDate: sanitizedData.startDate ? new Date(sanitizedData.startDate) : null,
      requirements: sanitizedData.requirements,
      isActive: true,
      isAvailableForInternational: true
    });

    console.log('✅ Course created successfully:', course._id);
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('❌ Error creating course:', error);
    
    // Provide better error messages
    let errorMessage = 'Server error creating course';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error: ';
      const errors = Object.values(error.errors).map(err => err.message);
      errorMessage += errors.join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate key error. Course with this programId or title already exists.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update course/program
// @route   PUT /api/courses/:id
// @access  Private/Admin
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Sanitize and validate updates
    const sanitizedUpdates = sanitizeCourseData(req.body);
    
    // Handle date fields
    if (sanitizedUpdates.applicationDeadline) {
      sanitizedUpdates.applicationDeadline = new Date(sanitizedUpdates.applicationDeadline);
    }
    if (sanitizedUpdates.startDate) {
      sanitizedUpdates.startDate = new Date(sanitizedUpdates.startDate);
    }

    // Update course
    Object.keys(sanitizedUpdates).forEach(key => {
      course[key] = sanitizedUpdates[key];
    });

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('❌ Error updating course:', error);
    
    let errorMessage = 'Server error updating course';
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error: ';
      const errors = Object.values(error.errors).map(err => err.message);
      errorMessage += errors.join(', ');
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete course/program
// @route   DELETE /api/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Soft delete by setting isActive to false
    course.isActive = false;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course deactivated successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Search courses across all universities
// @route   GET /api/courses/search
// @access  Public
export const searchCourses = async (req, res) => {
  try {
    const {
      query,
      universityId,
      majorArea,
      studyMode,
      level,
      minFees,
      maxFees,
      page = 1,
      limit = 12,
      sortBy = 'title',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const searchQuery = { isActive: true };
    
    // Text search
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { majorArea: { $regex: query, $options: 'i' } },
        { universityName: { $regex: query, $options: 'i' } }
      ];
    }
    
    // University filter
    if (universityId) {
      searchQuery.universityId = universityId;
    }
    
    // Major area filter
    if (majorArea && majorArea !== 'All') {
      searchQuery.majorArea = majorArea;
    }
    
    // Study mode filter - map to valid enum
    if (studyMode && studyMode !== 'All') {
      searchQuery.studyMode = mapStudyMode(studyMode);
    }
    
    // Level filter
    if (level && level !== 'All') {
      searchQuery.level = level;
    }
    
    // Fees range filter
    if (minFees || maxFees) {
      searchQuery['fees.amount'] = {};
      if (minFees) searchQuery['fees.amount'].$gte = parseFloat(minFees);
      if (maxFees) searchQuery['fees.amount'].$lte = parseFloat(maxFees);
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const courses = await Course.find(searchQuery)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count
    const total = await Course.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: courses
    });
  } catch (error) {
    console.error('❌ Error searching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get courses for application (based on frontend data)
// @route   GET /api/courses/application/:universityId
// @access  Public
export const getCoursesForApplication = async (req, res) => {
  try {
    const { universityId } = req.params;
    
    // Get courses for application with specific fields
    const courses = await Course.find({ 
      universityId,
      isActive: true,
      isAvailableForInternational: true 
    })
    .select('title programId level studyMode duration locations fees majorArea description')
    .sort({ title: 1 });

    // Group by major area for frontend filtering
    const majorAreas = await Course.distinct('majorArea', { 
      universityId, 
      isActive: true 
    });

    // Get study modes
    const studyModes = await Course.distinct('studyMode', { 
      universityId, 
      isActive: true 
    });

    // Get program levels
    const levels = await Course.distinct('level', { 
      universityId, 
      isActive: true 
    });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: {
        courses,
        filters: {
          majorAreas: ['All', ...majorAreas],
          studyModes: ['All', ...studyModes],
          levels: ['All', ...levels]
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching courses for application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get popular courses
// @route   GET /api/courses/popular
// @access  Public
export const getPopularCourses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const popularCourses = await Course.find({ 
      isActive: true 
    })
    .sort({ views: -1, createdAt: -1 })
    .limit(limit)
    .select('title universityName level studyMode duration fees majorArea views');

    res.status(200).json({
      success: true,
      count: popularCourses.length,
      data: popularCourses
    });
  } catch (error) {
    console.error('❌ Error fetching popular courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching popular courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get related courses
// @route   GET /api/courses/:id/related
// @access  Public
export const getRelatedCourses = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const relatedCourses = await Course.find({
      _id: { $ne: course._id },
      $or: [
        { majorArea: course.majorArea },
        { universityId: course.universityId },
        { level: course.level }
      ],
      isActive: true
    })
    .limit(6)
    .select('title universityName level studyMode duration fees majorArea');

    res.status(200).json({
      success: true,
      count: relatedCourses.length,
      data: relatedCourses
    });
  } catch (error) {
    console.error('❌ Error fetching related courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching related courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Bulk create courses (for initial data)
// @route   POST /api/courses/bulk
// @access  Private/Admin
export const bulkCreateCourses = async (req, res) => {
  try {
    const { courses } = req.body;

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of courses'
      });
    }

    // Process each course
    const createdCourses = [];
    const errors = [];

    for (const courseData of courses) {
      try {
        // Check if course already exists
        const existingCourse = await Course.findOne({
          $or: [
            { programId: courseData.programId },
            { title: courseData.title, universityId: courseData.universityId }
          ]
        });

        if (!existingCourse) {
          // Sanitize course data
          const sanitizedData = sanitizeCourseData(courseData);
          
          const course = await Course.create({
            ...sanitizedData,
            isActive: true,
            isAvailableForInternational: courseData.isAvailableForInternational !== false
          });
          createdCourses.push(course);
        } else {
          errors.push(`Course "${courseData.title}" already exists`);
        }
      } catch (error) {
        errors.push(`Error creating course "${courseData.title}": ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Bulk course creation completed',
      createdCount: createdCourses.length,
      errorCount: errors.length,
      data: createdCourses,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Error in bulk course creation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in bulk course creation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Validate study mode mapping
// @route   POST /api/courses/validate-study-mode
// @access  Public
export const validateStudyMode = async (req, res) => {
  try {
    const { studyMode } = req.body;
    
    if (!studyMode) {
      return res.status(400).json({
        success: false,
        message: 'Study mode is required'
      });
    }
    
    const mappedStudyMode = mapStudyMode(studyMode);
    
    res.status(200).json({
      success: true,
      original: studyMode,
      mapped: mappedStudyMode,
      message: `Study mode "${studyMode}" maps to "${mappedStudyMode}"`
    });
  } catch (error) {
    console.error('❌ Error validating study mode:', error);
    res.status(500).json({
      success: false,
      message: 'Server error validating study mode'
    });
  }
};
// 🔍 GET UNIVERSITY BY ID WITH FULL DETAILS AND PROGRAMS
export const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log(`🔍 Fetching university details for ID: ${id}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "University ID is required"
      });
    }

    // Try to find by UNITID or _id
    let university;
    const idStr = id.toString();
    
    // Check if id is a number (UNITID)
    if (!isNaN(idStr) && idStr.match(/^\d+$/)) {
      university = await University.findOne({ UNITID: Number(idStr) });
    } 
    
    // If not found and id looks like an ObjectId
    if (!university && idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
      university = await University.findById(idStr);
    }
    
    // Try as string UNITID
    if (!university) {
      university = await University.findOne({ UNITID: idStr });
    }

    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    // Get student profile for personalized recommendations and selected courses
    let studentProfile = null;
    let selectedUniversityData = null;
    
    if (userId) {
      try {
        studentProfile = await UserProfile.findOne({ userId });
        
        // Find if this university is in the user's selected universities
        if (studentProfile && studentProfile.selectedUniversities) {
          selectedUniversityData = studentProfile.selectedUniversities.find(u => 
            u.id === idStr || u.unitid?.toString() === idStr || u._id?.toString() === idStr
          );
        }
      } catch (profileError) {
        console.error("Error fetching student profile:", profileError);
      }
    }

    const uniObj = university.toObject ? university.toObject() : university;
    
    // Extract programs
    const programs = extractProgramsFromUniversity(uniObj);
    const programCount = programs.length;

    // Transform university data
    const transformedUniversity = {
      UNITID: uniObj.UNITID || uniObj._id.toString(),
      _id: uniObj._id.toString(),
      INSTNM: uniObj.INSTNM || 'Unknown University',
      IALIAS: uniObj.IALIAS || '',
      CITY: uniObj.location?.city || uniObj.CITY || '',
      STABBR: uniObj.location?.state || uniObj.STABBR || '',
      COUNTRY: uniObj.location?.country || 'USA',
      ADDRESS: uniObj.location?.address || uniObj.ADDR || '',
      ZIP: uniObj.location?.zip || uniObj.ZIP || '',
      WEBADDR: uniObj.contact?.website || uniObj.WEBADDR || '',
      logo: getUniversityLogo(uniObj.INSTNM || 'University'),
      fallbackLogo: '/default-university-logo.png',
      programs: programs, // IMPORTANT: This is what the Courses component needs
      programCount: programCount,
      stats: uniObj.stats || {},
      location: uniObj.location || {},
      contact: uniObj.contact || {},
      metadata: uniObj.metadata || {},
      GUS_DATA: uniObj.GUS_DATA || {},
      importedByAdmin: uniObj.importedByAdmin || false,
      
      // Include selected courses from user's profile if available
      selectedCourses: selectedUniversityData?.selectedCourses || [],
      isKansas: selectedUniversityData?.isKansas || false,
      selectedUniversityData: selectedUniversityData
    };

    console.log(`✅ University data prepared for ${transformedUniversity.INSTNM} with ${programs.length} programs`);

    return res.status(200).json({
      success: true,
      data: transformedUniversity
    });

  } catch (error) {
    console.error("❌ Error fetching university details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch university details",
      error: error.message
    });
  }
};