import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import './General.css';

const API_URL = process.env.REACT_APP_API_URL;

const General = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    startTerm: '',
    housingPreference: '',
    participationPrograms: '',
    fafsaIntent: '',
    visaClassification: '',
    applicationReason: []
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
      zIndex: 9999
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px'
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
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#dbeafe',
      borderRadius: '4px'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1e40af',
      fontSize: '13px',
      fontWeight: '500',
      padding: '4px 8px'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#1e40af',
      borderRadius: '0 4px 4px 0',
      '&:hover': {
        backgroundColor: '#bfdbfe',
        color: '#dc2626'
      }
    })
  };

  // Use exact enum values that match the backend
  const applicationReasons = [
    'Academic Program of Interest',
    'KU\'s Academic Reputation',
    'Value of a KU Degree',
    'Scholarship Opportunities',
    'Study Abroad Opportunities',
    'Career Services & Internships',
    'On-Campus Housing Options',
    'Athletics / Sports Programs',
    'Campus Atmosphere & Traditions',
    'Beauty of Campus',
    'Student Life & Social Scene',
    'Location/Distance from Home',
    'KU Recruitment Staff / Outreach',
    'Campus Visit Experience'
  ].map(reason => ({ value: reason, label: reason }));

  // Housing options with exact enum values matching backend
  const housingOptions = [
    { label: 'On-Campus', value: 'on-campus' },
    { label: 'Off-Campus/Organized Living (fraternity, sorority, etc.)', value: 'off-campus-organized-living' },
    { label: 'With Parents', value: 'with-parents' }
  ];

  // Program participation options with exact enum values matching backend
  const programOptions = [
    { label: 'Project Discovery', value: 'project-discovery' },
    { label: 'GEAR UP (Gaining Early Awareness and Readiness for Undergraduate Programs)', value: 'gear-up' },
    { label: '20/20 Leadership Program', value: '20-20-leadership-program' },
    { label: 'ECO (Expanding College Opportunities)', value: 'eco' },
    { label: 'KC Scholars', value: 'kc-scholars' },
    { label: 'None', value: 'none' }
  ];

  // Start term options
  const startTermOptions = [
    { label: 'Fall 2026', value: 'fall-2026' },
    { label: 'Spring 2026', value: 'spring-2026' },
    { label: 'Summer 2026', value: 'summer-2026' }
  ];

  // Fetch general application data from backend
  const fetchGeneralApplication = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/general/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { generalApplication } = response.data;
        setFormData({
          startTerm: generalApplication.startTerm || '',
          housingPreference: generalApplication.housingPreference || '',
          participationPrograms: generalApplication.participationPrograms || '',
          fafsaIntent: generalApplication.fafsaIntent || '',
          visaClassification: generalApplication.visaClassification || '',
          applicationReason: generalApplication.applicationReason || []
        });
        setProgress(generalApplication.progress || 0);
        
        // Update international section visibility based on saved visa classification
        if (generalApplication.visaClassification) {
          updateInternationalSectionVisibility(generalApplication.visaClassification);
        }
      }
    } catch (error) {
      console.error('Error fetching general application:', error);
      // Fallback to localStorage if backend fails
      const savedData = localStorage.getItem(`college_${collegeId}_general`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save general application data to backend
  const saveGeneralApplication = async (data) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/general/${collegeId}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { generalApplication } = response.data;
        setProgress(generalApplication.progress);
        return generalApplication;
      }
    } catch (error) {
      console.error('Error saving general application:', error);
      // Fallback to localStorage if backend fails
      localStorage.setItem(`college_${collegeId}_general`, JSON.stringify(data));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Clear specific field in backend
  const clearField = async (field) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/general/${collegeId}/clear/${field}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { generalApplication } = response.data;
        setFormData({
          ...formData,
          [field]: field === 'applicationReason' ? [] : ''
        });
        setProgress(generalApplication.progress);
      }
    } catch (error) {
      console.error('Error clearing field:', error);
      // Fallback to localStorage if backend fails
      const updatedData = {
        ...formData,
        [field]: field === 'applicationReason' ? [] : ''
      };
      setFormData(updatedData);
      localStorage.setItem(`college_${collegeId}_general`, JSON.stringify(updatedData));
    }
  };

  useEffect(() => {
    fetchGeneralApplication();
  }, [collegeId]);

  const updateInternationalSectionVisibility = (visaAnswer) => {
    localStorage.setItem(`college_${collegeId}_show_international`, visaAnswer === 'yes' ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('collegeFormUpdated', {
      detail: {
        collegeId,
        showInternational: visaAnswer === 'yes'
      }
    }));
  };

  const handleSelectChange = async (field, selectedOption) => {
    const value = selectedOption ? selectedOption.value : '';
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    if (field === 'visaClassification') {
      updateInternationalSectionVisibility(value);
    }

    try {
      await saveGeneralApplication(updatedData);
    } catch (error) {
      localStorage.setItem(`college_${collegeId}_general`, JSON.stringify(updatedData));
    }
  };

  const handleMultiSelectChange = async (selectedOptions) => {
    const selectedReasons = selectedOptions ? selectedOptions.map(option => option.value) : [];
    const updatedData = { ...formData, applicationReason: selectedReasons };
    setFormData(updatedData);

    try {
      await saveGeneralApplication(updatedData);
    } catch (error) {
      localStorage.setItem(`college_${collegeId}_general`, JSON.stringify(updatedData));
    }
  };

  const handleInputChange = async (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    if (field === 'visaClassification') {
      updateInternationalSectionVisibility(value);
    }

    try {
      await saveGeneralApplication(updatedData);
    } catch (error) {
      localStorage.setItem(`college_${collegeId}_general`, JSON.stringify(updatedData));
    }
  };

  const handleCheckboxChange = async (reason) => {
    const currentReasons = [...formData.applicationReason];
    const updatedReasons = currentReasons.includes(reason)
      ? currentReasons.filter(r => r !== reason)
      : [...currentReasons, reason];
    
    await handleInputChange('applicationReason', updatedReasons);
  };

  const handleClearAnswer = async (field) => {
    await clearField(field);
  };

  const handleSave = async () => {
    try {
      await saveGeneralApplication(formData);
      alert('Application data saved successfully!');
    } catch (error) {
      alert('Failed to save application data. Please try again.');
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await saveGeneralApplication(formData);
      const basePath = getBasePath();
      navigate(`${basePath}/colleges/${collegeId}/academics`);
    } catch (error) {
      alert('Failed to save application data. Please try again.');
    }
  };

  const handleSaveAndClose = async () => {
    try {
      await saveGeneralApplication(formData);
      const basePath = getBasePath();
      navigate(`${basePath}/colleges/${collegeId}`);
    } catch (error) {
      alert('Failed to save application data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="general-form-container">
        <div className="general-loading">
          <div className="general-loading-spinner"></div>
          <p>Loading application data...</p>
        </div>
      </div>
    );
  }

  // Find current selected values for react-select
  const getSelectedOption = (field, options) => {
    return options.find(option => option.value === formData[field]) || null;
  };

  const getSelectedMultiOptions = () => {
    return applicationReasons.filter(reason => 
      formData.applicationReason.includes(reason.value)
    );
  };

  return (
    <div className="general-form-container">
      {/* Header Section */}
      <div className="general-form-header">
        <div className="general-header-nav">
          <button 
            className="general-back-button" 
            onClick={() => {
              const basePath = getBasePath();
              navigate(`${basePath}/colleges/${collegeId}`);
            }}
          >
            ← Back to College Details
          </button>
        </div>
        
        <div className="general-header-info">
          <h1 className="general-title">Apply to University of Kansas</h1>
          <div className="general-status">
            {/* <span className="status-indicator">In progress</span> */}
          </div>
          <p className="general-description">
            The questions on this page are being asked by University of Kansas.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="general-form-content">
        <div className="general-progress">
          <span className="general-progress-text">Section Progress: {progress}%</span>
          <div className="general-progress-bar">
            <div className="general-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Main Form Content */}
        <section className="general-form-section">
          <h2 className="general-section-title">General</h2>
          
          {/* Start Term Question */}
          <div className="general-question-card">
            <div className="general-question-header">
              <h3 className="general-question-title">
                Start term<span className="required-asterisk">*</span>
              </h3>
            </div>
            <Select
              styles={customSelectStyles}
              options={startTermOptions}
              value={getSelectedOption('startTerm', startTermOptions)}
              onChange={(selectedOption) => handleSelectChange('startTerm', selectedOption)}
              placeholder="Choose an option"
              isSearchable={false}
              isDisabled={saving}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="start-term-select"
            />
            {formData.startTerm && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('startTerm')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Housing Preference Question */}
          <div className="general-question-card">
            <div className="general-question-header">
              <h3 className="general-question-title">
                Where would you like to live during your first year?<span className="required-asterisk">*</span>
              </h3>
            </div>
            <Select
              styles={customSelectStyles}
              options={housingOptions}
              value={getSelectedOption('housingPreference', housingOptions)}
              onChange={(selectedOption) => handleSelectChange('housingPreference', selectedOption)}
              placeholder="Choose an option"
              isSearchable={false}
              isDisabled={saving}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="housing-select"
            />
            {formData.housingPreference && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('housingPreference')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Participation Programs Question */}
          <div className="general-question-card">
            <div className="general-question-header">
              <h3 className="general-question-title">
                Do you currently participate in any of the following programs?<span className="required-asterisk">*</span>
              </h3>
            </div>
            <Select
              styles={customSelectStyles}
              options={programOptions}
              value={getSelectedOption('participationPrograms', programOptions)}
              onChange={(selectedOption) => handleSelectChange('participationPrograms', selectedOption)}
              placeholder="Choose an option"
              isSearchable={false}
              isDisabled={saving}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="programs-select"
            />
            {formData.participationPrograms && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('participationPrograms')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* FAFSA Intent Question */}
          <div className="general-question-card">
            <div className="general-question-header">
              <h3 className="general-question-title">
                Do you intend to file the FAFSA?<span className="required-asterisk">*</span>
              </h3>
            </div>
            <div className="general-radio-group">
              <label className="general-radio-option">
                <input
                  type="radio"
                  name="fafsaIntent"
                  value="yes"
                  checked={formData.fafsaIntent === 'yes'}
                  onChange={(e) => handleInputChange('fafsaIntent', e.target.value)}
                  className="general-radio-input"
                  disabled={saving}
                />
                <span className="general-radio-label">Yes</span>
              </label>
              <label className="general-radio-option">
                <input
                  type="radio"
                  name="fafsaIntent"
                  value="no"
                  checked={formData.fafsaIntent === 'no'}
                  onChange={(e) => handleInputChange('fafsaIntent', e.target.value)}
                  className="general-radio-input"
                  disabled={saving}
                />
                <span className="general-radio-label">No</span>
              </label>
            </div>
            {(formData.fafsaIntent === 'yes' || formData.fafsaIntent === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('fafsaIntent')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
            <div className="general-info-box">
              <p className="general-info-box-content">
                The Free Application for Federal Student Aid (FAFSA) is used to determine eligibility for federal, state, and institutional need-based aid.
              </p>
            </div>
          </div>

          {/* Visa Classification Question */}
          <div className="general-question-card">
            <div className="general-question-header">
              <h3 className="general-question-title">
                Will you have a non-immigrant visa classification (e.g. F-1, J-1, E-2, H-4, etc) to begin studying at KU?<span className="required-asterisk">*</span>
              </h3>
            </div>
            <div className="general-radio-group">
              <label className="general-radio-option">
                <input
                  type="radio"
                  name="visaClassification"
                  value="yes"
                  checked={formData.visaClassification === 'yes'}
                  onChange={(e) => handleInputChange('visaClassification', e.target.value)}
                  className="general-radio-input"
                  disabled={saving}
                />
                <span className="general-radio-label">Yes</span>
              </label>
              <label className="general-radio-option">
                <input
                  type="radio"
                  name="visaClassification"
                  value="no"
                  checked={formData.visaClassification === 'no'}
                  onChange={(e) => handleInputChange('visaClassification', e.target.value)}
                  className="general-radio-input"
                  disabled={saving}
                />
                <span className="general-radio-label">No</span>
              </label>
            </div>
            {(formData.visaClassification === 'yes' || formData.visaClassification === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('visaClassification')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Application Reasons Question - Using react-select multi-select */}
          <div className="general-question-card">
            <div className="general-question-header">
              <h3 className="general-question-title">
                Why did you choose to apply to KU? (Choose all that apply.)<span className="required-asterisk">*</span>
              </h3>
            </div>
            <Select
              styles={customSelectStyles}
              options={applicationReasons}
              value={getSelectedMultiOptions()}
              onChange={handleMultiSelectChange}
              placeholder="Select all that apply"
              isMulti
              isSearchable={true}
              isDisabled={saving}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="reasons-select"
            />
            {formData.applicationReason.length > 0 && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('applicationReason')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="general-actions">
            <button 
              className="general-secondary-button" 
              onClick={handleSaveAndClose}
              disabled={saving}
            >
              Save and Close
            </button>
            <button 
              className="general-primary-button" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="general-primary-button" 
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

export default General;