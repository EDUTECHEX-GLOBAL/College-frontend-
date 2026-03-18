// src/components/testing-sections/PTEAcademicTestsSection.js
import React, { useState, useEffect } from 'react';
import './PTEAcademicTestsSection.css';

const PTEAcademicTestsSection = ({ 
  formData, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [showScoreForm, setShowScoreForm] = useState(false);

  // Determine if we should show score form based on past tests
  useEffect(() => {
    const pastTests = parseInt(formData.ptePastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.ptePastTests]);

  // Score options for dropdowns (0-90 for PTE)
  const scoreOptions = Array.from({ length: 91 }, (_, i) => i);

  // Handle clearing past tests and related fields
  const handleClearPastTests = () => {
    clearRelatedFields('ptePastTests', [
      'pteHighestListeningScore', 'pteListeningScoreDate',
      'pteHighestReadingScore', 'pteReadingScoreDate',
      'pteHighestSpeakingScore', 'pteSpeakingScoreDate',
      'pteHighestWritingScore', 'pteWritingScoreDate',
      'pteHighestGrammarScore', 'pteGrammarScoreDate',
      'pteHighestOralFluencyScore', 'pteOralFluencyScoreDate',
      'pteHighestPronunciationScore', 'ptePronunciationScoreDate',
      'pteHighestSpellingScore', 'pteSpellingScoreDate',
      'pteHighestVocabularyScore', 'pteVocabularyScoreDate',
      'pteHighestWrittenDiscourseScore', 'pteWrittenDiscourseScoreDate'
    ]);
  };

  // Handle clearing future sittings and related fields
  const handleClearFutureSittings = () => {
    clearAnswer('pteFutureSittings');
  };

  return (
    <div className="pte-section">
      <h2>PTE Academic Tests</h2>
      <div className="section-status">
        {formData.ptePastTests && formData.pteFutureSittings ? 'Complete' : 'In Progress'}
      </div>
      
      <div className="form-content">
        {/* Number of Past PTE Academic Tests */}
        <div className="form-group">
          <p className="question-text">
            Number of times you have already taken the PTE Academic Test*
          </p>
          <div className="radio-group-vertical">
            {[0, 1, 2, 3, 4, 5].map(num => (
              <label key={num} className="radio-option">
                <input
                  type="radio"
                  name="ptePastTests"
                  value={num.toString()}
                  checked={formData.ptePastTests === num.toString()}
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

        {/* Number of Future PTE Academic Test Sittings */}
        <div className="form-group">
          <p className="question-text">
            Number of future PTE Academic Test sittings you expect*
          </p>
          <div className="radio-group-vertical">
            {[0, 1, 2, 3].map(num => (
              <label key={num} className="radio-option">
                <input
                  type="radio"
                  name="pteFutureSittings"
                  value={num.toString()}
                  checked={formData.pteFutureSittings === num.toString()}
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

        {/* Score Form - Only show if past tests > 0 */}
        {showScoreForm && (
          <div className="detailed-fields">
            <h3>PTE Academic Test Scores</h3>
            
            {/* Listening Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest listening score*</p>
                <select 
                  name="pteHighestListeningScore"
                  value={formData.pteHighestListeningScore || ''}
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
                <p className="question-text">Listening score date*</p>
                <input
                  type="date"
                  name="pteListeningScoreDate"
                  value={formData.pteListeningScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Reading Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest reading score*</p>
                <select 
                  name="pteHighestReadingScore"
                  value={formData.pteHighestReadingScore || ''}
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
                <p className="question-text">Reading score date*</p>
                <input
                  type="date"
                  name="pteReadingScoreDate"
                  value={formData.pteReadingScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Speaking Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest speaking score*</p>
                <select 
                  name="pteHighestSpeakingScore"
                  value={formData.pteHighestSpeakingScore || ''}
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
                <p className="question-text">Speaking score date*</p>
                <input
                  type="date"
                  name="pteSpeakingScoreDate"
                  value={formData.pteSpeakingScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Writing Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest writing score*</p>
                <select 
                  name="pteHighestWritingScore"
                  value={formData.pteHighestWritingScore || ''}
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
                <p className="question-text">Writing score date*</p>
                <input
                  type="date"
                  name="pteWritingScoreDate"
                  value={formData.pteWritingScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Grammar Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest grammar score*</p>
                <select 
                  name="pteHighestGrammarScore"
                  value={formData.pteHighestGrammarScore || ''}
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
                <p className="question-text">Grammar score date*</p>
                <input
                  type="date"
                  name="pteGrammarScoreDate"
                  value={formData.pteGrammarScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Oral Fluency Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest oral fluency score*</p>
                <select 
                  name="pteHighestOralFluencyScore"
                  value={formData.pteHighestOralFluencyScore || ''}
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
                <p className="question-text">Oral fluency score date*</p>
                <input
                  type="date"
                  name="pteOralFluencyScoreDate"
                  value={formData.pteOralFluencyScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Pronunciation Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest pronunciation score*</p>
                <select 
                  name="pteHighestPronunciationScore"
                  value={formData.pteHighestPronunciationScore || ''}
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
                <p className="question-text">Pronunciation score date*</p>
                <input
                  type="date"
                  name="ptePronunciationScoreDate"
                  value={formData.ptePronunciationScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Spelling Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest spelling score*</p>
                <select 
                  name="pteHighestSpellingScore"
                  value={formData.pteHighestSpellingScore || ''}
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
                <p className="question-text">Spelling score date*</p>
                <input
                  type="date"
                  name="pteSpellingScoreDate"
                  value={formData.pteSpellingScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Vocabulary Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest vocabulary score*</p>
                <select 
                  name="pteHighestVocabularyScore"
                  value={formData.pteHighestVocabularyScore || ''}
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
                <p className="question-text">Vocabulary score date*</p>
                <input
                  type="date"
                  name="pteVocabularyScoreDate"
                  value={formData.pteVocabularyScoreDate || ''}
                  onChange={handleInputChange}
                  className="date-input"
                />
                <div className="form-helper">
                  Date uses "month day, year" format (e.g. August 1, 2002)
                </div>
              </div>
            </div>

            {/* Written Discourse Score */}
            <div className="field-group">
              <div className="form-group">
                <p className="question-text">Highest written discourse score*</p>
                <select 
                  name="pteHighestWrittenDiscourseScore"
                  value={formData.pteHighestWrittenDiscourseScore || ''}
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
                <p className="question-text">Written discourse score date*</p>
                <input
                  type="date"
                  name="pteWrittenDiscourseScoreDate"
                  value={formData.pteWrittenDiscourseScoreDate || ''}
                  onChange={handleInputChange}
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

export default PTEAcademicTestsSection;