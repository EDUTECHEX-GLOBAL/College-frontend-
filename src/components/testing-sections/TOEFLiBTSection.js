// src/components/testing-sections/TOEFLiBTSection.js
import React, { useState, useEffect } from 'react';
import './TOEFLiBTSection.css';

const TOEFLiBTSection = ({ 
  formData, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [showScoreForm, setShowScoreForm] = useState(false);

  // Determine if we should show score form based on past tests
  useEffect(() => {
    const pastTests = parseInt(formData.toeflPastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.toeflPastTests]);

  // Score options for dropdowns (0-30)
  const scoreOptions = Array.from({ length: 31 }, (_, i) => i);

  // Handle clearing past tests and related fields
  const handleClearPastTests = () => {
    clearRelatedFields('toeflPastTests', [
      'toeflHighestReadingScore', 'toeflReadingScoreDate',
      'toeflHighestSpeakingScore', 'toeflSpeakingScoreDate',
      'toeflHighestListeningScore', 'toeflListeningScoreDate',
      'toeflHighestWritingScore', 'toeflWritingScoreDate',
      'toeflHighestTotalScore', 'toeflTotalScoreDate'
    ]);
  };

  // Handle clearing future sittings and related fields
  const handleClearFutureSittings = () => {
    clearAnswer('toeflFutureSittings');
  };

  return (
    <div className="toefl-section">
      <h2>TOEFL iBT</h2>
      <div className="section-status">
        {formData.toeflPastTests && formData.toeflFutureSittings ? 'Complete' : 'In Progress'}
      </div>
      
      <div className="form-content">
        {/* Number of Past TOEFL iBT Tests */}
        <div className="form-group">
          <p className="question-text">
            Number of times you have already taken the TOEFL iBT*
          </p>
          <div className="radio-group-vertical">
            {[0, 1, 2, 3, 4, 5].map(num => (
              <label key={num} className="radio-option">
                <input
                  type="radio"
                  name="toeflPastTests"
                  value={num.toString()}
                  checked={formData.toeflPastTests === num.toString()}
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

        {/* Number of Future TOEFL iBT Sittings */}
        <div className="form-group">
          <p className="question-text">
            Number of future TOEFL iBT sittings you expect*
          </p>
          <div className="radio-group-vertical">
            {[0, 1, 2, 3].map(num => (
              <label key={num} className="radio-option">
                <input
                  type="radio"
                  name="toeflFutureSittings"
                  value={num.toString()}
                  checked={formData.toeflFutureSittings === num.toString()}
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
            <h3>TOEFL iBT Scores</h3>
            
            {/* Reading Score */}
            <div className="form-row">
              <div className="form-field">
                <p className="question-text">Highest reading score*</p>
                <select 
                  name="toeflHighestReadingScore"
                  value={formData.toeflHighestReadingScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <p className="question-text">Reading score date*</p>
                <input
                  type="date"
                  name="toeflReadingScoreDate"
                  value={formData.toeflReadingScoreDate || ''}
                  onChange={handleInputChange}
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
                  name="toeflHighestSpeakingScore"
                  value={formData.toeflHighestSpeakingScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <p className="question-text">Speaking score date*</p>
                <input
                  type="date"
                  name="toeflSpeakingScoreDate"
                  value={formData.toeflSpeakingScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Listening Score */}
            <div className="form-row">
              <div className="form-field">
                <p className="question-text">Highest listening score*</p>
                <select 
                  name="toeflHighestListeningScore"
                  value={formData.toeflHighestListeningScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <p className="question-text">Listening score date*</p>
                <input
                  type="date"
                  name="toeflListeningScoreDate"
                  value={formData.toeflListeningScoreDate || ''}
                  onChange={handleInputChange}
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
                  name="toeflHighestWritingScore"
                  value={formData.toeflHighestWritingScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <p className="question-text">Writing score date*</p>
                <input
                  type="date"
                  name="toeflWritingScoreDate"
                  value={formData.toeflWritingScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Total Score */}
            <div className="form-row">
              <div className="form-field">
                <p className="question-text">Highest TOEFL iBT total score*</p>
                <input
                  type="number"
                  name="toeflHighestTotalScore"
                  value={formData.toeflHighestTotalScore || ''}
                  onChange={handleInputChange}
                  className="total-score-input"
                  min="0"
                  max="120"
                  placeholder="0-120"
                />
              </div>
              <div className="form-field">
                <p className="question-text">TOEFL iBT total score date*</p>
                <input
                  type="date"
                  name="toeflTotalScoreDate"
                  value={formData.toeflTotalScoreDate || ''}
                  onChange={handleInputChange}
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

export default TOEFLiBTSection;