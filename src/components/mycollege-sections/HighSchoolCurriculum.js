import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import './HighSchoolCurriculum.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const HighSchoolCurriculum = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    worldLanguageYears: '',
    honorsCourses: '',
    collegeCreditCourses: '',
    apCourses: '',
    ibCourses: '',
    ibDiploma: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  // Function to determine base path from current URL
  const getBasePath = () => {
    const path = location.pathname;
    
    // Extract the base path by finding the pattern
    const match = path.match(/\/(firstyear|transfer|dashboard-test)\/dashboard/);
    
    if (match) {
      return `/${match[1]}/dashboard`;
    }
    
    // Default to firstyear if pattern not found
    return '/firstyear/dashboard';
  };

  // Language year options for react-select
  const languageYearOptions = [
    { label: '1 year or less', value: '1-year-or-less' },
    { label: '2 years', value: '2-years' },
    { label: '3 years', value: '3-years' },
    { label: '4+ years', value: '4-plus-years' }
  ];

  // Yes/No options for react-select
  const yesNoOptions = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ];

  // Custom styles for react-select
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      border: state.isFocused ? '1px solid #2563eb' : '1px solid #d1d5db',
      borderRadius: '6px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#2563eb' : '#9ca3af'
      },
      backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
      cursor: 'pointer'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6b7280',
      fontSize: '14px'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#111827',
      fontSize: '14px'
    }),
    input: (base) => ({
      ...base,
      color: '#111827',
      fontSize: '14px'
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '6px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      marginTop: '4px',
      zIndex: 100,
      maxHeight: '250px',
      overflow: 'hidden'
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      maxHeight: '242px'
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '14px',
      padding: '10px 12px',
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#111827',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#dbeafe'
      }
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? '#2563eb' : '#6b7280',
      padding: '8px',
      transition: 'transform 0.2s ease',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'none',
      '&:hover': {
        color: '#2563eb'
      }
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    clearIndicator: (base) => ({
      ...base,
      color: '#6b7280',
      padding: '8px',
      cursor: 'pointer',
      '&:hover': {
        color: '#dc2626'
      }
    })
  };

  // Fetch high school curriculum data from backend
  const fetchHighSchoolCurriculum = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/high-school-curriculum/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { highSchoolCurriculum } = response.data;
        setFormData({
          worldLanguageYears: highSchoolCurriculum.worldLanguageYears || '',
          honorsCourses: highSchoolCurriculum.honorsCourses || '',
          collegeCreditCourses: highSchoolCurriculum.collegeCreditCourses || '',
          apCourses: highSchoolCurriculum.apCourses || '',
          ibCourses: highSchoolCurriculum.ibCourses || '',
          ibDiploma: highSchoolCurriculum.ibDiploma || ''
        });
        setProgress(highSchoolCurriculum.progress || 0);
      }
    } catch (error) {
      console.error('Error fetching high school curriculum:', error);
      // Fallback to localStorage if backend fails
      const savedData = localStorage.getItem(`college_${collegeId}_high_school_curriculum`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save high school curriculum data to backend
  const saveHighSchoolCurriculum = async (data) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/high-school-curriculum/${collegeId}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { highSchoolCurriculum } = response.data;
        setProgress(highSchoolCurriculum.progress);
        return highSchoolCurriculum;
      }
    } catch (error) {
      console.error('Error saving high school curriculum:', error);
      // Fallback to localStorage if backend fails
      localStorage.setItem(`college_${collegeId}_high_school_curriculum`, JSON.stringify(data));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Clear specific field
  const clearField = async (field) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/high-school-curriculum/${collegeId}/clear/${field}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { highSchoolCurriculum } = response.data;
        setFormData({
          ...formData,
          [field]: ''
        });
        setProgress(highSchoolCurriculum.progress);
      }
    } catch (error) {
      console.error('Error clearing field:', error);
      // Fallback to localStorage if backend fails
      const updatedData = {
        ...formData,
        [field]: ''
      };
      setFormData(updatedData);
      localStorage.setItem(`college_${collegeId}_high_school_curriculum`, JSON.stringify(updatedData));
    }
  };

  useEffect(() => {
    fetchHighSchoolCurriculum();
  }, [collegeId]);

  const handleSelectChange = async (field, selectedOption) => {
    const value = selectedOption ? selectedOption.value : '';
    const updatedData = { ...formData, [field]: value };
    
    setFormData(updatedData);

    // Auto-save to backend
    try {
      await saveHighSchoolCurriculum(updatedData);
    } catch (error) {
      // If backend save fails, fallback to localStorage
      localStorage.setItem(`college_${collegeId}_high_school_curriculum`, JSON.stringify(updatedData));
    }
  };

  const handleInputChange = async (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    // Auto-save to backend
    try {
      await saveHighSchoolCurriculum(updatedData);
    } catch (error) {
      localStorage.setItem(`college_${collegeId}_high_school_curriculum`, JSON.stringify(updatedData));
    }
  };

  const handleClearAnswer = async (field) => {
    await clearField(field);
  };

  const handleSave = async () => {
    try {
      await saveHighSchoolCurriculum(formData);
      alert('High school curriculum data saved successfully!');
    } catch (error) {
      alert('Failed to save high school curriculum data. Please try again.');
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await saveHighSchoolCurriculum(formData);
      const basePath = getBasePath();
      // FIXED: Navigate to Activities page instead of landing page
      navigate(`${basePath}/colleges/${collegeId}/activities`);
    } catch (error) {
      alert('Failed to save high school curriculum data. Please try again.');
    }
  };

  const handleSaveAndClose = async () => {
    try {
      await saveHighSchoolCurriculum(formData);
      const basePath = getBasePath();
      navigate(`${basePath}/colleges/${collegeId}`);
    } catch (error) {
      alert('Failed to save high school curriculum data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="high-school-curriculum-container">
        <div className="high-school-curriculum-loading">
          <div className="high-school-curriculum-loading-spinner"></div>
          <p>Loading high school curriculum data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="high-school-curriculum-container">
      {/* Header Section */}
      <div className="high-school-curriculum-header">
        <div className="high-school-curriculum-header-nav">
          <button 
            className="high-school-curriculum-back-button" 
            onClick={() => {
              const basePath = getBasePath();
              navigate(`${basePath}/colleges/${collegeId}`);
            }}
          >
            ← Back to College Details
          </button>
        </div>
        
        <div className="high-school-curriculum-header-info">
          <h1 className="high-school-curriculum-title">Apply to University of Kansas</h1>
          <div className="high-school-curriculum-status">
            {/* <span className="status-indicator">● In progress</span> */}
          </div>
          <p className="high-school-curriculum-description">
            The questions on this page are being asked by University of Kansas.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="high-school-curriculum-content">
        <div className="high-school-curriculum-progress">
          <span className="high-school-curriculum-progress-text">Section Progress: {progress}%</span>
          <div className="high-school-curriculum-progress-bar">
            <div className="high-school-curriculum-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Main Form Content */}
        <section className="high-school-curriculum-form-section">
          <h2 className="high-school-curriculum-section-title">High School Curriculum</h2>
          
          {/* World Language Question - UPDATED to react-select */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                1. How many years of a world language will you have taken at the time of graduation?<span className="required-asterisk">*</span>
              </h3>
            </div>
            <Select
              styles={customSelectStyles}
              options={languageYearOptions}
              value={languageYearOptions.find(option => option.value === formData.worldLanguageYears) || null}
              onChange={(selectedOption) => handleSelectChange('worldLanguageYears', selectedOption)}
              placeholder="Choose an option"
              isSearchable={false}
              isDisabled={saving}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="world-language-select"
            />
            {formData.worldLanguageYears && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('worldLanguageYears')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Honors Courses Question - UPDATED to react-select */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                At the time of graduation, will you have taken any Honors courses while in high school?<span className="required-asterisk">*</span>
              </h3>
            </div>
            <Select
              styles={customSelectStyles}
              options={yesNoOptions}
              value={yesNoOptions.find(option => option.value === formData.honorsCourses) || null}
              onChange={(selectedOption) => handleSelectChange('honorsCourses', selectedOption)}
              placeholder="Choose an option"
              isSearchable={false}
              isDisabled={saving}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="honors-courses-select"
            />
            {formData.honorsCourses && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('honorsCourses')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* College Credit Courses Question - UPDATED to react-select */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                At the time of graduation, will you have taken any courses, other than AP/IB, for college credit while in high school?<span className="required-asterisk">*</span>
              </h3>
            </div>
            <Select
              styles={customSelectStyles}
              options={yesNoOptions}
              value={yesNoOptions.find(option => option.value === formData.collegeCreditCourses) || null}
              onChange={(selectedOption) => handleSelectChange('collegeCreditCourses', selectedOption)}
              placeholder="Choose an option"
              isSearchable={false}
              isDisabled={saving}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="college-credit-select"
            />
            {formData.collegeCreditCourses && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('collegeCreditCourses')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* AP Courses Question - UPDATED to react-select */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                At the time of graduation, will you have taken any AP courses while in high school?<span className="required-asterisk">*</span>
              </h3>
            </div>
            <Select
              styles={customSelectStyles}
              options={yesNoOptions}
              value={yesNoOptions.find(option => option.value === formData.apCourses) || null}
              onChange={(selectedOption) => handleSelectChange('apCourses', selectedOption)}
              placeholder="Choose an option"
              isSearchable={false}
              isDisabled={saving}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="ap-courses-select"
            />
            {formData.apCourses && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('apCourses')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* IB Courses Question - UPDATED to react-select */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                At the time of graduation, will you have taken any IB courses while in high school?<span className="required-asterisk">*</span>
              </h3>
            </div>
            <Select
              styles={customSelectStyles}
              options={yesNoOptions}
              value={yesNoOptions.find(option => option.value === formData.ibCourses) || null}
              onChange={(selectedOption) => handleSelectChange('ibCourses', selectedOption)}
              placeholder="Choose an option"
              isSearchable={false}
              isDisabled={saving}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="ib-courses-select"
            />
            {formData.ibCourses && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('ibCourses')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* IB Diploma Question - UPDATED to react-select */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                At the time of graduation, will you have earned an IB diploma while in high school?<span className="required-asterisk">*</span>
              </h3>
            </div>
            <Select
              styles={customSelectStyles}
              options={yesNoOptions}
              value={yesNoOptions.find(option => option.value === formData.ibDiploma) || null}
              onChange={(selectedOption) => handleSelectChange('ibDiploma', selectedOption)}
              placeholder="Choose an option"
              isSearchable={false}
              isDisabled={saving}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="ib-diploma-select"
            />
            {formData.ibDiploma && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('ibDiploma')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="high-school-curriculum-actions">
            <button 
              className="high-school-curriculum-secondary-button" 
              onClick={handleSaveAndClose}
              disabled={saving}
            >
              Save and Close
            </button>
            <button 
              className="high-school-curriculum-primary-button" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="high-school-curriculum-primary-button" 
              onClick={handleSaveAndContinue}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save and Continue'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HighSchoolCurriculum;