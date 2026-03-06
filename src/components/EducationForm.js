// src/components/EducationForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './EducationForm.css';

// Import all education section components
import CurrentSchoolSection from './education-sections/CurrentSchoolSection';
import OtherSchoolsSection from './education-sections/OtherSchoolsSection';
import CollegesSection from './education-sections/CollegesSection';
import GradesSection from './education-sections/GradesSection';
import CurrentCoursesSection from './education-sections/CurrentCoursesSection';
import HonorsSection from './education-sections/HonorsSection';
import CommunityOrganizationsSection from './education-sections/CommunityOrganizationsSection';
import FuturePlansSection from './education-sections/FuturePlansSection';
import DocumentsUploadSection from './education-sections/DocumentsUploadSection';
import EducationPreview from './EducationPreview';

const API_URL = process.env.REACT_APP_API_BASE_URL
;

// Section name mapping - URL names to database field names
const SECTION_NAME_MAP = {
  'current-school': 'currentSchool',
  'other-schools': 'otherSchools', 
  'colleges': 'colleges',
  'grades': 'grades',
  'current-courses': 'currentCourses',
  'honors': 'honors',
  'community-organizations': 'communityOrganizations',
  'future-plans': 'futurePlans',
  'documents': 'documents'
};

// Reverse mapping - database field names to URL names
const REVERSE_SECTION_MAP = {
  'currentSchool': 'current-school',
  'otherSchools': 'other-schools', 
  'colleges': 'colleges',
  'grades': 'grades',
  'currentCourses': 'current-courses',
  'honors': 'honors',
  'communityOrganizations': 'community-organizations',
  'futurePlans': 'future-plans',
  'documents': 'documents'
};

