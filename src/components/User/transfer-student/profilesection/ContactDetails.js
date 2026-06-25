import React from 'react';
import './ContactDetails.css';

const ContactDetailsSection = ({ formData, handleInputChange }) => {
  // Helper function to get available phone types
  const getAvailablePhoneTypes = (preferredType) => {
    const allTypes = ['home', 'mobile', 'work'];
    return allTypes.filter(type => type !== preferredType);
  };

  // Check if user has alternate phone
  const hasAlternatePhone = formData.alternatePhoneType !== 'none' && formData.alternatePhoneType !== '';
  
  // Get available phone types for alternate phone
  const availableTypes = getAvailablePhoneTypes(formData.preferredPhoneType);

  return (
    <div className="contact-details-section">
      <h2>Contact Details</h2>
      <div className="section-status">
        {formData.profileCompletion.contactDetails ? 'Complete' : 'In Progress'}
      </div>
      <div className="form-content">
        {/* Preferred Phone Type */}
        <div className="form-group">
          <label className="required">Preferred Phone Type</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="preferredPhoneType"
                value="home"
                checked={formData.preferredPhoneType === 'home'}
                onChange={handleInputChange}
              />
              Home
            </label>
            <label>
              <input
                type="radio"
                name="preferredPhoneType"
                value="mobile"
                checked={formData.preferredPhoneType === 'mobile'}
                onChange={handleInputChange}
              />
              Mobile
            </label>
            <label>
              <input
                type="radio"
                name="preferredPhoneType"
                value="work"
                checked={formData.preferredPhoneType === 'work'}
                onChange={handleInputChange}
              />
              Work
            </label>
          </div>
        </div>

        {/* Preferred Phone Number */}
        <div className="form-group">
          <label className="required">Preferred Phone Number</label>
          <div className="phone-input">
            <select
              name="countryCode"
              value={formData.countryCode}
              onChange={handleInputChange}
              className="country-code"
            >
              <option value="+1">🇺🇸 +1 (USA/Canada)</option>
              <option value="+91">🇮🇳 +91 (India)</option>
              <option value="+44">🇬🇧 +44 (UK)</option>
              <option value="+61">🇦🇺 +61 (Australia)</option>
              <option value="+49">🇩🇪 +49 (Germany)</option>
            </select>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="phone-number"
              placeholder="(201) 555-0123"
              required
            />
          </div>
          <div className="helper-text">Phone includes country code and number</div>
        </div>

        {/* Alternate Phone Toggle - Yes/No */}
        <div className="form-group">
          <label>Do you have an alternate phone number?</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="alternatePhoneType"
                value="no"
                checked={!hasAlternatePhone}
                onChange={handleInputChange}
              />
              No
            </label>
            <label>
              <input
                type="radio"
                name="alternatePhoneType"
                value="yes"
                checked={hasAlternatePhone}
                onChange={handleInputChange}
              />
              Yes
            </label>
          </div>
        </div>

        {/* Alternate Phone Details (shown only when Yes is selected) */}
        {hasAlternatePhone && (
          <>
            {/* Alternate Phone Number with country code dropdown and phone type dropdown */}
            <div className="form-group">
              <label>Alternate Phone Number</label>
              <div className="phone-input-row">
                <select
                  name="alternateCountryCode"
                  value={formData.alternateCountryCode || '+1'}
                  onChange={handleInputChange}
                  className="country-code-dropdown"
                >
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+86">🇨🇳 +86</option>
                  <option value="+81">🇯🇵 +81</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+39">🇮🇹 +39</option>
                  <option value="+7">🇷🇺 +7</option>
                </select>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                 
                  className="phone-number-input"
                />
                <select
                  name="alternatePhoneType"
                  value={formData.alternatePhoneType}
                  onChange={handleInputChange}
                  className="phone-type-dropdown"
                >
                  {availableTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="helper-text">Alternate phone is optional</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContactDetailsSection;