// src/components/EducationForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './Education.css';

// Import all education section components
import CurrentSchoolSection from './educationsection/CurrentSchool';
import OtherSchoolsSection from './educationsection/OtherSchools';
import CollegesSection from './educationsection/Colleges';
import GradesSection from './educationsection/Grades';
import CurrentCoursesSection from './educationsection/CurrentCourses';
import HonorsSection from './educationsection/Honors';
import CommunityOrganizationsSection from './educationsection/CommunityOrganizations';
import FuturePlansSection from './educationsection/FuturePlans';
import DocumentsUploadSection from './educationsection/DocumentsUpload';
import EducationPreview from './EducationPre';

const EducationForm = () => {
  const navigate = useNavigate();
  const { '*': section } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('current-school');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Define all education sections in order
  const sections = [
    'current-school',
    'other-schools',
    'colleges',
    'grades',
    'current-courses',
    'honors',
    'community-organizations',
    'future-plans',
    'documents'
  ];

  // Main education form state
  const [educationData, setEducationData] = useState({
    // Current or Most Recent Secondary/High School
    currentSchool: {
      schoolName: '',
      schoolCEEBCode: '',
      dateOfEntry: '',
      isBoardingSchool: '',
      liveOnCampus: '',
      willGraduate: '',
      graduationDate: '',
      schoolAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },

    // Other Secondary/High Schools
    otherSchools: {
      numberOfSchools: 0,
      schools: []
    },

    // Colleges & Universities
    colleges: {
      numberOfColleges: 0,
      collegesList: []
    },

    // Grades
    grades: {
      graduatingClassSize: '',
      classRankReporting: '',
      classRank: '',
      gpaScale: '',
      cumulativeGPA: '',
      gpaWeighting: '',
      gpaMaxScale: ''
    },

    // Current or Most Recent Year Courses
    currentCourses: {
      numberOfCourses: 0,
      schedulingSystem: '',
      courses: []
    },

    // Honors
    honors: {
      reportHonors: '',
      honorsList: []
    },

    // Community-Based Organizations
    communityOrganizations: {
      numberOfOrganizations: 0,
      organizations: []
    },

    // Future Plans
    futurePlans: {
      studentType: '',
      highestDegree: '',
      careerInterest: '',
      additionalInterests: []
    },

    // Documents Upload
    documents: {
      passport: null,
      tenthMarksheet: null,
      twelfthMarksheet: null,
      otherDocuments: []
    },

    // Education Completion Tracking
    educationCompletion: {
      currentSchool: false,
      otherSchools: false,
      colleges: false,
      grades: false,
      currentCourses: false,
      honors: false,
      communityOrganizations: false,
      futurePlans: false,
      documents: false
    }
  });

  // Set active section based on URL with correct path
  useEffect(() => {
    if (section) {
      setActiveSection(section);
    } else {
      navigate('/transfer/dashboard/education/current-school', { replace: true });
    }
  }, [section, navigate]);

  // Fetch existing education data
  const fetchEducationData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      console.log('📥 Fetching education data...');

      const response = await axiosInstance.get('/api/education-transfer');

      console.log('✅ Education data received:', response.data);

      if (response.data.success && response.data.education) {
        setEducationData(response.data.education);
        const serverProgress = response.data.educationProgress || 0;
        setProgress(serverProgress);
        console.log('📊 Education progress:', serverProgress);

        // NEW: persist progress locally so Dashboard can merge it on next load
        try {
          const storedUser = localStorage.getItem('userData');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            localStorage.setItem(
              'userData',
              JSON.stringify({ ...parsed, educationProgress: serverProgress })
            );
          }
        } catch (e) {
          console.error('Error storing educationProgress in localStorage', e);
        }

        // 🔔 Notify dashboard on initial load as well
        window.dispatchEvent(
          new CustomEvent('educationProgressUpdate', {
            detail: { educationProgress: serverProgress }
          })
        );
      }
    } catch (error) {
      console.error('❌ Error fetching education:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);

      if (error.response?.status === 401) {
        console.error('❌ Unauthorized - redirecting to sign-in');
        localStorage.removeItem('token');
        navigate('/sign-in');
        return;
      }

      setMessage({
        type: 'error',
        text: 'Failed to load education data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch education data on component mount
  useEffect(() => {
    fetchEducationData();
  }, []);

  // Handler functions
  const handleInputChange = (section, field, value) => {
    setEducationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedChange = (section, subSection, field, value) => {
    setEducationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...prev[section][subSection],
          [field]: value
        }
      }
    }));
  };

  const handleArrayChange = (section, arrayField, index, field, value) => {
    setEducationData(prev => {
      const updatedArray = [...prev[section][arrayField]];
      updatedArray[index] = {
        ...updatedArray[index],
        [field]: value
      };
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [arrayField]: updatedArray
        }
      };
    });
  };

  const addArrayItem = (section, arrayField, newItem) => {
    setEducationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [arrayField]: [...prev[section][arrayField], newItem]
      }
    }));
  };

  const removeArrayItem = (section, arrayField, index) => {
    setEducationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [arrayField]: prev[section][arrayField].filter((_, i) => i !== index)
      }
    }));
  };

  // Save education function
  const saveEducation = async (section = null) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        navigate('/sign-in');
        return;
      }

      console.log('💾 Saving education data...');

      const response = await axiosInstance.put('/api/education-transfer', educationData);

      console.log('✅ Backend response:', response.data);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Education data saved successfully!'
        });

        // Use backend educationProgress
        const newProgress =
          response.data.educationProgress ||
          response.data.progress?.education ||
          0;

        setProgress(newProgress);
        console.log('📊 Updated progress:', newProgress);

        // NEW: persist progress locally
        try {
          const storedUser = localStorage.getItem('userData');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            localStorage.setItem(
              'userData',
              JSON.stringify({ ...parsed, educationProgress: newProgress })
            );
          }
        } catch (e) {
          console.error('Error storing educationProgress in localStorage', e);
        }

        // 🔔 Notify dashboard about updated education progress
        window.dispatchEvent(
          new CustomEvent('educationProgressUpdate', {
            detail: { educationProgress: newProgress }
          })
        );

        console.log('✅ Education saved');

        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save education');
      }
    } catch (error) {
      console.error('❌ Error saving education:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);

      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save education. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Save and Continue with correct navigation
  const handleSaveAndContinue = () => {
    saveEducation(activeSection);

    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex < sections.length - 1) {
      setTimeout(() => {
        navigate(`/transfer/dashboard/education/${sections[currentIndex + 1]}`);
      }, 500);
    } else {
      setShowPreview(true);
    }
  };

  const handleSaveOnly = () => {
    saveEducation(activeSection);
  };

  // Back to Dashboard with correct path
  const handleBackToDashboard = () => {
    navigate('/transfer/dashboard');
  };

  // Edit Section with correct path
  const handleEditSection = (section) => {
    setShowPreview(false);
    navigate(`/transfer/dashboard/education/${section}`);
  };

  // Final Submit with correct redirect
  const handleFinalSubmit = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('⚠️ No token found - redirecting to sign-in');
        setMessage({
          type: 'error',
          text: 'Session expired. Please sign in again.'
        });
        setTimeout(() => {
          navigate('/sign-in');
        }, 2000);
        return;
      }

      console.log('🎯 Final education submission...');

      const finalCompletion = {
        currentSchool: true,
        otherSchools: true,
        colleges: true,
        grades: true,
        currentCourses: true,
        honors: true,
        communityOrganizations: true,
        futurePlans: true,
        documents: true
      };

      const finalData = {
        ...educationData,
        educationCompletion: finalCompletion
      };

      const response = await axiosInstance.put('/api/education-transfer', finalData);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: '🎉 Education information completed successfully!'
        });

        setProgress(100);

        // NEW: persist final 100% locally
        try {
          const storedUser = localStorage.getItem('userData');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            localStorage.setItem(
              'userData',
              JSON.stringify({ ...parsed, educationProgress: 100 })
            );
          }
        } catch (e) {
          console.error('Error storing final educationProgress in localStorage', e);
        }

        // 🔔 Notify dashboard that education is fully complete
        window.dispatchEvent(
          new CustomEvent('educationProgressUpdate', {
            detail: { educationProgress: 100 }
          })
        );

        console.log('✅ Education submitted successfully!');
        console.log('🔄 Redirecting to dashboard in 3 seconds...');

        setTimeout(() => {
          navigate('/transfer/dashboard');
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save education');
      }
    } catch (error) {
      console.error('❌ Error submitting education:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to submit education. Please try again.';
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  // Check if current section is the last one
  const isLastSection = activeSection === sections[sections.length - 1];

  if (loading) {
    return (
      <div className="education-loading">
        <div className="loading-spinner"></div>
        <p>Loading your education information...</p>
      </div>
    );
  }

  // Render the active section component
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'current-school':
        return (
          <CurrentSchoolSection
            educationData={educationData}
            handleInputChange={handleInputChange}
            handleNestedChange={handleNestedChange}
          />
        );
      case 'other-schools':
        return (
          <OtherSchoolsSection
            educationData={educationData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      case 'colleges':
        return (
          <CollegesSection
            educationData={educationData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      case 'grades':
        return (
          <GradesSection
            educationData={educationData}
            handleInputChange={handleInputChange}
          />
        );
      case 'current-courses':
        return (
          <CurrentCoursesSection
            educationData={educationData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      case 'honors':
        return (
          <HonorsSection
            educationData={educationData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      case 'community-organizations':
        return (
          <CommunityOrganizationsSection
            educationData={educationData}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      case 'future-plans':
        return (
          <FuturePlansSection
            educationData={educationData}
            handleInputChange={handleInputChange}
          />
        );
      case 'documents':
        return (
          <DocumentsUploadSection
            educationData={educationData}
            handleInputChange={handleInputChange}
          />
        );
      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <div className="education-container">
      {/* Header with Back Button and Centered Title */}
      <div className="education-header">
        <button className="back-button" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>Complete your Education Information</h1>
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress}% Complete</span>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="education-content">
        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        {showPreview ? (
          <EducationPreview
            educationData={educationData}
            onEditSection={handleEditSection}
            onBackToForm={handleBackToForm}
            onFinalSubmit={handleFinalSubmit}
            saving={saving}
            message={message}
          />
        ) : (
          <>
            {renderActiveSection()}

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleSaveOnly}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Section'}
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={handleSaveAndContinue}
                disabled={saving}
              >
                {isLastSection ? 'Save & Preview' : 'Save & Continue →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EducationForm;
