// components/testing-sections/SATTests.js
import React from 'react';

const SATTests = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange, 
  addTestEntry, 
  removeTestEntry 
}) => {
  const satScoreOptions = Array.from({ length: 801 }, (_, i) => 200 + i * 10).filter(s => s <= 1600);
  const sectionScoreOptions = Array.from({ length: 401 }, (_, i) => 200 + i * 10).filter(s => s <= 800);
  
  const satTemplate = {
    totalScore: '',
    testDate: '',
    readingWritingScore: '',
    mathScore: '',
    essayReading: '',
    essayAnalysis: '',
    essayWriting: '',
    reportEssay: false,
    futureTestsCount: 0,
    futureTestDates: []
  };

  return (
    <div className="testing-section">
      <h3>SAT Tests</h3>
      <p className="section-subtitle">In progress</p>

      <div className="form-question">
        <label>Number of past SAT scores you wish to report*</label>
        <div className="radio-group vertical">
          {[0, 1, 2, 3, 4, 5].map(num => (
            <label key={num} className="radio-label">
              <input
                type="radio"
                name="satTestsCount"
                value={num}
                checked={formData.satTestsCount === num}
                onChange={() => {
                  handleInputChange('satTestsCount', num);
                  const tests = Array.from({ length: num }, () => ({ ...satTemplate }));
                  handleInputChange('satTests', tests);
                }}
              />
              <span>{num}</span>
            </label>
          ))}
        </div>
        <button className="clear-answer-btn">Clear answer</button>
      </div>

      {formData.satTestsCount > 0 && formData.satTests?.map((test, index) => (
        <div key={index} className="test-entry-form">
          <h4>SAT Test {index + 1}</h4>

          <div className="form-question">
            <label>Highest total SAT score*</label>
            <select 
              className="form-select"
              value={test.totalScore}
              onChange={(e) => handleArrayChange('satTests', index, 'totalScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {satScoreOptions.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Test date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.testDate}
              onChange={(e) => handleArrayChange('satTests', index, 'testDate', e.target.value)}
            />
            <small>Date uses "month year" format (e.g. August 2002)</small>
          </div>

          <div className="form-question">
            <label>Highest Evidence-Based Reading and Writing score*</label>
            <select 
              className="form-select"
              value={test.readingWritingScore}
              onChange={(e) => handleArrayChange('satTests', index, 'readingWritingScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {sectionScoreOptions.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Highest Math score*</label>
            <select 
              className="form-select"
              value={test.mathScore}
              onChange={(e) => handleArrayChange('satTests', index, 'mathScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {sectionScoreOptions.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          <div className="form-question">
            <label>Would you like to report an SAT Essay score?*</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.reportEssay === true}
                  onChange={() => handleArrayChange('satTests', index, 'reportEssay', true)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.reportEssay === false}
                  onChange={() => handleArrayChange('satTests', index, 'reportEssay', false)}
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {test.reportEssay && (
            <>
              <div className="form-question">
                <label>Essay Reading score*</label>
                <select 
                  className="form-select"
                  value={test.essayReading}
                  onChange={(e) => handleArrayChange('satTests', index, 'essayReading', e.target.value)}
                >
                  <option value="">- Choose an option -</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              <div className="form-question">
                <label>Essay Analysis score*</label>
                <select 
                  className="form-select"
                  value={test.essayAnalysis}
                  onChange={(e) => handleArrayChange('satTests', index, 'essayAnalysis', e.target.value)}
                >
                  <option value="">- Choose an option -</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              <div className="form-question">
                <label>Essay Writing score*</label>
                <select 
                  className="form-select"
                  value={test.essayWriting}
                  onChange={(e) => handleArrayChange('satTests', index, 'essayWriting', e.target.value)}
                >
                  <option value="">- Choose an option -</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="form-question">
            <label>Number of future SAT sittings you expect*</label>
            <div className="radio-group vertical">
              {[0, 1, 2, 3].map(num => (
                <label key={num} className="radio-label">
                  <input
                    type="radio"
                    checked={test.futureTestsCount === num}
                    onChange={() => handleArrayChange('satTests', index, 'futureTestsCount', num)}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SATTests;
