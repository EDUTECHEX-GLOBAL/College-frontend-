import FirstAcademic from '../models/FirstAcademicModel.js';

// Get academic application for a specific college
const getAcademicApplication = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;

    let academicApplication = await FirstAcademic.findOne({
      studentId,
      collegeId
    });

    // If no application exists, create a default one
    if (!academicApplication) {
      academicApplication = new FirstAcademic({
        studentId,
        collegeId,
        schoolDepartment: '',
        major: '',
        subplan: '',
        preProfessional: '',
        honorsProgram: '',
        algebraGrade: '',
        calculusGrade: '',
        visualArtGrade: '',
        selfFellowship: '',
        progress: 0
      });
      await academicApplication.save();
    }

    res.json({
      success: true,
      academics: academicApplication
    });
  } catch (error) {
    console.error('Error fetching academic application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching academic application'
    });
  }
};

// Create or update academic application
const saveAcademicApplication = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;
    const {
      schoolDepartment,
      major,
      subplan,
      preProfessional,
      honorsProgram,
      algebraGrade,
      calculusGrade,
      visualArtGrade,
      selfFellowship
    } = req.body;

    // Validate required fields
    if (!collegeId) {
      return res.status(400).json({
        success: false,
        message: 'College ID is required'
      });
    }

    // Find existing application or create new one
    let academicApplication = await FirstAcademic.findOne({
      studentId,
      collegeId
    });

    if (academicApplication) {
      // Update existing application
      academicApplication.schoolDepartment = schoolDepartment || '';
      academicApplication.major = major || '';
      academicApplication.subplan = subplan || '';
      academicApplication.preProfessional = preProfessional || '';
      academicApplication.honorsProgram = honorsProgram || '';
      academicApplication.algebraGrade = algebraGrade || '';
      academicApplication.calculusGrade = calculusGrade || '';
      academicApplication.visualArtGrade = visualArtGrade || '';
      academicApplication.selfFellowship = selfFellowship || '';
      academicApplication.lastSaved = new Date();
    } else {
      // Create new application
      academicApplication = new FirstAcademic({
        studentId,
        collegeId,
        schoolDepartment: schoolDepartment || '',
        major: major || '',
        subplan: subplan || '',
        preProfessional: preProfessional || '',
        honorsProgram: honorsProgram || '',
        algebraGrade: algebraGrade || '',
        calculusGrade: calculusGrade || '',
        visualArtGrade: visualArtGrade || '',
        selfFellowship: selfFellowship || ''
      });
    }

    await academicApplication.save();

    res.json({
      success: true,
      message: 'Academic application saved successfully',
      academics: academicApplication
    });
  } catch (error) {
    console.error('Error saving academic application:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Academic application already exists for this college'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while saving academic application'
    });
  }
};

// Update specific fields in academic application
const updateAcademicApplication = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;
    const updates = req.body;

    // Remove any fields that shouldn't be updated
    delete updates._id;
    delete updates.studentId;
    delete updates.collegeId;
    delete updates.createdAt;

    // Add lastSaved timestamp
    updates.lastSaved = new Date();

    const academicApplication = await FirstAcademic.findOneAndUpdate(
      { studentId, collegeId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!academicApplication) {
      return res.status(404).json({
        success: false,
        message: 'Academic application not found'
      });
    }

    res.json({
      success: true,
      message: 'Academic application updated successfully',
      academics: academicApplication
    });
  } catch (error) {
    console.error('Error updating academic application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating academic application'
    });
  }
};

// Clear a specific field in academic application
const clearField = async (req, res) => {
  try {
    const { collegeId, field } = req.params;
    const studentId = req.user.userId;

    const validFields = [
      'schoolDepartment',
      'major',
      'subplan',
      'preProfessional',
      'honorsProgram',
      'algebraGrade',
      'calculusGrade',
      'visualArtGrade',
      'selfFellowship'
    ];

    if (!validFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field name'
      });
    }

    const updateData = { [field]: '' };
    updateData.lastSaved = new Date();

    const academicApplication = await FirstAcademic.findOneAndUpdate(
      { studentId, collegeId },
      { $set: updateData },
      { new: true }
    );

    if (!academicApplication) {
      return res.status(404).json({
        success: false,
        message: 'Academic application not found'
      });
    }

    res.json({
      success: true,
      message: `Field ${field} cleared successfully`,
      academics: academicApplication
    });
  } catch (error) {
    console.error('Error clearing field:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing field'
    });
  }
};

// Get all academic applications for a student
const getAllAcademicApplications = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const academicApplications = await FirstAcademic.find({ studentId })
      .select('-__v')
      .sort({ lastSaved: -1 });

    res.json({
      success: true,
      academicApplications,
      count: academicApplications.length
    });
  } catch (error) {
    console.error('Error fetching academic applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching academic applications'
    });
  }
};

// Delete academic application for a college
const deleteAcademicApplication = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;

    const academicApplication = await FirstAcademic.findOneAndDelete({
      studentId,
      collegeId
    });

    if (!academicApplication) {
      return res.status(404).json({
        success: false,
        message: 'Academic application not found'
      });
    }

    res.json({
      success: true,
      message: 'Academic application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting academic application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting academic application'
    });
  }
};

export {
  getAcademicApplication,
  saveAcademicApplication,
  updateAcademicApplication,
  clearField,
  getAllAcademicApplications,
  deleteAcademicApplication
};