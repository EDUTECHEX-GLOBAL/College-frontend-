// components/testing-sections/TOEFLTests.js
import React from 'react';

const TOEFLTests = ({ 
  formData, 
  handleInputChange, 
  handleArrayChange 
}) => {
  const toeflTemplate = {
    readingScore: '',
    readingDate: '',
    speakingScore: '',
    speakingDate: '',
    listeningScore: '',
    listeningDate: '',
    writingScore: '',
    writingDate: '',
    totalScore: '',
    totalScoreDate: '',
    futureTestsCount: 0
  };

  // Score ranges for TOEFL iBT
  const sectionScores = Array.from({ length: 31 }, (_, i) => i); // 0-30
  const totalScores = Array.from({ length: 121 }, (_, i) => i); // 0-120

  return (
    <div className="testing-section">
      <h3>TOEFL iBT</h3>
      <p className="section-subtitle">In progress</p>

      {/* Number of times already taken */}
      <div className="form-question">
        <label>Number of times you have already taken the TOEFL iBT*</label>
        <select 
          className="form-select"
          value={formData.toeflTestsCount || 0}
          onChange={(e) => {
            const count = parseInt(e.target.value);
            handleInputChange('toeflTestsCount', count);
            const tests = Array.from({ length: count }, () => ({ ...toeflTemplate }));
            handleInputChange('toeflTests', tests);
          }}
        >
          <option value="">- Choose an option -</option>
          {[1, 2, 3, 4, 5, 6].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
        <button className="clear-answer-btn" onClick={() => {
          handleInputChange('toeflTestsCount', 0);
          handleInputChange('toeflTests', []);
        }}>
          Clear answer
        </button>
      </div>

      {/* Test Entry Forms */}
      {formData.toeflTestsCount > 0 && formData.toeflTests?.map((test, index) => (
        <div key={index} className="test-entry-form">
          <h4>TOEFL iBT Test {index + 1}</h4>

          {/* Highest Reading Score */}
          <div className="form-question">
            <label>Highest reading score*</label>
            <select 
              className="form-select"
              value={test.readingScore}
              onChange={(e) => handleArrayChange('toeflTests', index, 'readingScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {sectionScores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          {/* Reading Score Date */}
          <div className="form-question">
            <label>Reading score date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.readingDate}
              onChange={(e) => handleArrayChange('toeflTests', index, 'readingDate', e.target.value)}
              placeholder="month day, year"
            />
            <small>Date uses "month day, year" format (e.g. August 1, 2002)</small>
          </div>

          {/* Highest Speaking Score */}
          <div className="form-question">
            <label>Highest speaking score*</label>
            <select 
              className="form-select"
              value={test.speakingScore}
              onChange={(e) => handleArrayChange('toeflTests', index, 'speakingScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {sectionScores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          {/* Speaking Score Date */}
          <div className="form-question">
            <label>Speaking score date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.speakingDate}
              onChange={(e) => handleArrayChange('toeflTests', index, 'speakingDate', e.target.value)}
              placeholder="month day, year"
            />
            <small>Date uses "month day, year" format (e.g. August 1, 2002)</small>
          </div>

          {/* Highest Listening Score */}
          <div className="form-question">
            <label>Highest listening score*</label>
            <select 
              className="form-select"
              value={test.listeningScore}
              onChange={(e) => handleArrayChange('toeflTests', index, 'listeningScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {sectionScores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          {/* Listening Score Date */}
          <div className="form-question">
            <label>Listening score date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.listeningDate}
              onChange={(e) => handleArrayChange('toeflTests', index, 'listeningDate', e.target.value)}
              placeholder="month day, year"
            />
            <small>Date uses "month day, year" format (e.g. August 1, 2002)</small>
          </div>

          {/* Highest Writing Score */}
          <div className="form-question">
            <label>Highest writing score*</label>
            <select 
              className="form-select"
              value={test.writingScore}
              onChange={(e) => handleArrayChange('toeflTests', index, 'writingScore', e.target.value)}
            >
              <option value="">- Choose an option -</option>
              {sectionScores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          </div>

          {/* Writing Score Date */}
          <div className="form-question">
            <label>Writing score date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.writingDate}
              onChange={(e) => handleArrayChange('toeflTests', index, 'writingDate', e.target.value)}
              placeholder="month day, year"
            />
            <small>Date uses "month day, year" format (e.g. August 1, 2002)</small>
          </div>

          {/* Highest TOEFL iBT Total Score */}
          <div className="form-question">
            <label>Highest TOEFL iBT total score*</label>
            <input 
              type="number"
              className="form-input"
              min="0"
              max="120"
              value={test.totalScore}
              onChange={(e) => handleArrayChange('toeflTests', index, 'totalScore', e.target.value)}
              placeholder="Enter total score (0-120)"
            />
          </div>

          {/* TOEFL iBT Total Score Date */}
          <div className="form-question">
            <label>TOEFL iBT total score date*</label>
            <input 
              type="month"
              className="form-input"
              value={test.totalScoreDate}
              onChange={(e) => handleArrayChange('toeflTests', index, 'totalScoreDate', e.target.value)}
              placeholder="month day, year"
            />
            <small>Date uses "month day, year" format (e.g. August 1, 2002)</small>
          </div>

          {/* Number of Future Sittings */}
          <div className="form-question">
            <label>Number of future TOEFL iBT sittings you expect*</label>
            <div className="radio-group vertical">
              {[0, 1, 2, 3].map(num => (
                <label key={num} className="radio-label">
                  <input
                    type="radio"
                    name={`futureTestsCount-${index}`}
                    checked={test.futureTestsCount === num}
                    onChange={() => handleArrayChange('toeflTests', index, 'futureTestsCount', num)}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>
            <button className="clear-answer-btn" onClick={() => {
              handleArrayChange('toeflTests', index, 'futureTestsCount', 0);
            }}>
              Clear answer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TOEFLTests;
