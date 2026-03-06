// src/components/education-sections/CollegesSection.js
import React from 'react';
import './Colleges.css';

const CollegesSection = ({ educationData, handleInputChange, handleArrayChange, addArrayItem, removeArrayItem }) => {
  const { colleges } = educationData;

  const handleNumberOfCollegesChange = (value) => {
    const numColleges = parseInt(value);
    handleInputChange('colleges', 'numberOfColleges', numColleges);
    
    const currentColleges = colleges.collegesList || [];
    const newColleges = [];
    
    for (let i = 0; i < numColleges; i++) {
      newColleges.push(currentColleges[i] || {
        collegeName: '',
        collegeType: '',
        datesAttendedFrom: '',
        datesAttendedTo: '',
        creditsEarned: '',
        degreeEarned: '',
        major: ''
      });
    }
    
    handleInputChange('colleges', 'collegesList', newColleges);
  };

  const defaultCollege = {
    collegeName: '',
    collegeType: '',
    datesAttendedFrom: '',
    datesAttendedTo: '',
    creditsEarned: '',
    degreeEarned: '',
    major: ''
  };

  return (
    <div className="colleges-section">
      <div className="colleges-header">
        <h2 className="colleges-title">Colleges & Universities</h2>
        <div className="colleges-status">In progress</div>
      </div>

      <div className="colleges-description">
        If you have ever taken coursework at a college or university, please provide the details below.
      </div>

      {/* Number of Colleges */}
      <div className="colleges-form-group">
        <label className="colleges-label colleges-required">
          Please indicate the number of colleges
        </label>
        <div className="colleges-radio-group">
          {[0, 1, 2, 3].map(num => (
            <label key={num} className="colleges-radio-option">
              <input
                type="radio"
                name="numberOfColleges"
                value={num}
                checked={colleges.numberOfColleges === num}
                onChange={(e) => handleNumberOfCollegesChange(e.target.value)}
                className="colleges-radio-input"
              />
              <span className="colleges-radio-label">{num}</span>
            </label>
          ))}
        </div>
      </div>

      {/* College Details */}
      {colleges.collegesList && colleges.collegesList.map((college, index) => (
        <div key={index} className="colleges-array-section">
          <div className="colleges-item">
            <div className="colleges-item-header">
              <h4 className="colleges-item-title">College/University {index + 1}</h4>
              {colleges.numberOfColleges > 0 && (
                <button
                  type="button"
                  className="colleges-remove-btn"
                  onClick={() => {
                    const updatedColleges = colleges.collegesList.filter((_, i) => i !== index);
                    handleInputChange('colleges', 'collegesList', updatedColleges);
                    handleInputChange('colleges', 'numberOfColleges', updatedColleges.length);
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="colleges-grid">
              <div className="colleges-form-group colleges-full-width">
                <label className="colleges-label colleges-required">College/University Name</label>
                <input
                  type="text"
                  className="colleges-input"
                  placeholder="Enter college name"
                  value={college.collegeName || ''}
                  onChange={(e) => handleArrayChange('colleges', 'collegesList', index, 'collegeName', e.target.value)}
                />
              </div>

              <div className="colleges-form-group">
                <label className="colleges-label colleges-required">Type of Institution</label>
                <select
                  className="colleges-select"
                  value={college.collegeType || ''}
                  onChange={(e) => handleArrayChange('colleges', 'collegesList', index, 'collegeType', e.target.value)}
                >
                  <option value="">Select type</option>
                  <option value="community-college">Community College</option>
                  <option value="four-year-college">4-Year College</option>
                  <option value="university">University</option>
                  <option value="technical-institute">Technical Institute</option>
                </select>
              </div>

              {/* ✅ FIXED: Dates Attended - From */}
              <div className="colleges-form-group">
                <label className="colleges-label colleges-required">Dates Attended - From</label>
                <input
                  type="month"
                  className="colleges-input"
                  value={college.datesAttendedFrom || ''}
                  onChange={(e) => handleArrayChange('colleges', 'collegesList', index, 'datesAttendedFrom', e.target.value)}
                />
              </div>

              {/* ✅ FIXED: Dates Attended - To */}
              <div className="colleges-form-group">
                <label className="colleges-label">Dates Attended - To</label>
                <input
                  type="month"
                  className="colleges-input"
                  value={college.datesAttendedTo || ''}
                  onChange={(e) => handleArrayChange('colleges', 'collegesList', index, 'datesAttendedTo', e.target.value)}
                />
              </div>

              <div className="colleges-form-group">
                <label className="colleges-label">Credits Earned</label>
                <input
                  type="number"
                  className="colleges-input"
                  placeholder="Enter credits"
                  value={college.creditsEarned || ''}
                  onChange={(e) => handleArrayChange('colleges', 'collegesList', index, 'creditsEarned', e.target.value)}
                />
              </div>

              <div className="colleges-form-group">
                <label className="colleges-label">Degree Earned</label>
                <select
                  className="colleges-select"
                  value={college.degreeEarned || ''}
                  onChange={(e) => handleArrayChange('colleges', 'collegesList', index, 'degreeEarned', e.target.value)}
                >
                  <option value="">Select degree</option>
                  <option value="associate">Associate's Degree</option>
                  <option value="bachelor">Bachelor's Degree</option>
                  <option value="master">Master's Degree</option>
                  <option value="doctorate">Doctorate</option>
                  <option value="certificate">Certificate</option>
                </select>
              </div>

              <div className="colleges-form-group">
                <label className="colleges-label">Major/Field of Study</label>
                <input
                  type="text"
                  className="colleges-input"
                  placeholder="Enter major"
                  value={college.major || ''}
                  onChange={(e) => handleArrayChange('colleges', 'collegesList', index, 'major', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Add College Button */}
      {colleges.numberOfColleges < 3 && colleges.numberOfColleges > 0 && (
        <button
          type="button"
          className="colleges-add-btn"
          onClick={() => {
            if (colleges.collegesList.length < 3) {
              addArrayItem('colleges', 'collegesList', defaultCollege);
              handleInputChange('colleges', 'numberOfColleges', colleges.collegesList.length + 1);
            }
          }}
        >
          + Add Another College
        </button>
      )}
    </div>
  );
};

export default CollegesSection;
