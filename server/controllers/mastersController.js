import MastersUniversity from '../models/mastersUniversityModel.js';

// @desc    Create a new masters university
// @route   POST /api/masters/universities
// @access  Private
export const createUniversity = async (req, res) => {
  try {
    const universityData = req.body;
    
    // Validate programs array
    if (universityData.programs && Array.isArray(universityData.programs)) {
      // Ensure each program has required fields
      universityData.programs = universityData.programs.map(program => {
        // If program is a string (from form), convert to object
        if (typeof program === 'string') {
          return {
            name: program,
            title: program,
            program_name: program,
            level: 'Master',
            duration: '1-2 years',
            studyMode: 'On Campus',
            description: `${program} program at ${universityData.universityName}`,
            requirements: universityData.applicationRequirements?.join(', ') || 'Standard admission requirements apply'
          };
        }
        return program;
      });
      
      universityData.programCount = universityData.programs.length;
    }
    
    // Check if university code already exists
    const existingUniversity = await MastersUniversity.findOne({ 
      universityCode: universityData.universityCode 
    });
    
    if (existingUniversity) {
      return res.status(400).json({
        success: false,
        message: 'University with this code already exists'
      });
    }
    
    const university = new MastersUniversity(universityData);
    await university.save();
    
    res.status(201).json({
      success: true,
      data: university,
      message: 'Masters university created successfully'
    });
  } catch (error) {
    console.error('Create masters university error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error. University code must be unique.'
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors
    });
  }
};

// @desc    Get all masters universities
// @route   GET /api/masters/universities
// @access  Public
export const getUniversities = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      country, 
      state, 
      isActive,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (country) {
      filter.country = country;
    }
    
    if (state) {
      filter.state = state;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const universities = await MastersUniversity.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);
    
    const total = await MastersUniversity.countDocuments(filter);
    
    res.json({
      success: true,
      data: universities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get masters universities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single masters university by ID
// @route   GET /api/masters/universities/:id
// @access  Public
export const getUniversityById = async (req, res) => {
  try {
    const university = await MastersUniversity.findById(req.params.id);
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'Masters university not found'
      });
    }
    
    res.json({
      success: true,
      data: university
    });
  } catch (error) {
    console.error('Get masters university by id error:', error);
    
    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Masters university not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get masters university by code
// @route   GET /api/masters/universities/code/:code
// @access  Public
export const getUniversityByCode = async (req, res) => {
  try {
    const university = await MastersUniversity.findOne({ 
      universityCode: req.params.code.toUpperCase() 
    });
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'Masters university not found'
      });
    }
    
    res.json({
      success: true,
      data: university
    });
  } catch (error) {
    console.error('Get masters university by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update masters university
// @route   PUT /api/masters/universities/:id
// @access  Private
export const updateUniversity = async (req, res) => {
  try {
    const updateData = req.body;
    
    // Validate programs array
    if (updateData.programs && Array.isArray(updateData.programs)) {
      updateData.programs = updateData.programs.map(program => {
        if (typeof program === 'string') {
          return {
            name: program,
            title: program,
            program_name: program,
            level: 'Master',
            duration: '1-2 years',
            studyMode: 'On Campus',
            description: `${program} program at ${updateData.universityName}`,
            requirements: updateData.applicationRequirements?.join(', ') || 'Standard admission requirements apply'
          };
        }
        return program;
      });
      
      updateData.programCount = updateData.programs.length;
    }
    
    updateData.updatedAt = Date.now();
    
    const university = await MastersUniversity.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'Masters university not found'
      });
    }
    
    res.json({
      success: true,
      data: university,
      message: 'Masters university updated successfully'
    });
  } catch (error) {
    console.error('Update masters university error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error. University code must be unique.'
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors
    });
  }
};

