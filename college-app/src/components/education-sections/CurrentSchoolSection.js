// src/components/education-sections/CurrentSchoolSection.js
import React from 'react';
import './CurrentSchoolSection.css';

const CurrentSchoolSection = ({ educationData, handleInputChange, handleNestedChange }) => {
  const { currentSchool } = educationData;

  return (
    <div className="current-school-section">
      <div className="current-school-header">
        <h2 className="current-school-title">Current or Most Recent Secondary/High School</h2>
        <div className="current-school-status">In progress</div>
      </div>

      <div className="current-school-description">
        Please provide information about your current or most recent secondary/high school.
      </div>

      <div className="current-school-grid">
        {/* School Name */}
        <div className="current-school-form-group current-school-full-width">
          <label className="current-school-label current-school-required">
            Current or most recent secondary/high school
          </label>
          <input
            type="text"
            className="current-school-input"
            placeholder="Find school"
            value={currentSchool.schoolName || ''}
            onChange={(e) => handleInputChange('currentSchool', 'schoolName', e.target.value)}
          />
          <div className="current-school-hint">Search for your school by name</div>
        </div>

        {/* CEEB Code */}
        {/* <div className="current-school-form-group">
          <label className="current-school-label">
            School CEEB Code
          </label>
          <input
            type="text"
            className="current-school-input"
            placeholder="Enter CEEB code"
            value={currentSchool.schoolCEEBCode || ''}
            onChange={(e) => handleInputChange('currentSchool', 'schoolCEEBCode', e.target.value)}
          />
        </div> */}

        {/* Date of Entry */}
        <div className="current-school-form-group">
          <label className="current-school-label current-school-required">
            Date of entry
          </label>
          <input
            type="month"
            className="current-school-input"
            value={currentSchool.dateOfEntry || ''}
            onChange={(e) => handleInputChange('currentSchool', 'dateOfEntry', e.target.value)}
          />
          <div className="current-school-hint">Month and year format</div>
        </div>

        {/* Boarding School Question */}
        <div className="current-school-form-group current-school-full-width">
          <label className="current-school-label current-school-required">
            Is this a boarding school?
          </label>
          <div className="current-school-radio-group">
            <label className="current-school-radio-option">
              <input
                type="radio"
                name="isBoardingSchool"
                value="yes"
                checked={currentSchool.isBoardingSchool === 'yes'}
                onChange={(e) => handleInputChange('currentSchool', 'isBoardingSchool', e.target.value)}
                className="current-school-radio-input"
              />
              <span className="current-school-radio-label">Yes</span>
            </label>
            <label className="current-school-radio-option">
              <input
                type="radio"
                name="isBoardingSchool"
                value="no"
                checked={currentSchool.isBoardingSchool === 'no'}
                onChange={(e) => handleInputChange('currentSchool', 'isBoardingSchool', e.target.value)}
                className="current-school-radio-input"
              />
              <span className="current-school-radio-label">No</span>
            </label>
          </div>
        </div>

        {/* Live on Campus Question */}
        {currentSchool.isBoardingSchool === 'yes' && (
          <div className="current-school-form-group current-school-full-width">
            <label className="current-school-label current-school-required">
              Do you live on campus?
            </label>
            <div className="current-school-radio-group">
              <label className="current-school-radio-option">
                <input
                  type="radio"
                  name="liveOnCampus"
                  value="yes"
                  checked={currentSchool.liveOnCampus === 'yes'}
                  onChange={(e) => handleInputChange('currentSchool', 'liveOnCampus', e.target.value)}
                  className="current-school-radio-input"
                />
                <span className="current-school-radio-label">Yes</span>
              </label>
              <label className="current-school-radio-option">
                <input
                  type="radio"
                  name="liveOnCampus"
                  value="no"
                  checked={currentSchool.liveOnCampus === 'no'}
                  onChange={(e) => handleInputChange('currentSchool', 'liveOnCampus', e.target.value)}
                  className="current-school-radio-input"
                />
                <span className="current-school-radio-label">No</span>
              </label>
            </div>
          </div>
        )}

        {/* Graduation Question */}
        <div className="current-school-form-group current-school-full-width">
          <label className="current-school-label current-school-required">
            Did or will you graduate from this school?
          </label>
          <div className="current-school-radio-group">
            <label className="current-school-radio-option">
              <input
                type="radio"
                name="willGraduate"
                value="yes"
                checked={currentSchool.willGraduate === 'yes'}
                onChange={(e) => handleInputChange('currentSchool', 'willGraduate', e.target.value)}
                className="current-school-radio-input"
              />
              <span className="current-school-radio-label">Yes</span>
            </label>
            <label className="current-school-radio-option">
              <input
                type="radio"
                name="willGraduate"
                value="no"
                checked={currentSchool.willGraduate === 'no'}
                onChange={(e) => handleInputChange('currentSchool', 'willGraduate', e.target.value)}
                className="current-school-radio-input"
              />
              <span className="current-school-radio-label">No</span>
            </label>
          </div>
        </div>

        {/* Graduation Date */}
        {currentSchool.willGraduate === 'yes' && (
          <div className="current-school-form-group">
            <label className="current-school-label current-school-required">
              Graduation date
            </label>
            <input
              type="month"
              className="current-school-input"
              value={currentSchool.graduationDate || ''}
              onChange={(e) => handleInputChange('currentSchool', 'graduationDate', e.target.value)}
            />
            <div className="current-school-hint">Month and year format</div>
          </div>
        )}
      </div>

      {/* School Address */}
      <div className="current-school-address-section">
        <h3 className="current-school-address-title">School Address</h3>
        <div className="current-school-grid">
          <div className="current-school-form-group current-school-full-width">
            <label className="current-school-label">Street Address</label>
            <input
              type="text"
              className="current-school-input"
              placeholder="Enter street address"
              value={currentSchool.schoolAddress?.street || ''}
              onChange={(e) => handleNestedChange('currentSchool', 'schoolAddress', 'street', e.target.value)}
            />
          </div>

          <div className="current-school-form-group">
            <label className="current-school-label">City</label>
            <input
              type="text"
              className="current-school-input"
              placeholder="Enter city"
              value={currentSchool.schoolAddress?.city || ''}
              onChange={(e) => handleNestedChange('currentSchool', 'schoolAddress', 'city', e.target.value)}
            />
          </div>

          <div className="current-school-form-group">
            <label className="current-school-label">State/Province</label>
            <input
              type="text"
              className="current-school-input"
              placeholder="Enter state"
              value={currentSchool.schoolAddress?.state || ''}
              onChange={(e) => handleNestedChange('currentSchool', 'schoolAddress', 'state', e.target.value)}
            />
          </div>

          <div className="current-school-form-group">
            <label className="current-school-label">ZIP/Postal Code</label>
            <input
              type="text"
              className="current-school-input"
              placeholder="Enter ZIP code"
              value={currentSchool.schoolAddress?.zipCode || ''}
              onChange={(e) => handleNestedChange('currentSchool', 'schoolAddress', 'zipCode', e.target.value)}
            />
          </div>

          <div className="current-school-form-group">
            <label className="current-school-label">Country</label>
            <select
              className="current-school-select"
              value={currentSchool.schoolAddress?.country || ''}
              onChange={(e) => handleNestedChange('currentSchool', 'schoolAddress', 'country', e.target.value)}
            >
              <option value="">Select country</option>
              <option value="US">United States</option>
              <option value="IN">India</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentSchoolSection;