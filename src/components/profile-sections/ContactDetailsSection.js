// src/components/ContactDetailsSection.js
import React, { useState, useEffect } from 'react';
import './ContactDetailsSection.css';

const ContactDetailsSection = ({ 
  formData = {}, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [errors, setErrors] = useState({});

  // Check if user has alternate phone
  const hasAlternatePhone = formData.hasAlternatePhone === 'yes';
  
  // Get available phone types for alternate phone
  const getAvailablePhoneTypes = (preferredType) => {
    const allTypes = ['home', 'mobile', 'work'];
    return allTypes.filter(type => type !== preferredType);
  };

  const availableTypes = getAvailablePhoneTypes(formData.preferredPhoneType);

  // Validate form completion
  useEffect(() => {
    const hasPreferredType = formData.preferredPhoneType && formData.preferredPhoneType !== '';
    const hasCountryCode = formData.countryCode && formData.countryCode !== '';
    const hasPhone = formData.phone && formData.phone.trim() !== '';
    
    let alternateValid = true;
    if (hasAlternatePhone) {
      alternateValid = formData.alternatePhone && formData.alternatePhone.trim() !== '' &&
                       formData.alternatePhoneType && formData.alternatePhoneType !== '';
    }
    
    setIsFormValid(hasPreferredType && hasCountryCode && hasPhone && alternateValid);
  }, [formData, hasAlternatePhone]);

  // Validate phone number
  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s\-+()]{10,20}$/;
    if (phone && !phoneRegex.test(phone)) {
      return 'Please enter a valid phone number';
    }
    return '';
  };

  // Handle field change with validation
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    
    if (handleInputChange) {
      handleInputChange(e);
    }
    
    if (name === 'phone' || name === 'alternatePhone') {
      const error = validatePhone(value);
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

  // Handle clear all contact details
  const handleClearAll = () => {
    const fieldsToClear = [
      'preferredPhoneType', 'countryCode', 'phone',
      'hasAlternatePhone', 'alternateCountryCode', 'alternatePhone', 'alternatePhoneType'
    ];
    
    if (clearRelatedFields) {
      clearRelatedFields('contactDetails', fieldsToClear);
    } else if (clearAnswer) {
      fieldsToClear.forEach(field => clearAnswer(field));
    }
    setErrors({});
  };

  // Handle save section
  const handleSaveSection = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Handle save and continue
  const handleSaveAndContinue = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const hasAnyValue = () => {
    return formData.preferredPhoneType || formData.phone || formData.hasAlternatePhone === 'yes';
  };

  return (
    <div className="contact-details-section">
      <div className="contact-details-header">
        <h2>Contact Details</h2>
        <div className="section-description">
          Your contact information helps us reach you regarding your application
        </div>
      </div>
      
      <div className="section-status-wrapper">
        <div className={`section-status ${isFormValid ? 'complete' : 'in-progress'}`}>
          <span className="status-indicator"></span>
          {isFormValid ? 'Complete' : 'In Progress'}
        </div>
      </div>

      {showSuccess && (
        <div className="success-message">
          ✓ Section saved successfully!
        </div>
      )}

      <div className="form-content">
        {/* Preferred Phone Type */}
        <div className="form-group">
          <label className="required">Preferred Phone Type</label>
          <div className="radio-group">
            {['home', 'mobile', 'work'].map(type => (
              <label key={type}>
                <input
                  type="radio"
                  name="preferredPhoneType"
                  value={type}
                  checked={formData.preferredPhoneType === type}
                  onChange={handleFieldChange}
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
          {formData.preferredPhoneType && (
            <button 
              type="button" 
              className="clear-link"
              onClick={() => handleClearField('preferredPhoneType')}
            >
              Clear answer
            </button>
          )}
        </div>

        {/* Preferred Phone Number */}
        <div className="form-group">
          <label className="required">Preferred Phone Number</label>
          <div className="phone-input-wrapper">
            <div className="phone-input">
              <div className="input-container">
                <select
                  name="countryCode"
                  value={formData.countryCode || ''}
                  onChange={handleFieldChange}
                  className="country-code-select"
                >
                  <option value="">Select country</option>
                  <option value="+1">🇺🇸 +1 (USA/Canada)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+91">🇮🇳 +91 (India)</option>
                  <option value="+61">🇦🇺 +61 (Australia)</option>
                  <option value="+49">🇩🇪 +49 (Germany)</option>
                  <option value="+33">🇫🇷 +33 (France)</option>
                  <option value="+81">🇯🇵 +81 (Japan)</option>
                  <option value="+86">🇨🇳 +86 (China)</option>
                  <option value="+39">🇮🇹 +39 (Italy)</option>
                  <option value="+7">🇷🇺 +7 (Russia)</option>
                </select>
                {formData.countryCode && (
                  <button 
                    type="button" 
                    className="clear-field-btn"
                    onClick={() => handleClearField('countryCode')}
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="input-container">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleFieldChange}
                  className={`phone-number-input ${errors.phone ? 'error' : ''}`}
                  placeholder="Enter phone number"
                />
                {formData.phone && (
                  <button 
                    type="button" 
                    className="clear-field-btn"
                    onClick={() => handleClearField('phone')}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            {errors.phone && <div className="error-message">{errors.phone}</div>}
            <div className="helper-text">Phone includes country code and number</div>
          </div>
        </div>

        {/* Alternate Phone Toggle */}
        <div className="form-group">
          <label>Do you have an alternate phone number?</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="hasAlternatePhone"
                value="no"
                checked={formData.hasAlternatePhone === 'no'}
                onChange={handleFieldChange}
              />
              No
            </label>
            <label>
              <input
                type="radio"
                name="hasAlternatePhone"
                value="yes"
                checked={formData.hasAlternatePhone === 'yes'}
                onChange={handleFieldChange}
              />
              Yes
            </label>
          </div>
          {formData.hasAlternatePhone && (
            <button 
              type="button" 
              className="clear-link"
              onClick={() => handleClearField('hasAlternatePhone')}
            >
              Clear answer
            </button>
          )}
        </div>

        {/* Alternate Phone Details */}
        {hasAlternatePhone && (
          <div className="alternate-phone-section">
            <div className="form-group">
              <label>Alternate Phone Number</label>
              <div className="alternate-phone-input-group">
                <div className="input-container">
                  <select
                    name="alternateCountryCode"
                    value={formData.alternateCountryCode || '+1'}
                    onChange={handleFieldChange}
                    className="alternate-country-code"
                  >
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+86">🇨🇳 +86</option>
                  </select>
                </div>
                
                <div className="input-container">
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone || ''}
                    onChange={handleFieldChange}
                    className={`alternate-phone-number ${errors.alternatePhone ? 'error' : ''}`}
                    placeholder="Enter alternate phone number"
                  />
                  {formData.alternatePhone && (
                    <button 
                      type="button" 
                      className="clear-field-btn"
                      onClick={() => handleClearField('alternatePhone')}
                    >
                      ×
                    </button>
                  )}
                </div>
                
                <div className="input-container">
                  <select
                    name="alternatePhoneType"
                    value={formData.alternatePhoneType || ''}
                    onChange={handleFieldChange}
                    className="alternate-phone-type"
                  >
                    <option value="">Select type</option>
                    {availableTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                  {formData.alternatePhoneType && (
                    <button 
                      type="button" 
                      className="clear-field-btn"
                      onClick={() => handleClearField('alternatePhoneType')}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              {errors.alternatePhone && <div className="error-message">{errors.alternatePhone}</div>}
              <div className="helper-text">Alternate phone is optional - used for backup contact</div>
            </div>
          </div>
        )}

        
       
      </div>
    </div>
  );
};

export default ContactDetailsSection;