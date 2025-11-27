// components/testing-sections/PTETests.js
import React from 'react';

const PTETests = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange 
}) => {
  const pteTemplate = {
    overallScore: '',
    listeningScore: '',
    readingScore: '',
    speakingScore: '',
    writingScore: '',
    testDate: '',
    futureTestDate: ''
  };

  const scores = Array.from({ length: 91 }, (_, i) => i + 10);

  return (
    <div className="testing-section">
      <h3>PTE Academic Test</h3>
      <p className="section-subtitle">In progress</p>

      <div className="form-question">
        <label>Have you taken or will you take the PTE Academic Test?*</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              checked={formData.hasPTE === true}
              onChange={() => {
                handleInputChange('hasPTE', true);
                handleInputChange('pteTests', [{ ...pteTemplate }]);
              }}
            />
            <span>Yes</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              checked={formData.hasPTE === false}
              onChange={() => {
                handleInputChange('hasPTE', false);
                handleInputChange('pteTests', []);
              }}
            />
            <span>No</span>
          </label>
        </div>
        <button className="clear-answer-btn">Clear answer</button>
      </div>

      {formData.hasPTE && formData.pteTests?.map((test, index) => (
        <div key={index} className="test-entry-form">
          <h4>PTE Academic Score</h4>

          <div className="form-question">
            <label>Overall score*</label>
            <select 
              className="form-select"
              value={test.overallScore}
              onChange={(e) => handleArrayChange('pteTests', index, 'overallScore', e.target.value)}
            >
              <option value="">- Choose score -</option>
              {scores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Listening score*</label>
            <select 
              className="form-select"
              value={test.listeningScore}
              onChange={(e) => handleArrayChange('pteTests', index, 'listeningScore', e.target.value)}
            >
              <option value="">- Choose score -</option>
              {scores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Reading score*</label>
            <select 
              className="form-select"
              value={test.readingScore}
              onChange={(e) => handleArrayChange('pteTests', index, 'readingScore', e.target.value)}
            >
              <option value="">- Choose score -</option>
              {scores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Speaking score*</label>
            <select 
              className="form-select"
              value={test.speakingScore}
              onChange={(e) => handleArrayChange('pteTests', index, 'speakingScore', e.target.value)}
            >
              <option value="">- Choose score -</option>
              {scores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Writing score*</label>
            <select 
              className="form-select"
              value={test.writingScore}
              onChange={(e) => handleArrayChange('pteTests', index, 'writingScore', e.target.value)}
            >
              <option value="">- Choose score -</option>
              {scores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Test date*</label>
            <input 
              type="date"
              className="form-input"
              value={test.testDate}
              onChange={(e) => handleArrayChange('pteTests', index, 'testDate', e.target.value)}
            />
          </div>

          <div className="form-question">
            <label>Do you plan to take the PTE Academic Test in the future?*</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.planFutureTest === true}
                  onChange={() => handleArrayChange('pteTests', index, 'planFutureTest', true)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.planFutureTest === false}
                  onChange={() => handleArrayChange('pteTests', index, 'planFutureTest', false)}
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
                onChange={(e) => handleArrayChange('pteTests', index, 'futureTestDate', e.target.value)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PTETests;
