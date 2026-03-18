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
    <div className="duolingo-section">
      <h2>Duolingo English Test</h2>
      <div className="section-status">
        In Progress
      </div>
      
      <div className="form-content">
        {/* Number of Past Duolingo English Tests */}
        <div className="form-group">
          <p className="question-text">
            Number of times you have already taken a Duolingo English Test*
          </p>
          <div className="radio-group-vertical">
            {[0, 1, 2, 3, 4, 5].map(num => (
              <label key={num} className="radio-option">
                <input
                  type="radio"
                  name="duolingoPastTests"
                  value={num.toString()}
                  checked={formData.duolingoPastTests === num.toString()}
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

        {/* Number of Future Duolingo English Test Sittings */}
        <div className="form-group">
          <p className="question-text">
            Number of future Duolingo English Test sittings you expect*
          </p>
          <div className="radio-group-vertical">
            {[0, 1, 2, 3].map(num => (
              <label key={num} className="radio-option">
                <input
                  type="radio"
                  name="duolingoFutureSittings"
                  value={num.toString()}
                  checked={formData.duolingoFutureSittings === num.toString()}
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
        {parseInt(formData.duolingoFutureSittings || '0') > 0 && (
          <div className="future-dates">
            <h3>Future Testing Dates</h3>
            {Array.from({ length: parseInt(formData.duolingoFutureSittings || '0') }, (_, i) => (
              <div key={i} className="form-group">
                <p className="question-text">Future testing date {i + 1}*</p>
                <input
                  type="text"
                  name={`duolingoFutureTestDate${i + 1}`}
                  value={formData[`duolingoFutureTestDate${i + 1}`] || ''}
                  onChange={handleInputChange}
                  placeholder="Month year"
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month year" format (e.g. August 2002)
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Score Form - Only show if past tests > 0 */}
        {showScoreForm && (
          <div className="detailed-fields">
            <h3>Duolingo English Test Scores</h3>
            
            {/* Literacy Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest literacy score*</p>
                <select 
                  name="duolingoHighestLiteracyScore"
                  value={formData.duolingoHighestLiteracyScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <p className="question-text">Literacy score date*</p>
                <input
                  type="text"
                  name="duolingoLiteracyScoreDate"
                  value={formData.duolingoLiteracyScoreDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Comprehension Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest comprehension score*</p>
                <select 
                  name="duolingoHighestComprehensionScore"
                  value={formData.duolingoHighestComprehensionScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <p className="question-text">Comprehension score date*</p>
                <input
                  type="text"
                  name="duolingoComprehensionScoreDate"
                  value={formData.duolingoComprehensionScoreDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Conversation Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest conversation score*</p>
                <select 
                  name="duolingoHighestConversationScore"
                  value={formData.duolingoHighestConversationScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <p className="question-text">Conversation score date*</p>
                <input
                  type="text"
                  name="duolingoConversationScoreDate"
                  value={formData.duolingoConversationScoreDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Production Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest production score*</p>
                <select 
                  name="duolingoHighestProductionScore"
                  value={formData.duolingoHighestProductionScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <p className="question-text">Production score date*</p>
                <input
                  type="text"
                  name="duolingoProductionScoreDate"
                  value={formData.duolingoProductionScoreDate || ''}
                  onChange={handleInputChange}
                  placeholder="Month day, year"
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Total Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest Duolingo total score*</p>
                <select 
                  name="duolingoHighestTotalScore"
                  value={formData.duolingoHighestTotalScore || ''}
                  onChange={handleInputChange}
                  className="score-dropdown"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <p className="question-text">Duolingo total score date*</p>
                <input
                  type="text"
                  name="duolingoTotalScoreDate"
                  value={formData.duolingoTotalScoreDate || ''}
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

export default DuolingoEnglishTestSection;