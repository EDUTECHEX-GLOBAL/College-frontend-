// src/components/testing-sections/SATTestsSection.js
import React from 'react';
import './SATTestsSection.css';

const SATTestsSection = ({ formData, handleInputChange, clearAnswer }) => {
  const pastScoreOptions = ['0', '1', '2', '3', '4', '5'];
  const futureSittingOptions = ['0', '1', '2', '3'];

  return (
    <div className="sat-tests-section">
      <h2>SAT Tests</h2>
      <div className="section-status">
        {formData.testingCompletion.satTests ? 'Complete' : 'In Progress'}
      </div>
      
      <div className="form-content">
        {/* Past SAT Scores */}
        <div className="form-group">
          <label className="question-label">
            Number of past SAT scores you wish to report*
          </label>
          <div className="select-group">
            <select
              name="pastSATScores"
              value={formData.pastSATScores}
              onChange={handleInputChange}
              className="sat-select"
            >
              <option value="">Choose an option</option>
              {pastScoreOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <button 
            type="button" 
            className="clear-answer-button"
            onClick={() => clearAnswer('pastSATScores')}
          >
            Clear answer
          </button>
        </div>

        {/* Future SAT Sittings */}
        <div className="form-group">
          <label className="question-label">
            Number of future SAT sittings you expect*
          </label>
          <div className="radio-options-grid">
            {futureSittingOptions.map(option => (
              <label key={option} className="radio-option">
                <input
                  type="radio"
                  name="futureSATSittings"
                  value={option}
                  checked={formData.futureSATSittings === option}
                  onChange={handleInputChange}
                />
                <span className="radio-label">{option}</span>
              </label>
            ))}
          </div>
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
  );
};

export default SATTestsSection;