import FirstReview from '../models/FirstReviewModel.js';
import GeneralApplication from '../models/GeneralModel.js';
import FirstAcademic from '../models/FirstAcademicModel.js';
import HighSchoolCurriculum from '../models/highSchoolCurriculumModel.js';
import FirstActivities from '../models/firstMyCollegeActivitiesModel.js';
import FirstContacts from '../models/firstContactsModel.js';
import FirstFamily from '../models/firstFamilyModel.js';
import FirstResidency from '../models/FirstResidencyModel.js';
import InternationalStudent from '../models/InternationalStudentModel.js';
import { sendEmail } from "../utils/sendEmail.js";
import Account from "../models/accountModel.js";


// Get all application data for review
const getApplicationReview = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;

    console.log(`📋 Fetching review data for college: ${collegeId}, student: ${studentId}`);

    // Fetch data from all sections in parallel
    const [
      generalApplication,
      academicApplication,
      highSchoolCurriculum,
      activitiesApplication,
      contactsApplication,
      familyApplication,
      residencyApplication,
      internationalApplication,
      reviewApplication
    ] = await Promise.all([
      GeneralApplication.findOne({ studentId, collegeId }),
      FirstAcademic.findOne({ studentId, collegeId }),
      HighSchoolCurriculum.findOne({ studentId, collegeId }),
      FirstActivities.findOne({ studentId, collegeId }),
      FirstContacts.findOne({ studentId, collegeId }),
      FirstFamily.findOne({ studentId, collegeId }),
      FirstResidency.findOne({ studentId, collegeId }),
      InternationalStudent.findOne({ studentId, collegeId }),
      FirstReview.findOne({ studentId, collegeId })
    ]);

    // ✅ FIXED: Calculate overall progress properly
    const sections = [
      { data: generalApplication, progress: generalApplication?.progress || 0 },
      { data: academicApplication, progress: academicApplication?.progress || 0 },
      { data: highSchoolCurriculum, progress: highSchoolCurriculum?.progress || 0 },
      { data: activitiesApplication, progress: activitiesApplication?.progress || 0 },
      { data: contactsApplication, progress: contactsApplication?.progress || 0 },
      { data: familyApplication, progress: familyApplication?.progress || 0 },
      { data: residencyApplication, progress: residencyApplication?.progress || 0 },
      { data: internationalApplication, progress: internationalApplication?.progress || 0 }
    ];

    const totalProgress = sections.reduce((sum, section) => {
      return sum + section.progress;
    }, 0);
    
    const overallProgress = Math.round(totalProgress / sections.length);

    // ✅ FIXED: Store individual section progress with proper values
    const sectionProgress = {
      general: generalApplication?.progress || 0,
      academics: academicApplication?.progress || 0,
      highSchoolCurriculum: highSchoolCurriculum?.progress || 0,
      activities: activitiesApplication?.progress || 0,
      contacts: contactsApplication?.progress || 0,
      family: familyApplication?.progress || 0,
      residency: residencyApplication?.progress || 0,
      international: internationalApplication?.progress || 0
    };

    // Update or create review record with progress
    let reviewData = reviewApplication;
    if (!reviewData) {
      reviewData = new FirstReview({
        studentId,
        collegeId,
        overallProgress,
        sectionProgress
      });
    } else {
      reviewData.overallProgress = overallProgress;
      reviewData.sectionProgress = sectionProgress;
      reviewData.lastReviewed = new Date();
    }
    await reviewData.save();

    // ✅ FIXED: Prepare response data with proper structure
    const reviewResponse = {
      general: generalApplication || {},
      academics: academicApplication || {},
      'high-school-curriculum': highSchoolCurriculum || {}, // Keep the same key for frontend
      'first-activities': activitiesApplication || {},
      contacts: contactsApplication || {},
      family: familyApplication || {},
      residency: residencyApplication || {},
      international: internationalApplication || {},
      review: reviewData
    };

    res.status(200).json({
      success: true,
      message: 'Application review data fetched successfully',
      reviewData: reviewResponse,
      overallProgress,
      sectionProgress // ✅ ADD: Send section progress to frontend
    });

  } catch (error) {
    console.error('❌ Error fetching application review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application review'
    });
  }
};

