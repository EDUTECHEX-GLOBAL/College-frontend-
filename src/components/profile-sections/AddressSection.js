// src/components/AddressSection.js
import React, { useState, useEffect } from 'react';
import './AddressSection.css';

const AddressSection = ({ 
  formData = {}, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [isFormValid, setIsFormValid] = useState(false);
  const [errors, setErrors] = useState({});

  // Required fields
  const requiredFields = ['addressLine1', 'city', 'state', 'zipCode', 'country'];

  // Validate form completion
  useEffect(() => {
    const allFieldsFilled = requiredFields.every(field => 
      formData[field] && formData[field].toString().trim() !== ''
    );
    setIsFormValid(allFieldsFilled);
    
    // Clear errors when fields are filled
    if (allFieldsFilled) {
      setErrors({});
    }
  }, [formData]);

  // Validate specific field
  const validateField = (name, value) => {
    const trimmedValue = value?.trim() || '';
    
    switch (name) {
      case 'zipCode':
        const zipRegex = /^[A-Z0-9\s-]{3,10}$/i;
        if (trimmedValue && !zipRegex.test(trimmedValue)) {
          return 'Please enter a valid postal code';
        }
        break;
      case 'addressLine1':
        if (trimmedValue && trimmedValue.length < 3) {
          return 'Address must be at least 3 characters';
        }
        break;
      case 'city':
      case 'state':
      case 'country':
        if (trimmedValue && trimmedValue.length < 2) {
          return `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least 2 characters`;
        }
        break;
      default:
        break;
    }
    return '';
  };

  // Handle field change with validation
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    if (handleInputChange) {
      handleInputChange(e);
    }
    
    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Handle clearing a field
  const handleClearField = (fieldName) => {
    if (clearAnswer) {
      clearAnswer(fieldName);
    }
    
    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  // Handle clearing all address fields
  const handleClearAllFields = () => {
    const fieldsToClear = [
      'addressLine1', 'addressLine2', 'city', 'state', 'zipCode', 'country'
    ];
    
    if (clearRelatedFields) {
      clearRelatedFields('address', fieldsToClear);
    } else if (clearAnswer) {
      fieldsToClear.forEach(field => clearAnswer(field));
    }
    
    setErrors({});
  };

  // Check if any field has value
  const hasAnyValue = () => {
    return requiredFields.some(field => 
      formData[field] && formData[field].toString().trim() !== ''
    ) || (formData.addressLine2 && formData.addressLine2.trim() !== '');
  };

  // Get field error
  const getFieldError = (fieldName) => {
    return errors[fieldName] || '';
  };

  // Check if field is required
  const isRequired = (fieldName) => {
    return requiredFields.includes(fieldName);
  };

  // Get field value
  const getFieldValue = (fieldName) => {
    return formData[fieldName] || '';
  };

  return (
    <div className="address-section">
      <div className="address-header">
        <h2>Address</h2>
        <div className="section-description">
          Please provide your current residential address
        </div>
      </div>
      
      <div className="section-status-wrapper">
        <div className={`section-status ${isFormValid ? 'complete' : 'in-progress'}`}>
          <span className="status-indicator"></span>
          {isFormValid ? 'Complete' : 'In Progress'}
        </div>
      </div>

      <div className="form-content">
        {/* Address Line 1 */}
        <div className="form-group">
          <label className={isRequired('addressLine1') ? 'required' : ''}>
            Address Line 1
          </label>
          <div className="input-container">
            <input
              type="text"
              name="addressLine1"
              value={getFieldValue('addressLine1')}
              onChange={handleFieldChange}
              placeholder="Street address, P.O. Box"
              className={getFieldError('addressLine1') ? 'error' : ''}
            />
            {getFieldValue('addressLine1') && (
              <button 
                type="button" 
                className="clear-field-btn"
                onClick={() => handleClearField('addressLine1')}
                aria-label="Clear address line 1"
              >
                ×
              </button>
            )}
          </div>
          {getFieldError('addressLine1') && (
            <div className="error-message">{getFieldError('addressLine1')}</div>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="form-group">
          <label>Address Line 2</label>
          <div className="input-container">
            <input
              type="text"
              name="addressLine2"
              value={getFieldValue('addressLine2')}
              onChange={handleFieldChange}
              placeholder="Apartment, suite, unit, building, floor (optional)"
            />
            {getFieldValue('addressLine2') && (
              <button 
                type="button" 
                className="clear-field-btn"
                onClick={() => handleClearField('addressLine2')}
                aria-label="Clear address line 2"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Form Grid for 2-column layout */}
        <div className="form-grid">
          {/* City */}
          <div className="form-group">
            <label className={isRequired('city') ? 'required' : ''}>
              City
            </label>
            <div className="input-container">
              <input
                type="text"
                name="city"
                value={getFieldValue('city')}
                onChange={handleFieldChange}
                placeholder="Enter city"
                className={getFieldError('city') ? 'error' : ''}
              />
              {getFieldValue('city') && (
                <button 
                  type="button" 
                  className="clear-field-btn"
                  onClick={() => handleClearField('city')}
                  aria-label="Clear city"
                >
                  ×
                </button>
              )}
            </div>
            {getFieldError('city') && (
              <div className="error-message">{getFieldError('city')}</div>
            )}
          </div>

          {/* State/Province */}
          <div className="form-group">
            <label className={isRequired('state') ? 'required' : ''}>
              State/Province
            </label>
            <div className="input-container">
              <input
                type="text"
                name="state"
                value={getFieldValue('state')}
                onChange={handleFieldChange}
                placeholder="Enter state or province"
                className={getFieldError('state') ? 'error' : ''}
              />
              {getFieldValue('state') && (
                <button 
                  type="button" 
                  className="clear-field-btn"
                  onClick={() => handleClearField('state')}
                  aria-label="Clear state"
                >
                  ×
                </button>
              )}
            </div>
            {getFieldError('state') && (
              <div className="error-message">{getFieldError('state')}</div>
            )}
          </div>

          {/* ZIP/Postal Code */}
          <div className="form-group">
            <label className={isRequired('zipCode') ? 'required' : ''}>
              ZIP/Postal Code
            </label>
            <div className="input-container">
              <input
                type="text"
                name="zipCode"
                value={getFieldValue('zipCode')}
                onChange={handleFieldChange}
                placeholder="Enter postal code"
                className={getFieldError('zipCode') ? 'error' : ''}
              />
              {getFieldValue('zipCode') && (
                <button 
                  type="button" 
                  className="clear-field-btn"
                  onClick={() => handleClearField('zipCode')}
                  aria-label="Clear postal code"
                >
                  ×
                </button>
              )}
            </div>
            {getFieldError('zipCode') && (
              <div className="error-message">{getFieldError('zipCode')}</div>
            )}
          </div>

          {/* Country */}
          <div className="form-group">
            <label className={isRequired('country') ? 'required' : ''}>
              Country
            </label>
            <div className="input-container">
              <input
                type="text"
                name="country"
                value={getFieldValue('country')}
                onChange={handleFieldChange}
                placeholder="Enter country"
                className={getFieldError('country') ? 'error' : ''}
              />
              {getFieldValue('country') && (
                <button 
                  type="button" 
                  className="clear-field-btn"
                  onClick={() => handleClearField('country')}
                  aria-label="Clear country"
                >
                  ×
                </button>
              )}
            </div>
            {getFieldError('country') && (
              <div className="error-message">{getFieldError('country')}</div>
            )}
          </div>
        </div>

        {/* Clear All Button */}
        {hasAnyValue() && (
          <div className="clear-all-container">
            <button
              type="button"
              className="clear-all-link"
              onClick={handleClearAllFields}
            >
              Clear all address fields
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSection;