// src/components/ActivitiesPreview.js
import React from 'react';
import './ActivitiesPre.css';

const ActivitiesPreview = ({ 
  activitiesData, 
  onEditSection, 
  onBackToForm, 
  onFinalSubmit, 
  saving,
  message 
}) => {
  const { activities, responsibilities } = activitiesData;

  return (
    <div className="activities-preview">
      <div className="preview-header">
        <h2>Review Your Activities Submission</h2>
        <p>Please review all sections before final submission</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {message.text}
        </div>
      )}

      {/* Activities Section */}
      <div className="preview-section">
        <div className="preview-section-header">
          <h3>Activities</h3>
          <button 
            className="edit-button"
            onClick={() => onEditSection('activities')}
          >
            Edit
          </button>
        </div>
        <div className="preview-content">
          <div className="preview-field">
            <label>Has Activities:</label>
            <p>{activities.hasActivities || 'Not answered'}</p>
          </div>
          {activities.hasActivities === 'yes' && (
            <>
              <div className="preview-field">
                <label>Number of Activities:</label>
                <p>{activities.activitiesList?.length || 0}</p>
              </div>
              {activities.activitiesList && activities.activitiesList.length > 0 && (
                <div className="activities-list-preview">
                  {activities.activitiesList.map((activity, index) => (
                    <div key={index} className="activity-preview-card">
                      <h4>Activity {index + 1}</h4>
                      <div className="preview-field">
                        <label>Type:</label>
                        <p>{activity.activityType || 'Not specified'}</p>
                      </div>
                      <div className="preview-field">
                        <label>Position/Leadership:</label>
                        <p>{activity.positionLeadership || 'Not specified'}</p>
                      </div>
                      <div className="preview-field">
                        <label>Organization:</label>
                        <p>{activity.organizationName || 'Not specified'}</p>
                      </div>
                      <div className="preview-field">
                        <label>Description:</label>
                        <p>{activity.description || 'Not specified'}</p>
                      </div>
                      <div className="preview-field">
                        <label>Grade Levels:</label>
                        <p>{activity.participationGradeLevels?.join(', ') || 'Not specified'}</p>
                      </div>
                      <div className="preview-field">
                        <label>Timing:</label>
                        <p>{activity.timingOfParticipation?.join(', ') || 'Not specified'}</p>
                      </div>
                      <div className="preview-field">
                        <label>Time Commitment:</label>
                        <p>{activity.hoursPerWeek || 0} hours/week, {activity.weeksPerYear || 0} weeks/year</p>
                      </div>
                      <div className="preview-field">
                        <label>Continue in College:</label>
                        <p>{activity.intendToContinue || 'Not answered'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Responsibilities Section */}
      <div className="preview-section">
        <div className="preview-section-header">
          <h3>Responsibilities and Circumstances</h3>
          <button 
            className="edit-button"
            onClick={() => onEditSection('responsibilities')}
          >
            Edit
          </button>
        </div>
        <div className="preview-content">
          <div className="preview-field">
            <label>Selected Responsibilities:</label>
            {responsibilities.selectedResponsibilities && responsibilities.selectedResponsibilities.length > 0 ? (
              <ul>
                {responsibilities.selectedResponsibilities.map((resp, index) => (
                  <li key={index}>{resp}</li>
                ))}
              </ul>
            ) : (
              <p>None selected</p>
            )}
          </div>
          <div className="preview-field">
            <label>Selected Circumstances:</label>
            {responsibilities.selectedCircumstances && responsibilities.selectedCircumstances.length > 0 ? (
              <ul>
                {responsibilities.selectedCircumstances.map((circ, index) => (
                  <li key={index}>{circ}</li>
                ))}
              </ul>
            ) : (
              <p>None selected</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="preview-actions">
        <button 
          className="secondary-button"
          onClick={onBackToForm}
          disabled={saving}
        >
          ← Back to Form
        </button>
        <button 
          className="primary-button"
          onClick={onFinalSubmit}
          disabled={saving}
        >
          {saving ? 'Submitting...' : 'Submit Activities Section'}
        </button>
      </div>
    </div>
  );
};

export default ActivitiesPreview;
