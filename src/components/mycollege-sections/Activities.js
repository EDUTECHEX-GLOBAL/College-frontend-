import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import './Activities.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const Activities = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    activities: [{ value: '', label: 'Choose an option -' }] // Start with one empty activity by default
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null); // Track which activity to remove

  // Exact activity options from the screenshot - formatted for react-select
  const activityOptions = [
    { value: 'Air Force/ Space Force ROTC', label: 'Air Force/ Space Force ROTC' },
    { value: 'Army ROTC', label: 'Army ROTC' },
    { value: 'Broadcast media (Media Crossroads and KUJH)', label: 'Broadcast media (Media Crossroads and KUJH)' },
    { value: 'Catholic student programs', label: 'Catholic student programs' },
    { value: 'Clubs and organizations', label: 'Clubs and organizations' },
    { value: 'Community service and volunteering', label: 'Community service and volunteering' },
    { value: 'Concert Band', label: 'Concert Band' },
    { value: 'Disabilities accommodations', label: 'Disabilities accommodations' },
    { value: 'E-Sports', label: 'E-Sports' },
    { value: 'Engineering Diversity Programs', label: 'Engineering Diversity Programs' },
    { value: 'Financial Aid & Scholarships', label: 'Financial Aid & Scholarships' },
    { value: 'Greek life (fraternities and sororities)', label: 'Greek life (fraternities and sororities)' },
    { value: 'Intramurals and sports club', label: 'Intramurals and sports club' },
    { value: 'Jayhawk Finances Program', label: 'Jayhawk Finances Program' },
    { value: 'Jazz Band', label: 'Jazz Band' },
    { value: 'Jewish student programs', label: 'Jewish student programs' },
    { value: 'KJHK Student radio station', label: 'KJHK Student radio station' },
    { value: 'KU Writing Center', label: 'KU Writing Center' },
    { value: 'LGBTQIA + Programs and organizations', label: 'LGBTQIA + Programs and organizations' },
    { value: 'Marching Band', label: 'Marching Band' },
    { value: 'Marine Corps ROTC', label: 'Marine Corps ROTC' },
    { value: 'Multicultural resources & activities', label: 'Multicultural resources & activities' },
    { value: 'Navy ROTC', label: 'Navy ROTC' },
    { value: 'Orchestra', label: 'Orchestra' },
    { value: 'Recreation and fitness', label: 'Recreation and fitness' },
    { value: 'Religious organizations, general', label: 'Religious organizations, general' },
    { value: 'Student advertising agency (The Agency Steam Whistle Creative)', label: 'Student advertising agency (The Agency Steam Whistle Creative)' },
    { value: 'Student senate', label: 'Student senate' },
    { value: 'Student union activities', label: 'Student union activities' },
    { value: 'Study abroad', label: 'Study abroad' },
    { value: 'Tutoring services (All subjects)', label: 'Tutoring services (All subjects)' },
    { value: 'Undergraduate research', label: 'Undergraduate research' },
    { value: 'University Daily Kansan newspaper', label: 'University Daily Kansan newspaper' },
    { value: 'Vocal ensembles/Choir', label: 'Vocal ensembles/Choir' }
  ];

  // Get already selected values to disable them in other dropdowns
  const getSelectedValues = () => {
    return formData.activities
      .filter(activity => activity.value !== '')
      .map(activity => activity.value);
  };

  // Filter options for each dropdown - exclude already selected values from other dropdowns
  const getFilteredOptions = (currentIndex) => {
    const selectedValues = getSelectedValues();
    return activityOptions.filter(option => {
      // Keep the option if:
      // 1. It's the currently selected value for this dropdown, OR
      // 2. It's not selected in any other dropdown
      const currentValue = formData.activities[currentIndex]?.value;
      return option.value === currentValue || !selectedValues.includes(option.value);
    });
  };

  // Fetch activities data from backend
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/first-activities/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { activities } = response.data;
        const backendActivities = activities.activities || [''];
        
        // Convert backend string array to react-select format
        const formattedActivities = backendActivities.map(activity => {
          if (activity === '') {
            return { value: '', label: 'Choose an option -' };
          }
          const foundOption = activityOptions.find(opt => opt.value === activity);
          return foundOption || { value: activity, label: activity };
        });

        setFormData({
          activities: formattedActivities
        });
        setProgress(activities.progress || 0);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Fallback: start with one empty activity
      setFormData({ activities: [{ value: '', label: 'Choose an option -' }] });
    } finally {
      setLoading(false);
    }
  };

  // Save activities data to backend
  const saveActivities = async (data) => {
    try {
      setSaving(true);
      
      // Convert react-select format to simple string array for backend
      const activitiesForBackend = data.activities.map(item => item.value);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/first-activities/${collegeId}`, 
        { activities: activitiesForBackend }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const { activities } = response.data;
        setProgress(activities.progress);
        return activities;
      }
    } catch (error) {
      console.error('Error saving activities:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Clear specific activity
  const clearActivity = async (index) => {
    const updatedActivities = formData.activities.filter((_, i) => i !== index);
    
    // If removing the last activity, keep at least one empty activity
    const finalActivities = updatedActivities.length === 0 
      ? [{ value: '', label: 'Choose an option -' }] 
      : updatedActivities;
    
    const updatedData = { activities: finalActivities };
    setFormData(updatedData);
    setShowRemoveConfirm(null); // Close confirmation dialog

    try {
      await saveActivities(updatedData);
    } catch (error) {
      console.error('Error clearing activity:', error);
    }
  };

  // Clear all activities
  const clearAllActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/first-activities/${collegeId}/clear`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { activities } = response.data;
        // After clearing all, keep one empty activity
        setFormData({ activities: [{ value: '', label: 'Choose an option -' }] });
        setProgress(activities.progress);
      }
    } catch (error) {
      console.error('Error clearing activities:', error);
      // Fallback: reset to one empty activity locally
      setFormData({ activities: [{ value: '', label: 'Choose an option -' }] });
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [collegeId]);

  const handleActivityChange = async (selectedOption, index) => {
    const updatedActivities = [...formData.activities];
    
    if (!selectedOption) {
      // If user clears the selection, set to empty option
      updatedActivities[index] = { value: '', label: 'Choose an option -' };
    } else {
      // Update the activity at the specific index
      updatedActivities[index] = selectedOption;
    }

    const updatedData = { activities: updatedActivities };
    setFormData(updatedData);

    // Auto-save to backend
    try {
      await saveActivities(updatedData);
    } catch (error) {
      console.error('Error auto-saving activity:', error);
    }
  };

  const handleAddActivity = () => {
    if (formData.activities.length < 5) {
      const updatedActivities = [...formData.activities, { value: '', label: 'Choose an option -' }];
      setFormData({ activities: updatedActivities });
    }
  };

  const handleRemoveClick = (index) => {
    setShowRemoveConfirm(index);
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirm(null);
  };

  const handleSave = async () => {
    try {
      await saveActivities(formData);
      alert('Activities saved successfully!');
    } catch (error) {
      alert('Failed to save activities. Please try again.');
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await saveActivities(formData);
      navigate(`/firstyear/dashboard/colleges/${collegeId}/contacts`);
    } catch (error) {
      alert('Failed to save activities. Please try again.');
    }
  };

  // Calculate available slots
  const availableSlots = 5 - formData.activities.length;
  // Count how many activities have been selected (non-empty)
  const selectedActivitiesCount = formData.activities.filter(activity => activity.value !== "").length;

  if (loading) {
    return (
      <div className="activities-form-container">
        <div className="activities-loading">
          <div className="activities-loading-spinner"></div>
          <p>Loading activities data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activities-form-container">
      {/* Header Section */}
      <div className="activities-form-header">
        <div className="activities-header-nav">
          <button 
            className="activities-back-button" 
            onClick={() => navigate(`/firstyear/dashboard/colleges/${collegeId}`)}
          >
            ← Back to College Details
          </button>
        </div>
        
        <div className="activities-header-info">
          <h1 className="activities-title">Apply to University of Kansas</h1>
          <p className="activities-description">
            The questions on this page are being asked by University of Kansas.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="activities-form-content">
        <div className="activities-progress">
          <span className="activities-progress-text">Section Progress: {progress}%</span>
          <div className="activities-progress-bar">
            <div className="activities-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Main Form Content */}
        <section className="activities-form-section">
          <h2 className="activities-section-title">Activities</h2>
          
          {/* Activities Question */}
          <div className="activities-question-card">
            <div className="activities-question-header">
              <h3 className="activities-question-title">What activities at University of Kansas interest you?</h3>
              <span className="activities-question-required">Required</span>
            </div>
            <p className="activities-question-description">List in order of preference</p>

            {/* Activity Selection Areas */}
            <div className="activities-selection-container">
              {formData.activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-header">
                    <span className="activity-number">
                      Activity {index + 1}
                      {activity.value && <span className="activity-status-complete">, Complete</span>}
                    </span>
                    {formData.activities.length > 1 && ( // Only show remove button if more than one activity
                      <button 
                        className="remove-activity-button"
                        onClick={() => handleRemoveClick(index)}
                        disabled={saving}
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  
                  {/* React Select Dropdown */}
                  <div className="react-select-wrapper">
                    <Select
                      value={activity.value ? activity : null}
                      onChange={(selectedOption) => handleActivityChange(selectedOption, index)}
                      options={getFilteredOptions(index)}
                      placeholder="Choose an option -"
                      isDisabled={saving}
                      isClearable={true}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderColor: state.isFocused ? '#2563eb' : '#d1d5db',
                          boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
                          '&:hover': {
                            borderColor: '#9ca3af'
                          },
                          borderRadius: '6px',
                          minHeight: '42px',
                          fontSize: '14px'
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected ? '#2563eb' : 
                                          state.isFocused ? '#f0f9ff' : 'white',
                          color: state.isSelected ? 'white' : '#111827',
                          fontSize: '14px',
                          padding: '10px 12px',
                          '&:active': {
                            backgroundColor: '#1d4ed8'
                          }
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
                        menu: (base) => ({
                          ...base,
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          zIndex: 100
                        })
                      }}
                    />
                  </div>

                  {/* Remove Confirmation Dialog */}
                  {showRemoveConfirm === index && (
                    <div className="remove-confirmation-dialog">
                      <div className="confirmation-content">
                        <h4 className="confirmation-title">Remove Activity {index + 1}</h4>
                        <p className="confirmation-message">
                          Are you sure you want to remove this activity?
                        </p>
                        <div className="confirmation-actions">
                          <button 
                            className="confirmation-cancel-button"
                            onClick={handleCancelRemove}
                          >
                            Cancel
                          </button>
                          <button 
                            className="confirmation-remove-button"
                            onClick={() => clearActivity(index)}
                            disabled={saving}
                          >
                            {saving ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Another Activity Button */}
              {availableSlots > 0 && (
                <div className="add-activity-section">
                  <button 
                    className="add-activity-button"
                    onClick={handleAddActivity}
                    disabled={saving}
                  >
                    + Add another activity ({availableSlots} of 5 available)
                  </button>
                </div>
              )}
            </div>

            {/* Clear All Button - Only show if there are selected activities */}
            {selectedActivitiesCount > 0 && (
              <div className="clear-all-section">
                <button 
                  className="clear-all-activities-button"
                  onClick={clearAllActivities}
                  disabled={saving}
                >
                  {saving ? 'Clearing...' : 'Clear all activities'}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="activities-actions">
            <button 
              className="activities-secondary-button" 
              onClick={() => navigate(`/firstyear/dashboard/colleges/${collegeId}`)}
              disabled={saving}
            >
              Save and Close
            </button>
            <button 
              className="activities-primary-button" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="activities-primary-button" 
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

export default Activities;