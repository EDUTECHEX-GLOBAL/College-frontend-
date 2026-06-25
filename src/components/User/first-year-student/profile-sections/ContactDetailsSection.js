// src/components/ContactDetailsSection.js
import React, { useState, useEffect, useRef } from 'react';
import './ContactDetailsSection.css';
import { validateProfileField } from './../../../../utils/profileValidation';
import { countryCodes } from './../../../../utils/countryCodes';

const COUNTRY_CODE_OPTIONS = countryCodes.map(({ code, country }) => ({
  value: code,
  label: `${code} (${country})`,
}));

const SHORT_COUNTRY_CODE_OPTIONS = countryCodes.map(({ code, country }) => ({
  value: code,
  label: `${code} (${country})`,
}));

const PHONE_TYPE_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'work', label: 'Work' },
];

const ContactSelect = ({
  name,
  value,
  options,
  placeholder,
  onChange,
  className = '',
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectRef = useRef(null);
  const listboxId = `${name}-listbox`;
  const selectedOption = options.find(option => option.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter(option => option.label.toLowerCase().includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange({ target: { name, value: nextValue } });
    setIsOpen(false);
    window.requestAnimationFrame(() => document.getElementById(name)?.focus());
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={selectRef}
      className={`contact-custom-select${isOpen ? ' is-open' : ''}`}
    >
      <button
        type="button"
        id={name}
        className={`contact-select-trigger ${className}${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="contact-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="contact-select-menu" id={listboxId} role="listbox">
          {searchable && (
            <input
              type="text"
              className="contact-select-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              autoFocus
            />
          )}

          <div className="contact-select-options">
            <button
              type="button"
              className={`contact-select-option${value === '' ? ' is-selected' : ''}`}
              role="option"
              aria-selected={value === ''}
              onClick={() => handleSelect('')}
            >
              {placeholder}
            </button>

            {filteredOptions.map(option => (
              <button
                type="button"
                key={`${option.value}-${option.label}`}
                className={`contact-select-option${value === option.value ? ' is-selected' : ''}`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="contact-select-empty">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ContactDetailsSection = ({ 
  formData = {}, 
  handleInputChange,
  clearAnswer,
  fieldErrors = {}
}) => {
  const [showSuccess] = useState(false);
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
    
    setIsFormValid(
      hasPreferredType &&
      hasCountryCode &&
      hasPhone &&
      alternateValid &&
      !fieldErrors.phone &&
      !fieldErrors.alternatePhone
    );
  }, [formData, hasAlternatePhone, fieldErrors]);

  // Validate phone number
  const validatePhone = (phone) => {
    return validateProfileField('phone', phone, formData);
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
                <ContactSelect
                  name="countryCode"
                  value={formData.countryCode || ''}
                  onChange={handleFieldChange}
                  options={COUNTRY_CODE_OPTIONS}
                  placeholder="Select country"
                  className="country-code-select"
                  searchable
                />
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
                  className={`phone-number-input ${(fieldErrors.phone || errors.phone) ? 'error' : ''}`}
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
            {(fieldErrors.phone || errors.phone) && <div className="error-message">{fieldErrors.phone || errors.phone}</div>}
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
                  <ContactSelect
                    name="alternateCountryCode"
                    value={formData.alternateCountryCode || '+1'}
                    onChange={handleFieldChange}
                    options={SHORT_COUNTRY_CODE_OPTIONS}
                    placeholder="Code"
                    className="alternate-country-code"
                  />
                </div>
                
                <div className="input-container">
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone || ''}
                    onChange={handleFieldChange}
                    className={`alternate-phone-number ${(fieldErrors.alternatePhone || errors.alternatePhone) ? 'error' : ''}`}
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
                  <ContactSelect
                    name="alternatePhoneType"
                    value={formData.alternatePhoneType || ''}
                    onChange={handleFieldChange}
                    options={PHONE_TYPE_OPTIONS.filter(option => availableTypes.includes(option.value))}
                    placeholder="Select type"
                    className="alternate-phone-type"
                  />
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
              {(fieldErrors.alternatePhone || errors.alternatePhone) && <div className="error-message">{fieldErrors.alternatePhone || errors.alternatePhone}</div>}
              <div className="helper-text">Alternate phone is optional - used for backup contact</div>
            </div>
          </div>
        )}

        
       
      </div>
    </div>
  );
};

export default ContactDetailsSection;
