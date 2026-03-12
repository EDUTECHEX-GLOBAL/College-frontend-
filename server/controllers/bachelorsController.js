// controllers/bachelorsController.js
import BachelorsUniversity from '../models/bachelorsUniversityModel.js';


// ✅ Normalize programs — converts plain strings into proper objects
const normalizePrograms = (programs) => {
  if (!Array.isArray(programs)) return [];
  return programs.map(p => {
    if (typeof p === 'string') {
      return { name: p, title: p, program_name: p, level: 'Bachelor', duration: '4 years', studyMode: 'On Campus', description: `${p} program` };
    }
    if (typeof p === 'object' && p !== null && !p.name) {
      p.name = p.title || p.program_name || 'Unknown Program';
    }
    return p;
  });
};
// @desc    Create a new university
// @route   POST /api/bachelors/universities
// @access  Private/Admin
export const createUniversity = async (req, res) => {
  try {
    console.log('Received data:', req.body); // Debug log

    // Check if university code already exists
    const existingUniversity = await BachelorsUniversity.findOne({ 
      universityCode: req.body.universityCode?.toUpperCase() 
    });
    
    if (existingUniversity) {
      return res.status(400).json({
        success: false,
        message: 'University with this code already exists'
      });
    }

    // Prepare data with proper formatting
    const universityData = {
      ...req.body,
      universityCode: req.body.universityCode?.toUpperCase(),
      // Ensure arrays are properly formatted
      programs: normalizePrograms(req.body.programs),
      intakes: req.body.intakes || [],
      englishTests: req.body.englishTests || ["TOEFL iBT", "IELTS Academic"],
      applicationRequirements: req.body.applicationRequirements || [],
      // Ensure nested objects are properly structured
      applicationDeadlines: req.body.applicationDeadlines || {
        earlyDecision: "",
        earlyAction: "",
        regularDecision: "",
        rolling: ""
      },
      tuitionFees: req.body.tuitionFees || {
        inState: "",
        outOfState: "",
        international: "",
        roomAndBoard: ""
      },
      satRequirements: req.body.satRequirements || {
        math: "",
        reading: "",
        total: ""
      },
      actRequirements: req.body.actRequirements || {
        composite: ""
      }
    };

    // Create university
    const university = await BachelorsUniversity.create(universityData);

    res.status(201).json({
      success: true,
      data: university,
      message: 'University created successfully'
    });
  } catch (error) {
    console.error('Create university error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => ({
        field: val.path,
        message: val.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'University with this code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating university',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get all universities
// @route   GET /api/bachelors/universities
// @access  Private/Admin
export const getAllUniversities = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      state, 
      type, 
      search,
      isActive,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }

    if (state) {
      filter.state = state;
    }

    if (type) {
      filter.universityType = type;
    }

    // Search
    if (search) {
      filter.$or = [
        { universityName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { universityCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get universities
    const universities = await BachelorsUniversity.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await BachelorsUniversity.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: universities.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: universities
    });
  } catch (error) {
    console.error('Get universities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching universities',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get single university by ID
// @route   GET /api/bachelors/universities/:id
// @access  Private/Admin
export const getUniversityById = async (req, res) => {
  try {
    const university = await BachelorsUniversity.findById(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    res.status(200).json({
      success: true,
      data: university
    });
  } catch (error) {
    console.error('Get university error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching university',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Update university
// @route   PUT /api/bachelors/universities/:id
// @access  Private/Admin
export const updateUniversity = async (req, res) => {
  try {
    let university = await BachelorsUniversity.findById(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    // Check if university code is being changed and if it's unique
    if (req.body.universityCode && 
        req.body.universityCode.toUpperCase() !== university.universityCode) {
      const existingUniversity = await BachelorsUniversity.findOne({ 
        universityCode: req.body.universityCode.toUpperCase() 
      });
      
      if (existingUniversity) {
        return res.status(400).json({
          success: false,
          message: 'University with this code already exists'
        });
      }
    }

    // Prepare update data
    const updateData = {
      ...req.body,
      universityCode: req.body.universityCode?.toUpperCase(),
      updatedAt: Date.now()
    };

    // Update university
    university = await BachelorsUniversity.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: university,
      message: 'University updated successfully'
    });
  } catch (error) {
    console.error('Update university error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => ({
        field: val.path,
        message: val.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating university',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Delete university
// @route   DELETE /api/bachelors/universities/:id
// @access  Private/Admin
export const deleteUniversity = async (req, res) => {
  try {
    const university = await BachelorsUniversity.findById(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    await university.deleteOne();

    res.status(200).json({
      success: true,
      message: 'University deleted successfully'
    });
  } catch (error) {
    console.error('Delete university error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting university',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Toggle university active status
// @route   PATCH /api/bachelors/universities/:id/toggle-status
// @access  Private/Admin
export const toggleUniversityStatus = async (req, res) => {
  try {
    const university = await BachelorsUniversity.findById(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    university.isActive = !university.isActive;
    await university.save();

    res.status(200).json({
      success: true,
      data: { isActive: university.isActive },
      message: `University ${university.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle university status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling university status',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Toggle featured status
// @route   PATCH /api/bachelors/universities/:id/toggle-featured
// @access  Private/Admin
export const toggleFeatured = async (req, res) => {
  try {
    const university = await BachelorsUniversity.findById(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    university.featured = !university.featured;
    await university.save();

    res.status(200).json({
      success: true,
      data: { featured: university.featured },
      message: `University ${university.featured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling featured status',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};