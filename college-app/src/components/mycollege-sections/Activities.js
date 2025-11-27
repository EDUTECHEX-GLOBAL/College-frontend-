import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Activities.css';

const API_URL = process.env.REACT_APP_API_URL;

const Activities = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    activities: [''] // Start with one empty activity by default
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null); // Track which activity to remove

  // Exact activity options from the screenshot
  const activityOptions = [
    'Air Force/ Space Force ROTC',
    'Army ROTC',
    'Broadcast media (Media Crossroads and KUJH)',
    'Catholic student programs',
    'Clubs and organizations',
    'Community service and volunteering',
    'Concert Band',
    'Disabilities accommodations',
    'E-Sports',
    'Engineering Diversity Programs',
    'Financial Aid & Scholarships',
    'Greek life (fraternities and sororities)',
    'Intramurals and sports club',
    'Jayhawk Finances Program',
    'Jazz Band',
    'Jewish student programs',
    'KJHK Student radio station',
    'KU Writing Center',
    'LGBTQIA + Programs and organizations',
    'Marching Band',
    'Marine Corps ROTC',
    'Multicultural resources & activities',
    'Navy ROTC',
    'Orchestra',
    'Recreation and fitness',
    'Religious organizations, general',
    'Student advertising agency (The Agency Steam Whistle Creative)',
    'Student senate',
    'Student union activities',
    'Study abroad',
    'Tutoring services (All subjects)',
    'Undergraduate research',
    'University Daily Kansan newspaper',
    'Vocal ensembles/Choir'
  ];

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
        setFormData({
          activities: activities.activities || ['']
        });
        setProgress(activities.progress || 0);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Fallback: start with one empty activity
      setFormData({ activities: [''] });
    } finally {
      setLoading(false);
    }
  };

  // Save activities data to backend
  const saveActivities = async (data) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/first-activities/${collegeId}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

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
    const finalActivities = updatedActivities.length === 0 ? [''] : updatedActivities;
    
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
        setFormData({ activities: [''] });
        setProgress(activities.progress);
      }
    } catch (error) {
      console.error('Error clearing activities:', error);
      // Fallback: reset to one empty activity locally
      setFormData({ activities: [''] });
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [collegeId]);

  const handleActivityChange = async (activity, index) => {
    const updatedActivities = [...formData.activities];
    
    if (activity === "") {
      // If user selects "Choose an option -", keep the field but empty
      updatedActivities[index] = "";
    } else {
      // Update the activity at the specific index
      updatedActivities[index] = activity;
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
      const updatedActivities = [...formData.activities, ""];
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
      navigate(`/dashboard/colleges/${collegeId}/contacts`);
    } catch (error) {
      alert('Failed to save activities. Please try again.');
    }
  };

  // Calculate available slots
  const availableSlots = 5 - formData.activities.length;
  // Count how many activities have been selected (non-empty)
  const selectedActivitiesCount = formData.activities.filter(activity => activity !== "").length;

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
          <button className="activities-back-button" onClick={() => navigate(`/dashboard/colleges/${collegeId}`)}>
            ← Back to College Details
          </button>
        </div>
        
        <div className="activities-header-info">
          <h1 className="activities-title">Apply to University of Kansas</h1>
          {/* <div className="activities-status">
            {selectedActivitiesCount > 0 && (
              <span className="status-indicator">● Complete</span>
            )}
          </div> */}
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
                      {activity && <span className="activity-status-complete">, Complete</span>}
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
                  <select 
                    className="activities-form-select"
                    value={activity}
                    onChange={(e) => handleActivityChange(e.target.value, index)}
                    disabled={saving}
                  >
                    <option value="">Choose an option -</option>
                    {activityOptions.map((option, optionIndex) => (
                      <option 
                        key={optionIndex} 
                        value={option} 
                        disabled={formData.activities.includes(option) && activity !== option}
                      >
                        {option}
                      </option>
                    ))}
                  </select>

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
              onClick={() => navigate(`/dashboard/colleges/${collegeId}`)}
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