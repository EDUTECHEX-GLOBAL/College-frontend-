import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FirstResidency.css';

const API_URL = process.env.REACT_APP_API_URL;

const FirstResidency = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    qualifyInStateTuition: '',
    kansasResident: '',
    livedInKansasSinceBirth: '',
    kansasResidenceStartDate: '',
    kansasResidenceEndDate: '',
    everLivedInKansas: '',
    kansasResidenceDates: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch residency data from backend
  const fetchResidencyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/residency/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { residency } = response.data;
        setFormData({
          qualifyInStateTuition: residency.qualifyInStateTuition || '',
          kansasResident: residency.kansasResident || '',
          livedInKansasSinceBirth: residency.livedInKansasSinceBirth || '',
          kansasResidenceStartDate: residency.kansasResidenceStartDate || '',
          kansasResidenceEndDate: residency.kansasResidenceEndDate || '',
          everLivedInKansas: residency.everLivedInKansas || '',
          kansasResidenceDates: residency.kansasResidenceDates || []
        });
        setProgress(residency.progress || 0);
      }
    } catch (error) {
      console.error('Error fetching residency data:', error);
      // Fallback to localStorage if backend fails
      const savedData = localStorage.getItem(`college_${collegeId}_residency`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save residency data to backend
  const saveResidencyData = async (data) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/residency/${collegeId}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { residency } = response.data;
        setProgress(residency.progress);
        return residency;
      }
    } catch (error) {
      console.error('Error saving residency data:', error);
      // Fallback to localStorage if backend fails
      localStorage.setItem(`college_${collegeId}_residency`, JSON.stringify(data));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Clear specific field in backend
  const clearField = async (field) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/residency/${collegeId}/clear/${field}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { residency } = response.data;
        setFormData(prev => ({
          ...prev,
          [field]: field.includes('Date') ? '' : field === 'kansasResidenceDates' ? [] : ''
        }));
        setProgress(residency.progress);
      }
    } catch (error) {
      console.error('Error clearing field:', error);
      // Fallback to localStorage if backend fails
      const updatedData = {
        ...formData,
        [field]: field.includes('Date') ? '' : field === 'kansasResidenceDates' ? [] : ''
      };
      setFormData(updatedData);
      localStorage.setItem(`college_${collegeId}_residency`, JSON.stringify(updatedData));
    }
  };

  useEffect(() => {
    fetchResidencyData();
  }, [collegeId]);

  const handleInputChange = async (field, value) => {
    const updatedData = { ...formData, [field]: value };
    
    // Clear dependent fields when parent field changes
    if (field === 'qualifyInStateTuition') {
      updatedData.kansasResident = '';
      updatedData.livedInKansasSinceBirth = '';
      updatedData.everLivedInKansas = '';
      updatedData.kansasResidenceStartDate = '';
      updatedData.kansasResidenceEndDate = '';
    } else if (field === 'kansasResident') {
      updatedData.livedInKansasSinceBirth = '';
      updatedData.everLivedInKansas = '';
      updatedData.kansasResidenceStartDate = '';
      updatedData.kansasResidenceEndDate = '';
    } else if (field === 'livedInKansasSinceBirth' || field === 'everLivedInKansas') {
      updatedData.kansasResidenceStartDate = '';
      updatedData.kansasResidenceEndDate = '';
    }

    setFormData(updatedData);

    // Auto-save to backend
    try {
      await saveResidencyData(updatedData);
    } catch (error) {
      // If backend save fails, fallback to localStorage
      localStorage.setItem(`college_${collegeId}_residency`, JSON.stringify(updatedData));
    }
  };

  const handleClearAnswer = async (field) => {
    await clearField(field);
  };

  const handleSave = async () => {
    try {
      await saveResidencyData(formData);
      alert('Residency data saved successfully!');
    } catch (error) {
      alert('Failed to save residency data. Please try again.');
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await saveResidencyData(formData);
      // FIXED: Changed to firstyear/dashboard prefix
      navigate(`/firstyear/dashboard/colleges/${collegeId}/international`);
    } catch (error) {
      alert('Failed to save residency data. Please try again.');
    }
  };

  const handleBack = () => {
    // FIXED: Changed to firstyear/dashboard prefix
    navigate(`/firstyear/dashboard/colleges/${collegeId}`);
  };

  const handleSaveAndClose = () => {
    handleBack();
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

  // Determine if date fields should be shown
  const shouldShowDateFields = () => {
    // Show dates when: Kansas resident = yes AND lived since birth = no
    if (formData.kansasResident === 'yes' && formData.livedInKansasSinceBirth === 'no') {
      return true;
    }
    // Show dates when: Kansas resident = no AND ever lived in Kansas = yes
    if (formData.kansasResident === 'no' && formData.everLivedInKansas === 'yes') {
      return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="residency-form-container">
        <div className="residency-loading">
          <div className="residency-loading-spinner"></div>
          <p>Loading residency data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="residency-form-container">
      {/* Header Section */}
      <div className="residency-form-header">
        <div className="residency-header-nav">
          {/* FIXED: Updated onClick handler */}
          <button className="residency-back-button" onClick={handleBack}>
            ← Back to College Details
          </button>
        </div>
        
        <div className="residency-header-info">
          <h1 className="residency-title">Apply to University of Kansas</h1>
          <div className="residency-status">
            {/* <span className="status-indicator">In progress</span> */}
          </div>
          <p className="residency-description">
            The questions on this page are being asked by University of Kansas.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="residency-form-content">
        <div className="residency-progress">
          <span className="residency-progress-text">Section Progress: {progress}%</span>
          <div className="residency-progress-bar">
            <div className="residency-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Main Form Content */}
        <section className="residency-form-section">
          <h2 className="residency-section-title">Residency</h2>
          
          {/* In-State Tuition Qualification Question */}
          <div className="residency-question-card">
            <div className="residency-question-header">
              <h3 className="residency-question-title">Do you believe you may qualify for in-state tuition? *</h3>
              <span className="residency-question-required">Required</span>
            </div>
            <div className="residency-radio-group">
              <label className="residency-radio-option">
                <input
                  type="radio"
                  name="qualifyInStateTuition"
                  value="yes"
                  checked={formData.qualifyInStateTuition === 'yes'}
                  onChange={(e) => handleInputChange('qualifyInStateTuition', e.target.value)}
                  className="residency-radio-input"
                  disabled={saving}
                />
                <span className="residency-radio-label">Yes</span>
              </label>
              <label className="residency-radio-option">
                <input
                  type="radio"
                  name="qualifyInStateTuition"
                  value="no"
                  checked={formData.qualifyInStateTuition === 'no'}
                  onChange={(e) => handleInputChange('qualifyInStateTuition', e.target.value)}
                  className="residency-radio-input"
                  disabled={saving}
                />
                <span className="residency-radio-label">No</span>
              </label>
            </div>
            {(formData.qualifyInStateTuition === 'yes' || formData.qualifyInStateTuition === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('qualifyInStateTuition')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Conditional Questions based on In-State Tuition Answer */}
          {formData.qualifyInStateTuition === 'yes' && (
            <>
              {/* Kansas Resident Question */}
              <div className="residency-question-card">
                <div className="residency-question-header">
                  <h3 className="residency-question-title">Are you a resident of Kansas? *</h3>
                  <span className="residency-question-required">Required</span>
                </div>
                <div className="residency-radio-group">
                  <label className="residency-radio-option">
                    <input
                      type="radio"
                      name="kansasResident"
                      value="yes"
                      checked={formData.kansasResident === 'yes'}
                      onChange={(e) => handleInputChange('kansasResident', e.target.value)}
                      className="residency-radio-input"
                      disabled={saving}
                    />
                    <span className="residency-radio-label">Yes</span>
                  </label>
                  <label className="residency-radio-option">
                    <input
                      type="radio"
                      name="kansasResident"
                      value="no"
                      checked={formData.kansasResident === 'no'}
                      onChange={(e) => handleInputChange('kansasResident', e.target.value)}
                      className="residency-radio-input"
                      disabled={saving}
                    />
                    <span className="residency-radio-label">No</span>
                  </label>
                </div>
                {(formData.kansasResident === 'yes' || formData.kansasResident === 'no') && (
                  <button 
                    className="clear-answer-button"
                    onClick={() => handleClearAnswer('kansasResident')}
                    disabled={saving}
                  >
                    {saving ? 'Clearing...' : 'Clear answer'}
                  </button>
                )}
              </div>

              {/* Conditional Questions based on Kansas Resident Answer */}
              {formData.kansasResident === 'yes' && (
                <>
                  {/* Lived in Kansas Since Birth Question */}
                  <div className="residency-question-card">
                    <div className="residency-question-header">
                      <h3 className="residency-question-title">Have you lived in Kansas since birth? *</h3>
                      <span className="residency-question-required">Required</span>
                    </div>
                    <div className="residency-radio-group">
                      <label className="residency-radio-option">
                        <input
                          type="radio"
                          name="livedInKansasSinceBirth"
                          value="yes"
                          checked={formData.livedInKansasSinceBirth === 'yes'}
                          onChange={(e) => handleInputChange('livedInKansasSinceBirth', e.target.value)}
                          className="residency-radio-input"
                          disabled={saving}
                        />
                        <span className="residency-radio-label">Yes</span>
                      </label>
                      <label className="residency-radio-option">
                        <input
                          type="radio"
                          name="livedInKansasSinceBirth"
                          value="no"
                          checked={formData.livedInKansasSinceBirth === 'no'}
                          onChange={(e) => handleInputChange('livedInKansasSinceBirth', e.target.value)}
                          className="residency-radio-input"
                          disabled={saving}
                        />
                        <span className="residency-radio-label">No</span>
                      </label>
                    </div>
                    {(formData.livedInKansasSinceBirth === 'yes' || formData.livedInKansasSinceBirth === 'no') && (
                      <button 
                        className="clear-answer-button"
                        onClick={() => handleClearAnswer('livedInKansasSinceBirth')}
                        disabled={saving}
                      >
                        {saving ? 'Clearing...' : 'Clear answer'}
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Ever Lived in Kansas Question (shown when Kansas resident is no) */}
              {formData.kansasResident === 'no' && (
                <div className="residency-question-card">
                  <div className="residency-question-header">
                    <h3 className="residency-question-title">Have you ever lived in Kansas? *</h3>
                    <span className="residency-question-required">Required</span>
                  </div>
                  <div className="residency-radio-group">
                    <label className="residency-radio-option">
                      <input
                        type="radio"
                        name="everLivedInKansas"
                        value="yes"
                        checked={formData.everLivedInKansas === 'yes'}
                        onChange={(e) => handleInputChange('everLivedInKansas', e.target.value)}
                        className="residency-radio-input"
                        disabled={saving}
                      />
                      <span className="residency-radio-label">Yes</span>
                    </label>
                    <label className="residency-radio-option">
                      <input
                        type="radio"
                        name="everLivedInKansas"
                        value="no"
                        checked={formData.everLivedInKansas === 'no'}
                        onChange={(e) => handleInputChange('everLivedInKansas', e.target.value)}
                        className="residency-radio-input"
                        disabled={saving}
                      />
                      <span className="residency-radio-label">No</span>
                    </label>
                  </div>
                  {(formData.everLivedInKansas === 'yes' || formData.everLivedInKansas === 'no') && (
                    <button 
                      className="clear-answer-button"
                      onClick={() => handleClearAnswer('everLivedInKansas')}
                      disabled={saving}
                    >
                      {saving ? 'Clearing...' : 'Clear answer'}
                    </button>
                  )}
                </div>
              )}

              {/* Date Fields - Show in multiple scenarios */}
              {shouldShowDateFields() && (
                <div className="residency-question-card">
                  <div className="residency-question-header">
                    <h3 className="residency-question-title">Please list dates of Kansas residence</h3>
                    <span className="residency-question-required">Required</span>
                  </div>
                  <div className="residency-date-fields">
                    <div className="residency-form-group">
                      <label className="residency-form-label">Starting date *</label>
                      <input
                        type="date"
                        className="residency-form-input"
                        value={formatDateForInput(formData.kansasResidenceStartDate)}
                        onChange={(e) => handleInputChange('kansasResidenceStartDate', parseDateFromInput(e.target.value))}
                        disabled={saving}
                      />
                      <div className="residency-date-hint">Date uses "month day, year" format (e.g. August 1, 2002)</div>
                    </div>
                    <div className="residency-form-group">
                      <label className="residency-form-label">Ending date *</label>
                      <input
                        type="date"
                        className="residency-form-input"
                        value={formatDateForInput(formData.kansasResidenceEndDate)}
                        onChange={(e) => handleInputChange('kansasResidenceEndDate', parseDateFromInput(e.target.value))}
                        disabled={saving}
                      />
                      <div className="residency-date-hint">Date uses "month day, year" format (e.g. August 1, 2002)</div>
                    </div>
                  </div>
                  {(formData.kansasResidenceStartDate || formData.kansasResidenceEndDate) && (
                    <button 
                      className="clear-answer-button"
                      onClick={() => {
                        handleClearAnswer('kansasResidenceStartDate');
                        handleClearAnswer('kansasResidenceEndDate');
                      }}
                      disabled={saving}
                    >
                      {saving ? 'Clearing...' : 'Clear dates'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="residency-actions">
            {/* FIXED: Updated onClick handler */}
            <button 
              className="residency-secondary-button" 
              onClick={handleSaveAndClose}
              disabled={saving}
            >
              Save and Close
            </button>
            <button 
              className="residency-primary-button" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {/* FIXED: Updated button text to be consistent with other components */}
            <button 
              className="residency-primary-button" 
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

export default FirstResidency;