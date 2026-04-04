// src/components/DemographicsSection.js
import React, { useState, useEffect } from 'react';
import './DemographicsSection.css';

const DemographicsSection = ({ 
  formData = {}, 
  handleInputChange,
  handleArrayChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [isFormValid, setIsFormValid] = useState(false);

  // Ethnicity options
  const ethnicityOptions = [
    { value: 'american-indian-alaska-native', label: 'American Indian or Alaska Native' },
    { value: 'asian', label: 'Asian' },
    { value: 'black-african-american', label: 'Black or African American' },
    { value: 'native-hawaiian-pacific-islander', label: 'Native Hawaiian or Other Pacific Islander' },
    { value: 'white', label: 'White' },
    { value: 'hispanic-latino', label: 'Hispanic or Latino' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  // Validate form completion
  useEffect(() => {
    const hasGender = formData.gender && formData.gender !== '';
    const hasEthnicity = formData.ethnicity && formData.ethnicity.length > 0;
    setIsFormValid(hasGender && hasEthnicity);
  }, [formData.gender, formData.ethnicity]);

  // Handle checkbox change
  const handleCheckboxChange = (value) => {
    if (handleArrayChange) {
      handleArrayChange('ethnicity', value);
    }
  };

  // Handle clear gender
  const handleClearGender = () => {
    if (clearAnswer) {
      clearAnswer('gender');
    }
  };

  // Handle clear pronouns
  const handleClearPronouns = () => {
    if (clearAnswer) {
      clearAnswer('pronouns');
    }
  };

  // Handle clear ethnicity
  const handleClearEthnicity = () => {
    if (clearRelatedFields) {
      clearRelatedFields('ethnicity', ['ethnicity']);
    } else if (clearAnswer) {
      clearAnswer('ethnicity');
    }
  };

  // Handle clear all demographics
  const handleClearAll = () => {
    const fieldsToClear = ['gender', 'pronouns', 'ethnicity'];
    if (clearRelatedFields) {
      clearRelatedFields('demographics', fieldsToClear);
    } else if (clearAnswer) {
      fieldsToClear.forEach(field => clearAnswer(field));
    }
  };

  // Check if any field has value
  const hasAnyValue = () => {
    return (formData.gender && formData.gender !== '') ||
           (formData.pronouns && formData.pronouns !== '') ||
           (formData.ethnicity && formData.ethnicity.length > 0);
  };

  return (
    <div className="demographics-section">
      <div className="demographics-header">
        <h2>Demographics</h2>
        <div className="section-description">
          Help us understand your background
        </div>
      </div>
      
      <div className="section-status-wrapper">
        <div className={`section-status ${isFormValid ? 'complete' : 'in-progress'}`}>
          <span className="status-indicator"></span>
          {isFormValid ? 'Complete' : 'In Progress'}
        </div>
      </div>

      <div className="form-content">
        {/* Gender */}
        <div className="form-group">
          <label className="required">Gender</label>
          <div className="radio-group">
            {['female', 'male', 'nonbinary', 'prefer-not-to-say'].map(option => (
              <label key={option}>
                <input
                  type="radio"
                  name="gender"
                  value={option}
                  checked={formData.gender === option}
                  onChange={handleInputChange}
                />
                <span className="radio-label">
                  {option === 'prefer-not-to-say' ? 'Prefer not to say' : 
                   option.charAt(0).toUpperCase() + option.slice(1)}
                </span>
              </label>
            ))}
          </div>
          {formData.gender && (
            <button 
              type="button" 
              className="clear-link"
              onClick={handleClearGender}
            >
              Clear answer
            </button>
          )}
        </div>

        {/* Pronouns */}
        <div className="form-group">
          <label>Pronouns</label>
          <div className="radio-group">
            {[
              { value: 'he-him', label: 'He/Him' },
              { value: 'she-her', label: 'She/Her' },
              { value: 'they-them', label: 'They/Them' },
              { value: 'prefer-not-to-say', label: 'Prefer not to say' }
            ].map(option => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="pronouns"
                  value={option.value}
                  checked={formData.pronouns === option.value}
                  onChange={handleInputChange}
                />
                <span className="radio-label">{option.label}</span>
              </label>
            ))}
          </div>
          {formData.pronouns && (
            <button 
              type="button" 
              className="clear-link"
              onClick={handleClearPronouns}
            >
              Clear answer
            </button>
          )}
        </div>

        {/* Ethnicity */}
        <div className="form-group">
          <label className="required">How do you identify yourself?</label>
          <div className="checkbox-description">
            Regardless of your answer to the prior question, please indicate how you identify yourself. (You may select one or more)
          </div>
          <div className="checkbox-group">
            {ethnicityOptions.map(option => (
              <label key={option.value}>
                <input
                  type="checkbox"
                  checked={formData.ethnicity?.includes(option.value) || false}
                  onChange={() => handleCheckboxChange(option.value)}
                />
                <span className="checkbox-label">{option.label}</span>
              </label>
            ))}
          </div>
          {formData.ethnicity && formData.ethnicity.length > 0 && (
            <button 
              type="button" 
              className="clear-link"
              onClick={handleClearEthnicity}
            >
              Clear all selections
            </button>
          )}
        </div>

        {/* Clear All Button */}
        {hasAnyValue() && (
          <div className="clear-all-container">
            <button type="button" className="clear-all-link" onClick={handleClearAll}>
              Clear all demographics
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemographicsSection;