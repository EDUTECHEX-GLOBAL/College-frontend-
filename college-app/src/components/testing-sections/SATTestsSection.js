// src/components/testing-sections/SATTestsSection.js
import React from 'react';
import './SATTestsSection.css';

const SATTestsSection = ({ formData, handleInputChange, clearAnswer }) => {
  const pastScoreOptions = ['0', '1', '2', '3', '4', '5'];
  const futureSittingOptions = ['0', '1', '2', '3'];

  // Check if section is complete
  const isSectionComplete = formData.pastSATScores && formData.futureSATSittings;

  return (
    <div className="sat-tests-section">
      <div className="section-header">
        <h2>SAT Tests</h2>
        <div className={`section-status ${isSectionComplete ? 'complete' : 'in-progress'}`}>
          <span className="status-indicator"></span>
          {isSectionComplete ? 'Complete' : 'In Progress'}
        </div>
      </div>
      
      <div className="form-content">
        {/* Past SAT Scores */}
        <div className="form-group">
          <p className="question-text">
            Number of past SAT scores you wish to report*
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
          </div>
          <div className="clear-button-container">
            <button 
              type="button" 
              className="clear-answer-button"
              onClick={() => clearAnswer('pastSATScores')}
            >
              Clear answer
            </button>
          </div>
        </div>

        {/* Future SAT Sittings */}
        <div className="form-group">
          <p className="question-text">
            Number of future SAT sittings you expect*
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
          <div className="clear-button-container">
            <button 
              type="button" 
              className="clear-answer-button"
              onClick={() => clearAnswer('futureSATSittings')}
            >
              Clear answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SATTestsSection;