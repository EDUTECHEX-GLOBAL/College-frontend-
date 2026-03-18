// components/testing-sections/IELTSTests.js
import React from 'react';

const IELTSTests = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange 
}) => {
  const ieltsTemplate = {
    overallBand: '',
    listeningBand: '',
    readingBand: '',
    writingBand: '',
    speakingBand: '',
    testDate: '',
    testType: 'Academic',
    futureTestDate: ''
  };

  const bandScores = [
    '0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', 
    '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9'
  ];

  return (
    <div className="testing-section">
      <h3>IELTS</h3>
      <p className="section-subtitle">In progress</p>

      <div className="form-question">
        <label>Have you taken or will you take the IELTS?*</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              checked={formData.hasIELTS === true}
              onChange={() => {
                handleInputChange('hasIELTS', true);
                handleInputChange('ieltsTests', [{ ...ieltsTemplate }]);
              }}
            />
            <span>Yes</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              checked={formData.hasIELTS === false}
              onChange={() => {
                handleInputChange('hasIELTS', false);
                handleInputChange('ieltsTests', []);
              }}
            />
            <span>No</span>
          </label>
        </div>
        <button className="clear-answer-btn">Clear answer</button>
      </div>

      {formData.hasIELTS && formData.ieltsTests?.map((test, index) => (
        <div key={index} className="test-entry-form">
          <h4>IELTS Score</h4>

          <div className="form-question">
            <label>Test type*</label>
            <select 
              className="form-select"
              value={test.testType}
              onChange={(e) => handleArrayChange('ieltsTests', index, 'testType', e.target.value)}
            >
              <option value="Academic">Academic</option>
              <option value="General Training">General Training</option>
            </select>
          </div>

          <div className="form-question">
            <label>Overall band score*</label>
            <select 
              className="form-select"
              value={test.overallBand}
              onChange={(e) => handleArrayChange('ieltsTests', index, 'overallBand', e.target.value)}
            >
              <option value="">- Choose band score -</option>
              {bandScores.map(band => (
                <option key={band} value={band}>{band}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Listening band score*</label>
            <select 
              className="form-select"
              value={test.listeningBand}
              onChange={(e) => handleArrayChange('ieltsTests', index, 'listeningBand', e.target.value)}
            >
              <option value="">- Choose band score -</option>
              {bandScores.map(band => (
                <option key={band} value={band}>{band}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Reading band score*</label>
            <select 
              className="form-select"
              value={test.readingBand}
              onChange={(e) => handleArrayChange('ieltsTests', index, 'readingBand', e.target.value)}
            >
              <option value="">- Choose band score -</option>
              {bandScores.map(band => (
                <option key={band} value={band}>{band}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Writing band score*</label>
            <select 
              className="form-select"
              value={test.writingBand}
              onChange={(e) => handleArrayChange('ieltsTests', index, 'writingBand', e.target.value)}
            >
              <option value="">- Choose band score -</option>
              {bandScores.map(band => (
                <option key={band} value={band}>{band}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Speaking band score*</label>
            <select 
              className="form-select"
              value={test.speakingBand}
              onChange={(e) => handleArrayChange('ieltsTests', index, 'speakingBand', e.target.value)}
            >
              <option value="">- Choose band score -</option>
              {bandScores.map(band => (
                <option key={band} value={band}>{band}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Test date*</label>
            <input 
              type="date"
              className="form-input"
              value={test.testDate}
              onChange={(e) => handleArrayChange('ieltsTests', index, 'testDate', e.target.value)}
            />
          </div>

          <div className="form-question">
            <label>Do you plan to take the IELTS in the future?*</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.planFutureTest === true}
                  onChange={() => handleArrayChange('ieltsTests', index, 'planFutureTest', true)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.planFutureTest === false}
                  onChange={() => handleArrayChange('ieltsTests', index, 'planFutureTest', false)}
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {test.planFutureTest && (
            <div className="form-question">
              <label>Future test date</label>
              <input 
                type="date"
                className="form-input"
                value={test.futureTestDate}
                onChange={(e) => handleArrayChange('ieltsTests', index, 'futureTestDate', e.target.value)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default IELTSTests;
