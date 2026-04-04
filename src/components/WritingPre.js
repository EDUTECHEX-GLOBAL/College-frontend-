// src/components/WritingPreview.js
import React from 'react';
import './WritingPre.css';

const WritingPreview = ({ 
  writingData, 
  onEditSection, 
  onBackToForm, 
  onFinalSubmit, 
  saving,
  message 
}) => {
  const { personalEssay, additionalInformation } = writingData;

  return (
    <div className="writing-preview">
      <div className="preview-header">
        <h2>Review Your Writing Submission</h2>
        <p>Please review all sections before final submission</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {message.text}
        </div>
      )}

      {/* Personal Essay Section */}
      <div className="preview-section">
        <div className="preview-section-header">
          <h3>Personal Essay</h3>
          <button 
            className="edit-button"
            onClick={() => onEditSection('personal-essay')}
          >
            Edit
          </button>
        </div>
        <div className="preview-content">
          <div className="preview-field">
            <label>Essay Required:</label>
            <p>{personalEssay.essayRequired ? 'Yes' : 'No'}</p>
          </div>
          <div className="preview-field">
            <label>Selected Topic:</label>
            <p>{personalEssay.selectedTopic || 'Not selected'}</p>
          </div>
          <div className="preview-field">
            <label>Essay Text:</label>
            <p className="essay-preview-text">
              {personalEssay.essayText || 'No essay written'}
            </p>
          </div>
          <div className="preview-field">
            <label>Word Count:</label>
            <p>{personalEssay.wordCount || 0} words</p>
          </div>
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="preview-section">
        <div className="preview-section-header">
          <h3>Additional Information</h3>
          <button 
            className="edit-button"
            onClick={() => onEditSection('additional-information')}
          >
            Edit
          </button>
        </div>
        <div className="preview-content">
          <div className="preview-field">
            <label>Share Challenges:</label>
            <p>{additionalInformation.shareDetails || 'Not answered'}</p>
          </div>
          {additionalInformation.shareDetails === 'yes' && (
            <div className="preview-field">
              <label>Details:</label>
              <p>{additionalInformation.challengesExperienced || 'No details provided'}</p>
            </div>
          )}
          <div className="preview-field">
            <label>Additional Qualifications:</label>
            <p>{additionalInformation.additionalQualifications || 'Not answered'}</p>
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
          {saving ? 'Submitting...' : 'Submit Writing Section'}
        </button>
      </div>
    </div>
  );
};

export default WritingPreview;
