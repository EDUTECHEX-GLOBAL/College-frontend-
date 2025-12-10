import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FirstContacts.css';

const API_URL = process.env.REACT_APP_API_URL;

const FirstContacts = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    textMessagePermission: '',
    hasTwitter: '',
    twitterHandle: '',
    hasSnapchat: '',
    snapchatUsername: '',
    hasInstagram: '',
    instagramUsername: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch contacts data from backend
  const fetchContactsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/contacts/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { contacts } = response.data;
        setFormData({
          textMessagePermission: contacts.textMessagePermission || '',
          hasTwitter: contacts.hasTwitter || '',
          twitterHandle: contacts.twitterHandle || '',
          hasSnapchat: contacts.hasSnapchat || '',
          snapchatUsername: contacts.snapchatUsername || '',
          hasInstagram: contacts.hasInstagram || '',
          instagramUsername: contacts.instagramUsername || ''
        });
        setProgress(contacts.progress || 0);
      }
    } catch (error) {
      console.error('Error fetching contacts data:', error);
      // Fallback to localStorage if backend fails
      const savedData = localStorage.getItem(`college_${collegeId}_contacts`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save contacts data to backend
  const saveContactsData = async (data) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/contacts/${collegeId}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { contacts } = response.data;
        setProgress(contacts.progress);
        return contacts;
      }
    } catch (error) {
      console.error('Error saving contacts data:', error);
      // Fallback to localStorage if backend fails
      localStorage.setItem(`college_${collegeId}_contacts`, JSON.stringify(data));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Clear specific field in backend
  const clearField = async (field) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/contacts/${collegeId}/clear/${field}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { contacts } = response.data;
        setFormData(prev => ({
          ...prev,
          [field]: ''
        }));
        setProgress(contacts.progress);
      }
    } catch (error) {
      console.error('Error clearing field:', error);
      // Fallback to localStorage if backend fails
      const updatedData = { ...formData, [field]: '' };
      setFormData(updatedData);
      localStorage.setItem(`college_${collegeId}_contacts`, JSON.stringify(updatedData));
    }
  };

  useEffect(() => {
    fetchContactsData();
  }, [collegeId]);

  const handleInputChange = async (field, value) => {
    const updatedData = { ...formData, [field]: value };
    
    // Clear social media handle when user selects "No"
    if (field === 'hasTwitter' && value === 'no') {
      updatedData.twitterHandle = '';
    }
    if (field === 'hasSnapchat' && value === 'no') {
      updatedData.snapchatUsername = '';
    }
    if (field === 'hasInstagram' && value === 'no') {
      updatedData.instagramUsername = '';
    }

    setFormData(updatedData);

    // Auto-save to backend
    try {
      await saveContactsData(updatedData);
    } catch (error) {
      // If backend save fails, fallback to localStorage
      localStorage.setItem(`college_${collegeId}_contacts`, JSON.stringify(updatedData));
    }
  };

  const handleClearAnswer = async (field) => {
    await clearField(field);
  };

  const handleSave = async () => {
    try {
      await saveContactsData(formData);
      alert('Contacts data saved successfully!');
    } catch (error) {
      alert('Failed to save contacts data. Please try again.');
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await saveContactsData(formData);
      // Fixed navigation path for first-year students
      navigate(`/firstyear/dashboard/colleges/${collegeId}/family`);
    } catch (error) {
      alert('Failed to save contacts data. Please try again.');
    }
  };

  const handleBack = () => {
    // Fixed navigation path for first-year students
    navigate(`/firstyear/dashboard/colleges/${collegeId}`);
  };

  const handleSaveAndClose = () => {
    handleBack();
  };

  if (loading) {
    return (
      <div className="firstcontacts-container">
        <div className="firstcontacts-loading">
          <div className="firstcontacts-loading-spinner"></div>
          <p>Loading contacts data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="firstcontacts-container">
      {/* Header Section */}
      <div className="firstcontacts-header">
        <div className="firstcontacts-header-nav">
          <button className="firstcontacts-back-button" onClick={handleBack}>
            ← Back to College Details
          </button>
        </div>
        
        <div className="firstcontacts-header-info">
          <h1 className="firstcontacts-title">Apply to University of Kansas</h1>
          <div className="firstcontacts-status">
            {/* <span className="firstcontacts-status-indicator">In progress</span> */}
          </div>
          <p className="firstcontacts-description">
            The questions on this page are being asked by University of Kansas.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="firstcontacts-content">
        <div className="firstcontacts-progress">
          <span className="firstcontacts-progress-text">Section Progress: {progress}%</span>
          <div className="firstcontacts-progress-bar">
            <div className="firstcontacts-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Main Form Content */}
        <section className="firstcontacts-form-section">
          <h2 className="firstcontacts-section-title">Contacts</h2>
          
          {/* Text Message Permission Question */}
          <div className="firstcontacts-question-card">
            <div className="firstcontacts-question-header">
              <h3 className="firstcontacts-question-title">
                I give permission to the University of Kansas to send me updates via text messaging. (Standard message charges apply.)
              </h3>
              <span className="firstcontacts-question-required">Required</span>
            </div>
            <div className="firstcontacts-radio-group">
              <label className="firstcontacts-radio-option">
                <input
                  type="radio"
                  name="textMessagePermission"
                  value="yes"
                  checked={formData.textMessagePermission === 'yes'}
                  onChange={(e) => handleInputChange('textMessagePermission', e.target.value)}
                  className="firstcontacts-radio-input"
                  disabled={saving}
                />
                <span className="firstcontacts-radio-label">Yes</span>
              </label>
              <label className="firstcontacts-radio-option">
                <input
                  type="radio"
                  name="textMessagePermission"
                  value="no"
                  checked={formData.textMessagePermission === 'no'}
                  onChange={(e) => handleInputChange('textMessagePermission', e.target.value)}
                  className="firstcontacts-radio-input"
                  disabled={saving}
                />
                <span className="firstcontacts-radio-label">No</span>
              </label>
            </div>
            {(formData.textMessagePermission === 'yes' || formData.textMessagePermission === 'no') && (
              <button 
                className="firstcontacts-clear-answer-button"
                onClick={() => handleClearAnswer('textMessagePermission')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Twitter Handle Question */}
          <div className="firstcontacts-question-card">
            <div className="firstcontacts-question-header">
              <h3 className="firstcontacts-question-title">Do you have a X (formerly Twitter) handle?</h3>
              <span className="firstcontacts-question-required">Required</span>
            </div>
            <div className="firstcontacts-radio-group">
              <label className="firstcontacts-radio-option">
                <input
                  type="radio"
                  name="hasTwitter"
                  value="yes"
                  checked={formData.hasTwitter === 'yes'}
                  onChange={(e) => handleInputChange('hasTwitter', e.target.value)}
                  className="firstcontacts-radio-input"
                  disabled={saving}
                />
                <span className="firstcontacts-radio-label">Yes</span>
              </label>
              <label className="firstcontacts-radio-option">
                <input
                  type="radio"
                  name="hasTwitter"
                  value="no"
                  checked={formData.hasTwitter === 'no'}
                  onChange={(e) => handleInputChange('hasTwitter', e.target.value)}
                  className="firstcontacts-radio-input"
                  disabled={saving}
                />
                <span className="firstcontacts-radio-label">No</span>
              </label>
            </div>
            
            {/* Twitter Handle Input - Only show if Yes is selected */}
            {formData.hasTwitter === 'yes' && (
              <div className="firstcontacts-input-group">
                <label className="firstcontacts-input-label">X (formerly Twitter) handle</label>
                <input
                  type="text"
                  className="firstcontacts-text-input"
                  value={formData.twitterHandle}
                  onChange={(e) => handleInputChange('twitterHandle', e.target.value)}
                  placeholder="Enter your X/Twitter handle"
                  disabled={saving}
                />
              </div>
            )}
            
            {(formData.hasTwitter === 'yes' || formData.hasTwitter === 'no') && (
              <button 
                className="firstcontacts-clear-answer-button"
                onClick={() => handleClearAnswer('hasTwitter')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Snapchat Username Question */}
          <div className="firstcontacts-question-card">
            <div className="firstcontacts-question-header">
              <h3 className="firstcontacts-question-title">Do you have a Snapchat username?</h3>
              <span className="firstcontacts-question-required">Required</span>
            </div>
            <div className="firstcontacts-radio-group">
              <label className="firstcontacts-radio-option">
                <input
                  type="radio"
                  name="hasSnapchat"
                  value="yes"
                  checked={formData.hasSnapchat === 'yes'}
                  onChange={(e) => handleInputChange('hasSnapchat', e.target.value)}
                  className="firstcontacts-radio-input"
                  disabled={saving}
                />
                <span className="firstcontacts-radio-label">Yes</span>
              </label>
              <label className="firstcontacts-radio-option">
                <input
                  type="radio"
                  name="hasSnapchat"
                  value="no"
                  checked={formData.hasSnapchat === 'no'}
                  onChange={(e) => handleInputChange('hasSnapchat', e.target.value)}
                  className="firstcontacts-radio-input"
                  disabled={saving}
                />
                <span className="firstcontacts-radio-label">No</span>
              </label>
            </div>
            
            {/* Snapchat Username Input - Only show if Yes is selected */}
            {formData.hasSnapchat === 'yes' && (
              <div className="firstcontacts-input-group">
                <label className="firstcontacts-input-label">Snapchat username</label>
                <input
                  type="text"
                  className="firstcontacts-text-input"
                  value={formData.snapchatUsername}
                  onChange={(e) => handleInputChange('snapchatUsername', e.target.value)}
                  placeholder="Enter your Snapchat username"
                  disabled={saving}
                />
              </div>
            )}
            
            {(formData.hasSnapchat === 'yes' || formData.hasSnapchat === 'no') && (
              <button 
                className="firstcontacts-clear-answer-button"
                onClick={() => handleClearAnswer('hasSnapchat')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Instagram Username Question */}
          <div className="firstcontacts-question-card">
            <div className="firstcontacts-question-header">
              <h3 className="firstcontacts-question-title">Do you have Instagram username?</h3>
              <span className="firstcontacts-question-required">Required</span>
            </div>
            <div className="firstcontacts-radio-group">
              <label className="firstcontacts-radio-option">
                <input
                  type="radio"
                  name="hasInstagram"
                  value="yes"
                  checked={formData.hasInstagram === 'yes'}
                  onChange={(e) => handleInputChange('hasInstagram', e.target.value)}
                  className="firstcontacts-radio-input"
                  disabled={saving}
                />
                <span className="firstcontacts-radio-label">Yes</span>
              </label>
              <label className="firstcontacts-radio-option">
                <input
                  type="radio"
                  name="hasInstagram"
                  value="no"
                  checked={formData.hasInstagram === 'no'}
                  onChange={(e) => handleInputChange('hasInstagram', e.target.value)}
                  className="firstcontacts-radio-input"
                  disabled={saving}
                />
                <span className="firstcontacts-radio-label">No</span>
              </label>
            </div>
            
            {/* Instagram Username Input - Only show if Yes is selected */}
            {formData.hasInstagram === 'yes' && (
              <div className="firstcontacts-input-group">
                <label className="firstcontacts-input-label">Instagram username</label>
                <input
                  type="text"
                  className="firstcontacts-text-input"
                  value={formData.instagramUsername}
                  onChange={(e) => handleInputChange('instagramUsername', e.target.value)}
                  placeholder="Enter your Instagram username"
                  disabled={saving}
                />
              </div>
            )}
            
            {(formData.hasInstagram === 'yes' || formData.hasInstagram === 'no') && (
              <button 
                className="firstcontacts-clear-answer-button"
                onClick={() => handleClearAnswer('hasInstagram')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="firstcontacts-actions">
            <button 
              className="firstcontacts-secondary-button" 
              onClick={handleSaveAndClose}
              disabled={saving}
            >
              Save and Close
            </button>
            <button 
              className="firstcontacts-primary-button" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="firstcontacts-primary-button" 
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

export default FirstContacts;