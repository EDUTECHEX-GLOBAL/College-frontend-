// src/components/testing-sections/DuolingoEnglishTestSection.js
import React, { useState, useEffect } from 'react';
import './DuolingoEnglishTestSection.css';

const DuolingoEnglishTestSection = ({ 
  formData, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [showScoreForm, setShowScoreForm] = useState(false);

  // Determine if we should show score form based on past tests
  useEffect(() => {
    const pastTests = parseInt(formData.duolingoPastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.duolingoPastTests]);

  // Duolingo Score options (10-160 in 5 point increments)
  const scoreOptions = [];
  for (let i = 10; i <= 160; i += 5) {
    scoreOptions.push(i);
  }

  // Check if section is complete
  const isSectionComplete = () => {
    // Check if past tests and future sittings are selected
    if (!formData.duolingoPastTests || !formData.duolingoFutureSittings) return false;
    
    const pastTests = parseInt(formData.duolingoPastTests);
    const futureSittings = parseInt(formData.duolingoFutureSittings);
    
    // Check future test dates
    for (let i = 1; i <= futureSittings; i++) {
      if (!formData[`duolingoFutureTestDate${i}`]) return false;
    }
    
    // If past tests > 0, check score fields
    if (pastTests > 0) {
      if (!formData.duolingoHighestLiteracyScore || !formData.duolingoLiteracyScoreDate) return false;
      if (!formData.duolingoHighestComprehensionScore || !formData.duolingoComprehensionScoreDate) return false;
      if (!formData.duolingoHighestConversationScore || !formData.duolingoConversationScoreDate) return false;
      if (!formData.duolingoHighestProductionScore || !formData.duolingoProductionScoreDate) return false;
      if (!formData.duolingoHighestTotalScore || !formData.duolingoTotalScoreDate) return false;
    }
    
    return true;
  };

  // Handle clearing past Duolingo tests and related fields
  const handleClearPastTests = () => {
    clearRelatedFields('duolingoPastTests', [
      'duolingoHighestLiteracyScore', 'duolingoLiteracyScoreDate',
      'duolingoHighestComprehensionScore', 'duolingoComprehensionScoreDate',
      'duolingoHighestConversationScore', 'duolingoConversationScoreDate',
      'duolingoHighestProductionScore', 'duolingoProductionScoreDate',
      'duolingoHighestTotalScore', 'duolingoTotalScoreDate'
    ]);
  };

  // Handle clearing future sittings and related fields
  const handleClearFutureSittings = () => {
    clearRelatedFields('duolingoFutureSittings', [
      'duolingoFutureTestDate1', 'duolingoFutureTestDate2', 'duolingoFutureTestDate3'
    ]);
  };

  return (
    <div className="duo-container">
      <div className="duo-card">
        <div className="duo-card-header">
          <h2 className="duo-card-title">Duolingo English Test</h2>
          <div className="duo-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="duo-form-content">
          {/* Number of Past Duolingo English Tests */}
          <div className="duo-form-group">
            <label className="duo-question-label required">
              Number of times you have already taken a Duolingo English Test*
            </label>
            <div className="duo-radio-group-vertical">
              {[0, 1, 2, 3, 4, 5].map(num => (
                <label key={num} className="duo-radio-option">
                  <input
                    type="radio"
                    name="duolingoPastTests"
                    value={num.toString()}
                    checked={formData.duolingoPastTests === num.toString()}
                    onChange={handleInputChange}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>
            <button 
              type="button" 
              className="duo-clear-link"
              onClick={handleClearPastTests}
              disabled={!formData.duolingoPastTests}
            >
              Clear answer
            </button>
          </div>

          {/* Number of Future Duolingo English Test Sittings */}
          <div className="duo-form-group">
            <label className="duo-question-label required">
              Number of future Duolingo English Test sittings you expect*
            </label>
            <div className="duo-radio-group-vertical">
              {[0, 1, 2, 3].map(num => (
                <label key={num} className="duo-radio-option">
                  <input
                    type="radio"
                    name="duolingoFutureSittings"
                    value={num.toString()}
                    checked={formData.duolingoFutureSittings === num.toString()}
                    onChange={handleInputChange}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>
            <button 
              type="button" 
              className="duo-clear-link"
              onClick={handleClearFutureSittings}
              disabled={!formData.duolingoFutureSittings}
            >
              Clear answer
            </button>
          </div>

          {/* Future Test Dates - Conditionally show based on number of future sittings */}
          {parseInt(formData.duolingoFutureSittings || '0') > 0 && (
            <div className="duo-future-dates">
              <h3>Future Testing Dates</h3>
              {Array.from({ length: parseInt(formData.duolingoFutureSittings || '0') }, (_, i) => (
                <div key={i} className="duo-form-group">
                  <label className="duo-question-label required">
                    Future testing date {i + 1}*
                  </label>
                  <input
                    type="text"
                    name={`duolingoFutureTestDate${i + 1}`}
                    value={formData[`duolingoFutureTestDate${i + 1}`] || ''}
                    onChange={handleInputChange}
                    placeholder="Month year"
                    className="duo-date-input"
                  />
                  <div className="duo-form-helper">
                    Date uses "month year" format (e.g. August 2002)
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Score Form - Only show if past tests > 0 */}
          {showScoreForm && (
            <div className="duo-detailed-fields">
              <h3>Duolingo English Test Scores</h3>
              
              {/* Literacy Score */}
              <div className="duo-field-group">
                <div className="duo-form-group">
                  <label className="duo-question-label required">Highest literacy score*</label>
                  <select 
                    name="duolingoHighestLiteracyScore"
                    value={formData.duolingoHighestLiteracyScore || ''}
                    onChange={handleInputChange}
                    className="duo-select"
                  >
                    <option value="">Choose an option</option>
                    {scoreOptions.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="duo-form-group">
                  <label className="duo-question-label required">Literacy score date*</label>
                  <input
                    type="text"
                    name="duolingoLiteracyScoreDate"
                    value={formData.duolingoLiteracyScoreDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="duo-date-input"
                  />
                  <div className="duo-form-helper">
                    Date uses "month day, year" format (e.g. August 1, 2002)
                  </div>
                </div>
              </div>

              {/* Comprehension Score */}
              <div className="duo-field-group">
                <div className="duo-form-group">
                  <label className="duo-question-label required">Highest comprehension score*</label>
                  <select 
                    name="duolingoHighestComprehensionScore"
                    value={formData.duolingoHighestComprehensionScore || ''}
                    onChange={handleInputChange}
                    className="duo-select"
                  >
                    <option value="">Choose an option</option>
                    {scoreOptions.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="duo-form-group">
                  <label className="duo-question-label required">Comprehension score date*</label>
                  <input
                    type="text"
                    name="duolingoComprehensionScoreDate"
                    value={formData.duolingoComprehensionScoreDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="duo-date-input"
                  />
                  <div className="duo-form-helper">
                    Date uses "month day, year" format (e.g. August 1, 2002)
                  </div>
                </div>
              </div>

              {/* Conversation Score */}
              <div className="duo-field-group">
                <div className="duo-form-group">
                  <label className="duo-question-label required">Highest conversation score*</label>
                  <select 
                    name="duolingoHighestConversationScore"
                    value={formData.duolingoHighestConversationScore || ''}
                    onChange={handleInputChange}
                    className="duo-select"
                  >
                    <option value="">Choose an option</option>
                    {scoreOptions.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="duo-form-group">
                  <label className="duo-question-label required">Conversation score date*</label>
                  <input
                    type="text"
                    name="duolingoConversationScoreDate"
                    value={formData.duolingoConversationScoreDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="duo-date-input"
                  />
                  <div className="duo-form-helper">
                    Date uses "month day, year" format (e.g. August 1, 2002)
                  </div>
                </div>
              </div>

              {/* Production Score */}
              <div className="duo-field-group">
                <div className="duo-form-group">
                  <label className="duo-question-label required">Highest production score*</label>
                  <select 
                    name="duolingoHighestProductionScore"
                    value={formData.duolingoHighestProductionScore || ''}
                    onChange={handleInputChange}
                    className="duo-select"
                  >
                    <option value="">Choose an option</option>
                    {scoreOptions.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="duo-form-group">
                  <label className="duo-question-label required">Production score date*</label>
                  <input
                    type="text"
                    name="duolingoProductionScoreDate"
                    value={formData.duolingoProductionScoreDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="duo-date-input"
                  />
                  <div className="duo-form-helper">
                    Date uses "month day, year" format (e.g. August 1, 2002)
                  </div>
                </div>
              </div>

              {/* Total Score */}
              <div className="duo-field-group">
                <div className="duo-form-group">
                  <label className="duo-question-label required">Highest Duolingo total score*</label>
                  <select 
                    name="duolingoHighestTotalScore"
                    value={formData.duolingoHighestTotalScore || ''}
                    onChange={handleInputChange}
                    className="duo-select"
                  >
                    <option value="">Choose an option</option>
                    {scoreOptions.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="duo-form-group">
                  <label className="duo-question-label required">Duolingo total score date*</label>
                  <input
                    type="text"
                    name="duolingoTotalScoreDate"
                    value={formData.duolingoTotalScoreDate || ''}
                    onChange={handleInputChange}
                    placeholder="Month day, year"
                    className="duo-date-input"
                  />
                  <div className="duo-form-helper">
                    Date uses "month day, year" format (e.g. August 1, 2002)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuolingoEnglishTestSection;