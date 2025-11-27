import React from 'react';
import './ContactDetailsSection.css'; // Add this import

const ContactDetailsSection = ({ formData, handleInputChange }) => (
  <div className="contact-details-section"> {/* Changed class name */}
    <h2>Contact Details</h2>
    <div className="section-status">
      {formData.profileCompletion.contactDetails ? 'Complete' : 'In Progress'}
    </div>
    <div className="form-content">
      {/* Your existing JSX content remains exactly the same */}
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
        <label>Alternate Phone</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="alternatePhoneType"
              value="none"
              checked={formData.alternatePhoneType === 'none'}
              onChange={handleInputChange}
            />
            No other telephone
          </label>
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
        </div>
      </div>

      {formData.alternatePhoneType !== 'none' && (
        <div className="form-group">
          <label>Alternate Phone Number</label>
          <input
            type="tel"
            name="alternatePhone"
            value={formData.alternatePhone}
            onChange={handleInputChange}
            placeholder="Enter alternate phone number"
          />
          <div className="helper-text">Phone includes country code and number</div>
        </div>
      )}
    </div>
  </div>
);

export default ContactDetailsSection;