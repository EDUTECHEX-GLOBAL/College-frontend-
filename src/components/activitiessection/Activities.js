// src/components/activities-sections/ActivitiesSection.js
import React from 'react';
import './Activities.css';

const ActivitiesSection = ({ 
  activitiesData, 
  handleInputChange, 
  handleArrayChange, 
  addArrayItem, 
  removeArrayItem 
}) => {
  const { activities } = activitiesData;

  // Activity types
  const activityTypes = [
    'Art',
    'Athletics: Club',
    'Athletics: JV/Varsity',
    'Career Oriented',
    'Community Service (Volunteer)',
    'Computer/Technology',
    'Cultural',
    'Dance',
    'Debate/Speech',
    'Environmental',
    'Family Responsibilities',
    'Foreign Exchange',
    'Journalism/Publication',
    'Junior R.O.T.C.',
    'LGBT',
    'Music: Instrumental',
    'Music: Vocal',
    'Religious',
    'Research',
    'Robotics',
    'School Spirit',
    'Science/Math',
    'Student Govt/Politics',
    'Theater/Drama',
    'Work (Paid)',
    'Other Club/Activity'
  ];

  // Participation grade levels
  const gradeLevels = ['9', '10', '11', '12', 'Post-graduate'];

  // Timing options
  const timingOptions = [
    'During school year',
    'During school break',
    'All year'
  ];

  const addActivity = () => {
    const newActivity = {
      activityType: '',
      positionLeadership: '',
      organizationName: '',
      description: '',
      participationGradeLevels: [],
      timingOfParticipation: [],
      hoursPerWeek: '',
      weeksPerYear: '',
      intendToContinue: ''
    };
    addArrayItem('activities', 'activitiesList', newActivity);
  };

  const removeActivity = (index) => {
    removeArrayItem('activities', 'activitiesList', index);
  };

  const handleGradeLevelChange = (activityIndex, grade) => {
    const currentGrades = activities.activitiesList[activityIndex]?.participationGradeLevels || [];
    let updatedGrades;
    
    if (currentGrades.includes(grade)) {
      updatedGrades = currentGrades.filter(g => g !== grade);
    } else {
      updatedGrades = [...currentGrades, grade];
    }
    
    handleArrayChange('activities', 'activitiesList', activityIndex, 'participationGradeLevels', updatedGrades);
  };

  const handleTimingChange = (activityIndex, timing) => {
    const currentTimings = activities.activitiesList[activityIndex]?.timingOfParticipation || [];
    let updatedTimings;
    
    if (currentTimings.includes(timing)) {
      updatedTimings = currentTimings.filter(t => t !== timing);
    } else {
      updatedTimings = [...currentTimings, timing];
    }
    
    handleArrayChange('activities', 'activitiesList', activityIndex, 'timingOfParticipation', updatedTimings);
  };

  return (
    <div className="activities-section">
      {/* Header */}
      <div className="activities-header-section">
        <h2 className="activities-title">Activities</h2>
        <div className="activities-status">In progress</div>
      </div>

      <div className="activities-description">
        <p>
          Reporting activities can help colleges better understand your life outside of the classroom. Examples of activities might include:
        </p>
        <ul>
          <li>Arts of Music</li>
          <li>Clubs</li>
          <li>Community engagement</li>
          <li>Family responsibilities</li>
          <li>Hobbies</li>
          <li>Sports</li>
          <li>Work</li>
          <li>Other experiences that have been meaningful to you</li>
        </ul>
      </div>

      {/* Do you have activities question */}
      <div className="activities-question">
        <label className="activities-label">
          Do you have any activities that you wish to report? *
        </label>
        <div className="activities-radio-group">
          <label className="activities-radio-option">
            <input
              type="radio"
              name="hasActivities"
              value="yes"
              checked={activities.hasActivities === 'yes'}
              onChange={(e) => handleInputChange('activities', 'hasActivities', e.target.value)}
              className="activities-radio"
            />
            <span>Yes</span>
          </label>
          <label className="activities-radio-option">
            <input
              type="radio"
              name="hasActivities"
              value="no"
              checked={activities.hasActivities === 'no'}
              onChange={(e) => handleInputChange('activities', 'hasActivities', e.target.value)}
              className="activities-radio"
            />
            <span>No</span>
          </label>
        </div>
        <button 
          className="clear-answer-btn"
          onClick={() => handleInputChange('activities', 'hasActivities', '')}
        >
          Clear answer
        </button>
      </div>

      {/* Show activities list if user selected Yes */}
      {activities.hasActivities === 'yes' && (
        <>
          <div className="activities-info">
            <p>
              Please list your activities in order of their importance to you. Colleges want to understand what you care about and what you do. Your list does not need to be in any specific order. Up to 10 activities can be reported.
            </p>
          </div>

          {/* Activities List */}
          <div className="activities-list">
            {activities.activitiesList && activities.activitiesList.length > 0 ? (
              activities.activitiesList.map((activity, index) => (
                <div key={index} className="activity-card">
                  <div className="activity-card-header">
                    <h3 className="activity-card-title">Activity {index + 1}</h3>
                    <div className="activity-card-actions">
                      <button 
                        className="move-up-btn"
                        onClick={() => {/* implement move up */}}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button 
                        className="move-down-btn"
                        onClick={() => {/* implement move down */}}
                        disabled={index === activities.activitiesList.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button 
                        className="remove-btn"
                        onClick={() => removeActivity(index)}
                        title="Remove activity"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="activity-form-grid">
                    {/* Activity Type */}
                    <div className="activity-form-group full-width">
                      <label className="activity-label required">Activity type *</label>
                      <select
                        className="activity-select"
                        value={activity.activityType || ''}
                        onChange={(e) => handleArrayChange('activities', 'activitiesList', index, 'activityType', e.target.value)}
                      >
                        <option value="">- Choose an option -</option>
                        {activityTypes.map((type, idx) => (
                          <option key={idx} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Position/Leadership */}
                    <div className="activity-form-group full-width">
                      <label className="activity-label">Position/Leadership description and organization name</label>
                      <p className="activity-helper-text">Max characters: 50</p>
                      <input
                        type="text"
                        className="activity-input"
                        placeholder="Enter position/leadership"
                        maxLength={50}
                        value={activity.positionLeadership || ''}
                        onChange={(e) => handleArrayChange('activities', 'activitiesList', index, 'positionLeadership', e.target.value)}
                      />
                    </div>

                    {/* Organization Name */}
                    <div className="activity-form-group full-width">
                      <label className="activity-label">Organization Name</label>
                      <p className="activity-helper-text">Max characters: 100</p>
                      <input
                        type="text"
                        className="activity-input"
                        placeholder="Enter organization name"
                        maxLength={100}
                        value={activity.organizationName || ''}
                        onChange={(e) => handleArrayChange('activities', 'activitiesList', index, 'organizationName', e.target.value)}
                      />
                    </div>

                    {/* Description */}
                    <div className="activity-form-group full-width">
                      <label className="activity-label">Please describe this activity, including what you accomplished and any recognition you received, etc.</label>
                      <p className="activity-helper-text">Max characters: 150</p>
                      <textarea
                        className="activity-textarea"
                        placeholder="Describe your activity..."
                        maxLength={150}
                        rows={3}
                        value={activity.description || ''}
                        onChange={(e) => handleArrayChange('activities', 'activitiesList', index, 'description', e.target.value)}
                      />
                    </div>

                    {/* Participation Grade Levels */}
                    <div className="activity-form-group full-width">
                      <label className="activity-label">Participation grade levels *</label>
                      <div className="checkbox-group">
                        {gradeLevels.map((grade) => (
                          <label key={grade} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={activity.participationGradeLevels?.includes(grade) || false}
                              onChange={() => handleGradeLevelChange(index, grade)}
                              className="checkbox-input"
                            />
                            <span>{grade}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Timing of Participation */}
                    <div className="activity-form-group full-width">
                      <label className="activity-label">Timing of participation *</label>
                      <div className="checkbox-group">
                        {timingOptions.map((timing) => (
                          <label key={timing} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={activity.timingOfParticipation?.includes(timing) || false}
                              onChange={() => handleTimingChange(index, timing)}
                              className="checkbox-input"
                            />
                            <span>{timing}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Hours per week */}
                    <div className="activity-form-group">
                      <label className="activity-label">Hours spent per week *</label>
                      <input
                        type="number"
                        className="activity-input"
                        placeholder="Hours per week"
                        min="0"
                        value={activity.hoursPerWeek || ''}
                        onChange={(e) => handleArrayChange('activities', 'activitiesList', index, 'hoursPerWeek', e.target.value)}
                      />
                    </div>

                    {/* Weeks per year */}
                    <div className="activity-form-group">
                      <label className="activity-label">Weeks spent per year *</label>
                      <input
                        type="number"
                        className="activity-input"
                        placeholder="Weeks per year"
                        min="0"
                        max="52"
                        value={activity.weeksPerYear || ''}
                        onChange={(e) => handleArrayChange('activities', 'activitiesList', index, 'weeksPerYear', e.target.value)}
                      />
                    </div>

                    {/* Intend to continue */}
                    <div className="activity-form-group full-width">
                      <label className="activity-label">I intend to participate in a similar activity in college *</label>
                      <div className="activities-radio-group">
                        <label className="activities-radio-option">
                          <input
                            type="radio"
                            name={`intendToContinue-${index}`}
                            value="yes"
                            checked={activity.intendToContinue === 'yes'}
                            onChange={(e) => handleArrayChange('activities', 'activitiesList', index, 'intendToContinue', e.target.value)}
                            className="activities-radio"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="activities-radio-option">
                          <input
                            type="radio"
                            name={`intendToContinue-${index}`}
                            value="no"
                            checked={activity.intendToContinue === 'no'}
                            onChange={(e) => handleArrayChange('activities', 'activitiesList', index, 'intendToContinue', e.target.value)}
                            className="activities-radio"
                          />
                          <span>No</span>
                        </label>
                      </div>
                      <button 
                        className="clear-answer-btn"
                        onClick={() => handleArrayChange('activities', 'activitiesList', index, 'intendToContinue', '')}
                      >
                        Clear answer
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activities-message">
                <p>No activities added yet. Click "Add another activity" to get started.</p>
              </div>
            )}
          </div>

          {/* Add Activity Button */}
          {activities.activitiesList.length < 10 && (
            <div className="add-activity-section">
              <p className="activity-count">{activities.activitiesList.length} of 10 activities</p>
              <button 
                className="add-activity-btn"
                onClick={addActivity}
              >
                + Add another activity
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivitiesSection;
