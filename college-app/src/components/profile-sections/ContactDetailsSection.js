import React from 'react';
import './ContactDetailsSection.css';

const ContactDetailsSection = ({ formData, handleInputChange }) => {
  // Helper function to get available phone types
  const getAvailablePhoneTypes = (preferredType) => {
    const allTypes = ['home', 'mobile', 'work'];
    return allTypes.filter(type => type !== preferredType);
  };

  const handleAlternatePhoneToggle = (e) => {
    const value = e.target.value;
    if (value === 'yes') {
      handleInputChange(e);
    } else {
      // When "No" is selected, reset alternate phone fields
      const event = {
        target: {
          name: 'alternatePhoneType',
          value: 'none'
        }
      };
      handleInputChange(event);
      
      // Also clear the alternate phone number
      const clearEvent = {
        target: {
          name: 'alternatePhone',
          value: ''
        }
      };
      handleInputChange(clearEvent);
    }
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

        <div className="form-group">
          <label className="required">Preferred Phone Number</label>
          <div className="phone-input">
            <select
              name="countryCode"
              value={formData.countryCode}
              onChange={handleInputChange}
              className="country-code"
            >
              <option value="+1">+1 (USA/Canada)</option>
              <option value="+91">+91 (India)</option>
              <option value="+44">+44 (UK)</option>
            </select>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="phone-number"
              placeholder="Enter phone number"
              required
            />
          </div>
          <div className="helper-text">Phone includes country code and number</div>
        </div>

        <div className="form-group">
          <label>Do you have an alternate phone number?</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="alternatePhoneType"
                value="no"
                checked={formData.alternatePhoneType === 'none' || !formData.alternatePhoneType}
                onChange={handleAlternatePhoneToggle}
              />
              No
            </label>
            <label>
              <input
                type="radio"
                name="alternatePhoneType"
                value="yes"
                checked={formData.alternatePhoneType !== 'none' && formData.alternatePhoneType !== ''}
                onChange={handleAlternatePhoneToggle}
              />
              Yes
            </label>
          </div>
        </div>

        {formData.alternatePhoneType !== 'none' && formData.alternatePhoneType !== '' && (
          <>
            <div className="form-group">
              <label className="required">Alternate Phone Type</label>
              <div className="radio-group">
                {/* Only show options that are NOT selected as preferred */}
                {formData.preferredPhoneType !== 'home' && (
                  <label>
                    <input
                      type="radio"
                      name="alternatePhoneType"
                      value="home"
                      checked={formData.alternatePhoneType === 'home'}
                      onChange={handleInputChange}
                    />
                    Home
                  </label>
                )}
                {formData.preferredPhoneType !== 'mobile' && (
                  <label>
                    <input
                      type="radio"
                      name="alternatePhoneType"
                      value="mobile"
                      checked={formData.alternatePhoneType === 'mobile'}
                      onChange={handleInputChange}
                    />
                    Mobile
                  </label>
                )}
                {formData.preferredPhoneType !== 'work' && (
                  <label>
                    <input
                      type="radio"
                      name="alternatePhoneType"
                      value="work"
                      checked={formData.alternatePhoneType === 'work'}
                      onChange={handleInputChange}
                    />
                    Work
                  </label>
                )}
              </div>
            </div>

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
                  placeholder="(201) 555-0123"
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