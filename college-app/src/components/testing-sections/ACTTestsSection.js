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
    <div className="act-container">
      <div className="act-card">
        <div className="act-card-header">
          <h2 className="act-card-title">ACT Tests</h2>
          <div className="act-status-badge">
            {formData.pastACTScores && formData.futureACTSittings ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="act-form-content">
          {/* Number of Past ACT Scores */}
          <div className="act-form-group">
            <label className="act-question-label required">
              Number of past ACT scores you wish to report*
            </label>
            <div className="act-radio-group-vertical">
              {[0, 1, 2, 3, 4, 5].map(num => (
                <label key={num} className="act-radio-option">
                  <input
                    type="radio"
                    name="pastACTScores"
                    value={num.toString()}
                    checked={formData.pastACTScores === num.toString()}
                    onChange={handleInputChange}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>
            <button 
              type="button" 
              className="act-clear-link"
              onClick={handleClearPastScores}
              disabled={!formData.pastACTScores}
            >
              Clear answer
            </button>
          </div>

          {/* Conditional Fields based on past scores selection */}
          {!showSimpleForm && (
            <div className="act-detailed-fields">
              {/* Composite Score and Date */}
              <div className="act-field-group">
                <div className="act-form-group">
                  <label className="act-question-label required">Highest composite score*</label>
                  <select 
                    name="highestCompositeScore"
                    value={formData.highestCompositeScore || ''}
                    onChange={handleInputChange}
                    className="act-select"
                  >
                    <option value="">Choose an option</option>
                    {compositeScores.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="act-form-group">
                  <label className="act-question-label required">Highest composite date*</label>
                  <input
                    type="text"
                    name="highestCompositeDate"
                    value={formData.highestCompositeDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="act-date-input"
                  />
                </div>
              </div>

              {/* Math Score and Date */}
              <div className="act-field-group">
                <div className="act-form-group">
                  <label className="act-question-label required">Highest math score*</label>
                  <select 
                    name="highestMathScore"
                    value={formData.highestMathScore || ''}
                    onChange={handleInputChange}
                    className="act-select"
                  >
                    <option value="">Choose an option</option>
                    {subjectScores.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="act-form-group">
                  <label className="act-question-label required">Highest math date*</label>
                  <input
                    type="text"
                    name="highestMathDate"
                    value={formData.highestMathDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="act-date-input"
                  />
                </div>
              </div>

              {/* English Score and Date */}
              <div className="act-field-group">
                <div className="act-form-group">
                  <label className="act-question-label required">Highest English score*</label>
                  <select 
                    name="highestEnglishScore"
                    value={formData.highestEnglishScore || ''}
                    onChange={handleInputChange}
                    className="act-select"
                  >
                    <option value="">Choose an option</option>
                    {subjectScores.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="act-form-group">
                  <label className="act-question-label required">Highest English date*</label>
                  <input
                    type="text"
                    name="highestEnglishDate"
                    value={formData.highestEnglishDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="act-date-input"
                  />
                </div>
              </div>

              {/* Reading Score and Date */}
              <div className="act-field-group">
                <div className="act-form-group">
                  <label className="act-question-label required">Highest reading score*</label>
                  <select 
                    name="highestReadingScore"
                    value={formData.highestReadingScore || ''}
                    onChange={handleInputChange}
                    className="act-select"
                  >
                    <option value="">Choose an option</option>
                    {subjectScores.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="act-form-group">
                  <label className="act-question-label required">Highest reading date*</label>
                  <input
                    type="text"
                    name="highestReadingDate"
                    value={formData.highestReadingDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="act-date-input"
                  />
                </div>
              </div>

              {/* Science Score Reporting */}
              <div className="act-form-group">
                <label className="act-question-label required">
                  Would you like to report an ACT science score?*
                </label>
                <div className="act-radio-group-horizontal">
                  <label className="act-radio-option">
                    <input
                      type="radio"
                      name="reportScienceScore"
                      value="yes"
                      checked={formData.reportScienceScore === 'yes'}
                      onChange={handleInputChange}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="act-radio-option">
                    <input
                      type="radio"
                      name="reportScienceScore"
                      value="no"
                      checked={formData.reportScienceScore === 'no'}
                      onChange={handleInputChange}
                    />
                    <span>No</span>
                  </label>
                </div>
                <button 
                  type="button" 
                  className="act-clear-link"
                  onClick={() => clearAnswer('reportScienceScore')}
                  disabled={!formData.reportScienceScore}
                >
                  Clear answer
                </button>
              </div>

              {/* Science Score (conditional) */}
              {formData.reportScienceScore === 'yes' && (
                <div className="act-field-group">
                  <div className="act-form-group">
                    <label className="act-question-label required">Highest science score*</label>
                    <select 
                      name="highestScienceScore"
                      value={formData.highestScienceScore || ''}
                      onChange={handleInputChange}
                      className="act-select"
                    >
                      <option value="">Choose an option</option>
                      {subjectScores.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>
                  <div className="act-form-group">
                    <label className="act-question-label required">Highest science date*</label>
                    <input
                      type="text"
                      name="highestScienceDate"
                      value={formData.highestScienceDate || ''}
                      onChange={handleInputChange}
                      placeholder="Month day, year"
                      className="act-date-input"
                    />
                  </div>
                </div>
              )}

              {/* Writing Score Reporting */}
              <div className="act-form-group">
                <label className="act-question-label required">
                  Would you like to report an ACT writing score?*
                </label>
                <div className="act-radio-group-horizontal">
                  <label className="act-radio-option">
                    <input
                      type="radio"
                      name="reportWritingScore"
                      value="yes"
                      checked={formData.reportWritingScore === 'yes'}
                      onChange={handleInputChange}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="act-radio-option">
                    <input
                      type="radio"
                      name="reportWritingScore"
                      value="no"
                      checked={formData.reportWritingScore === 'no'}
                      onChange={handleInputChange}
                    />
                    <span>No</span>
                  </label>
                </div>
                <button 
                  type="button" 
                  className="act-clear-link"
                  onClick={() => clearAnswer('reportWritingScore')}
                  disabled={!formData.reportWritingScore}
                >
                  Clear answer
                </button>
              </div>

              {/* Writing Score (conditional) */}
              {formData.reportWritingScore === 'yes' && (
                <div className="act-field-group">
                  <div className="act-form-group">
                    <label className="act-question-label required">Highest writing score*</label>
                    <select 
                      name="highestWritingScore"
                      value={formData.highestWritingScore || ''}
                      onChange={handleInputChange}
                      className="act-select"
                    >
                      <option value="">Choose an option</option>
                      {subjectScores.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>
                  <div className="act-form-group">
                    <label className="act-question-label required">Highest writing date*</label>
                    <input
                      type="text"
                      name="highestWritingDate"
                      value={formData.highestWritingDate || ''}
                      onChange={handleInputChange}
                      placeholder="Month day, year"
                      className="act-date-input"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Number of Future ACT Sittings */}
          <div className="act-form-group">
            <label className="act-question-label required">
              Number of future ACT sittings you expect*
            </label>
            <div className="act-radio-group-vertical">
              {[0, 1, 2, 3].map(num => (
                <label key={num} className="act-radio-option">
                  <input
                    type="radio"
                    name="futureACTSittings"
                    value={num.toString()}
                    checked={formData.futureACTSittings === num.toString()}
                    onChange={handleInputChange}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>
            <button 
              type="button" 
              className="act-clear-link"
              onClick={handleClearFutureSittings}
              disabled={!formData.futureACTSittings}
            >
              Clear answer
            </button>
          </div>

          {/* Future Test Dates - Conditionally show based on number of future sittings */}
          {parseInt(formData.futureACTSittings || '0') > 0 && (
            <div className="act-future-dates">
              <h3>Future Testing Dates</h3>
              {Array.from({ length: parseInt(formData.futureACTSittings || '0') }, (_, i) => (
                <div key={i} className="act-form-group">
                  <label className="act-question-label required">
                    Future testing date {i + 1}*
                  </label>
                  <input
                    type="text"
                    name={`futureTestDate${i + 1}`}
                    value={formData[`futureTestDate${i + 1}`] || ''}
                    onChange={handleInputChange}
                    placeholder="Month year"
                    className="act-date-input"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Helper text */}
          <div className="act-form-helper">
            * Required fields. Remember to send official score reports to colleges that require them.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ACTTestsSection;