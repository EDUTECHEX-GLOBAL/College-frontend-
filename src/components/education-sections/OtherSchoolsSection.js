// src/components/education-sections/OtherSchoolsSection.js
import React from 'react';
import './OtherSchoolsSection.css';

const OtherSchoolsSection = ({ educationData, handleInputChange, handleArrayChange, addArrayItem, removeArrayItem }) => {
  const { otherSchools } = educationData;

  const handleNumberOfSchoolsChange = (value) => {
    const numSchools = parseInt(value);
    handleInputChange('otherSchools', 'numberOfSchools', numSchools);
    
    // Initialize schools array based on number selected
    const currentSchools = otherSchools.schools || [];
    const newSchools = [];
    
    for (let i = 0; i < numSchools; i++) {
      newSchools.push(currentSchools[i] || {
        schoolName: '',
        schoolCEEBCode: '',
        dateOfEntry: '',
        dateOfExit: '',
        isBoardingSchool: '',
        graduated: '',
        graduationDate: '',
        schoolAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });
    }
    
    handleInputChange('otherSchools', 'schools', newSchools);
  };

  const defaultSchool = {
    schoolName: '',
        schoolCEEBCode: '',
        dateOfEntry: '',
        dateOfExit: '',
        isBoardingSchool: '',
        graduated: '',
        graduationDate: '',
        schoolAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
  };

  return (
    <div className="other-schools-section">
      <div className="other-schools-header">
        <h2 className="other-schools-title">Other Secondary/High Schools</h2>
        <div className="other-schools-status">In progress</div>
      </div>

      <div className="other-schools-description">
        If you have attended any secondary/high schools not listed in the previous section, please provide the details below.
      </div>

      {/* Number of Schools */}
      <div className="other-schools-form-group">
        <label className="other-schools-label other-schools-required">
          Please indicate the number of schools
        </label>
        <div className="other-schools-radio-group">
          {[0, 1, 2, 3].map(num => (
            <label key={num} className="other-schools-radio-option">
              <input
                type="radio"
                name="numberOfSchools"
                value={num}
                checked={otherSchools.numberOfSchools === num}
                onChange={(e) => handleNumberOfSchoolsChange(e.target.value)}
                className="other-schools-radio-input"
              />
              <span className="other-schools-radio-label">{num}</span>
            </label>
          ))}
        </div>
      </div>

      {/* School Details for each school */}
      {otherSchools.schools && otherSchools.schools.map((school, index) => (
        <div key={index} className="other-schools-array-section">
          <div className="other-schools-item">
            <div className="other-schools-item-header">
              <h4 className="other-schools-item-title">School {index + 1}</h4>
              {otherSchools.numberOfSchools > 0 && (
                <button
                  type="button"
                  className="other-schools-remove-btn"
                  onClick={() => {
                    const updatedSchools = otherSchools.schools.filter((_, i) => i !== index);
                    handleInputChange('otherSchools', 'schools', updatedSchools);
                    handleInputChange('otherSchools', 'numberOfSchools', updatedSchools.length);
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="other-schools-grid">
              <div className="other-schools-form-group other-schools-full-width">
                <label className="other-schools-label other-schools-required">School Name</label>
                <input
                  type="text"
                  className="other-schools-input"
                  placeholder="Enter school name"
                  value={school.schoolName}
                  onChange={(e) => handleArrayChange('otherSchools', 'schools', index, 'schoolName', e.target.value)}
                />
              </div>

              <div className="other-schools-form-group">
                <label className="other-schools-label">CEEB Code</label>
                <input
                  type="text"
                  className="other-schools-input"
                  placeholder="Enter CEEB code"
                  value={school.schoolCEEBCode}
                  onChange={(e) => handleArrayChange('otherSchools', 'schools', index, 'schoolCEEBCode', e.target.value)}
                />
              </div>

              <div className="other-schools-form-group">
                <label className="other-schools-label other-schools-required">Date of Entry</label>
                <input
                  type="month"
                  className="other-schools-input"
                  value={school.dateOfEntry}
                  onChange={(e) => handleArrayChange('otherSchools', 'schools', index, 'dateOfEntry', e.target.value)}
                />
              </div>

              <div className="other-schools-form-group">
                <label className="other-schools-label">Date of Exit</label>
                <input
                  type="month"
                  className="other-schools-input"
                  value={school.dateOfExit}
                  onChange={(e) => handleArrayChange('otherSchools', 'schools', index, 'dateOfExit', e.target.value)}
                />
              </div>

              <div className="other-schools-form-group other-schools-full-width">
                <label className="other-schools-label other-schools-required">Did you graduate from this school?</label>
                <div className="other-schools-radio-group">
                  <label className="other-schools-radio-option">
                    <input
                      type="radio"
                      name={`graduated-${index}`}
                      value="yes"
                      checked={school.graduated === 'yes'}
                      onChange={(e) => handleArrayChange('otherSchools', 'schools', index, 'graduated', e.target.value)}
                      className="other-schools-radio-input"
                    />
                    <span className="other-schools-radio-label">Yes</span>
                  </label>
                  <label className="other-schools-radio-option">
                    <input
                      type="radio"
                      name={`graduated-${index}`}
                      value="no"
                      checked={school.graduated === 'no'}
                      onChange={(e) => handleArrayChange('otherSchools', 'schools', index, 'graduated', e.target.value)}
                      className="other-schools-radio-input"
                    />
                    <span className="other-schools-radio-label">No</span>
                  </label>
                </div>
              </div>

              {school.graduated === 'yes' && (
                <div className="other-schools-form-group">
                  <label className="other-schools-label other-schools-required">Graduation Date</label>
                  <input
                    type="month"
                    className="other-schools-input"
                    value={school.graduationDate}
                    onChange={(e) => handleArrayChange('otherSchools', 'schools', index, 'graduationDate', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Add School Button */}
      {otherSchools.numberOfSchools < 3 && otherSchools.numberOfSchools > 0 && (
        <button
          type="button"
          className="other-schools-add-btn"
          onClick={() => {
            if (otherSchools.schools.length < 3) {
              addArrayItem('otherSchools', 'schools', defaultSchool);
              handleInputChange('otherSchools', 'numberOfSchools', otherSchools.schools.length + 1);
            }
          }}
        >
          + Add Another School
        </button>
      )}
    </div>
  );
};

export default OtherSchoolsSection;