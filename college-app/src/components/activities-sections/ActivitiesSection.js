import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import './ActivitiesSection.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const ActivitiesSection = () => {
  const navigate = useNavigate();
  const [hasActivities, setHasActivities] = useState(null);
  const [showActivitiesForm, setShowActivitiesForm] = useState(false);
  const [activities, setActivities] = useState([{
    id: 1,
    type: '',
    position: '',
    organization: '',
    description: '',
    gradeLevels: [],
    timing: '',
    hoursPerWeek: '',
    weeksPerYear: '',
    continueInCollege: null
  }]);
  const [loading, setLoading] = useState(false);

  const activityTypes = [
    'Social Justice', 'Art', 'Athletics: Club', 'Athletics: JV/Varsity', 
    'Career Oriented', 'Community Service', 'Computer/Technology', 'Cultural',
    'Dance', 'Debate/Speech', 'Environmental', 'Family Responsibilities',
    'Foreign Exchange', 'Foreign Language', 'Internship', 'Journalism/Publication',
    'Junior ROTC', 'Music: Instrumental', 'Music: Vocal', 'Religious',
    'Research', 'Robotics', 'School Spirit', 'Science/Math',
    'Student Government', 'Theater/Drama', 'Work (Paid)', 'Other'
  ].map(type => ({ value: type, label: type }));

  // Custom styles for react-select
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '44px',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 123, 255, 0.1)' : 'none',
      borderColor: state.isFocused ? '#007bff' : '#ced4da',
      '&:hover': {
        borderColor: state.isFocused ? '#007bff' : '#9ca3af'
      },
      fontSize: '14px',
      fontFamily: 'inherit',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '6px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e5e7eb',
      zIndex: 9999,
      marginTop: '2px'
    }),
    menuList: (base) => ({
      ...base,
      padding: 0,
      maxHeight: '200px'
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '14px',
      padding: '10px 12px',
      backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : 'white',
      color: state.isSelected ? 'white' : '#1a1a1a',
      '&:active': {
        backgroundColor: '#007bff',
        color: 'white'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6c757d'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#1a1a1a'
    })
  };

  useEffect(() => {
    const fetchActivitiesData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_URL}/api/students/activities`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          const activitiesData = response.data.activitiesData;
          setHasActivities(activitiesData.hasActivities);
          
          if (activitiesData.hasActivities && activitiesData.activities && activitiesData.activities.length > 0) {
            // Convert stored activity types to react-select format
            const formattedActivities = activitiesData.activities.map(activity => ({
              ...activity,
              type: activity.type ? { value: activity.type, label: activity.type } : ''
            }));
            setActivities(formattedActivities);
            setShowActivitiesForm(true);
          }
        }
      } catch (error) {
        console.error('Error fetching activities data:', error);
      }
    };

    fetchActivitiesData();
  }, []);

  // ADDED: Back to Dashboard function
  const handleBackToDashboard = () => {
    const isFirstYear = window.location.pathname.includes('/firstyear/');
    const basePath = isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard';
    navigate(basePath);
  };

  const handleAnswerSelect = async (answer) => {
    setLoading(true);
    
    // Immediately update UI
    setHasActivities(answer);
    
    if (answer) {
      setShowActivitiesForm(true);
    } else {
      // If No, mark as complete and redirect to dashboard
      // FIXED: Use handleBackToDashboard instead of hardcoded path
      handleBackToDashboard();
    }

    // Save to backend
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/sign-in');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/students/activities/has-activities`,
        { hasActivities: answer },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update localStorage with fresh data from backend
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          localStorage.setItem('userData', JSON.stringify({
            ...userData,
            applicationProgress: {
              ...userData.applicationProgress,
              activities: response.data.applicationProgress?.activities || userData.applicationProgress?.activities
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error saving activities preference:', error);
      alert('Error saving your preference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateActivity = (index, field, value) => {
    const updatedActivities = [...activities];
    updatedActivities[index] = {
      ...updatedActivities[index],
      [field]: value
    };
    setActivities(updatedActivities);
  };

  const updateGradeLevels = (index, grade, checked) => {
    const updatedActivities = [...activities];
    if (checked) {
      updatedActivities[index].gradeLevels = [...updatedActivities[index].gradeLevels, grade];
    } else {
      updatedActivities[index].gradeLevels = updatedActivities[index].gradeLevels.filter(g => g !== grade);
    }
    setActivities(updatedActivities);
  };

  const addActivity = () => {
    if (activities.length < 10) {
      setActivities([...activities, {
        id: activities.length + 1,
        type: '',
        position: '',
        organization: '',
        description: '',
        gradeLevels: [],
        timing: '',
        hoursPerWeek: '',
        weeksPerYear: '',
        continueInCollege: null
      }]);
    }
  };

  const removeActivity = (index) => {
    if (activities.length > 1) {
      const updatedActivities = activities.filter((_, i) => i !== index);
      setActivities(updatedActivities);
    }
  };

  const handleSaveAndContinue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/sign-in');
        return;
      }

      // Convert react-select objects back to strings for backend
      const activitiesForBackend = activities.map(activity => ({
        ...activity,
        type: activity.type ? activity.type.value : ''
      }));

      // Validate required fields
      const hasEmptyFields = activitiesForBackend.some(activity => 
        !activity.type || 
        !activity.position || 
        !activity.description || 
        activity.gradeLevels.length === 0 || 
        !activity.timing || 
        !activity.hoursPerWeek || 
        !activity.weeksPerYear || 
        activity.continueInCollege === null
      );

      if (hasEmptyFields) {
        alert('Please fill all required fields for each activity.');
        setLoading(false);
        return;
      }

      // Save activities to backend
      const response = await axios.post(
        `${API_URL}/api/students/activities/details`,
        { activities: activitiesForBackend },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update localStorage with progress data
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          localStorage.setItem('userData', JSON.stringify({
            ...userData,
            applicationProgress: {
              ...userData.applicationProgress,
              activities: 100
            }
          }));
        }

        // Navigate to responsibilities section
        navigate('/firstyear/dashboard/activities/responsibilities');
      }
    } catch (error) {
      console.error('Error saving activities details:', error);
      alert('Error saving your activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAnswer = async () => {
    setLoading(true);
    
    // Immediately update UI
    setHasActivities(null);
    setShowActivitiesForm(false);
    setActivities([{
      id: 1,
      type: '',
      position: '',
      organization: '',
      description: '',
      gradeLevels: [],
      timing: '',
      hoursPerWeek: '',
      weeksPerYear: '',
      continueInCollege: null
    }]);

    // Clear from backend
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.delete(`${API_URL}/api/students/activities/has-activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Update localStorage progress
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          localStorage.setItem('userData', JSON.stringify({
            ...userData,
            applicationProgress: {
              ...userData.applicationProgress,
              activities: 0
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error clearing activities answer:', error);
      alert('Error clearing your answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render Initial Question Screen
  if (!showActivitiesForm) {
    return (
      <div className="activities-container">
        <div className="activities-content">
          {/* MODIFIED: Added Back Button to the left of Complete your Application */}
          <div className="activities-header">
            <div className="header-left-container">
              <button
                className="back-dashboard-btn"
                onClick={handleBackToDashboard}
                disabled={loading}
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="header-center">
              <h1>Complete your Common Application</h1>
            </div>
            <div className="header-right">
              <div className="progress-status">In progress</div>
            </div>
          </div>

          <div className="activities-card">
            <h2>Activities</h2>
            
            <div className="activities-description">
              <p>Reporting activities can help colleges better understand your life outside of the classroom. Examples of activities might include:</p>
              <ul>
                <li>Arts or music</li>
                <li>Clubs</li>
                <li>Community engagement</li>
                <li>Family responsibilities (<a href="#" onClick={(e) => e.preventDefault()}>learn more</a>)</li>
                <li>Hobbies</li>
                <li>Sports</li>
                <li>Work or volunteering</li>
                <li>Other experiences that have been meaningful to you</li>
              </ul>
            </div>

            <div className="activities-question">
              <label>Do you have any activities that you wish to report? *</label>
              <div className="answer-options">
                <button
                  className={`answer-btn ${hasActivities === true ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(true)}
                  disabled={loading}
                >
                  Yes
                </button>
                <button
                  className={`answer-btn ${hasActivities === false ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(false)}
                  disabled={loading}
                >
                  No
                </button>
              </div>
              
              {hasActivities !== null && (
                <button
                  className="clear-answer"
                  onClick={handleClearAnswer}
                  disabled={loading}
                >
                  Clear answer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Activities Form Screen
  return (
    <div className="activities-container">
      <div className="activities-content">
        {/* MODIFIED: Added Back Button to the left of Complete your Application */}
        <div className="activities-header">
          <div className="header-left-container">
            <button
              className="back-dashboard-btn"
              onClick={handleBackToDashboard}
              disabled={loading}
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="header-center">
            <h1>Complete your Common Application</h1>
          </div>
          <div className="header-right">
            <div className="progress-status">In progress</div>
          </div>
        </div>

        <div className="activities-card">
          <h2>Activities</h2>
          
          <div className="activities-instructions">
            <p>Please list your activities in the order of their importance to you.</p>
          </div>

          {activities.map((activity, index) => (
            <div key={activity.id} className="activity-form">
              <div className="activity-header">
                <h3>Activity {index + 1}</h3>
                {activities.length > 1 && (
                  <button
                    className="remove-activity"
                    onClick={() => removeActivity(index)}
                    type="button"
                    disabled={loading}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Activity type *</label>
                <Select
                  options={activityTypes}
                  value={activity.type}
                  onChange={(selectedOption) => updateActivity(index, 'type', selectedOption)}
                  placeholder="Choose an option"
                  styles={customStyles}
                  isDisabled={loading}
                  isSearchable={true}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>

              <div className="form-group">
                <label>Position/Leadership description (Max characters: 50) *</label>
                <input
                  type="text"
                  value={activity.position}
                  onChange={(e) => updateActivity(index, 'position', e.target.value)}
                  maxLength={50}
                  placeholder="Enter position or leadership role"
                  required
                  disabled={loading}
                />
                <div className="char-count">{activity.position.length}/50</div>
              </div>

              <div className="form-group">
                <label>Organization Name (Max characters: 100)</label>
                <input
                  type="text"
                  value={activity.organization}
                  onChange={(e) => updateActivity(index, 'organization', e.target.value)}
                  maxLength={100}
                  placeholder="Enter organization name"
                  disabled={loading}
                />
                <div className="char-count">{activity.organization.length}/100</div>
              </div>

              <div className="form-group">
                <label>Please describe this activity, including what you accomplished and any recognition you received, etc. (Max characters: 150) *</label>
                <textarea
                  value={activity.description}
                  onChange={(e) => updateActivity(index, 'description', e.target.value)}
                  maxLength={150}
                  placeholder="Describe your activity"
                  rows="3"
                  required
                  disabled={loading}
                />
                <div className="char-count">{activity.description.length}/150</div>
              </div>

              <div className="form-group">
                <label>Participation grade levels *</label>
                <div className="simple-checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={activity.gradeLevels.includes(9)}
                      onChange={(e) => updateGradeLevels(index, 9, e.target.checked)}
                      disabled={loading}
                    />
                    <span>9</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={activity.gradeLevels.includes(10)}
                      onChange={(e) => updateGradeLevels(index, 10, e.target.checked)}
                      disabled={loading}
                    />
                    <span>10</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={activity.gradeLevels.includes(11)}
                      onChange={(e) => updateGradeLevels(index, 11, e.target.checked)}
                      disabled={loading}
                    />
                    <span>11</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={activity.gradeLevels.includes(12)}
                      onChange={(e) => updateGradeLevels(index, 12, e.target.checked)}
                      disabled={loading}
                    />
                    <span>12</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={activity.gradeLevels.includes('Post-graduate')}
                      onChange={(e) => updateGradeLevels(index, 'Post-graduate', e.target.checked)}
                      disabled={loading}
                    />
                    <span>Post-graduate</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Timing of participation *</label>
                <div className="simple-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`timing-${index}`}
                      value="During school year"
                      checked={activity.timing === 'During school year'}
                      onChange={(e) => updateActivity(index, 'timing', e.target.value)}
                      required
                      disabled={loading}
                    />
                    <span>During school year</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`timing-${index}`}
                      value="During school break"
                      checked={activity.timing === 'During school break'}
                      onChange={(e) => updateActivity(index, 'timing', e.target.value)}
                      disabled={loading}
                    />
                    <span>During school break</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`timing-${index}`}
                      value="All year"
                      checked={activity.timing === 'All year'}
                      onChange={(e) => updateActivity(index, 'timing', e.target.value)}
                      disabled={loading}
                    />
                    <span>All year</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hours spent per week *</label>
                  <input
                    type="number"
                    value={activity.hoursPerWeek}
                    onChange={(e) => updateActivity(index, 'hoursPerWeek', e.target.value)}
                    min="0"
                    max="168"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Weeks spent per year *</label>
                  <input
                    type="number"
                    value={activity.weeksPerYear}
                    onChange={(e) => updateActivity(index, 'weeksPerYear', e.target.value)}
                    min="0"
                    max="52"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>I intend to participate in a similar activity in college. *</label>
                <div className="simple-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`continue-${index}`}
                      checked={activity.continueInCollege === true}
                      onChange={() => updateActivity(index, 'continueInCollege', true)}
                      required
                      disabled={loading}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`continue-${index}`}
                      checked={activity.continueInCollege === false}
                      onChange={() => updateActivity(index, 'continueInCollege', false)}
                      disabled={loading}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {index < activities.length - 1 && <hr />}
            </div>
          ))}

          {activities.length < 10 && (
            <div className="add-activity-section">
              <span className="activities-remaining">
                ({10 - activities.length} of 10 available)
              </span>
              <button
                className="add-activity-btn"
                onClick={addActivity}
                type="button"
                disabled={loading}
              >
                Add another activity
              </button>
            </div>
          )}

          <div className="continue-section">
            <button
              className="continue-btn"
              onClick={handleSaveAndContinue}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesSection;