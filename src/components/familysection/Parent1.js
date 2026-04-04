// src/components/family-sections/Parent1Section.js
import React from 'react';
import './Parent1.css';
import { countryCodes } from '../../utils/countryCodes';

const Parent1Section = ({ familyData, handleInputChange, handleNestedChange }) => {
  const { parent1 } = familyData;

  return (
    <div className="parent1-section">
      {/* Header */}
      <div className="parent1-header">
        <h2 className="parent1-title">Parent 1</h2>
        <div className="parent1-status">In progress</div>
      </div>

      <div className="parent1-description">
        Please provide information about your first parent or guardian.
      </div>

      <div className="parent1-grid">
        {/* Is Deceased */}
        <div className="parent1-form-group parent1-full-width">
          <label className="parent1-checkbox-label">
            <input
              type="checkbox"
              checked={parent1.isDeceased || false}
              onChange={(e) => handleInputChange('parent1', 'isDeceased', e.target.checked)}
              className="parent1-checkbox"
            />
            <span>Parent 1 is deceased</span>
          </label>
        </div>

        {!parent1.isDeceased && (
          <>
            {/* Name Fields */}
            <div className="parent1-form-group">
              <label className="parent1-label">Prefix</label>
              <select
                className="parent1-select"
                value={parent1.prefix || ''}
                onChange={(e) => handleInputChange('parent1', 'prefix', e.target.value)}
              >
                <option value="">Select</option>
                <option value="mr">Mr.</option>
                <option value="mrs">Mrs.</option>
                <option value="ms">Ms.</option>
                <option value="dr">Dr.</option>
              </select>
            </div>

            <div className="parent1-form-group">
              <label className="parent1-label parent1-required">First Name</label>
              <input
                type="text"
                className="parent1-input"
                placeholder="Enter first name"
                value={parent1.firstName || ''}
                onChange={(e) => handleInputChange('parent1', 'firstName', e.target.value)}
              />
            </div>

            <div className="parent1-form-group">
              <label className="parent1-label">Middle Name</label>
              <input
                type="text"
                className="parent1-input"
                placeholder="Enter middle name"
                value={parent1.middleName || ''}
                onChange={(e) => handleInputChange('parent1', 'middleName', e.target.value)}
              />
            </div>

            <div className="parent1-form-group">
              <label className="parent1-label parent1-required">Last Name</label>
              <input
                type="text"
                className="parent1-input"
                placeholder="Enter last name"
                value={parent1.lastName || ''}
                onChange={(e) => handleInputChange('parent1', 'lastName', e.target.value)}
              />
            </div>

            <div className="parent1-form-group">
              <label className="parent1-label">Suffix</label>
              <select
                className="parent1-select"
                value={parent1.suffix || ''}
                onChange={(e) => handleInputChange('parent1', 'suffix', e.target.value)}
              >
                <option value="">Select</option>
                <option value="jr">Jr.</option>
                <option value="sr">Sr.</option>
                <option value="ii">II</option>
                <option value="iii">III</option>
                <option value="iv">IV</option>
              </select>
            </div>

            {/* Relationship */}
            <div className="parent1-form-group parent1-full-width">
              <label className="parent1-label parent1-required">Relationship to you</label>
              <select
                className="parent1-select"
                value={parent1.relationshipToYou || ''}
                onChange={(e) => handleInputChange('parent1', 'relationshipToYou', e.target.value)}
              >
                <option value="">- Choose an option -</option>
                <option value="mother">Mother</option>
                <option value="father">Father</option>
                <option value="stepmother">Stepmother</option>
                <option value="stepfather">Stepfather</option>
                <option value="legal-guardian">Legal Guardian</option>
                <option value="grandparent">Grandparent</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Contact Information */}
            <div className="parent1-form-group">
              <label className="parent1-label">Email</label>
              <input
                type="email"
                className="parent1-input"
                placeholder="Enter email"
                value={parent1.email || ''}
                onChange={(e) => handleInputChange('parent1', 'email', e.target.value)}
              />
            </div>

            <div className="parent1-form-group">
              <label className="parent1-label">Phone Number</label>
              <div className="parent1-phone-group">
                <select
                  className="parent1-country-code"
                  value={parent1.phoneCountryCode || '+1'}
                  onChange={(e) => handleInputChange('parent1', 'phoneCountryCode', e.target.value)}
                >
                  {countryCodes.map((item, index) => (
                    <option key={index} value={item.code}>
                      {item.code} {item.country}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  className="parent1-input"
                  placeholder="Phone number"
                  value={parent1.phoneNumber || ''}
                  onChange={(e) => handleInputChange('parent1', 'phoneNumber', e.target.value)}
                />
              </div>
            </div>

            {/* Education */}
            <div className="parent1-form-group">
              <label className="parent1-label">Highest Level of Education</label>
              <select
                className="parent1-select"
                value={parent1.highestEducationLevel || ''}
                onChange={(e) => handleInputChange('parent1', 'highestEducationLevel', e.target.value)}
              >
                <option value="">Select</option>
                <option value="no-high-school">No High School</option>
                <option value="high-school">High School</option>
                <option value="some-college">Some College</option>
                <option value="associate">Associate Degree</option>
                <option value="bachelor">Bachelor's Degree</option>
                <option value="master">Master's Degree</option>
                <option value="doctorate">Doctorate</option>
              </select>
            </div>

            <div className="parent1-form-group">
              <label className="parent1-label">College Attended</label>
              <input
                type="text"
                className="parent1-input"
                placeholder="Enter college name"
                value={parent1.collegeAttended || ''}
                onChange={(e) => handleInputChange('parent1', 'collegeAttended', e.target.value)}
              />
            </div>

            {/* Occupation */}
            <div className="parent1-form-group">
              <label className="parent1-label">Occupation</label>
              <input
                type="text"
                className="parent1-input"
                placeholder="Enter occupation"
                value={parent1.occupation || ''}
                onChange={(e) => handleInputChange('parent1', 'occupation', e.target.value)}
              />
            </div>

            <div className="parent1-form-group">
              <label className="parent1-label">Employer</label>
              <input
                type="text"
                className="parent1-input"
                placeholder="Enter employer"
                value={parent1.employer || ''}
                onChange={(e) => handleInputChange('parent1', 'employer', e.target.value)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Parent1Section;
