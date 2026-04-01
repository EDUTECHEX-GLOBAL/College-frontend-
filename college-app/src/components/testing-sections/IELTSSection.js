// src/components/testing-sections/IELTSSection.js
import React, { useState, useEffect } from 'react';
import './IELTSSection.css';

const IELTSSection = ({ 
  formData, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [showScoreForm, setShowScoreForm] = useState(false);

  // Determine if we should show score form based on past tests
  useEffect(() => {
    const pastTests = parseInt(formData.ieltsPastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.ieltsPastTests]);

  // IELTS Band Scores (0.0 to 9.0 in 0.5 increments)
  const bandScores = [];
  for (let i = 0; i <= 9; i += 0.5) {
    bandScores.push(i.toFixed(1));
  }

  // Check if section is complete
  const isSectionComplete = () => {
    // Check if past tests and future sittings are selected
    if (!formData.ieltsPastTests || !formData.ieltsFutureSittings) return false;
    
    const pastTests = parseInt(formData.ieltsPastTests);
    
    // If past tests > 0, check score fields
    if (pastTests > 0) {
      if (!formData.ieltsHighestListeningScore || !formData.ieltsListeningScoreDate) return false;
      if (!formData.ieltsHighestReadingScore || !formData.ieltsReadingScoreDate) return false;
      if (!formData.ieltsHighestWritingScore || !formData.ieltsWritingScoreDate) return false;
      if (!formData.ieltsHighestSpeakingScore || !formData.ieltsSpeakingScoreDate) return false;
      if (!formData.ieltsHighestOverallScore || !formData.ieltsOverallScoreDate) return false;
    }
    
    return true;
  };

  // Handle clearing past IELTS tests and related fields
  const handleClearPastTests = () => {
    clearRelatedFields('ieltsPastTests', [
      'ieltsHighestListeningScore', 'ieltsListeningScoreDate',
      'ieltsHighestReadingScore', 'ieltsReadingScoreDate',
      'ieltsHighestWritingScore', 'ieltsWritingScoreDate',
      'ieltsHighestSpeakingScore', 'ieltsSpeakingScoreDate',
      'ieltsHighestOverallScore', 'ieltsOverallScoreDate'
    ]);
  };

  // Handle clearing future IELTS sittings
  const handleClearFutureSittings = () => {
    clearAnswer('ieltsFutureSittings');
  };

  return (
    <div className="ielts-container">
      <div className="ielts-card">
        <div className="ielts-card-header">
          <h2 className="ielts-card-title">IELTS</h2>
          <div className="ielts-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="ielts-form-content">
          {/* Number of Past IELTS Tests */}
          <div className="ielts-form-group">
            <label className="ielts-question-label required">
              Number of times you have already taken the IELTS*
            </label>
            <div className="ielts-radio-group-vertical">
              {[0, 1, 2, 3, 4, 5].map(num => (
                <label key={num} className="ielts-radio-option">
                  <input
                    type="radio"
                    name="ieltsPastTests"
                    value={num.toString()}
                    checked={formData.ieltsPastTests === num.toString()}
                    onChange={handleInputChange}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>
            <button 
              type="button" 
              className="ielts-clear-link"
              onClick={handleClearPastTests}
              disabled={!formData.ieltsPastTests}
            >
              Clear answer
            </button>
          </div>

          {/* Number of Future IELTS Sittings */}
          <div className="ielts-form-group">
            <label className="ielts-question-label required">
              Number of future IELTS sittings you expect*
            </label>
            <div className="ielts-radio-group-vertical">
              {[0, 1, 2, 3].map(num => (
                <label key={num} className="ielts-radio-option">
                  <input
                    type="radio"
                    name="ieltsFutureSittings"
                    value={num.toString()}
                    checked={formData.ieltsFutureSittings === num.toString()}
                    onChange={handleInputChange}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>
            <button 
              type="button" 
              className="ielts-clear-link"
              onClick={handleClearFutureSittings}
              disabled={!formData.ieltsFutureSittings}
            >
              Clear answer
            </button>
          </div>

          {/* Score Form - Only show if past tests > 0 */}
          {showScoreForm && (
            <div className="ielts-detailed-fields">
              <h3>IELTS Scores</h3>
              
              {/* Listening Score */}
              <div className="ielts-form-row">
                <div className="ielts-form-field">
                  <div className="ielts-form-group">
                    <label className="ielts-question-label required">Highest listening score*</label>
                    <select 
                      name="ieltsHighestListeningScore"
                      value={formData.ieltsHighestListeningScore || ''}
                      onChange={handleInputChange}
                      className="ielts-select"
                    >
                      <option value="">Choose an option</option>
                      {bandScores.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ielts-form-field">
                  <div className="ielts-form-group">
                    <label className="ielts-question-label required">Listening score date*</label>
                    <input
                      type="text"
                      name="ieltsListeningScoreDate"
                      value={formData.ieltsListeningScoreDate || ''}
                      onChange={handleInputChange}
                      placeholder="Month day, year"
                      className="ielts-date-input"
                    />
                    <div className="ielts-form-helper">
                      Date uses "month day, year" format (e.g. August 1, 2002)
                    </div>
                  </div>
                </div>
              </div>

              {/* Reading Score */}
              <div className="ielts-form-row">
                <div className="ielts-form-field">
                  <div className="ielts-form-group">
                    <label className="ielts-question-label required">Highest reading score*</label>
                    <select 
                      name="ieltsHighestReadingScore"
                      value={formData.ieltsHighestReadingScore || ''}
                      onChange={handleInputChange}
                      className="ielts-select"
                    >
                      <option value="">Choose an option</option>
                      {bandScores.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ielts-form-field">
                  <div className="ielts-form-group">
                    <label className="ielts-question-label required">Reading score date*</label>
                    <input
                      type="text"
                      name="ieltsReadingScoreDate"
                      value={formData.ieltsReadingScoreDate || ''}
                      onChange={handleInputChange}
                      placeholder="Month day, year"
                      className="ielts-date-input"
                    />
                    <div className="ielts-form-helper">
                      Date uses "month day, year" format (e.g. August 1, 2002)
                    </div>
                  </div>
                </div>
              </div>

              {/* Writing Score */}
              <div className="ielts-form-row">
                <div className="ielts-form-field">
                  <div className="ielts-form-group">
                    <label className="ielts-question-label required">Highest writing score*</label>
                    <select 
                      name="ieltsHighestWritingScore"
                      value={formData.ieltsHighestWritingScore || ''}
                      onChange={handleInputChange}
                      className="ielts-select"
                    >
                      <option value="">Choose an option</option>
                      {bandScores.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ielts-form-field">
                  <div className="ielts-form-group">
                    <label className="ielts-question-label required">Writing score date*</label>
                    <input
                      type="text"
                      name="ieltsWritingScoreDate"
                      value={formData.ieltsWritingScoreDate || ''}
                      onChange={handleInputChange}
                      placeholder="Month day, year"
                      className="ielts-date-input"
                    />
                    <div className="ielts-form-helper">
                      Date uses "month day, year" format (e.g. August 1, 2002)
                    </div>
                  </div>
                </div>
              </div>

              {/* Speaking Score */}
              <div className="ielts-form-row">
                <div className="ielts-form-field">
                  <div className="ielts-form-group">
                    <label className="ielts-question-label required">Highest speaking score*</label>
                    <select 
                      name="ieltsHighestSpeakingScore"
                      value={formData.ieltsHighestSpeakingScore || ''}
                      onChange={handleInputChange}
                      className="ielts-select"
                    >
                      <option value="">Choose an option</option>
                      {bandScores.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ielts-form-field">
                  <div className="ielts-form-group">
                    <label className="ielts-question-label required">Speaking score date*</label>
                    <input
                      type="text"
                      name="ieltsSpeakingScoreDate"
                      value={formData.ieltsSpeakingScoreDate || ''}
                      onChange={handleInputChange}
                      placeholder="Month day, year"
                      className="ielts-date-input"
                    />
                    <div className="ielts-form-helper">
                      Date uses "month day, year" format (e.g. August 1, 2002)
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Band Score */}
              <div className="ielts-form-row">
                <div className="ielts-form-field">
                  <div className="ielts-form-group">
                    <label className="ielts-question-label required">Highest IELTS overall band score*</label>
                    <select 
                      name="ieltsHighestOverallScore"
                      value={formData.ieltsHighestOverallScore || ''}
                      onChange={handleInputChange}
                      className="ielts-select"
                    >
                      <option value="">Choose an option</option>
                      {bandScores.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ielts-form-field">
                  <div className="ielts-form-group">
                    <label className="ielts-question-label required">IELTS overall band score date*</label>
                    <input
                      type="text"
                      name="ieltsOverallScoreDate"
                      value={formData.ieltsOverallScoreDate || ''}
                      onChange={handleInputChange}
                      placeholder="Month day, year"
                      className="ielts-date-input"
                    />
                    <div className="ielts-form-helper">
                      Date uses "month day, year" format (e.g. August 1, 2002)
                    </div>
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

export default IELTSSection;