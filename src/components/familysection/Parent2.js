// src/components/family-sections/Parent2Section.js
import React from 'react';
import './Parent2.css';
import { countryCodes } from '../../utils/countryCodes';

const Parent2Section = ({ familyData, handleInputChange, handleNestedChange }) => {
  const { parent2 } = familyData;

  return (
    <div className="parent2-section">
      {/* Header */}
      <div className="parent2-header">
        <h2 className="parent2-title">Parent 2</h2>
        <div className="parent2-status">In progress</div>
      </div>

      <div className="parent2-description">
        Please provide information about your second parent or guardian if applicable.
      </div>

      <div className="parent2-grid">
        {/* Has Parent 2 */}
        <div className="parent2-form-group parent2-full-width">
          <label className="parent2-label parent2-required">
            Do you have a second parent or guardian?
          </label>
          <div className="parent2-radio-group">
            <label className="parent2-radio-option">
              <input
                type="radio"
                name="hasParent2"
                value="yes"
                checked={parent2.hasParent2 === 'yes'}
                onChange={(e) => handleInputChange('parent2', 'hasParent2', e.target.value)}
                className="parent2-radio-input"
              />
              <span className="parent2-radio-label">Yes</span>
            </label>
            <label className="parent2-radio-option">
              <input
                type="radio"
                name="hasParent2"
                value="no"
                checked={parent2.hasParent2 === 'no'}
                onChange={(e) => handleInputChange('parent2', 'hasParent2', e.target.value)}
                className="parent2-radio-input"
              />
              <span className="parent2-radio-label">No</span>
            </label>
          </div>
        </div>

        {parent2.hasParent2 === 'yes' && (
          <>
            {/* Is Deceased */}
            <div className="parent2-form-group parent2-full-width">
              <label className="parent2-checkbox-label">
                <input
                  type="checkbox"
                  checked={parent2.isDeceased || false}
                  onChange={(e) => handleInputChange('parent2', 'isDeceased', e.target.checked)}
                  className="parent2-checkbox"
                />
                <span>Parent 2 is deceased</span>
              </label>
            </div>

            {!parent2.isDeceased && (
              <>
                {/* Name Fields */}
                <div className="parent2-form-group">
                  <label className="parent2-label">Prefix</label>
                  <select
                    className="parent2-select"
                    value={parent2.prefix || ''}
                    onChange={(e) => handleInputChange('parent2', 'prefix', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="mr">Mr.</option>
                    <option value="mrs">Mrs.</option>
                    <option value="ms">Ms.</option>
                    <option value="dr">Dr.</option>
                  </select>
                </div>

                <div className="parent2-form-group">
                  <label className="parent2-label parent2-required">First Name</label>
                  <input
                    type="text"
                    className="parent2-input"
                    placeholder="Enter first name"
                    value={parent2.firstName || ''}
                    onChange={(e) => handleInputChange('parent2', 'firstName', e.target.value)}
                  />
                </div>

                <div className="parent2-form-group">
                  <label className="parent2-label">Middle Name</label>
                  <input
                    type="text"
                    className="parent2-input"
                    placeholder="Enter middle name"
                    value={parent2.middleName || ''}
                    onChange={(e) => handleInputChange('parent2', 'middleName', e.target.value)}
                  />
                </div>

                <div className="parent2-form-group">
                  <label className="parent2-label parent2-required">Last Name</label>
                  <input
                    type="text"
                    className="parent2-input"
                    placeholder="Enter last name"
                    value={parent2.lastName || ''}
                    onChange={(e) => handleInputChange('parent2', 'lastName', e.target.value)}
                  />
                </div>

                <div className="parent2-form-group">
                  <label className="parent2-label">Suffix</label>
                  <select
                    className="parent2-select"
                    value={parent2.suffix || ''}
                    onChange={(e) => handleInputChange('parent2', 'suffix', e.target.value)}
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
                <div className="parent2-form-group parent2-full-width">
                  <label className="parent2-label parent2-required">Relationship to you</label>
                  <select
                    className="parent2-select"
                    value={parent2.relationshipToYou || ''}
                    onChange={(e) => handleInputChange('parent2', 'relationshipToYou', e.target.value)}
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
                <div className="parent2-form-group">
                  <label className="parent2-label">Email</label>
                  <input
                    type="email"
                    className="parent2-input"
                    placeholder="Enter email"
                    value={parent2.email || ''}
                    onChange={(e) => handleInputChange('parent2', 'email', e.target.value)}
                  />
                </div>

                <div className="parent2-form-group">
                  <label className="parent2-label">Phone Number</label>
                  <div className="parent2-phone-group">
                    <select
                      className="parent2-country-code"
                      value={parent2.phoneCountryCode || '+1'}
                      onChange={(e) => handleInputChange('parent2', 'phoneCountryCode', e.target.value)}
                    >
                      {countryCodes.map((item, index) => (
                        <option key={index} value={item.code}>
                          {item.code} {item.country}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      className="parent2-input"
                      placeholder="Phone number"
                      value={parent2.phoneNumber || ''}
                      onChange={(e) => handleInputChange('parent2', 'phoneNumber', e.target.value)}
                    />
                  </div>
                </div>

                {/* Education */}
                <div className="parent2-form-group">
                  <label className="parent2-label">Highest Level of Education</label>
                  <select
                    className="parent2-select"
                    value={parent2.highestEducationLevel || ''}
                    onChange={(e) => handleInputChange('parent2', 'highestEducationLevel', e.target.value)}
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

                <div className="parent2-form-group">
                  <label className="parent2-label">College Attended</label>
                  <input
                    type="text"
                    className="parent2-input"
                    placeholder="Enter college name"
                    value={parent2.collegeAttended || ''}
                    onChange={(e) => handleInputChange('parent2', 'collegeAttended', e.target.value)}
                  />
                </div>

                {/* Occupation */}
                <div className="parent2-form-group">
                  <label className="parent2-label">Occupation</label>
                  <input
                    type="text"
                    className="parent2-input"
                    placeholder="Enter occupation"
                    value={parent2.occupation || ''}
                    onChange={(e) => handleInputChange('parent2', 'occupation', e.target.value)}
                  />
                </div>

                <div className="parent2-form-group">
                  <label className="parent2-label">Employer</label>
                  <input
                    type="text"
                    className="parent2-input"
                    placeholder="Enter employer"
                    value={parent2.employer || ''}
                    onChange={(e) => handleInputChange('parent2', 'employer', e.target.value)}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Parent2Section;