// @desc    Delete masters university
// @route   DELETE /api/masters/universities/:id
// @access  Private
export const deleteUniversity = async (req, res) => {
  try {
    const university = await MastersUniversity.findByIdAndDelete(req.params.id);
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'Masters university not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Masters university deleted successfully'
    });
  } catch (error) {
    console.error('Delete masters university error:', error);
    
    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Masters university not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get featured masters universities
// @route   GET /api/masters/universities/featured/all
// @access  Public
export const getFeaturedUniversities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const universities = await MastersUniversity.find({ 
      featured: true, 
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error('Get featured masters universities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search masters universities
// @route   GET /api/masters/universities/search/:query
// @access  Public
export const searchUniversities = async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;
    
    const universities = await MastersUniversity.find({
      $or: [
        { universityName: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } },
        { state: { $regex: query, $options: 'i' } },
        { country: { $regex: query, $options: 'i' } },
        { 'programs.name': { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
      .sort({ universityName: 1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error('Search masters universities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Bulk create masters universities
// @route   POST /api/masters/universities/bulk
// @access  Private
export const bulkCreateUniversities = async (req, res) => {
  try {
    const universities = req.body;
    
    if (!Array.isArray(universities)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of universities'
      });
    }
    
    // Process each university
    const processedUniversities = universities.map(uni => {
      if (uni.programs && Array.isArray(uni.programs)) {
        uni.programs = uni.programs.map(program => {
          if (typeof program === 'string') {
            return {
              name: program,
              title: program,
              program_name: program,
              level: 'Master',
              duration: '1-2 years',
              studyMode: 'On Campus',
              description: `${program} program at ${uni.universityName}`,
              requirements: uni.applicationRequirements?.join(', ') || 'Standard admission requirements apply'
            };
          }
          return program;
        });
        uni.programCount = uni.programs.length;
      }
      return uni;
    });
    
    const createdUniversities = await MastersUniversity.insertMany(processedUniversities);
    
    res.status(201).json({
      success: true,
      data: createdUniversities,
      message: `Successfully created ${createdUniversities.length} masters universities`
    });
  } catch (error) {
    console.error('Bulk create masters universities error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors
    });
  }
};

// @desc    Toggle university active status
// @route   PATCH /api/masters/universities/:id/toggle-status
// @access  Private
export const toggleUniversityStatus = async (req, res) => {
  try {
    const university = await MastersUniversity.findById(req.params.id);
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'Masters university not found'
      });
    }
    
    university.isActive = !university.isActive;
    await university.save();
    
    res.json({
      success: true,
      data: university,
      message: `University ${university.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle university status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle featured status
// @route   PATCH /api/masters/universities/:id/toggle-featured
// @access  Private
export const toggleFeaturedStatus = async (req, res) => {
  try {
    const university = await MastersUniversity.findById(req.params.id);
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'Masters university not found'
      });
    }
    
    university.featured = !university.featured;
    await university.save();
    
    res.json({
      success: true,
      data: university,
      message: `University ${university.featured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    console.error('Toggle featured status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get universities by country
// @route   GET /api/masters/universities/country/:country
// @access  Public
export const getUniversitiesByCountry = async (req, res) => {
  try {
    const { country } = req.params;
    const { limit = 50 } = req.query;
    
    const universities = await MastersUniversity.find({ 
      country: { $regex: new RegExp(`^${country}$`, 'i') },
      isActive: true 
    })
      .sort({ universityName: 1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error('Get universities by country error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get statistics
// @route   GET /api/masters/universities/stats/overview
// @access  Private
export const getStats = async (req, res) => {
  try {
    const totalUniversities = await MastersUniversity.countDocuments();
    const activeUniversities = await MastersUniversity.countDocuments({ isActive: true });
    const featuredUniversities = await MastersUniversity.countDocuments({ featured: true });
    const totalPrograms = await MastersUniversity.aggregate([
      { $group: { _id: null, total: { $sum: '$programCount' } } }
    ]);
    
    // Get universities by country
    const byCountry = await MastersUniversity.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get universities by type
    const byType = await MastersUniversity.aggregate([
      { $group: { _id: '$universityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalUniversities,
        active: activeUniversities,
        featured: featuredUniversities,
        totalPrograms: totalPrograms[0]?.total || 0,
        byCountry,
        byType
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};