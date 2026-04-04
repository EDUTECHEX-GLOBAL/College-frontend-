// src/components/GeographySection.js
import React, { useState, useEffect } from 'react';
import './GeographySection.css';

const GeographySection = ({ 
  formData = {}, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [isFormValid, setIsFormValid] = useState(false);
  const [errors, setErrors] = useState({});

  // Citizenship status options
  const citizenshipOptions = [
    { value: 'us-citizen-national', label: 'U.S. citizen or U.S. national' },
    { value: 'us-dual-citizen', label: 'U.S. dual citizen' },
    { value: 'us-permanent-resident', label: 'U.S. permanent resident (green card holder)' },
    { value: 'citizen-non-us-country', label: 'Citizen of non-U.S. country' },
    { value: 'us-resident', label: 'U.S. resident' }
  ];

  // Validate form completion
  useEffect(() => {
    const hasCitizenshipStatus = formData.citizenshipStatus && formData.citizenshipStatus !== '';
    setIsFormValid(hasCitizenshipStatus);
  }, [formData.citizenshipStatus]);

  // Validate years in US
  const validateYearsInUS = (years) => {
    if (years && (years < 0 || years > 100)) {
      return 'Years must be between 0 and 100';
    }
    return '';
  };

  // Handle field change with validation
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    
    if (handleInputChange) {
      handleInputChange(e);
    }
    
    if (name === 'yearsInUS') {
      const error = validateYearsInUS(value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle clear field
  const handleClearField = (fieldName) => {
    if (clearAnswer) {
      clearAnswer(fieldName);
    }
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  // Handle clear citizenship status
  const handleClearCitizenship = () => {
    if (clearAnswer) {
      clearAnswer('citizenshipStatus');
    }
  };

  // Handle clear all geography fields
  const handleClearAll = () => {
    const fieldsToClear = ['birthCountry', 'cityOfBirth', 'yearsInUS', 'citizenshipStatus'];
    
    if (clearRelatedFields) {
      clearRelatedFields('geography', fieldsToClear);
    } else if (clearAnswer) {
      fieldsToClear.forEach(field => clearAnswer(field));
    }
    setErrors({});
  };

  // Check if any field has value
  const hasAnyValue = () => {
    return (formData.birthCountry && formData.birthCountry.trim() !== '') ||
           (formData.cityOfBirth && formData.cityOfBirth.trim() !== '') ||
           (formData.yearsInUS && formData.yearsInUS.toString().trim() !== '') ||
           (formData.citizenshipStatus && formData.citizenshipStatus !== '');
  };

  return (
    <div className="geography-section">
      <div className="geography-header">
        <h2>Geography and Nationality</h2>
        <div className="section-description">
          Help us understand your geographic background
        </div>
      </div>
      
      <div className="section-status-wrapper">
        <div className={`section-status ${isFormValid ? 'complete' : 'in-progress'}`}>
          <span className="status-indicator"></span>
          {isFormValid ? 'Complete' : 'In Progress'}
        </div>
      </div>

      <div className="form-content">
        {/* Birth Country */}
        <div className="form-group">
          <label>Birth Country/Region/Territory</label>
          <div className="input-container">
            <input
              type="text"
              name="birthCountry"
              value={formData.birthCountry || ''}
              onChange={handleFieldChange}
              placeholder="Enter birth country"
            />
            {formData.birthCountry && (
              <button 
                type="button" 
                className="clear-field-btn"
                onClick={() => handleClearField('birthCountry')}
                aria-label="Clear birth country"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* City of Birth */}
        <div className="form-group">
          <label>City of Birth</label>
          <div className="input-container">
            <input
              type="text"
              name="cityOfBirth"
              value={formData.cityOfBirth || ''}
              onChange={handleFieldChange}
              placeholder="Enter city of birth"
            />
            {formData.cityOfBirth && (
              <button 
                type="button" 
                className="clear-field-btn"
                onClick={() => handleClearField('cityOfBirth')}
                aria-label="Clear city of birth"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Years in US */}
        <div className="form-group">
          <label>Number of years you have lived in the United States</label>
          <div className="input-container">
            <input
              type="number"
              name="yearsInUS"
              value={formData.yearsInUS || ''}
              onChange={handleFieldChange}
              min="0"
              max="100"
              placeholder="Enter number of years"
              className={errors.yearsInUS ? 'error' : ''}
            />
            {formData.yearsInUS && (
              <button 
                type="button" 
                className="clear-field-btn"
                onClick={() => handleClearField('yearsInUS')}
                aria-label="Clear years"
              >
                ×
              </button>
            )}
          </div>
          {errors.yearsInUS && <div className="error-message">{errors.yearsInUS}</div>}
        </div>

        {/* Citizenship Status */}
        <div className="form-group">
          <label className="required">Select your citizenship status</label>
          <div className="radio-group">
            {citizenshipOptions.map(option => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="citizenshipStatus"
                  value={option.value}
                  checked={formData.citizenshipStatus === option.value}
                  onChange={handleFieldChange}
                />
                <span className="radio-label">{option.label}</span>
              </label>
            ))}
          </div>
          {formData.citizenshipStatus && (
            <button 
              type="button" 
              className="clear-link"
              onClick={handleClearCitizenship}
            >
              Clear answer
            </button>
          )}
          {!isFormValid && (
            <div className="validation-hint">
              Please select your citizenship status to complete this section
            </div>
          )}
        </div>

        {/* Clear All Button */}
        {hasAnyValue() && (
          <div className="clear-all-container">
            <button type="button" className="clear-all-link" onClick={handleClearAll}>
              Clear all geography fields
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeographySection;