// src/components/testing-sections/SATTestsSection.js
import React, { useState, useEffect } from 'react';
import './SATTestsSection.css';

const SATTestsSection = ({ 
  formData = {}, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [isFormValid, setIsFormValid] = useState(false);

  const pastScoreOptions = ['0', '1', '2', '3', '4', '5'];
  const futureSittingOptions = ['0', '1', '2', '3'];

  // Validate form completion
  useEffect(() => {
    const hasPastScores = formData.pastSATScores !== undefined && 
                          formData.pastSATScores !== '' && 
                          formData.pastSATScores !== null;
    const hasFutureSittings = formData.futureSATSittings !== undefined && 
                              formData.futureSATSittings !== '' && 
                              formData.futureSATSittings !== null;
    
    setIsFormValid(hasPastScores && hasFutureSittings);
  }, [formData.pastSATScores, formData.futureSATSittings]);

  // Handle clearing past SAT scores
  const handleClearPastScores = () => {
    if (clearRelatedFields) {
      clearRelatedFields('pastSATScores', ['satScoreDetails', 'satTestDates']);
    } else if (clearAnswer) {
      clearAnswer('pastSATScores');
    }
  };

  // Handle clearing future SAT sittings
  const handleClearFutureSittings = () => {
    if (clearAnswer) {
      clearAnswer('futureSATSittings');
    }
  };

  // Check if any value is selected
  const hasPastScoresValue = formData.pastSATScores !== undefined && 
                             formData.pastSATScores !== '' && 
                             formData.pastSATScores !== null;
  
  const hasFutureSittingsValue = formData.futureSATSittings !== undefined && 
                                 formData.futureSATSittings !== '' && 
                                 formData.futureSATSittings !== null;

  return (
    <div className="sat-tests-section">
      <div className="section-header">
        <h2>SAT Tests</h2>
        <div className={`section-status ${isFormValid ? 'complete' : 'in-progress'}`}>
          <span className="status-indicator"></span>
          {isFormValid ? 'Complete' : 'In Progress'}
        </div>
      </div>

      <div className="form-content">
        {/* Past SAT Scores */}
        <div className="form-group">
          <p className="question-text required">
            Number of past SAT scores you wish to report
          </p>
          <div className="select-group">
            <select
              name="pastSATScores"
              value={formData.pastSATScores || ''}
              onChange={handleInputChange}
              className="sat-select"
            >
              <option value="">Choose an option</option>
              {pastScoreOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {hasPastScoresValue && (
              <button
                type="button"
                className="clear-field-btn select-clear"
                onClick={handleClearPastScores}
                aria-label="Clear selection"
              >
                ×
              </button>
            )}
          </div>
          {hasPastScoresValue && (
            <div className="clear-link-container">
              <button
                type="button"
                className="clear-link"
                onClick={handleClearPastScores}
              >
                Clear answer
              </button>
            </div>
          )}
        </div>

        {/* Future SAT Sittings */}
        <div className="form-group">
          <p className="question-text required">
            Number of future SAT sittings you expect
          </p>
          <div className="radio-group-vertical">
            {futureSittingOptions.map(option => (
              <label key={option} className="radio-option">
                <input
                  type="radio"
                  name="futureSATSittings"
                  value={option}
                  checked={formData.futureSATSittings === option}
                  onChange={handleInputChange}
                />
                <span className="radio-checkmark"></span>
                <span className="radio-label">{option}</span>
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
      </div>
    </div>
  );
};

export default SATTestsSection;