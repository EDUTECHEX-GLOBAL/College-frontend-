// components/testing-sections/DuolingoTests.js
import React from 'react';

const DuolingoTests = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange 
}) => {
  const duolingoTemplate = {
    overallScore: '',
    literacyScore: '',
    comprehensionScore: '',
    conversationScore: '',
    productionScore: '',
    testDate: '',
    futureTestDate: ''
  };

  const overallScores = Array.from({ length: 151 }, (_, i) => i + 10);
  const subscores = Array.from({ length: 151 }, (_, i) => i + 10);

  return (
    <div className="testing-section">
      <h3>Duolingo English Test</h3>
      <p className="section-subtitle">In progress</p>

      <div className="form-question">
        <label>Have you taken or will you take the Duolingo English Test?*</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              checked={formData.hasDuolingo === true}
              onChange={() => {
                handleInputChange('hasDuolingo', true);
                handleInputChange('duolingoTests', [{ ...duolingoTemplate }]);
              }}
            />
            <span>Yes</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              checked={formData.hasDuolingo === false}
              onChange={() => {
                handleInputChange('hasDuolingo', false);
                handleInputChange('duolingoTests', []);
              }}
            />
            <span>No</span>
          </label>
        </div>
        <button className="clear-answer-btn">Clear answer</button>
      </div>

      {formData.hasDuolingo && formData.duolingoTests?.map((test, index) => (
        <div key={index} className="test-entry-form">
          <h4>Duolingo English Test Score</h4>

          <div className="form-question">
            <label>Overall score*</label>
            <select 
              className="form-select"
              value={test.overallScore}
              onChange={(e) => handleArrayChange('duolingoTests', index, 'overallScore', e.target.value)}
            >
              <option value="">- Choose score -</option>
              {overallScores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
            <small>Scores range from 10 to 160</small>
          </div>

          <div className="form-question">
            <label>Literacy subscore*</label>
            <select 
              className="form-select"
              value={test.literacyScore}
              onChange={(e) => handleArrayChange('duolingoTests', index, 'literacyScore', e.target.value)}
            >
              <option value="">- Choose score -</option>
              {subscores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Comprehension subscore*</label>
            <select 
              className="form-select"
              value={test.comprehensionScore}
              onChange={(e) => handleArrayChange('duolingoTests', index, 'comprehensionScore', e.target.value)}
            >
              <option value="">- Choose score -</option>
              {subscores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Conversation subscore*</label>
            <select 
              className="form-select"
              value={test.conversationScore}
              onChange={(e) => handleArrayChange('duolingoTests', index, 'conversationScore', e.target.value)}
            >
              <option value="">- Choose score -</option>
              {subscores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Production subscore*</label>
            <select 
              className="form-select"
              value={test.productionScore}
              onChange={(e) => handleArrayChange('duolingoTests', index, 'productionScore', e.target.value)}
            >
              <option value="">- Choose score -</option>
              {subscores.map(score => (
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
              onChange={(e) => handleArrayChange('duolingoTests', index, 'testDate', e.target.value)}
            />
          </div>

          <div className="form-question">
            <label>Do you plan to take the Duolingo English Test in the future?*</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.planFutureTest === true}
                  onChange={() => handleArrayChange('duolingoTests', index, 'planFutureTest', true)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.planFutureTest === false}
                  onChange={() => handleArrayChange('duolingoTests', index, 'planFutureTest', false)}
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
                onChange={(e) => handleArrayChange('duolingoTests', index, 'futureTestDate', e.target.value)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DuolingoTests;
