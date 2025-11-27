import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HighSchoolCurriculum.css';

const API_URL = process.env.REACT_APP_API_URL;

const HighSchoolCurriculum = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
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

  // Language year options
  const languageYearOptions = [
    { label: '1 year or less', value: '1-year-or-less' },
    { label: '2 years', value: '2-years' },
    { label: '3 years', value: '3-years' },
    { label: '4+ years', value: '4-plus-years' }
  ];

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

  const handleInputChange = async (field, value) => {
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
      navigate(`/dashboard/colleges/${collegeId}/activities`);
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
          <button className="high-school-curriculum-back-button" onClick={() => navigate(`/dashboard/colleges/${collegeId}`)}>
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
          
          {/* World Language Question */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                1. How many years of a world language will you have taken at the time of graduation?*
              </h3>
              <span className="high-school-curriculum-question-required">Required</span>
            </div>
            <select 
              className="high-school-curriculum-form-select"
              value={formData.worldLanguageYears}
              onChange={(e) => handleInputChange('worldLanguageYears', e.target.value)}
              disabled={saving}
            >
              <option value="">Choose an option</option>
              {languageYearOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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

          {/* Honors Courses Question */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                At the time of graduation, will you have taken any Honors courses while in high school?*
              </h3>
              <span className="high-school-curriculum-question-required">Required</span>
            </div>
            <div className="high-school-curriculum-radio-group">
              <label className="high-school-curriculum-radio-option">
                <input
                  type="radio"
                  name="honorsCourses"
                  value="yes"
                  checked={formData.honorsCourses === 'yes'}
                  onChange={(e) => handleInputChange('honorsCourses', e.target.value)}
                  className="high-school-curriculum-radio-input"
                  disabled={saving}
                />
                <span className="high-school-curriculum-radio-label">Yes</span>
              </label>
              <label className="high-school-curriculum-radio-option">
                <input
                  type="radio"
                  name="honorsCourses"
                  value="no"
                  checked={formData.honorsCourses === 'no'}
                  onChange={(e) => handleInputChange('honorsCourses', e.target.value)}
                  className="high-school-curriculum-radio-input"
                  disabled={saving}
                />
                <span className="high-school-curriculum-radio-label">No</span>
              </label>
            </div>
            {(formData.honorsCourses === 'yes' || formData.honorsCourses === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('honorsCourses')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* College Credit Courses Question */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                At the time of graduation, will you have taken any courses, other than AP/IB, for college credit while in high school?*
              </h3>
              <span className="high-school-curriculum-question-required">Required</span>
            </div>
            <div className="high-school-curriculum-radio-group">
              <label className="high-school-curriculum-radio-option">
                <input
                  type="radio"
                  name="collegeCreditCourses"
                  value="yes"
                  checked={formData.collegeCreditCourses === 'yes'}
                  onChange={(e) => handleInputChange('collegeCreditCourses', e.target.value)}
                  className="high-school-curriculum-radio-input"
                  disabled={saving}
                />
                <span className="high-school-curriculum-radio-label">Yes</span>
              </label>
              <label className="high-school-curriculum-radio-option">
                <input
                  type="radio"
                  name="collegeCreditCourses"
                  value="no"
                  checked={formData.collegeCreditCourses === 'no'}
                  onChange={(e) => handleInputChange('collegeCreditCourses', e.target.value)}
                  className="high-school-curriculum-radio-input"
                  disabled={saving}
                />
                <span className="high-school-curriculum-radio-label">No</span>
              </label>
            </div>
            {(formData.collegeCreditCourses === 'yes' || formData.collegeCreditCourses === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('collegeCreditCourses')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* AP Courses Question */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                At the time of graduation, will you have taken any AP courses while in high school?*
              </h3>
              <span className="high-school-curriculum-question-required">Required</span>
            </div>
            <div className="high-school-curriculum-radio-group">
              <label className="high-school-curriculum-radio-option">
                <input
                  type="radio"
                  name="apCourses"
                  value="yes"
                  checked={formData.apCourses === 'yes'}
                  onChange={(e) => handleInputChange('apCourses', e.target.value)}
                  className="high-school-curriculum-radio-input"
                  disabled={saving}
                />
                <span className="high-school-curriculum-radio-label">Yes</span>
              </label>
              <label className="high-school-curriculum-radio-option">
                <input
                  type="radio"
                  name="apCourses"
                  value="no"
                  checked={formData.apCourses === 'no'}
                  onChange={(e) => handleInputChange('apCourses', e.target.value)}
                  className="high-school-curriculum-radio-input"
                  disabled={saving}
                />
                <span className="high-school-curriculum-radio-label">No</span>
              </label>
            </div>
            {(formData.apCourses === 'yes' || formData.apCourses === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('apCourses')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* IB Courses Question */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                At the time of graduation, will you have taken any IB courses while in high school?*
              </h3>
              <span className="high-school-curriculum-question-required">Required</span>
            </div>
            <div className="high-school-curriculum-radio-group">
              <label className="high-school-curriculum-radio-option">
                <input
                  type="radio"
                  name="ibCourses"
                  value="yes"
                  checked={formData.ibCourses === 'yes'}
                  onChange={(e) => handleInputChange('ibCourses', e.target.value)}
                  className="high-school-curriculum-radio-input"
                  disabled={saving}
                />
                <span className="high-school-curriculum-radio-label">Yes</span>
              </label>
              <label className="high-school-curriculum-radio-option">
                <input
                  type="radio"
                  name="ibCourses"
                  value="no"
                  checked={formData.ibCourses === 'no'}
                  onChange={(e) => handleInputChange('ibCourses', e.target.value)}
                  className="high-school-curriculum-radio-input"
                  disabled={saving}
                />
                <span className="high-school-curriculum-radio-label">No</span>
              </label>
            </div>
            {(formData.ibCourses === 'yes' || formData.ibCourses === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('ibCourses')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* IB Diploma Question */}
          <div className="high-school-curriculum-question-card">
            <div className="high-school-curriculum-question-header">
              <h3 className="high-school-curriculum-question-title">
                At the time of graduation, will you have earned an IB diploma while in high school?*
              </h3>
              <span className="high-school-curriculum-question-required">Required</span>
            </div>
            <div className="high-school-curriculum-radio-group">
              <label className="high-school-curriculum-radio-option">
                <input
                  type="radio"
                  name="ibDiploma"
                  value="yes"
                  checked={formData.ibDiploma === 'yes'}
                  onChange={(e) => handleInputChange('ibDiploma', e.target.value)}
                  className="high-school-curriculum-radio-input"
                  disabled={saving}
                />
                <span className="high-school-curriculum-radio-label">Yes</span>
              </label>
              <label className="high-school-curriculum-radio-option">
                <input
                  type="radio"
                  name="ibDiploma"
                  value="no"
                  checked={formData.ibDiploma === 'no'}
                  onChange={(e) => handleInputChange('ibDiploma', e.target.value)}
                  className="high-school-curriculum-radio-input"
                  disabled={saving}
                />
                <span className="high-school-curriculum-radio-label">No</span>
              </label>
            </div>
            {(formData.ibDiploma === 'yes' || formData.ibDiploma === 'no') && (
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
              onClick={() => navigate(`/dashboard/colleges/${collegeId}`)}
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