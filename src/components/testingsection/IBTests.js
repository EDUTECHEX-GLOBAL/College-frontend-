// components/testing-sections/IBTests.js
import React from 'react';

const IBTests = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange 
}) => {
  const ibTemplate = {
    subject: '',
    level: 'HL',
    score: '',
    predicted: false
  };

  return (
    <div className="testing-section">
      <h3>IB Subject Tests</h3>
      <p className="section-subtitle">In progress</p>

      <div className="form-question">
        <label>Number of IB exams you wish to report*</label>
        <select 
          className="form-select"
          value={formData.ibTestsCount || 0}
          onChange={(e) => {
            const count = parseInt(e.target.value);
            handleInputChange('ibTestsCount', count);
            const tests = Array.from({ length: count }, () => ({ ...ibTemplate }));
            handleInputChange('ibTests', tests);
          }}
        >
          <option value="">Select number</option>
          {Array.from({ length: 11 }, (_, i) => i).map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {formData.ibTestsCount > 0 && formData.ibTests?.map((test, index) => (
        <div key={index} className="test-entry-form">
          <h4>IB Test {index + 1}</h4>

          <div className="form-question">
            <label>Subject*</label>
            <input 
              type="text"
              className="form-input"
              placeholder="Enter subject name"
              value={test.subject}
              onChange={(e) => handleArrayChange('ibTests', index, 'subject', e.target.value)}
            />
          </div>

          <div className="form-question">
            <label>Level*</label>
            <select 
              className="form-select"
              value={test.level}
              onChange={(e) => handleArrayChange('ibTests', index, 'level', e.target.value)}
            >
              <option value="HL">Higher Level (HL)</option>
              <option value="SL">Standard Level (SL)</option>
            </select>
          </div>

          <div className="form-question">
            <label>Score*</label>
            <select 
              className="form-select"
              value={test.score}
              onChange={(e) => handleArrayChange('ibTests', index, 'score', e.target.value)}
            >
              <option value="">- Choose a score -</option>
              {[1, 2, 3, 4, 5, 6, 7].map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Is this a predicted score?*</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.predicted === true}
                  onChange={() => handleArrayChange('ibTests', index, 'predicted', true)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.predicted === false}
                  onChange={() => handleArrayChange('ibTests', index, 'predicted', false)}
                />
                <span>No</span>
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default IBTests;
