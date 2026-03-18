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

  useEffect(() => {
    const pastTests = parseInt(formData.toeflPastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.toeflPastTests]);

  // Score options 0-30
  const scoreOptions = Array.from({ length: 31 }, (_, i) => i);

  const handleClearPastTests = () => {
    clearRelatedFields('toeflPastTests', [
      'toeflHighestReadingScore', 'toeflReadingScoreDate',
      'toeflHighestSpeakingScore', 'toeflSpeakingScoreDate',
      'toeflHighestListeningScore', 'toeflListeningScoreDate',
      'toeflHighestWritingScore', 'toeflWritingScoreDate',
      'toeflHighestTotalScore', 'toeflTotalScoreDate'
    ]);
  };

  const handleClearFutureSittings = () => {
    clearAnswer('toeflFutureSittings');
  };

  // Reusable score row
  const ScoreRow = ({ scoreLabel, scoreName, dateName }) => (
    <div className="form-row">
      <div className="form-field">
        <p className="question-text">{scoreLabel}*</p>
        <select
          name={scoreName}
          value={formData[scoreName] || ''}
          onChange={handleInputChange}
          className="score-dropdown"
        >
          <option value="">Choose</option>
          {scoreOptions.map(score => (
            <option key={score} value={score}>{score}</option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <p className="question-text">{scoreLabel.replace('Highest ', '').replace(' score', '')} score date*</p>
        <input
          type="date"
          name={dateName}
          value={formData[dateName] || ''}
          onChange={handleInputChange}
          className="date-input"
        />
        <div className="form-helper">
          Format: month day, year (e.g. August 1, 2002)
        </div>
      </div>
    </div>
  );

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

        {/* Score Form - only if past tests > 0 */}
        {showScoreForm && (
          <div className="detailed-fields">
            <h3>TOEFL iBT Scores</h3>

            <ScoreRow
              scoreLabel="Highest reading score"
              scoreName="toeflHighestReadingScore"
              dateName="toeflReadingScoreDate"
            />
            <ScoreRow
              scoreLabel="Highest speaking score"
              scoreName="toeflHighestSpeakingScore"
              dateName="toeflSpeakingScoreDate"
            />
            <ScoreRow
              scoreLabel="Highest listening score"
              scoreName="toeflHighestListeningScore"
              dateName="toeflListeningScoreDate"
            />
            <ScoreRow
              scoreLabel="Highest writing score"
              scoreName="toeflHighestWritingScore"
              dateName="toeflWritingScoreDate"
            />

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
                  placeholder="0–120"
                  inputMode="numeric"
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
                  Format: month day, year (e.g. August 1, 2002)
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