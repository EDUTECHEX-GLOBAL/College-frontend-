// src/components/writing-sections/AdditionalInformationSection.js
import React from 'react';
import './AdditionalInformation.css';

const AdditionalInformationSection = ({ writingData, handleInputChange }) => {
  const { additionalInformation } = writingData;

  return (
    <div className="additional-info-section">
      {/* Header */}
      <div className="additional-info-header">
        <h2 className="additional-info-title">Additional Information</h2>
        <div className="additional-info-status">In progress</div>
      </div>

      <div className="additional-info-description">
        Sometimes a student's application and achievements may be impacted by challenges or other circumstances. This could involve:
      </div>

      <ul className="circumstances-list">
        <li>Access to a safe and quiet study space</li>
        <li>Access to reliable technology and internet</li>
        <li>Community disruption (violence, protests, teacher strikes, etc.)</li>
        <li>Discrimination</li>
        <li>Family disruptions (divorce, incarceration, job loss, health, loss of a family member, addiction, etc.)</li>
        <li>Family or other obligations (care-taking, financial support, etc.)</li>
        <li>Housing instability, displacement, or homelessness</li>
        <li>Military deployment or activation</li>
        <li>Natural disasters</li>
        <li>Physical health and mental well-being</li>
        <li>War, conflict, or other hardships</li>
      </ul>

      <div className="info-usage-text">
        <p>
          If you're comfortable sharing, this information can help colleges better understand the context of your application. Colleges may use this information to provide you and your fellow students with support and resources.
        </p>
      </div>

      {/* Question 1: Share Details */}
      <div className="info-question">
        <label className="info-label">
          Would you like to share any details about challenges or other circumstances you've experienced? *
        </label>
        <div className="info-radio-group">
          <label className="info-radio-option">
            <input
              type="radio"
              name="shareDetails"
              value="yes"
              checked={additionalInformation.shareDetails === 'yes'}
              onChange={(e) => handleInputChange('additionalInformation', 'shareDetails', e.target.value)}
              className="info-radio"
            />
            <span>Yes</span>
          </label>
          <label className="info-radio-option">
            <input
              type="radio"
              name="shareDetails"
              value="no"
              checked={additionalInformation.shareDetails === 'no'}
              onChange={(e) => handleInputChange('additionalInformation', 'shareDetails', e.target.value)}
              className="info-radio"
            />
            <span>No</span>
          </label>
        </div>
        <button 
          className="clear-answer-btn"
          onClick={() => handleInputChange('additionalInformation', 'shareDetails', '')}
        >
          Clear answer
        </button>
      </div>

      {/* Conditional Text Area for Challenges */}
      {additionalInformation.shareDetails === 'yes' && (
        <div className="info-textarea-section">
          <label className="info-label">Please provide details:</label>
          <textarea
            className="info-textarea"
            placeholder="Describe the challenges or circumstances you've experienced..."
            value={additionalInformation.challengesExperienced || ''}
            onChange={(e) => handleInputChange('additionalInformation', 'challengesExperienced', e.target.value)}
            rows={6}
          />
        </div>
      )}

      {/* Question 2: Additional Qualifications */}
      <div className="info-question">
        <label className="info-label">
          Would you like to share any additional details or qualifications not reflected in the application? *
        </label>
        <div className="info-radio-group">
          <label className="info-radio-option">
            <input
              type="radio"
              name="additionalQuals"
              value="yes"
              checked={additionalInformation.additionalQualifications === 'yes'}
              onChange={(e) => handleInputChange('additionalInformation', 'additionalQualifications', e.target.value)}
              className="info-radio"
            />
            <span>Yes</span>
          </label>
          <label className="info-radio-option">
            <input
              type="radio"
              name="additionalQuals"
              value="no"
              checked={additionalInformation.additionalQualifications === 'no'}
              onChange={(e) => handleInputChange('additionalInformation', 'additionalQualifications', e.target.value)}
              className="info-radio"
            />
            <span>No</span>
          </label>
        </div>
        <button 
          className="clear-answer-btn"
          onClick={() => handleInputChange('additionalInformation', 'additionalQualifications', '')}
        >
          Clear answer
        </button>
      </div>
    </div>
  );
};

export default AdditionalInformationSection;
