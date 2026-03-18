// components/testing-sections/ACTTests.js
import React from 'react';

const ACTTests = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange, 
  addTestEntry, 
  removeTestEntry 
}) => {
  const actScoreOptions = Array.from({ length: 36 }, (_, i) => i + 1);
  
  const actTemplate = {
    compositeScore: '',
    compositeDate: '',
    mathScore: '',
    mathDate: '',
    englishScore: '',
    englishDate: '',
    readingScore: '',
    readingDate: '',
    scienceScore: '',
    scienceDate: '',
    writingScore: '',
    writingDate: '',
    reportWriting: false,
    futureTestsCount: 0,
    futureTestDates: []
  };

  return (
    <div className="testing-section">
      <h3>ACT Tests</h3>
      <p className="section-subtitle">In progress</p>

      <div className="form-question">
        <label>Number of past ACT scores you wish to report*</label>
        <div className="radio-group vertical">
          {[0, 1, 2, 3, 4, 5].map(num => (
            <label key={num} className="radio-label">
              <input
                type="radio"
                name="actTestsCount"
                value={num}
                checked={formData.actTestsCount === num}
                onChange={() => {
                  handleInputChange('actTestsCount', num);
                  // Initialize ACT tests array
                  const tests = Array.from({ length: num }, () => ({ ...actTemplate }));
                  handleInputChange('actTests', tests);
                }}
              />
              <span>{num}</span>
            </label>
          ))}
        </div>
        <button className="clear-answer-btn">Clear answer</button>
      </div>

      {formData.actTestsCount > 0 && formData.actTests.map((test, index) => (
        <div key={index} className="test-entry-form">
          <h4>ACT Test {index + 1}</h4>

          {/* Highest composite score */}
          <div className="form-question">
            <label>Highest composite score*</label>
            <select 
              className="form-select"
              value={test.compositeScore}
              onChange={(e) => handleArrayChange('actTests', index, 'compositeScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {actScoreOptions.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          {/* Highest composite date */}
          <div className="form-question">
            <label>Highest composite date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.compositeDate}
              onChange={(e) => handleArrayChange('actTests', index, 'compositeDate', e.target.value)}
            />
            <small>Date uses "month year" format (e.g. August 2002)</small>
          </div>

          {/* Highest math score */}
          <div className="form-question">
            <label>Highest math score*</label>
            <select 
              className="form-select"
              value={test.mathScore}
              onChange={(e) => handleArrayChange('actTests', index, 'mathScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {actScoreOptions.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          {/* Highest math date */}
          <div className="form-question">
            <label>Highest math date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.mathDate}
              onChange={(e) => handleArrayChange('actTests', index, 'mathDate', e.target.value)}
            />
          </div>

          {/* Highest English score */}
          <div className="form-question">
            <label>Highest English score*</label>
            <select 
              className="form-select"
              value={test.englishScore}
              onChange={(e) => handleArrayChange('actTests', index, 'englishScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {actScoreOptions.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          {/* Highest English date */}
          <div className="form-question">
            <label>Highest English date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.englishDate}
              onChange={(e) => handleArrayChange('actTests', index, 'englishDate', e.target.value)}
            />
          </div>

          {/* Highest reading score */}
          <div className="form-question">
            <label>Highest reading score*</label>
            <select 
              className="form-select"
              value={test.readingScore}
              onChange={(e) => handleArrayChange('actTests', index, 'readingScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {actScoreOptions.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          {/* Highest reading date */}
          <div className="form-question">
            <label>Highest reading date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.readingDate}
              onChange={(e) => handleArrayChange('actTests', index, 'readingDate', e.target.value)}
            />
          </div>

          {/* Would you like to report an ACT science score? */}
          <div className="form-question">
            <label>Would you like to report an ACT science score?*</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.reportScience === true}
                  onChange={() => handleArrayChange('actTests', index, 'reportScience', true)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.reportScience === false}
                  onChange={() => handleArrayChange('actTests', index, 'reportScience', false)}
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {test.reportScience && (
            <>
              <div className="form-question">
                <label>Highest science score*</label>
                <select 
                  className="form-select"
                  value={test.scienceScore}
                  onChange={(e) => handleArrayChange('actTests', index, 'scienceScore', e.target.value)}
                >
                  <option value="">- Choose an option -</option>
                  {actScoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              <div className="form-question">
                <label>Highest science date*</label>
                <input 
                  type="month"
                  className="form-input"
                  value={test.scienceDate}
                  onChange={(e) => handleArrayChange('actTests', index, 'scienceDate', e.target.value)}
                />
              </div>
            </>
          )}

          {/* Would you like to report an ACT writing score? */}
          <div className="form-question">
            <label>Would you like to report an ACT writing score?*</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.reportWriting === true}
                  onChange={() => handleArrayChange('actTests', index, 'reportWriting', true)}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={test.reportWriting === false}
                  onChange={() => handleArrayChange('actTests', index, 'reportWriting', false)}
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {test.reportWriting && (
            <>
              <div className="form-question">
                <label>Highest writing score*</label>
                <select 
                  className="form-select"
                  value={test.writingScore}
                  onChange={(e) => handleArrayChange('actTests', index, 'writingScore', e.target.value)}
                >
                  <option value="">- Choose an option -</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              <div className="form-question">
                <label>Highest writing date*</label>
                <input 
                  type="month"
                  className="form-input"
                  value={test.writingDate}
                  onChange={(e) => handleArrayChange('actTests', index, 'writingDate', e.target.value)}
                />
              </div>
            </>
          )}

          {/* Number of future ACT sittings you expect */}
          <div className="form-question">
            <label>Number of future ACT sittings you expect*</label>
            <div className="radio-group vertical">
              {[0, 1, 2, 3].map(num => (
                <label key={num} className="radio-label">
                  <input
                    type="radio"
                    checked={test.futureTestsCount === num}
                    onChange={() => handleArrayChange('actTests', index, 'futureTestsCount', num)}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>
          </div>

          {test.futureTestsCount > 0 && (
            <div className="form-question">
              <label>Future testing date 1*</label>
              <input 
                type="month"
                className="form-input"
                onChange={(e) => {
                  const dates = test.futureTestDates || [];
                  dates[0] = e.target.value;
                  handleArrayChange('actTests', index, 'futureTestDates', dates);
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ACTTests;