const submitApplication = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;

    console.log(`🚀 Submitting application for college: ${collegeId}, student: ${studentId}`);

    // Fetch all required sections
    const [
      generalApplication,
      academicApplication,
      highSchoolCurriculum,
      activitiesApplication,
      contactsApplication,
      familyApplication
    ] = await Promise.all([
      GeneralApplication.findOne({ studentId, collegeId }),
      FirstAcademic.findOne({ studentId, collegeId }),
      HighSchoolCurriculum.findOne({ studentId, collegeId }),
      FirstActivities.findOne({ studentId, collegeId }),
      FirstContacts.findOne({ studentId, collegeId }),
      FirstFamily.findOne({ studentId, collegeId })
    ]);

    const incompleteSections = [];

    if (!generalApplication || generalApplication.progress < 100) incompleteSections.push('general');
    if (!academicApplication || academicApplication.progress < 100) incompleteSections.push('academics');
    if (!highSchoolCurriculum || highSchoolCurriculum.progress < 100) incompleteSections.push('high-school-curriculum');
    if (!activitiesApplication || activitiesApplication.progress < 100) incompleteSections.push('activities');
    if (!contactsApplication || contactsApplication.progress < 100) incompleteSections.push('contacts');
    if (!familyApplication || familyApplication.progress < 100) incompleteSections.push('family');

    if (incompleteSections.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required sections before submitting',
        incompleteSections
      });
    }

    // Update / create review record
    const reviewApplication = await FirstReview.findOneAndUpdate(
      { studentId, collegeId },
      {
        status: 'submitted',
        submittedAt: new Date(),
        lastReviewed: new Date()
      },
      { new: true, upsert: true }
    );

    console.log(`✅ Application submitted successfully for college: ${collegeId}`);

    // --------------------------------
    // 📧 SEND EMAIL (CORRECT WAY)
    // --------------------------------
    try {
      const { email, firstName } = req.user;

      if (email) {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif;">
            <h2>Application Submitted Successfully 🎉</h2>
            <p>Hi ${firstName || 'Student'},</p>
            <p>Your application has been successfully submitted.</p>
            <p><strong>College ID:</strong> ${collegeId}</p>
            <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p>You can log in to your dashboard to track the application status.</p>
            <br/>
            <p>Best regards,<br/><b>Admissions Team</b></p>
          </div>
        `;

        await sendEmail(
          email,
          'Application Submitted Successfully',
          htmlContent
        );

        console.log(`📧 Submission email sent to ${email}`);
      } else {
        console.warn('⚠️ Email not found in req.user');
      }
    } catch (emailError) {
      console.error('❌ Failed to send submission email:', emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Application submitted successfully!',
      submission: {
        id: reviewApplication._id,
        collegeId: reviewApplication.collegeId,
        status: reviewApplication.status,
        submittedAt: reviewApplication.submittedAt
      }
    });

  } catch (error) {
    console.error('❌ Error submitting application:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting application'
    });
  }
};


// Get application status
const getApplicationStatus = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;

    const reviewApplication = await FirstReview.findOne({
      studentId,
      collegeId
    }).select('status submittedAt overallProgress sectionProgress');

    if (!reviewApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      application: reviewApplication
    });

  } catch (error) {
    console.error('❌ Error fetching application status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application status'
    });
  }
};

// Save review notes
const saveReviewNotes = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const studentId = req.user.userId;
    const { reviewNotes } = req.body;

    const reviewApplication = await FirstReview.findOneAndUpdate(
      { studentId, collegeId },
      { 
        reviewNotes,
        lastReviewed: new Date()
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Review notes saved successfully',
      review: reviewApplication
    });

  } catch (error) {
    console.error('❌ Error saving review notes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving review notes'
    });
  }
};

export {
  getApplicationReview,
  submitApplication,
  getApplicationStatus,
  saveReviewNotes
};