import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './General.css';

const API_URL = process.env.REACT_APP_API_URL;

const General = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
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
  ];

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
    // Store in localStorage to persist across page refreshes
    localStorage.setItem(`college_${collegeId}_show_international`, visaAnswer === 'yes' ? 'true' : 'false');
    
    // Dispatch event to notify DashboardLayout about the change
    window.dispatchEvent(new CustomEvent('collegeFormUpdated', {
      detail: {
        collegeId,
        showInternational: visaAnswer === 'yes'
      }
    }));
  };

  const handleInputChange = async (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    // Update international section visibility when visa classification changes
    if (field === 'visaClassification') {
      updateInternationalSectionVisibility(value);
    }

    // Auto-save to backend
    try {
      await saveGeneralApplication(updatedData);
    } catch (error) {
      // If backend save fails, fallback to localStorage
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
      navigate(`/dashboard/colleges/${collegeId}/academics`);
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

  return (
    <div className="general-form-container">
      {/* Header Section */}
      <div className="general-form-header">
        <div className="general-header-nav">
          <button className="general-back-button" onClick={() => navigate(`/dashboard/colleges/${collegeId}`)}>
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
              <h3 className="general-question-title">Start term*</h3>
              <span className="general-question-required">Required</span>
            </div>
            <select 
              className="general-form-select"
              value={formData.startTerm}
              onChange={(e) => handleInputChange('startTerm', e.target.value)}
              disabled={saving}
            >
              <option value="">Choose an option</option>
              {startTermOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              <h3 className="general-question-title">Where would you like to live during your first year?*</h3>
              <span className="general-question-required">Required</span>
            </div>
            <select 
              className="general-form-select"
              value={formData.housingPreference}
              onChange={(e) => handleInputChange('housingPreference', e.target.value)}
              disabled={saving}
            >
              <option value="">Choose an option</option>
              {housingOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              <h3 className="general-question-title">Do you currently participate in any of the following programs?*</h3>
              <span className="general-question-required">Required</span>
            </div>
            <select 
              className="general-form-select"
              value={formData.participationPrograms}
              onChange={(e) => handleInputChange('participationPrograms', e.target.value)}
              disabled={saving}
            >
              <option value="">Choose an option</option>
              {programOptions.map((program, index) => (
                <option key={index} value={program.value}>
                  {program.label}
                </option>
              ))}
            </select>
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
              <h3 className="general-question-title">Do you intend to file the FAFSA?*</h3>
              <span className="general-question-required">Required</span>
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
                Will you have a non-immigrant visa classification (e.g. F-1, J-1, E-2, H-4, etc) to begin studying at KU?*
              </h3>
              <span className="general-question-required">Required</span>
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

          {/* Application Reasons Question */}
          <div className="general-question-card">
            <div className="general-question-header">
              <h3 className="general-question-title">Why did you choose to apply to KU? (Choose all that apply.)*</h3>
              <span className="general-question-required">Required</span>
            </div>
            <div className="general-checkbox-grid">
              {applicationReasons.map((reason, index) => (
                <label key={index} className="general-checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.applicationReason.includes(reason)}
                    onChange={() => handleCheckboxChange(reason)}
                    className="general-checkbox-input"
                    disabled={saving}
                  />
                  <span className="general-checkbox-label">{reason}</span>
                </label>
              ))}
            </div>
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
              onClick={() => navigate(`/dashboard/colleges/${collegeId}`)}
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