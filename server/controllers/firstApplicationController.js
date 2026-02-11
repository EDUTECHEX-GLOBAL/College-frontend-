import FirstApplication from '../models/FirstApplication.js';
import mongoose from 'mongoose';

// Get or create application
const getOrCreateApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find existing application
    let application = await FirstApplication.findOne({ userId })
      .select('-__v')
      .populate('userId', 'email firstName lastName');

    if (!application) {
      // Create new application
      application = new FirstApplication({
        userId,
        status: 'draft',
        currentStep: 'personal',
        completionPercentage: 0
      });

      await application.save();
      
      application = await FirstApplication.findOne({ userId })
        .select('-__v')
        .populate('userId', 'email firstName lastName');
    }

    res.status(200).json({
      success: true,
      application
    });

  } catch (error) {
    console.error('❌ Error in getOrCreateApplication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch/create application',
      error: error.message
    });
  }
};

// Get application by ID
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    const application = await FirstApplication.findById(id)
      .select('-__v')
      .populate('userId', 'email firstName lastName phone');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user is authorized (admin or owner)
    if (req.user.role !== 'admin' && application.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this application'
      });
    }

    res.status(200).json({
      success: true,
      application
    });

  } catch (error) {
    console.error('❌ Error in getApplicationById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// Update application
const updateApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    const application = await FirstApplication.findOne({ userId });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update fields based on section
    if (updateData.personalInfo) {
      application.personalInfo = { ...application.personalInfo.toObject(), ...updateData.personalInfo };
    }
    
    if (updateData.educationInfo) {
      application.educationInfo = { ...application.educationInfo.toObject(), ...updateData.educationInfo };
    }
    
    if (updateData.englishTest) {
      application.englishTest = { ...application.englishTest.toObject(), ...updateData.englishTest };
    }
    
    if (updateData.selectedPrograms) {
      // Add new programs without duplicates
      updateData.selectedPrograms.forEach(newProgram => {
        const exists = application.selectedPrograms.some(
          prog => prog.programId === newProgram.programId
        );
        if (!exists) {
          application.selectedPrograms.push(newProgram);
        }
      });
    }
    
    if (updateData.currentStep) {
      application.currentStep = updateData.currentStep;
    }

    // Update status based on completion
    if (application.completionPercentage === 100) {
      application.status = 'in_progress';
    }

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      application
    });

  } catch (error) {
    console.error('❌ Error in updateApplication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
};

// Submit application
const submitApplication = async (req, res) => {
  try {
    const userId = req.user.userId;

    const application = await FirstApplication.findOne({ userId });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if application is complete
    if (application.completionPercentage < 100) {
      return res.status(400).json({
        success: false,
        message: 'Application is not complete',
        completionPercentage: application.completionPercentage
      });
    }

    // Update application status
    application.status = 'submitted';
    application.submittedAt = Date.now();
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application._id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        submittedAt: application.submittedAt
      }
    });

  } catch (error) {
    console.error('❌ Error in submitApplication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

// Get all applications (for admin)
const getAllApplications = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const { status, page = 1, limit = 10, search = '' } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const applications = await FirstApplication.find(query)
      .select('-__v')
      .populate('userId', 'email firstName lastName phone')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalApplications = await FirstApplication.countDocuments(query);
    const totalPages = Math.ceil(totalApplications / parseInt(limit));

    res.status(200).json({
      success: true,
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalApplications,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('❌ Error in getAllApplications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    const application = await FirstApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user is authorized (admin or owner)
    if (req.user.role !== 'admin' && application.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this application'
      });
    }

    await FirstApplication.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in deleteApplication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    });
  }
};

// Update application status (admin only)
const updateApplicationStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    const validStatuses = ['under_review', 'accepted', 'rejected', 'waitlisted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const application = await FirstApplication.findByIdAndUpdate(
      id,
      {
        status,
        $push: {
          adminNotes: {
            note: adminNotes,
            updatedBy: req.user.userId,
            updatedAt: Date.now()
          }
        }
      },
      { new: true }
    )
      .select('-__v')
      .populate('userId', 'email firstName lastName');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      application
    });

  } catch (error) {
    console.error('❌ Error in updateApplicationStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
};

export {
  getOrCreateApplication,
  getApplicationById,
  updateApplication,
  submitApplication,
  getAllApplications,
  deleteApplication,
  updateApplicationStatus
};