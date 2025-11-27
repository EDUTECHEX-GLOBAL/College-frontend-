// src/components/FamilyPreview.js
import React from 'react';
import './FamilyPre.css';

const FamilyPreview = ({ 
  familyData, 
  onEditSection, 
  onBackToForm, 
  onFinalSubmit, 
  saving,
  message 
}) => {
  return (
    <div className="family-preview-container">
      <div className="family-preview-header">
        <h2>Review Your Family Information</h2>
        <p>Please review all sections before final submission</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {message.text}
        </div>
      )}

      {/* Household Section */}
      <div className="family-preview-section">
        <div className="family-preview-section-header">
          <h3>Household Information</h3>
          <button 
            className="family-edit-btn"
            onClick={() => onEditSection('household')}
          >
            Edit
          </button>
        </div>
        <div className="family-preview-content">
          <div className="family-preview-item">
            <span className="family-preview-label">Parents' Marital Status:</span>
            <span className="family-preview-value">
              {familyData.household.parentsMaritalStatus || 'Not provided'}
            </span>
          </div>
          <div className="family-preview-item">
            <span className="family-preview-label">Permanent Home:</span>
            <span className="family-preview-value">
              {familyData.household.permanentHome || 'Not provided'}
            </span>
          </div>
          <div className="family-preview-item">
            <span className="family-preview-label">Has Children:</span>
            <span className="family-preview-value">
              {familyData.household.hasChildren === 'yes' 
                ? `Yes (${familyData.household.numberOfChildren})` 
                : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Parent 1 Section */}
      <div className="family-preview-section">
        <div className="family-preview-section-header">
          <h3>Parent 1</h3>
          <button 
            className="family-edit-btn"
            onClick={() => onEditSection('parent1')}
          >
            Edit
          </button>
        </div>
        <div className="family-preview-content">
          {familyData.parent1.isDeceased ? (
            <div className="family-preview-item">
              <span className="family-preview-value">Parent 1 is deceased</span>
            </div>
          ) : (
            <>
              <div className="family-preview-item">
                <span className="family-preview-label">Name:</span>
                <span className="family-preview-value">
                  {`${familyData.parent1.firstName || ''} ${familyData.parent1.lastName || ''}`}
                </span>
              </div>
              <div className="family-preview-item">
                <span className="family-preview-label">Relationship:</span>
                <span className="family-preview-value">
                  {familyData.parent1.relationshipToYou || 'Not provided'}
                </span>
              </div>
              <div className="family-preview-item">
                <span className="family-preview-label">Email:</span>
                <span className="family-preview-value">
                  {familyData.parent1.email || 'Not provided'}
                </span>
              </div>
              <div className="family-preview-item">
                <span className="family-preview-label">Occupation:</span>
                <span className="family-preview-value">
                  {familyData.parent1.occupation || 'Not provided'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Parent 2 Section */}
      <div className="family-preview-section">
        <div className="family-preview-section-header">
          <h3>Parent 2</h3>
          <button 
            className="family-edit-btn"
            onClick={() => onEditSection('parent2')}
          >
            Edit
          </button>
        </div>
        <div className="family-preview-content">
          {familyData.parent2.hasParent2 === 'no' ? (
            <div className="family-preview-item">
              <span className="family-preview-value">No second parent</span>
            </div>
          ) : familyData.parent2.isDeceased ? (
            <div className="family-preview-item">
              <span className="family-preview-value">Parent 2 is deceased</span>
            </div>
          ) : (
            <>
              <div className="family-preview-item">
                <span className="family-preview-label">Name:</span>
                <span className="family-preview-value">
                  {`${familyData.parent2.firstName || ''} ${familyData.parent2.lastName || ''}`}
                </span>
              </div>
              <div className="family-preview-item">
                <span className="family-preview-label">Relationship:</span>
                <span className="family-preview-value">
                  {familyData.parent2.relationshipToYou || 'Not provided'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Siblings Section */}
      <div className="family-preview-section">
        <div className="family-preview-section-header">
          <h3>Siblings</h3>
          <button 
            className="family-edit-btn"
            onClick={() => onEditSection('sibling')}
          >
            Edit
          </button>
        </div>
        <div className="family-preview-content">
          {familyData.siblings.hasSiblings === 'no' ? (
            <div className="family-preview-item">
              <span className="family-preview-value">No siblings</span>
            </div>
          ) : (
            <>
              <div className="family-preview-item">
                <span className="family-preview-label">Number of Siblings:</span>
                <span className="family-preview-value">
                  {familyData.siblings.numberOfSiblings || 0}
                </span>
              </div>
              {familyData.siblings.siblingsList?.map((sibling, index) => (
                <div key={index} className="family-preview-subitem">
                  <strong>Sibling {index + 1}:</strong> 
                  {` ${sibling.firstName} ${sibling.lastName} (${sibling.relationship})`}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="family-preview-actions">
        <button 
          className="family-back-btn"
          onClick={onBackToForm}
          disabled={saving}
        >
          ← Back to Form
        </button>
        <button 
          className="family-submit-btn"
          onClick={onFinalSubmit}
          disabled={saving}
        >
          {saving ? 'Submitting...' : 'Submit Family Information'}
        </button>
      </div>
    </div>
  );
};

export default FamilyPreview;
