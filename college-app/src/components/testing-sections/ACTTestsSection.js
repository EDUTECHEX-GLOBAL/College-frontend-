// src/components/testing-sections/ACTTestsSection.js
import React, { useState, useEffect } from 'react';
import './ACTTestsSection.css';

const ACTTestsSection = ({ 
  formData, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [showSimpleForm, setShowSimpleForm] = useState(true);

  // Determine if we should show simple or detailed form
  useEffect(() => {
    const pastScores = parseInt(formData.pastACTScores || '0');
    setShowSimpleForm(pastScores === 0);
  }, [formData.pastACTScores]);

  // Score options for dropdowns
  const compositeScores = Array.from({ length: 37 }, (_, i) => i);
  const subjectScores = Array.from({ length: 37 }, (_, i) => i);

  // Handle clearing past ACT scores and related fields
  const handleClearPastScores = () => {
    clearRelatedFields('pastACTScores', [
      'highestCompositeScore', 'highestCompositeDate',
      'highestMathScore', 'highestMathDate',
      'highestEnglishScore', 'highestEnglishDate',
      'highestReadingScore', 'highestReadingDate',
      'reportScienceScore', 'highestScienceScore', 'highestScienceDate',
      'reportWritingScore', 'highestWritingScore', 'highestWritingDate'
    ]);
  };

  // Handle clearing future ACT sittings and related fields
  const handleClearFutureSittings = () => {
    clearRelatedFields('futureACTSittings', [
      'futureTestDate1', 'futureTestDate2', 'futureTestDate3'
    ]);
  };

  return (
    <div className="act-tests-section">
      <h2>ACT Tests</h2>
      <div className="section-status">
        {formData.pastACTScores && formData.futureACTSittings ? 'Complete' : 'In Progress'}
      </div>
      
      <div className="form-content">
        {/* Number of Past ACT Scores */}
        <div className="form-group">
          <p className="question-text">
            Number of past ACT scores you wish to report*
          </p>
          <div className="radio-group-vertical">
            {[0, 1, 2, 3, 4, 5].map(num => (
              <label key={num} className="radio-option">
                <input
                  type="radio"
                  name="pastACTScores"
                  value={num.toString()}
                  checked={formData.pastACTScores === num.toString()}
                  onChange={handleInputChange}
                />
                <span className="radio-label">{num}</span>
              </label>
            ))}
          </div>
          <button 
            type="button" 
            className="clear-answer-button"
            onClick={handleClearPastScores}
          >
            Clear answer
          </button>
        </div>

        {/* Conditional Fields based on past scores selection */}
        {!showSimpleForm && (
          <div className="detailed-fields">
            {/* Composite Score and Date */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest composite score*</p>
                <select 
                  name="highestCompositeScore"
                  value={formData.highestCompositeScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {compositeScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <p className="question-text">Highest composite date*</p>
                <input
                  type="text"
                  name="highestCompositeDate"
                  value={formData.highestCompositeDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
              </div>
            </div>

            {/* Math Score and Date */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest math score*</p>
                <select 
                  name="highestMathScore"
                  value={formData.highestMathScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {subjectScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <p className="question-text">Highest math date*</p>
                <input
                  type="text"
                  name="highestMathDate"
                  value={formData.highestMathDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
              </div>
            </div>

            {/* English Score and Date */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest English score*</p>
                <select 
                  name="highestEnglishScore"
                  value={formData.highestEnglishScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {subjectScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <p className="question-text">Highest English date*</p>
                <input
                  type="text"
                  name="highestEnglishDate"
                  value={formData.highestEnglishDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
              </div>
            </div>

            {/* Reading Score and Date */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest reading score*</p>
                <select 
                  name="highestReadingScore"
                  value={formData.highestReadingScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {subjectScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <p className="question-text">Highest reading date*</p>
                <input
                  type="text"
                  name="highestReadingDate"
                  value={formData.highestReadingDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
              </div>
            </div>

            {/* Science Score Reporting */}
            <div className="form-group">
              <p className="question-text">Would you like to report an ACT science score?*</p>
              <div className="radio-group-horizontal">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="reportScienceScore"
                    value="yes"
                    checked={formData.reportScienceScore === 'yes'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-label">Yes</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="reportScienceScore"
                    value="no"
                    checked={formData.reportScienceScore === 'no'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-label">No</span>
                </label>
              </div>
              <button 
                type="button" 
                className="clear-answer-button"
                onClick={() => clearAnswer('reportScienceScore')}
              >
                Clear answer
              </button>
            </div>

            {/* Science Score (conditional) */}
            {formData.reportScienceScore === 'yes' && (
              <div className="field-group">
                <div className="form-group">
                  <p className="question-text">Highest science score*</p>
                  <select 
                    name="highestScienceScore"
                    value={formData.highestScienceScore || ''}
                    onChange={handleInputChange}
                    className="score-dropdown"
                  >
                    <option value="">Choose an option</option>
                    {subjectScores.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <p className="question-text">Highest science date*</p>
                  <input
                    type="text"
                    name="highestScienceDate"
                    value={formData.highestScienceDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="date-input"
                  />
                </div>
              </div>
            )}

            {/* Writing Score Reporting */}
            <div className="form-group">
              <p className="question-text">Would you like to report an ACT writing score?*</p>
              <div className="radio-group-horizontal">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="reportWritingScore"
                    value="yes"
                    checked={formData.reportWritingScore === 'yes'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-label">Yes</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="reportWritingScore"
                    value="no"
                    checked={formData.reportWritingScore === 'no'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-label">No</span>
                </label>
              </div>
              <button 
                type="button" 
                className="clear-answer-button"
                onClick={() => clearAnswer('reportWritingScore')}
              >
                Clear answer
              </button>
            </div>

            {/* Writing Score (conditional) */}
            {formData.reportWritingScore === 'yes' && (
              <div className="field-group">
                <div className="form-group">
                  <p className="question-text">Highest writing score*</p>
                  <select 
                    name="highestWritingScore"
                    value={formData.highestWritingScore || ''}
                    onChange={handleInputChange}
                    className="score-dropdown"
                  >
                    <option value="">Choose an option</option>
                    {subjectScores.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <p className="question-text">Highest writing date*</p>
                  <input
                    type="text"
                    name="highestWritingDate"
                    value={formData.highestWritingDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="date-input"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Number of Future ACT Sittings */}
        <div className="form-group">
          <p className="question-text">
            Number of future ACT sittings you expect*
          </p>
          <div className="radio-group-vertical">
            {[0, 1, 2, 3].map(num => (
              <label key={num} className="radio-option">
                <input
                  type="radio"
                  name="futureACTSittings"
                  value={num.toString()}
                  checked={formData.futureACTSittings === num.toString()}
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

        {/* Future Test Dates - Conditionally show based on number of future sittings */}
        {parseInt(formData.futureACTSittings || '0') > 0 && (
          <div className="future-dates">
            <h3>Future Testing Dates</h3>
            {Array.from({ length: parseInt(formData.futureACTSittings || '0') }, (_, i) => (
              <div key={i} className="form-group">
                <p className="question-text">Future testing date {i + 1}*</p>
                <input
                  type="text"
                  name={`futureTestDate${i + 1}`}
                  value={formData[`futureTestDate${i + 1}`] || ''}
                  onChange={handleInputChange}
                  placeholder="Month year"
                  className="date-input"
                />
              </div>
            ))}
          </div>
        )}

        {/* Helper text */}
        <div className="form-helper">
          * Required fields. Remember to send official score reports to colleges that require them.
        </div>
      </div>
    </div>
  );
};

export default ACTTestsSection;