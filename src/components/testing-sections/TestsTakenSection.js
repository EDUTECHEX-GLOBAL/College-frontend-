// src/components/testing-sections/TOEFLiBTSection.js
import React, { useState, useEffect } from 'react';
import './TOEFLiBTSection.css';

const TOEFLiBTSection = ({
  formData = {},
  handleInputChange,
  clearAnswer,
  clearRelatedFields
}) => {
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Determine if we should show score form based on past tests
  useEffect(() => {
    const pastTests = parseInt(formData.toeflPastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.toeflPastTests]);

  // Validate form completion
  useEffect(() => {
    const hasPastTests = formData.toeflPastTests !== undefined && 
                         formData.toeflPastTests !== '' && 
                         formData.toeflPastTests !== null;
    const hasFutureSittings = formData.toeflFutureSittings !== undefined && 
                              formData.toeflFutureSittings !== '' && 
                              formData.toeflFutureSittings !== null;
    
    let scoresValid = true;
    
    if (showScoreForm && parseInt(formData.toeflPastTests || '0') > 0) {
      // Check if all required score fields are filled
      const requiredFields = [
        'toeflHighestReadingScore', 'toeflReadingScoreDate',
        'toeflHighestSpeakingScore', 'toeflSpeakingScoreDate',
        'toeflHighestListeningScore', 'toeflListeningScoreDate',
        'toeflHighestWritingScore', 'toeflWritingScoreDate',
        'toeflHighestTotalScore', 'toeflTotalScoreDate'
      ];
      
      scoresValid = requiredFields.every(field => 
        formData[field] && formData[field].toString().trim() !== ''
      );
    }
    
    setIsFormValid(hasPastTests && hasFutureSittings && (showScoreForm ? scoresValid : true));
  }, [formData, showScoreForm]);

  // Score options 0-30
  const scoreOptions = Array.from({ length: 31 }, (_, i) => i);

  const handleClearPastTests = () => {
    if (clearRelatedFields) {
      clearRelatedFields('toeflPastTests', [
        'toeflHighestReadingScore', 'toeflReadingScoreDate',
        'toeflHighestSpeakingScore', 'toeflSpeakingScoreDate',
        'toeflHighestListeningScore', 'toeflListeningScoreDate',
        'toeflHighestWritingScore', 'toeflWritingScoreDate',
        'toeflHighestTotalScore', 'toeflTotalScoreDate'
      ]);
    } else if (clearAnswer) {
      clearAnswer('toeflPastTests');
    }
  };

  const handleClearFutureSittings = () => {
    if (clearAnswer) {
      clearAnswer('toeflFutureSittings');
    }
  };

  const handleClearScoreField = (fieldName) => {
    if (clearAnswer) {
      clearAnswer(fieldName);
    }
  };

  const handleClearAllScores = () => {
    if (clearRelatedFields) {
      clearRelatedFields('toeflPastTests', [
        'toeflHighestReadingScore', 'toeflReadingScoreDate',
        'toeflHighestSpeakingScore', 'toeflSpeakingScoreDate',
        'toeflHighestListeningScore', 'toeflListeningScoreDate',
        'toeflHighestWritingScore', 'toeflWritingScoreDate',
        'toeflHighestTotalScore', 'toeflTotalScoreDate'
      ]);
    }
  };

  // Check if any score exists
  const hasAnyScore = () => {
    const scoreFields = [
      'toeflHighestReadingScore', 'toeflHighestSpeakingScore',
      'toeflHighestListeningScore', 'toeflHighestWritingScore',
      'toeflHighestTotalScore'
    ];
    return scoreFields.some(field => formData[field] && formData[field].toString().trim() !== '');
  };

  // Reusable score row component
  const ScoreRow = ({ scoreLabel, scoreName, dateName }) => {
    const scoreValue = formData[scoreName] || '';
    const dateValue = formData[dateName] || '';

    return (
      <div className="form-row">
        <div className="form-field">
          <p className="question-text required">{scoreLabel}</p>
          <div className="select-container">
            <select
              name={scoreName}
              value={scoreValue}
              onChange={handleInputChange}
              className="score-dropdown"
            >
              <option value="">Choose an option</option>
              {scoreOptions.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
            {scoreValue && (
              <button 
                type="button" 
                className="clear-field-btn"
                onClick={() => handleClearScoreField(scoreName)}
                aria-label="Clear score"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div className="form-field">
          <p className="question-text required">
            {scoreLabel.replace('Highest ', '').replace(' score', '')} score date
          </p>
          <div className="date-input-container">
            <input
              type="date"
              name={dateName}
              value={dateValue}
              onChange={handleInputChange}
              className="date-input"
            />
            {dateValue && (
              <button 
                type="button" 
                className="clear-field-btn"
                onClick={() => handleClearScoreField(dateName)}
                aria-label="Clear date"
              >
                ×
              </button>
            )}
          </div>
          <div className="form-helper">
            Format: month day, year (e.g. August 1, 2002)
          </div>
        </div>
      </div>
    );
  };

  const hasPastTestsValue = formData.toeflPastTests !== undefined && 
                            formData.toeflPastTests !== '' && 
                            formData.toeflPastTests !== null;
  
  const hasFutureSittingsValue = formData.toeflFutureSittings !== undefined && 
                                 formData.toeflFutureSittings !== '' && 
                                 formData.toeflFutureSittings !== null;

  return (
    <div className="toefl-section">
      <div className="section-header">
        <h2>TOEFL iBT</h2>
        <div className={`section-status ${isFormValid ? 'complete' : 'in-progress'}`}>
          <span className="status-indicator"></span>
          {isFormValid ? 'Complete' : 'In Progress'}
        </div>
      </div>

      <div className="form-content">
        {/* Number of Past TOEFL iBT Tests */}
        <div className="form-group">
          <p className="question-text required">
            Number of times you have already taken the TOEFL iBT
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
                <span className="radio-checkmark"></span>
                <span className="radio-label">{num}</span>
              </label>
            ))}
          </div>
          {hasPastTestsValue && (
            <div className="clear-link-container">
              <button
                type="button"
                className="clear-link"
                onClick={handleClearPastTests}
              >
                Clear answer
              </button>
            </div>
          )}
        </div>

        {/* Number of Future TOEFL iBT Sittings */}
        <div className="form-group">
          <p className="question-text required">
            Number of future TOEFL iBT sittings you expect
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
                <span className="radio-checkmark"></span>
                <span className="radio-label">{num}</span>
              </label>
            ))}
          </div>
          {hasFutureSittingsValue && (
            <div className="clear-link-container">
              <button
                type="button"
                className="clear-link"
                onClick={handleClearFutureSittings}
              >
                Clear answer
              </button>
            </div>
          )}
        </div>

        {/* Score Form - only if past tests > 0 */}
        {showScoreForm && (
          <div className="detailed-fields">
            <div className="detailed-header">
              <h3>TOEFL iBT Scores</h3>
              {hasAnyScore() && (
                <button 
                  type="button" 
                  className="clear-all-link"
                  onClick={handleClearAllScores}
                >
                  Clear all scores
                </button>
              )}
            </div>

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
            <div className="form-row total-score-row">
              <div className="form-field">
                <p className="question-text required">Highest TOEFL iBT total score</p>
                <div className="total-score-container">
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
                  {formData.toeflHighestTotalScore && (
                    <button 
                      type="button" 
                      className="clear-field-btn"
                      onClick={() => handleClearScoreField('toeflHighestTotalScore')}
                      aria-label="Clear total score"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className="form-field">
                <p className="question-text required">TOEFL iBT total score date</p>
                <div className="date-input-container">
                  <input
                    type="date"
                    name="toeflTotalScoreDate"
                    value={formData.toeflTotalScoreDate || ''}
                    onChange={handleInputChange}
                    className="date-input"
                  />
                  {formData.toeflTotalScoreDate && (
                    <button 
                      type="button" 
                      className="clear-field-btn"
                      onClick={() => handleClearScoreField('toeflTotalScoreDate')}
                      aria-label="Clear date"
                    >
                      ×
                    </button>
                  )}
                </div>
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