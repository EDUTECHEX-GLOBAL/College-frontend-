import React from 'react';
import './PersonalInfo.css';

const PersonalInfoSection = ({ formData, handleInputChange }) => (
  <div className="personal-info-section">
    <h2>Personal Information</h2>
    <div className="section-status">
      {formData.profileCompletion.personalInfo ? 'Complete' : 'In Progress'}
    </div>
    <div className="form-content">
      <div className="form-grid">
        <div className="form-group">
          <label className="required">Legal First/Given Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Middle Name</label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label className="required">Last/Family Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Suffix</label>
          <select
            name="suffix"
            value={formData.suffix}
            onChange={handleInputChange}
          >
            <option value="">Select Suffix</option>
            <option value="jr">Jr.</option>
            <option value="sr">Sr.</option>
            <option value="ii">II</option>
            <option value="iii">III</option>
            <option value="iv">IV</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="required">Date of Birth</label>
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Would you like to share a different first name that people call you?</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="useDifferentFirstName"
              value="yes"
              checked={formData.useDifferentFirstName === 'yes'}
              onChange={handleInputChange}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="useDifferentFirstName"
              value="no"
              checked={formData.useDifferentFirstName === 'no'}
              onChange={handleInputChange}
            />
            No
          </label>
        </div>
      </div>

      {formData.useDifferentFirstName === 'yes' && (
        <div className="form-group">
          <label>Preferred First Name</label>
          <input
            type="text"
            name="preferredFirstName"
            value={formData.preferredFirstName}
            onChange={handleInputChange}
          />
        </div>
      )}
    </div>
  </div>
);

export default PersonalInfoSection;