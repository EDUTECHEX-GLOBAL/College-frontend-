// E:\COLLEGEAPPLICATION\college-app\src\components\mycollege-sections\FirstReview.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FirstReview.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const Review = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();

  // 🔹 Fixed base path for FIRST-YEAR students
  const basePath = '/firstyear/dashboard';

  const [reviewData, setReviewData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch all application data for review
 const fetchAllApplicationData = async () => {
  setLoading(true);

  const token = localStorage.getItem('token');

  const sections = [
    'general',
    'academics',
    'high-school-curriculum',
    'first-activities',
    'contacts',
    'family',
    'residency',
    'international'
  ];

  try {
    // 🔹 Fetch all sections in parallel
    const fetchPromises = sections.map(async (section) => {
      try {
        const response = await axios.get(`${API_URL}/api/${section}/${collegeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          let sectionData;
          if (section === 'first-activities') {
            sectionData = response.data.activities || {};
          } else if (section === 'high-school-curriculum') {
            sectionData = response.data.highSchoolCurriculum || {};
          } else {
            sectionData = response.data[section] || response.data[`${section}Application`] || {};
          }
          return { section, data: sectionData };
        } else {
          throw new Error(`API returned unsuccessful for ${section}`);
        }
      } catch (apiError) {
        console.warn(`Error fetching ${section} from API:`, apiError);

        // 🔹 Fallback to localStorage
        const localStorageKey = section === 'first-activities' ? 'activities' : section.replace(/-/g, '_');
        const localStorageData = localStorage.getItem(`college_${collegeId}_${localStorageKey}`);
        if (localStorageData) {
          try {
            return { section, data: JSON.parse(localStorageData) };
          } catch (parseError) {
            console.error(`Error parsing localStorage data for ${section}:`, parseError);
            return { section, data: {} };
          }
        }

        return { section, data: {} }; // Default empty object
      }
    });

    // Wait for all sections to fetch
    const results = await Promise.all(fetchPromises);

    // Combine into a single object
    const allData = results.reduce((acc, curr) => {
      acc[curr.section] = curr.data;
      return acc;
    }, {});

    setReviewData(allData);

    // 🔹 Fetch overall progress
    try {
      const reviewResponse = await axios.get(`${API_URL}/api/review/${collegeId}/review`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (reviewResponse.data.success) {
        setProgress(reviewResponse.data.overallProgress || 0);
      } else {
        setProgress(0);
      }
    } catch (progressError) {
      console.warn('Error fetching progress:', progressError);
      setProgress(0);
    }

  } catch (error) {
    console.error('Unexpected error fetching application data:', error);
    setProgress(0);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchAllApplicationData();
  }, [collegeId]);

  // Format display values
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return 'Not provided';
    if (Array.isArray(value)) {
      const filteredValues = value.filter(item => item && item !== '');
      return filteredValues.length > 0 ? filteredValues.join(', ') : 'Not provided';
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return Object.keys(value).length > 0 ? JSON.stringify(value) : 'Not provided';
    return value.toString();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Handle application submission
  const handleSubmitApplication = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/api/review/${collegeId}/submit`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Application submitted successfully!');
        // ✅ After submit, go to "My Colleges - Overview" (First-Year)
        navigate(`${basePath}/colleges`);
      } else {
        alert('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      if (error.response && error.response.data && error.response.data.incompleteSections) {
        alert(`Please complete these sections before submitting: ${error.response.data.incompleteSections.join(', ')}`);
      } else {
        alert('Failed to submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle save and close
  const handleSaveAndClose = () => {
    // ✅ Back to this college's details for First-Year dashboard
    navigate(`${basePath}/colleges/${collegeId}`);
  };

  // Handle edit section
  const handleEditSection = (section) => {
    // ✅ Edit section under First-Year dashboard
    navigate(`${basePath}/colleges/${collegeId}/${section}`);
  };

  if (loading) {
    return (
      <div className="review-container">
        <div className="review-loading">
          <div className="review-loading-spinner"></div>
          <p>Loading application review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      {/* Header Section */}
      <div className="review-header">
        <div className="review-header-nav">
          <button
            className="review-back-button"
            onClick={() => navigate(`${basePath}/colleges/${collegeId}`)}
          >
            ← Back to College Details
          </button>
        </div>
        
        <div className="review-header-info">
          <h1 className="review-title">Review and Submit Application</h1>
          <div className="review-status">
            {/* <span className="status-indicator">● Ready for Review</span> */}
          </div>
          <p className="review-description">
            Please review all your application information before submitting. You can edit any section by clicking the "Edit" button.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="review-content">
        <div className="review-progress">
          <span className="review-progress-text">Application Progress: {progress}%</span>
          <div className="review-progress-bar">
            <div className="review-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Review Sections */}
        <section className="review-form-section">
          <h2 className="review-section-title">Application Summary</h2>
          
          {/* General Section Review */}
          <div className="review-section-card">
            <div className="review-section-header">
              <h3 className="review-section-name">General Information</h3>
              <button 
                className="review-edit-button"
                onClick={() => handleEditSection('general')}
              >
                Edit
              </button>
            </div>
            <div className="review-section-content">
              <div className="review-item">
                <span className="review-label">Start Term:</span>
                <span className="review-value">{formatValue(reviewData.general?.startTerm)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Housing Preference:</span>
                <span className="review-value">{formatValue(reviewData.general?.housingPreference)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Program Participation:</span>
                <span className="review-value">{formatValue(reviewData.general?.participationPrograms)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">FAFSA Intent:</span>
                <span className="review-value">{formatValue(reviewData.general?.fafsaIntent)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Visa Classification:</span>
                <span className="review-value">{formatValue(reviewData.general?.visaClassification)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Application Reasons:</span>
                <span className="review-value">{formatValue(reviewData.general?.applicationReason)}</span>
              </div>
            </div>
          </div>

          {/* Academics Section Review */}
          <div className="review-section-card">
            <div className="review-section-header">
              <h3 className="review-section-name">Academics</h3>
              <button 
                className="review-edit-button"
                onClick={() => handleEditSection('academics')}
              >
                Edit
              </button>
            </div>
            <div className="review-section-content">
              <div className="review-item">
                <span className="review-label">School/Department:</span>
                <span className="review-value">{formatValue(reviewData.academics?.schoolDepartment)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Major:</span>
                <span className="review-value">{formatValue(reviewData.academics?.major)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Subplan:</span>
                <span className="review-value">{formatValue(reviewData.academics?.subplan)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Pre-Professional:</span>
                <span className="review-value">{formatValue(reviewData.academics?.preProfessional)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Honors Program:</span>
                <span className="review-value">{formatValue(reviewData.academics?.honorsProgram)}</span>
              </div>
              {reviewData.academics?.algebraGrade && (
                <div className="review-item">
                  <span className="review-label">Algebra Grade (B or higher):</span>
                  <span className="review-value">{formatValue(reviewData.academics.algebraGrade)}</span>
                </div>
              )}
              {reviewData.academics?.calculusGrade && (
                <div className="review-item">
                  <span className="review-label">Calculus Grade (C or higher):</span>
                  <span className="review-value">{formatValue(reviewData.academics.calculusGrade)}</span>
                </div>
              )}
            </div>
          </div>

          {/* High School Curriculum Review */}
          <div className="review-section-card">
            <div className="review-section-header">
              <h3 className="review-section-name">High School Curriculum</h3>
              <button 
                className="review-edit-button"
                onClick={() => handleEditSection('high-school')}
              >
                Edit
              </button>
            </div>
            <div className="review-section-content">
              <div className="review-item">
                <span className="review-label">World Language Years:</span>
                <span className="review-value">{formatValue(reviewData['high-school-curriculum']?.worldLanguageYears)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Honors Courses:</span>
                <span className="review-value">{formatValue(reviewData['high-school-curriculum']?.honorsCourses)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">College Credit Courses:</span>
                <span className="review-value">{formatValue(reviewData['high-school-curriculum']?.collegeCreditCourses)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">AP Courses:</span>
                <span className="review-value">{formatValue(reviewData['high-school-curriculum']?.apCourses)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">IB Courses:</span>
                <span className="review-value">{formatValue(reviewData['high-school-curriculum']?.ibCourses)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">IB Diploma:</span>
                <span className="review-value">{formatValue(reviewData['high-school-curriculum']?.ibDiploma)}</span>
              </div>
            </div>
          </div>

          {/* Activities Review */}
          <div className="review-section-card">
            <div className="review-section-header">
              <h3 className="review-section-name">Activities</h3>
              <button 
                className="review-edit-button"
                onClick={() => handleEditSection('activities')}
              >
                Edit
              </button>
            </div>
            <div className="review-section-content">
              {reviewData['first-activities']?.activities ? (
                reviewData['first-activities'].activities
                  .filter(activity => activity && activity !== "")
                  .map((activity, index) => (
                    <div key={index} className="review-item">
                      <span className="review-label">Activity {index + 1}:</span>
                      <span className="review-value">{activity}</span>
                    </div>
                  ))
              ) : (
                <div className="review-item">
                  <span className="review-value">No activities selected</span>
                </div>
              )}
              {reviewData['first-activities']?.activities && 
               reviewData['first-activities'].activities.filter(a => a && a !== "").length === 0 && (
                <div className="review-item">
                  <span className="review-value">No activities selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Contacts Review */}
          <div className="review-section-card">
            <div className="review-section-header">
              <h3 className="review-section-name">Contacts</h3>
              <button 
                className="review-edit-button"
                onClick={() => handleEditSection('contacts')}
              >
                Edit
              </button>
            </div>
            <div className="review-section-content">
              <div className="review-item">
                <span className="review-label">Text Message Permission:</span>
                <span className="review-value">{formatValue(reviewData.contacts?.textMessagePermission)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Twitter Handle:</span>
                <span className="review-value">
                  {reviewData.contacts?.hasTwitter === 'yes' ? formatValue(reviewData.contacts.twitterHandle) : 'No'}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">Snapchat Username:</span>
                <span className="review-value">
                  {reviewData.contacts?.hasSnapchat === 'yes' ? formatValue(reviewData.contacts.snapchatUsername) : 'No'}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">Instagram Username:</span>
                <span className="review-value">
                  {reviewData.contacts?.hasInstagram === 'yes' ? formatValue(reviewData.contacts.instagramUsername) : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Family Review */}
          <div className="review-section-card">
            <div className="review-section-header">
              <h3 className="review-section-name">Family Information</h3>
              <button 
                className="review-edit-button"
                onClick={() => handleEditSection('family')}
              >
                Edit
              </button>
            </div>
            <div className="review-section-content">
              <div className="review-item">
                <span className="review-label">Parent/Guardian Address:</span>
                <span className="review-value">{formatValue(reviewData.family?.parentGuardianAddress)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">KU Graduates in Family:</span>
                <span className="review-value">{formatValue(reviewData.family?.kuGraduates)}</span>
              </div>
              <div className="review-item">
                <span className="review-label">KU Employee Dependent:</span>
                <span className="review-value">{formatValue(reviewData.family?.kuEmployeeDependent)}</span>
              </div>
              {reviewData.family?.kuEmployeeDependent === 'yes' && (
                <>
                  <div className="review-item">
                    <span className="review-label">KU Employee Name:</span>
                    <span className="review-value">{formatValue(reviewData.family.kuEmployeeName)}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">KU Employee Location:</span>
                    <span className="review-value">{formatValue(reviewData.family.kuEmployeeLocation)}</span>
                  </div>
                </>
              )}
              <div className="review-item">
                <span className="review-label">Military Dependent:</span>
                <span className="review-value">{formatValue(reviewData.family?.militaryDependent)}</span>
              </div>
              {reviewData.family?.militaryDependent === 'yes' && (
                <>
                  <div className="review-item">
                    <span className="review-label">Military Status:</span>
                    <span className="review-value">{formatValue(reviewData.family.militaryStatus)}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">VA Benefits Intent:</span>
                    <span className="review-value">{formatValue(reviewData.family.vaBenefitsIntent)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Residency Review */}
          <div className="review-section-card">
            <div className="review-section-header">
              <h3 className="review-section-name">Residency</h3>
              <button 
                className="review-edit-button"
                onClick={() => handleEditSection('residency')}
              >
                Edit
              </button>
            </div>
            <div className="review-section-content">
              <div className="review-item">
                <span className="review-label">Qualify for In-State Tuition:</span>
                <span className="review-value">{formatValue(reviewData.residency?.qualifyInStateTuition)}</span>
              </div>
              {reviewData.residency?.qualifyInStateTuition === 'yes' && (
                <>
                  <div className="review-item">
                    <span className="review-label">Kansas Resident:</span>
                    <span className="review-value">{formatValue(reviewData.residency.kansasResident)}</span>
                  </div>
                  {reviewData.residency.kansasResident === 'yes' && (
                    <div className="review-item">
                      <span className="review-label">Lived in Kansas Since Birth:</span>
                      <span className="review-value">{formatValue(reviewData.residency.livedInKansasSinceBirth)}</span>
                    </div>
                  )}
                  {reviewData.residency.kansasResident === 'no' && (
                    <div className="review-item">
                      <span className="review-label">Ever Lived in Kansas:</span>
                      <span className="review-value">{formatValue(reviewData.residency.everLivedInKansas)}</span>
                    </div>
                  )}
                  {(reviewData.residency.kansasResidenceStartDate || reviewData.residency.kansasResidenceEndDate) && (
                    <>
                      <div className="review-item">
                        <span className="review-label">Kansas Residence Start:</span>
                        <span className="review-value">{formatDate(reviewData.residency.kansasResidenceStartDate)}</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Kansas Residence End:</span>
                        <span className="review-value">{formatDate(reviewData.residency.kansasResidenceEndDate)}</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* International Student Review (if applicable) */}
          {reviewData.general?.visaClassification === 'yes' && (
            <div className="review-section-card">
              <div className="review-section-header">
                <h3 className="review-section-name">International Student Information</h3>
                <button 
                  className="review-edit-button"
                  onClick={() => handleEditSection('international')}
                >
                  Edit
                </button>
              </div>
              <div className="review-section-content">
                <div className="review-item">
                  <span className="review-label">High School Graduated:</span>
                  <span className="review-value">{formatValue(reviewData.international?.highSchoolGraduated)}</span>
                </div>
                {reviewData.international?.highSchoolGraduated === 'yes' && (
                  <div className="review-item">
                    <span className="review-label">Classes Since Graduation:</span>
                    <span className="review-value">{formatValue(reviewData.international.attendedClassesSinceGraduation)}</span>
                  </div>
                )}
                <div className="review-item">
                  <span className="review-label">Requested Immigration Status:</span>
                  <span className="review-value">{formatValue(reviewData.international?.requestedImmigrationStatus)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Currently in US:</span>
                  <span className="review-value">{formatValue(reviewData.international?.currentlyInUS)}</span>
                </div>
                {reviewData.international?.currentlyInUS === 'yes' && (
                  <div className="review-item">
                    <span className="review-label">Current Immigration Status:</span>
                    <span className="review-value">{formatValue(reviewData.international.currentImmigrationStatus)}</span>
                  </div>
                )}
                <div className="review-item">
                  <span className="review-label">Heard About KU:</span>
                  <span className="review-value">{formatValue(reviewData.international?.hearAboutKU)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Application Fee Agreement:</span>
                  <span className="review-value">{formatValue(reviewData.international?.applicationFeeAgreement)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Certification Agreement:</span>
                  <span className="review-value">{formatValue(reviewData.international?.certificationAgreement)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Third Party Preparation:</span>
                  <span className="review-value">{formatValue(reviewData.international?.thirdPartyPreparation)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Final Submission Section */}
          <div className="review-submission-section">
            <h3 className="review-submission-title">Ready to Submit</h3>
            <div className="review-submission-content">
              <p className="review-submission-description">
                By submitting this application, you certify that all information provided is true and complete to the best of your knowledge.
              </p>
              <div className="review-submission-actions">
                <button 
                  className="review-secondary-button" 
                  onClick={handleSaveAndClose}
                  disabled={submitting}
                >
                  Save and Close
                </button>
                <button 
                  className="review-primary-button" 
                  onClick={handleSubmitApplication}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Review;
