// src/components/testing-sections/IELTSSection.js
import React, { useState, useEffect } from 'react';
import './IELTSSection.css';

const IELTSSection = ({ 
  formData, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [showScoreForm, setShowScoreForm] = useState(false);

  // Determine if we should show score form based on past tests
  useEffect(() => {
    const pastTests = parseInt(formData.ieltsPastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.ieltsPastTests]);

  // IELTS Band Scores (0.0 to 9.0 in 0.5 increments)
  const bandScores = [];
  for (let i = 0; i <= 9; i += 0.5) {
    bandScores.push(i.toFixed(1));
  }

  // Handle clearing past IELTS tests and related fields
  const handleClearPastTests = () => {
    clearRelatedFields('ieltsPastTests', [
      'ieltsHighestListeningScore', 'ieltsListeningScoreDate',
      'ieltsHighestReadingScore', 'ieltsReadingScoreDate',
      'ieltsHighestWritingScore', 'ieltsWritingScoreDate',
      'ieltsHighestSpeakingScore', 'ieltsSpeakingScoreDate',
      'ieltsHighestOverallScore', 'ieltsOverallScoreDate'
    ]);
  };

  // Handle clearing future IELTS sittings
  const handleClearFutureSittings = () => {
    clearAnswer('ieltsFutureSittings');
  };

  return (
    <div className="ielts-section">
      <h2>IELTS</h2>
      <div className="section-status">
        In Progress
      </div>
      
      <div className="form-content">
        {/* Number of Past IELTS Tests */}
        <div className="form-group">
          <p className="question-text">
            Number of times you have already taken the IELTS*
          </p>
          <div className="radio-group-vertical">
            {[0, 1, 2, 3, 4, 5].map(num => (
              <label key={num} className="radio-option">
                <input
                  type="radio"
                  name="ieltsPastTests"
                  value={num.toString()}
                  checked={formData.ieltsPastTests === num.toString()}
                  onChange={handleInputChange}
                />
                <span className="radio-label">{num}</span>
              </label>
            ))}
          </div>
          <button 
            type="button" 
            className="clear-answer-button"
            onClick={handleClearPastTests}
          >
            Clear answer
          </button>
        </div>

        {/* Number of Future IELTS Sittings */}
        <div className="form-group">
          <p className="question-text">
            Number of future IELTS sittings you expect*
          </p>
          <div className="radio-group-vertical">
            {[0, 1, 2, 3].map(num => (
              <label key={num} className="radio-option">
                <input
                  type="radio"
                  name="ieltsFutureSittings"
                  value={num.toString()}
                  checked={formData.ieltsFutureSittings === num.toString()}
                  onChange={handleInputChange}
                />
                <span className="radio-label">{num}</span>
              </label>
            ))}
          </div>
          <button 
            type="button" 
            className="clear-answer-button"
            onClick={handleClearFutureSittings}
          >
            Clear answer
          </button>
        </div>

        {/* Score Form - Only show if past tests > 0 */}
        {showScoreForm && (
          <div className="detailed-fields">
            <h3>IELTS Scores</h3>
            
            {/* Listening Score */}
            <div className="form-row">
              <div className="form-field">
                <p className="question-text">Highest listening score*</p>
                <select 
                  name="ieltsHighestListeningScore"
                  value={formData.ieltsHighestListeningScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {bandScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <p className="question-text">Listening score date*</p>
                <input
                  type="text"
                  name="ieltsListeningScoreDate"
                  value={formData.ieltsListeningScoreDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Reading Score */}
            <div className="form-row">
              <div className="form-field">
                <p className="question-text">Highest reading score*</p>
                <select 
                  name="ieltsHighestReadingScore"
                  value={formData.ieltsHighestReadingScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {bandScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <p className="question-text">Reading score date*</p>
                <input
                  type="text"
                  name="ieltsReadingScoreDate"
                  value={formData.ieltsReadingScoreDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Writing Score */}
            <div className="form-row">
              <div className="form-field">
                <p className="question-text">Highest writing score*</p>
                <select 
                  name="ieltsHighestWritingScore"
                  value={formData.ieltsHighestWritingScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {bandScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <p className="question-text">Writing score date*</p>
                <input
                  type="text"
                  name="ieltsWritingScoreDate"
                  value={formData.ieltsWritingScoreDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Speaking Score */}
            <div className="form-row">
              <div className="form-field">
                <p className="question-text">Highest speaking score*</p>
                <select 
                  name="ieltsHighestSpeakingScore"
                  value={formData.ieltsHighestSpeakingScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {bandScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <p className="question-text">Speaking score date*</p>
                <input
                  type="text"
                  name="ieltsSpeakingScoreDate"
                  value={formData.ieltsSpeakingScoreDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Overall Band Score */}
            <div className="form-row">
              <div className="form-field">
                <p className="question-text">Highest IELTS overall band score*</p>
                <select 
                  name="ieltsHighestOverallScore"
                  value={formData.ieltsHighestOverallScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {bandScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <p className="question-text">IELTS overall band score date*</p>
                <input
                  type="text"
                  name="ieltsOverallScoreDate"
                  value={formData.ieltsOverallScoreDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IELTSSection;