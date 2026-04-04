import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import './InternationalStudent.css';

const API_URL = process.env.REACT_APP_API_URL;

const InternationalStudent = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    highSchoolGraduated: '',
    attendedClassesSinceGraduation: '',
    addAnotherSchool: '',
    schoolName: '',
    schoolStartDate: '',
    schoolEndDate: '',
    requestedImmigrationStatus: '',
    currentlyInUS: '',
    currentImmigrationStatus: '',
    hearAboutKU: '',
    applicationFeeAgreement: '',
    certificationAgreement: '',
    thirdPartyPreparation: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  // Immigration status options - formatted for react-select
  const immigrationStatusOptions = [
    { value: 'F-1 student (most common)', label: 'F-1 student (most common)' },
    { value: 'J-1 exchange visitor', label: 'J-1 exchange visitor' },
    { value: 'F-2 dependent', label: 'F-2 dependent' },
    { value: 'J-2 dependent', label: 'J-2 dependent' },
    { value: 'B-2 tourist', label: 'B-2 tourist' },
    { value: 'H-4 dependent', label: 'H-4 dependent' },
    { value: 'L-2 dependent', label: 'L-2 dependent' },
    { value: 'E-2 dependent', label: 'E-2 dependent' },
    { value: 'Other', label: 'Other' }
  ];

  // Information source options - formatted for react-select
  const hearAboutKUOptions = [
    { value: 'Agent', label: 'Agent' },
    { value: 'Counselor/Advisor', label: 'Counselor/Advisor' },
    { value: 'Educational Fair', label: 'Educational Fair' },
    { value: 'Friends or Family', label: 'Friends or Family' },
    { value: 'Internet', label: 'Internet' },
    { value: 'KU Admissions Rep', label: 'KU Admissions Rep' },
    { value: 'KU alumni', label: 'KU alumni' },
    { value: 'KU Professor', label: 'KU Professor' },
    { value: 'KU Student', label: 'KU Student' },
    { value: 'KU Study Abroad', label: 'KU Study Abroad' },
    { value: 'Ranks', label: 'Ranks' },
    { value: 'Recruitment Email', label: 'Recruitment Email' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Sponsor', label: 'Sponsor' },
    { value: 'Teacher/Professor', label: 'Teacher/Professor' },
    { value: 'US University or College Fair', label: 'US University or College Fair' },
    { value: 'Other', label: 'Other' }
  ];

  // Helper function to find react-select value
  const findSelectValue = (options, currentValue) => {
    return options.find(option => option.value === currentValue) || null;
  };

  // Fetch international student data
  const fetchInternationalData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/international/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { international } = response.data;
        setFormData({
          highSchoolGraduated: international.highSchoolGraduated || '',
          attendedClassesSinceGraduation: international.attendedClassesSinceGraduation || '',
          addAnotherSchool: international.addAnotherSchool || '',
          schoolName: international.schoolName || '',
          schoolStartDate: international.schoolStartDate || '',
          schoolEndDate: international.schoolEndDate || '',
          requestedImmigrationStatus: international.requestedImmigrationStatus || '',
          currentlyInUS: international.currentlyInUS || '',
          currentImmigrationStatus: international.currentImmigrationStatus || '',
          hearAboutKU: international.hearAboutKU || '',
          applicationFeeAgreement: international.applicationFeeAgreement || '',
          certificationAgreement: international.certificationAgreement || '',
          thirdPartyPreparation: international.thirdPartyPreparation || ''
        });
        setProgress(international.progress || 0);
      }
    } catch (error) {
      console.error('Error fetching international student data:', error);
      const savedData = localStorage.getItem(`college_${collegeId}_international`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save international student data
  const saveInternationalData = async (data) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/international/${collegeId}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { international } = response.data;
        setProgress(international.progress);
        return international;
      }
    } catch (error) {
      console.error('Error saving international student data:', error);
      localStorage.setItem(`college_${collegeId}_international`, JSON.stringify(data));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Clear specific field
  const clearField = async (field) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/international/${collegeId}/clear/${field}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { international } = response.data;
        setFormData(prev => ({
          ...prev,
          [field]: ''
        }));
        setProgress(international.progress);
      }
    } catch (error) {
      console.error('Error clearing field:', error);
      const updatedData = {
        ...formData,
        [field]: ''
      };
      setFormData(updatedData);
      localStorage.setItem(`college_${collegeId}_international`, JSON.stringify(updatedData));
    }
  };

  useEffect(() => {
    fetchInternationalData();
  }, [collegeId]);

  const handleInputChange = async (field, value) => {
    const updatedData = { ...formData, [field]: value };
    
    // Clear dependent fields when parent field changes
    if (field === 'highSchoolGraduated') {
      if (value === 'no') {
        updatedData.attendedClassesSinceGraduation = '';
        updatedData.addAnotherSchool = '';
        updatedData.schoolName = '';
        updatedData.schoolStartDate = '';
        updatedData.schoolEndDate = '';
      }
    }
    
    if (field === 'attendedClassesSinceGraduation') {
      if (value === 'no') {
        updatedData.addAnotherSchool = '';
        updatedData.schoolName = '';
        updatedData.schoolStartDate = '';
        updatedData.schoolEndDate = '';
      }
    }
    
    if (field === 'addAnotherSchool') {
      if (value === 'no') {
        updatedData.schoolName = '';
        updatedData.schoolStartDate = '';
        updatedData.schoolEndDate = '';
      }
    }
    
    if (field === 'currentlyInUS') {
      if (value === 'no') {
        updatedData.currentImmigrationStatus = '';
      }
    }
    
    setFormData(updatedData);

    try {
      await saveInternationalData(updatedData);
    } catch (error) {
      console.error('Failed to save data:', error);
      localStorage.setItem(`college_${collegeId}_international`, JSON.stringify(updatedData));
    }
  };

  const handleSelectChange = async (field, selectedOption) => {
    await handleInputChange(field, selectedOption?.value || '');
  };

  const handleClearAnswer = async (field) => {
    await clearField(field);
  };

  // Helper function to format date for display
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Helper function to parse date from input
  const parseDateFromInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString();
  };

  const handleSave = async () => {
    try {
      await saveInternationalData(formData);
      alert('International student information saved successfully!');
    } catch (error) {
      alert('Failed to save international student information. Please try again.');
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await saveInternationalData(formData);
      // FIXED NAVIGATION: Changed to firstyear/dashboard prefix
      navigate(`/firstyear/dashboard/colleges/${collegeId}/review`);
    } catch (error) {
      alert('Failed to save international student information. Please try again.');
    }
  };

  const handleBack = () => {
    // FIXED NAVIGATION: Changed to firstyear/dashboard prefix
    navigate(`/firstyear/dashboard/colleges/${collegeId}`);
  };

  const handleSaveAndClose = () => {
    handleBack();
  };

  if (loading) {
    return (
      <div className="international-form-container">
        <div className="international-loading">
          <div className="international-loading-spinner"></div>
          <p>Loading international student information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="international-form-container">
      {/* Header Section */}
      <div className="international-form-header">
        <div className="international-header-nav">
          {/* FIXED NAVIGATION: Updated onClick handler */}
          <button className="international-back-button" onClick={handleBack}>
            ← Back to College Details
          </button>
        </div>
        
        <div className="international-header-info">
          <h1 className="international-title">Apply to University of Kansas</h1>
          <div className="international-status">
            <span className="status-indicator">In progress</span>
          </div>
          <p className="international-description">
            The questions on this page are being asked by University of Kansas.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="international-form-content">
        <div className="international-progress">
          <span className="international-progress-text">Section Progress: {progress}%</span>
          <div className="international-progress-bar">
            <div className="international-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Main Form Content */}
        <section className="international-form-section">
          <h2 className="international-section-title">International Student Information</h2>
          
          {/* High School Graduation Question */}
          <div className="international-question-card">
            <div className="international-question-header">
              <h3 className="international-question-title">Have you graduated from high school? *</h3>
              <span className="international-question-required">Required</span>
            </div>
            <div className="international-radio-group">
              <label className="international-radio-option">
                <input
                  type="radio"
                  name="highSchoolGraduated"
                  value="yes"
                  checked={formData.highSchoolGraduated === 'yes'}
                  onChange={(e) => handleInputChange('highSchoolGraduated', e.target.value)}
                  className="international-radio-input"
                  disabled={saving}
                />
                <span className="international-radio-label">Yes</span>
              </label>
              <label className="international-radio-option">
                <input
                  type="radio"
                  name="highSchoolGraduated"
                  value="no"
                  checked={formData.highSchoolGraduated === 'no'}
                  onChange={(e) => handleInputChange('highSchoolGraduated', e.target.value)}
                  className="international-radio-input"
                  disabled={saving}
                />
                <span className="international-radio-label">No</span>
              </label>
            </div>
            {(formData.highSchoolGraduated === 'yes' || formData.highSchoolGraduated === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('highSchoolGraduated')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Attended Classes Since Graduation Question - Conditional */}
          {formData.highSchoolGraduated === 'yes' && (
            <div className="international-question-card">
              <div className="international-question-header">
                <h3 className="international-question-title">Have you attended any classes since graduation? *</h3>
                <span className="international-question-required">Required</span>
              </div>
              <div className="international-radio-group">
                <label className="international-radio-option">
                  <input
                    type="radio"
                    name="attendedClassesSinceGraduation"
                    value="yes"
                    checked={formData.attendedClassesSinceGraduation === 'yes'}
                    onChange={(e) => handleInputChange('attendedClassesSinceGraduation', e.target.value)}
                    className="international-radio-input"
                    disabled={saving}
                  />
                  <span className="international-radio-label">Yes</span>
                </label>
                <label className="international-radio-option">
                  <input
                    type="radio"
                    name="attendedClassesSinceGraduation"
                    value="no"
                    checked={formData.attendedClassesSinceGraduation === 'no'}
                    onChange={(e) => handleInputChange('attendedClassesSinceGraduation', e.target.value)}
                    className="international-radio-input"
                    disabled={saving}
                  />
                  <span className="international-radio-label">No</span>
                </label>
              </div>
              {(formData.attendedClassesSinceGraduation === 'yes' || formData.attendedClassesSinceGraduation === 'no') && (
                <button 
                  className="clear-answer-button"
                  onClick={() => handleClearAnswer('attendedClassesSinceGraduation')}
                  disabled={saving}
                >
                  {saving ? 'Clearing...' : 'Clear answer'}
                </button>
              )}
            </div>
          )}

          {/* Add Another School Question - Conditional */}
          {formData.attendedClassesSinceGraduation === 'yes' && (
            <div className="international-question-card">
              <div className="international-question-header">
                <h3 className="international-question-title">Do you want to add another school? *</h3>
                <span className="international-question-required">Required</span>
              </div>
              <div className="international-radio-group">
                <label className="international-radio-option">
                  <input
                    type="radio"
                    name="addAnotherSchool"
                    value="yes"
                    checked={formData.addAnotherSchool === 'yes'}
                    onChange={(e) => handleInputChange('addAnotherSchool', e.target.value)}
                    className="international-radio-input"
                    disabled={saving}
                  />
                  <span className="international-radio-label">Yes</span>
                </label>
                <label className="international-radio-option">
                  <input
                    type="radio"
                    name="addAnotherSchool"
                    value="no"
                    checked={formData.addAnotherSchool === 'no'}
                    onChange={(e) => handleInputChange('addAnotherSchool', e.target.value)}
                    className="international-radio-input"
                    disabled={saving}
                  />
                  <span className="international-radio-label">No</span>
                </label>
              </div>
              {(formData.addAnotherSchool === 'yes' || formData.addAnotherSchool === 'no') && (
                <button 
                  className="clear-answer-button"
                  onClick={() => handleClearAnswer('addAnotherSchool')}
                  disabled={saving}
                >
                  {saving ? 'Clearing...' : 'Clear answer'}
                </button>
              )}
            </div>
          )}

          {/* School Information Fields - Conditional */}
          {formData.addAnotherSchool === 'yes' && (
            <div className="international-question-card">
              <div className="international-question-header">
                <h3 className="international-question-title">School Information *</h3>
                <span className="international-question-required">Required</span>
              </div>
              <div className="international-form-group">
                <label className="international-form-label">School Name *</label>
                <input
                  type="text"
                  className="international-form-input"
                  value={formData.schoolName}
                  onChange={(e) => handleInputChange('schoolName', e.target.value)}
                  disabled={saving}
                  placeholder="Enter school name"
                />
              </div>
              <div className="international-form-group">
                <label className="international-form-label">Start Date *</label>
                <input
                  type="date"
                  className="international-form-input"
                  value={formatDateForInput(formData.schoolStartDate)}
                  onChange={(e) => handleInputChange('schoolStartDate', parseDateFromInput(e.target.value))}
                  disabled={saving}
                />
                <div className="international-date-hint">Date uses "month day, year" format (e.g. August 1, 2002)</div>
              </div>
              <div className="international-form-group">
                <label className="international-form-label">End Date *</label>
                <input
                  type="date"
                  className="international-form-input"
                  value={formatDateForInput(formData.schoolEndDate)}
                  onChange={(e) => handleInputChange('schoolEndDate', parseDateFromInput(e.target.value))}
                  disabled={saving}
                />
                <div className="international-date-hint">Date uses "month day, year" format (e.g. August 1, 2002)</div>
              </div>
              {(formData.schoolName || formData.schoolStartDate || formData.schoolEndDate) && (
                <button 
                  className="clear-answer-button"
                  onClick={() => {
                    handleClearAnswer('schoolName');
                    handleClearAnswer('schoolStartDate');
                    handleClearAnswer('schoolEndDate');
                  }}
                  disabled={saving}
                >
                  {saving ? 'Clearing...' : 'Clear school information'}
                </button>
              )}
            </div>
          )}

          {/* Requested Immigration Status Question - USING REACT-SELECT */}
          <div className="international-question-card">
            <div className="international-question-header">
              <h3 className="international-question-title">Which immigration status are you requesting to study at KU? *</h3>
              <span className="international-question-required">Required</span>
            </div>
            <Select
              value={findSelectValue(immigrationStatusOptions, formData.requestedImmigrationStatus)}
              onChange={(selectedOption) => handleSelectChange('requestedImmigrationStatus', selectedOption)}
              options={immigrationStatusOptions}
              placeholder="Choose an option"
              isDisabled={saving}
              isClearable={true}
              className="react-select-container"
              classNamePrefix="react-select"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#d1d5db',
                  '&:hover': { borderColor: '#9ca3af' },
                  borderRadius: '6px',
                  minHeight: '42px',
                  fontSize: '14px',
                  maxWidth: '500px'
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999
                }),
                menuPortal: (base) => ({
                  ...base,
                  zIndex: 9999
                })
              }}
            />
            {formData.requestedImmigrationStatus && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('requestedImmigrationStatus')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Currently in US Question */}
          <div className="international-question-card">
            <div className="international-question-header">
              <h3 className="international-question-title">Are you currently in the United States? *</h3>
              <span className="international-question-required">Required</span>
            </div>
            <div className="international-radio-group">
              <label className="international-radio-option">
                <input
                  type="radio"
                  name="currentlyInUS"
                  value="yes"
                  checked={formData.currentlyInUS === 'yes'}
                  onChange={(e) => handleInputChange('currentlyInUS', e.target.value)}
                  className="international-radio-input"
                  disabled={saving}
                />
                <span className="international-radio-label">Yes</span>
              </label>
              <label className="international-radio-option">
                <input
                  type="radio"
                  name="currentlyInUS"
                  value="no"
                  checked={formData.currentlyInUS === 'no'}
                  onChange={(e) => handleInputChange('currentlyInUS', e.target.value)}
                  className="international-radio-input"
                  disabled={saving}
                />
                <span className="international-radio-label">No</span>
              </label>
            </div>
            {(formData.currentlyInUS === 'yes' || formData.currentlyInUS === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('currentlyInUS')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Current Immigration Status Question - Conditional - USING REACT-SELECT */}
          {formData.currentlyInUS === 'yes' && (
            <div className="international-question-card">
              <div className="international-question-header">
                <h3 className="international-question-title">What is your current immigration status? *</h3>
                <span className="international-question-required">Required</span>
              </div>
              <Select
                value={findSelectValue(immigrationStatusOptions, formData.currentImmigrationStatus)}
                onChange={(selectedOption) => handleSelectChange('currentImmigrationStatus', selectedOption)}
                options={immigrationStatusOptions}
                placeholder="Choose an option"
                isDisabled={saving}
                isClearable={true}
                className="react-select-container"
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: '#d1d5db',
                    '&:hover': { borderColor: '#9ca3af' },
                    borderRadius: '6px',
                    minHeight: '42px',
                    fontSize: '14px',
                    maxWidth: '500px'
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999
                  })
                }}
              />
              {formData.currentImmigrationStatus && (
                <button 
                  className="clear-answer-button"
                  onClick={() => handleClearAnswer('currentImmigrationStatus')}
                  disabled={saving}
                >
                  {saving ? 'Clearing...' : 'Clear answer'}
                </button>
              )}
            </div>
          )}

          {/* How did you hear about KU Question - USING REACT-SELECT */}
          <div className="international-question-card">
            <div className="international-question-header">
              <h3 className="international-question-title">How did you hear about KU? *</h3>
              <span className="international-question-required">Required</span>
            </div>
            <Select
              value={findSelectValue(hearAboutKUOptions, formData.hearAboutKU)}
              onChange={(selectedOption) => handleSelectChange('hearAboutKU', selectedOption)}
              options={hearAboutKUOptions}
              placeholder="Choose an option"
              isDisabled={saving}
              isClearable={true}
              className="react-select-container"
              classNamePrefix="react-select"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#d1d5db',
                  '&:hover': { borderColor: '#9ca3af' },
                  borderRadius: '6px',
                  minHeight: '42px',
                  fontSize: '14px',
                  maxWidth: '500px'
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999
                }),
                menuPortal: (base) => ({
                  ...base,
                  zIndex: 9999
                })
              }}
            />
            {formData.hearAboutKU && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('hearAboutKU')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Application Fee Agreement */}
          <div className="international-question-card">
            <div className="international-question-header">
              <h3 className="international-question-title">
                The Office of International Admission requires an application fee to be paid, even if a student states eligibility for a fee waiver. By submitting this application, you understand that you will be asked to pay a non-refundable $90 application fee. *
              </h3>
              <span className="international-question-required">Required</span>
            </div>
            <div className="international-radio-group">
              <label className="international-radio-option">
                <input
                  type="radio"
                  name="applicationFeeAgreement"
                  value="agree"
                  checked={formData.applicationFeeAgreement === 'agree'}
                  onChange={(e) => handleInputChange('applicationFeeAgreement', e.target.value)}
                  className="international-radio-input"
                  disabled={saving}
                />
                <span className="international-radio-label">I agree</span>
              </label>
            </div>
            {formData.applicationFeeAgreement && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('applicationFeeAgreement')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Certification Agreement */}
          <div className="international-question-card">
            <div className="international-question-header">
              <h3 className="international-question-title">
                I certify that all information given on this application form and all documents submitted to KU are complete and correct and will be used to determine my admission status. I authorize the University of Kansas to verify information I have provided. I agree to notify the proper officials of the institution of any changes in the information provided. I understand that this application is a legally binding document and that falsification or omission of any of the information in my submitted materials will void my admission, cancel my enrollment, and result in appropriate disciplinary action. I understand that all application materials become the property of KU and that the application fee is non-refundable. *
              </h3>
              <span className="international-question-required">Required</span>
            </div>
            <div className="international-radio-group">
              <label className="international-radio-option">
                <input
                  type="radio"
                  name="certificationAgreement"
                  value="agree"
                  checked={formData.certificationAgreement === 'agree'}
                  onChange={(e) => handleInputChange('certificationAgreement', e.target.value)}
                  className="international-radio-input"
                  disabled={saving}
                />
                <span className="international-radio-label">I Agree</span>
              </label>
            </div>
            {formData.certificationAgreement && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('certificationAgreement')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Third Party Preparation Question */}
          <div className="international-question-card">
            <div className="international-question-header">
              <h3 className="international-question-title">
                Is a third party preparing your application? If someone besides the applicant is completing this application or if the applicant wishes to authorize sharing information about this application with a third party (educational agent, family member, counselor or friend, etc.), they are required to complete the Third Party Release Form. Failure to provide this information by the application deadline will result in delay in processing or deferral of admission. The Third Party Release Form should be uploaded in the Slate Applicant Portal. *
              </h3>
              <span className="international-question-required">Required</span>
            </div>
            <div className="international-radio-group">
              <label className="international-radio-option">
                <input
                  type="radio"
                  name="thirdPartyPreparation"
                  value="yes"
                  checked={formData.thirdPartyPreparation === 'yes'}
                  onChange={(e) => handleInputChange('thirdPartyPreparation', e.target.value)}
                  className="international-radio-input"
                  disabled={saving}
                />
                <span className="international-radio-label">Yes</span>
              </label>
              <label className="international-radio-option">
                <input
                  type="radio"
                  name="thirdPartyPreparation"
                  value="no"
                  checked={formData.thirdPartyPreparation === 'no'}
                  onChange={(e) => handleInputChange('thirdPartyPreparation', e.target.value)}
                  className="international-radio-input"
                  disabled={saving}
                />
                <span className="international-radio-label">No</span>
              </label>
            </div>
            {(formData.thirdPartyPreparation === 'yes' || formData.thirdPartyPreparation === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('thirdPartyPreparation')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="international-actions">
            {/* FIXED NAVIGATION: Updated onClick handler */}
            <button 
              className="international-secondary-button" 
              onClick={handleSaveAndClose}
              disabled={saving}
            >
              Save and Close
            </button>
            <button 
              className="international-primary-button" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {/* FIXED NAVIGATION: Updated button text to match other components */}
            <button 
              className="international-primary-button" 
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

export default InternationalStudent;