const EducationForm = () => {
  const navigate = useNavigate();
  const { '*': urlSection } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Convert URL section to database section name
  const activeSection = SECTION_NAME_MAP[urlSection] || 'currentSchool';

  // Define all education sections in database field names
  const sections = [
    'currentSchool',
    'otherSchools', 
    'colleges',
    'grades',
    'currentCourses',
    'honors',
    'communityOrganizations',
    'futurePlans',
    'documents'
  ];

  // Main education form state
  const [educationData, setEducationData] = useState({
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
    otherSchools: {
      numberOfSchools: 0,
      schools: []
    },
    colleges: {
      numberOfColleges: 0,
      collegesList: []
    },
    grades: {
      graduatingClassSize: '',
      classRankReporting: '',
      classRank: '',
      gpaScale: '',
      cumulativeGPA: '',
      gpaWeighting: '',
      gpaMaxScale: ''
    },
    currentCourses: {
      numberOfCourses: 0,
      schedulingSystem: '',
      courses: []
    },
    honors: {
      reportHonors: '',
      honorsList: []
    },
    communityOrganizations: {
      numberOfOrganizations: 0,
      organizations: []
    },
    futurePlans: {
      studentType: '',
      highestDegree: '',
      careerInterest: '',
      additionalInterests: []
    },
    documents: {
      passport: null,
      tenthMarksheet: null,
      twelfthMarksheet: null,
      additionalDocuments: []
    },
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
    },
    overallProgress: 0
  });

  // Load education data from API
  useEffect(() => {
    const fetchEducationData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/sign-in');
          return;
        }

        const response = await axios.get(`${API_URL}/api/education`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success && response.data.education) {
          setEducationData(prev => ({
            ...prev,
            ...response.data.education
          }));
          setProgress(response.data.education.overallProgress || 0);
        }
      } catch (error) {
        console.error('Error fetching education data:', error);
        setMessage({ type: 'error', text: 'Failed to load education data' });
      } finally {
        setLoading(false);
      }
    };

    fetchEducationData();
  }, [navigate]);

  // Set active section based on URL
  useEffect(() => {
    if (!urlSection) {
      navigate('/firstyear/dashboard/education/current-school', { replace: true });
    }
  }, [urlSection, navigate]);

  // Save section data to backend
  const saveSectionToBackend = async (sectionName, sectionData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/sign-in');
        return false;
      }

      const response = await axios.put(
        `${API_URL}/api/education/update`,
        {
          section: sectionName,  // Use database field name directly
          data: sectionData
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setProgress(response.data.progress);
        // Update education completion data
        setEducationData(prev => ({
          ...prev,
          educationCompletion: response.data.education.educationCompletion,
          overallProgress: response.data.progress
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error saving ${sectionName}:`, error);
      setMessage({ 
        type: 'error', 
        text: `Failed to save ${sectionName.replace(/([A-Z])/g, ' $1').toLowerCase()}` 
      });
      return false;
    }
  };

  // Handler functions
  const handleInputChange = async (section, field, value) => {
    const updatedData = {
      ...educationData,
      [section]: {
        ...educationData[section],
        [field]: value
      }
    };
    
    setEducationData(updatedData);
    
    // Auto-save after change with debounce
    setTimeout(async () => {
      await saveSectionToBackend(section, updatedData[section]);
    }, 1000);
  };

  const handleNestedChange = async (section, subSection, field, value) => {
    const updatedData = {
      ...educationData,
      [section]: {
        ...educationData[section],
        [subSection]: {
          ...educationData[section][subSection],
          [field]: value
        }
      }
    };
    
    setEducationData(updatedData);
    
    setTimeout(async () => {
      await saveSectionToBackend(section, updatedData[section]);
    }, 1000);
  };

  const handleArrayChange = async (section, arrayField, index, field, value) => {
    const updatedArray = [...educationData[section][arrayField]];
    updatedArray[index] = {
      ...updatedArray[index],
      [field]: value
    };
    
    const updatedData = {
      ...educationData,
      [section]: {
        ...educationData[section],
        [arrayField]: updatedArray
      }
    };
    
    setEducationData(updatedData);
    
    setTimeout(async () => {
      await saveSectionToBackend(section, updatedData[section]);
    }, 1000);
  };

  const addArrayItem = async (section, arrayField, newItem) => {
    const updatedData = {
      ...educationData,
      [section]: {
        ...educationData[section],
        [arrayField]: [...educationData[section][arrayField], newItem],
        [`numberOf${arrayField.charAt(0).toUpperCase() + arrayField.slice(1)}`]: 
          educationData[section][arrayField].length + 1
      }
    };
    
    setEducationData(updatedData);
    
    const success = await saveSectionToBackend(section, updatedData[section]);
    if (success) {
      setMessage({ type: 'success', text: 'Item added successfully' });
    }
  };

  const removeArrayItem = async (section, arrayField, index) => {
    const updatedArray = educationData[section][arrayField].filter((_, i) => i !== index);
    const updatedData = {
      ...educationData,
      [section]: {
        ...educationData[section],
        [arrayField]: updatedArray,
        [`numberOf${arrayField.charAt(0).toUpperCase() + arrayField.slice(1)}`]: updatedArray.length
      }
    };
    
    setEducationData(updatedData);
    
    const success = await saveSectionToBackend(section, updatedData[section]);
    if (success) {
      setMessage({ type: 'success', text: 'Item removed successfully' });
    }
  };

  // Validation for each section
  const validateSection = (sectionName) => {
    const section = educationData[sectionName];
    
    switch (sectionName) {
      case 'currentSchool':
        return section.schoolName && section.dateOfEntry;
      
      case 'grades':
        return section.cumulativeGPA && section.gpaScale;
      
      case 'futurePlans':
        return section.highestDegree && section.careerInterest;
      
      case 'documents':
        return section.passport && section.tenthMarksheet;
      
      default:
        return true; // Other sections are optional or have different validation
    }
  };

  const handleSaveSection = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Validate current section
    if (!validateSection(activeSection)) {
      setMessage({ 
        type: 'error', 
        text: 'Please fill all required fields before continuing' 
      });
      setSaving(false);
      return;
    }

    // Save current section
    const success = await saveSectionToBackend(activeSection, educationData[activeSection]);
    
    if (success) {
      setMessage({ type: 'success', text: 'Section saved successfully' });
    }
    
    setSaving(false);
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Validate current section
    if (!validateSection(activeSection)) {
      setMessage({ 
        type: 'error', 
        text: 'Please fill all required fields before continuing' 
      });
      setSaving(false);
      return;
    }

    // Save current section
    const success = await saveSectionToBackend(activeSection, educationData[activeSection]);
    
    if (success) {
      setMessage({ type: 'success', text: 'Section saved successfully' });
      
      // Navigate to next section or show preview
      const currentIndex = sections.indexOf(activeSection);
      if (currentIndex < sections.length - 1) {
        const nextSection = sections[currentIndex + 1];
        const nextUrlSection = REVERSE_SECTION_MAP[nextSection];
        navigate(`/firstyear/dashboard/education/${nextUrlSection}`);
      } else {
        setShowPreview(true);
      }
    }
    
    setSaving(false);
  };

  const handleFinalSubmit = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/sign-in');
        return;
      }

      // Check if all sections are completed
      const allCompleted = educationData.educationCompletion && 
        Object.values(educationData.educationCompletion).every(Boolean);
      
      if (!allCompleted) {
        setMessage({ 
          type: 'error', 
          text: 'Please complete all sections before submitting' 
        });
        setSaving(false);
        return;
      }

      // Here you can add any final submission logic
      // For now, we'll just show a success message and update the progress
      setMessage({ 
        type: 'success', 
        text: 'Education information submitted successfully! You can now proceed with your college applications.' 
      });

      // Update the education data to mark as submitted
      const updatedData = {
        ...educationData,
        submitted: true,
        submittedAt: new Date().toISOString()
      };
      
      setEducationData(updatedData);

      // Optionally navigate back to dashboard after successful submission
      setTimeout(() => {
        navigate('/firstyear/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Error submitting education information:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to submit education information. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/firstyear/dashboard');
  };

  const handleEditSection = (section) => {
    setShowPreview(false);
    const urlSection = REVERSE_SECTION_MAP[section];
    navigate(`/firstyear/dashboard/education/${urlSection}`);
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
    const commonProps = {
      educationData,
      handleInputChange,
      handleNestedChange,
      handleArrayChange,
      addArrayItem,
      removeArrayItem
    };

    switch (activeSection) {
      case 'currentSchool':
        return <CurrentSchoolSection {...commonProps} />;
      case 'otherSchools':
        return <OtherSchoolsSection {...commonProps} />;
      case 'colleges':
        return <CollegesSection {...commonProps} />;
      case 'grades':
        return <GradesSection {...commonProps} />;
      case 'currentCourses':
        return <CurrentCoursesSection {...commonProps} />;
      case 'honors':
        return <HonorsSection {...commonProps} />;
      case 'communityOrganizations':
        return <CommunityOrganizationsSection {...commonProps} />;
      case 'futurePlans':
        return <FuturePlansSection {...commonProps} />;
      case 'documents':
        return <DocumentsUploadSection {...commonProps} />;
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
                onClick={handleSaveSection}
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
                {saving ? 'Saving...' : (isLastSection ? 'Save & Preview' : 'Save & Continue →')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EducationForm;