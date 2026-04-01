// src/components/testing-sections/PTEAcademicTestsSection.js
import React, { useState, useEffect } from 'react';
import './PTEAcademicTestsSection.css';

const PTEAcademicTestsSection = ({ 
  formData = {}, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Determine if we should show score form based on past tests
  useEffect(() => {
    const pastTests = parseInt(formData.ptePastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.ptePastTests]);

  // Validate form completion
  useEffect(() => {
    const hasPastTests = formData.ptePastTests !== undefined && formData.ptePastTests !== '';
    const hasFutureSittings = formData.pteFutureSittings !== undefined && formData.pteFutureSittings !== '';
    
    let scoresValid = true;
    
    if (showScoreForm && parseInt(formData.ptePastTests || '0') > 0) {
      // Check if all required score fields are filled
      const requiredFields = [
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
      ];
      
      scoresValid = requiredFields.every(field => 
        formData[field] && formData[field].toString().trim() !== ''
      );
    }
    
    setIsFormValid(hasPastTests && hasFutureSittings && (showScoreForm ? scoresValid : true));
  }, [formData, showScoreForm]);

  // Score options for dropdowns (0-90 for PTE)
  const scoreOptions = Array.from({ length: 91 }, (_, i) => i);

  // Handle clearing past tests and related fields
  const handleClearPastTests = () => {
    if (clearRelatedFields) {
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
    } else if (clearAnswer) {
      clearAnswer('ptePastTests');
    }
  };

  // Handle clearing future sittings
  const handleClearFutureSittings = () => {
    if (clearAnswer) {
      clearAnswer('pteFutureSittings');
    }
  };

  // Handle clearing individual score fields
  const handleClearScoreField = (fieldName) => {
    if (clearAnswer) {
      clearAnswer(fieldName);
    }
  };

  // Helper function to render score and date pair
  const renderScoreDatePair = (scoreField, dateField, title) => {
    const scoreValue = formData[scoreField] || '';
    const dateValue = formData[dateField] || '';

    return (
      <div className="pte-field-group" key={scoreField}>
        <div className="pte-form-group">
          <label className="pte-question-label required">
            Highest {title} score
          </label>
          <select 
            name={scoreField}
            value={scoreValue}
            onChange={handleInputChange}
            className="pte-select"
          >
            <option value="">Choose an option</option>
            {scoreOptions.map(score => (
              <option key={score} value={score}>{score}</option>
            ))}
          </select>
          {scoreValue && (
            <button 
              type="button" 
              className="pte-clear-link"
              onClick={() => handleClearScoreField(scoreField)}
            >
              Clear score
            </button>
          )}
        </div>
        
        <div className="pte-form-group">
          <label className="pte-question-label required">
            {title} score date
          </label>
          <input
            type="date"
            name={dateField}
            value={dateValue}
            onChange={handleInputChange}
            className="pte-date-input"
          />
          {dateValue && (
            <button 
              type="button" 
              className="pte-clear-link"
              onClick={() => handleClearScoreField(dateField)}
            >
              Clear date
            </button>
          )}
          <div className="pte-form-helper">
            Date uses "month day, year" format (e.g. August 1, 2002)
          </div>
        </div>
      </div>
    );
  };

  // Check if any past test scores exist
  const hasAnyScore = () => {
    const scoreFields = [
      'pteHighestListeningScore', 'pteHighestReadingScore', 'pteHighestSpeakingScore',
      'pteHighestWritingScore', 'pteHighestGrammarScore', 'pteHighestOralFluencyScore',
      'pteHighestPronunciationScore', 'pteHighestSpellingScore', 'pteHighestVocabularyScore',
      'pteHighestWrittenDiscourseScore'
    ];
    return scoreFields.some(field => formData[field] && formData[field].toString().trim() !== '');
  };

  // Clear all scores
  const handleClearAllScores = () => {
    if (clearRelatedFields) {
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
    }
  };

  return (
    <div className="pte-container">
      <div className="pte-card">
        <div className="pte-card-header">
          <h2 className="pte-card-title">PTE Academic Tests</h2>
          <div className="pte-status-badge">
            {isFormValid ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="pte-form-content">
          {/* Number of Past PTE Academic Tests */}
          <div className="pte-form-group">
            <label className="pte-question-label required">
              Number of times you have already taken the PTE Academic Test
            </label>
            <div className="pte-radio-group-vertical">
              {[0, 1, 2, 3, 4, 5].map(num => (
                <label key={num} className="pte-radio-option">
                  <input
                    type="radio"
                    name="ptePastTests"
                    value={num.toString()}
                    checked={formData.ptePastTests === num.toString()}
                    onChange={handleInputChange}
                  />
                  <span className="pte-radio-label">{num}</span>
                </label>
              ))}
            </div>
            {formData.ptePastTests !== undefined && formData.ptePastTests !== '' && (
              <button 
                type="button" 
                className="pte-clear-link"
                onClick={handleClearPastTests}
              >
                Clear answer
              </button>
            )}
          </div>

          {/* Number of Future PTE Academic Test Sittings */}
          <div className="pte-form-group">
            <label className="pte-question-label required">
              Number of future PTE Academic Test sittings you expect
            </label>
            <div className="pte-radio-group-vertical">
              {[0, 1, 2, 3].map(num => (
                <label key={num} className="pte-radio-option">
                  <input
                    type="radio"
                    name="pteFutureSittings"
                    value={num.toString()}
                    checked={formData.pteFutureSittings === num.toString()}
                    onChange={handleInputChange}
                  />
                  <span className="pte-radio-label">{num}</span>
                </label>
              ))}
            </div>
            {formData.pteFutureSittings !== undefined && formData.pteFutureSittings !== '' && (
              <button 
                type="button" 
                className="pte-clear-link"
                onClick={handleClearFutureSittings}
              >
                Clear answer
              </button>
            )}
          </div>

          {/* Score Form - Only show if past tests > 0 */}
          {showScoreForm && (
            <div className="pte-detailed-fields">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h3>PTE Academic Test Scores</h3>
                {hasAnyScore() && (
                  <button 
                    type="button" 
                    className="pte-clear-link"
                    onClick={handleClearAllScores}
                    style={{ fontSize: '11px' }}
                  >
                    Clear all scores
                  </button>
                )}
              </div>
              
              {/* Listening Score */}
              {renderScoreDatePair(
                'pteHighestListeningScore', 
                'pteListeningScoreDate', 
                'listening'
              )}

              {/* Reading Score */}
              {renderScoreDatePair(
                'pteHighestReadingScore', 
                'pteReadingScoreDate', 
                'reading'
              )}

              {/* Speaking Score */}
              {renderScoreDatePair(
                'pteHighestSpeakingScore', 
                'pteSpeakingScoreDate', 
                'speaking'
              )}

              {/* Writing Score */}
              {renderScoreDatePair(
                'pteHighestWritingScore', 
                'pteWritingScoreDate', 
                'writing'
              )}

              {/* Grammar Score */}
              {renderScoreDatePair(
                'pteHighestGrammarScore', 
                'pteGrammarScoreDate', 
                'grammar'
              )}

              {/* Oral Fluency Score */}
              {renderScoreDatePair(
                'pteHighestOralFluencyScore', 
                'pteOralFluencyScoreDate', 
                'oral fluency'
              )}

              {/* Pronunciation Score */}
              {renderScoreDatePair(
                'pteHighestPronunciationScore', 
                'ptePronunciationScoreDate', 
                'pronunciation'
              )}

              {/* Spelling Score */}
              {renderScoreDatePair(
                'pteHighestSpellingScore', 
                'pteSpellingScoreDate', 
                'spelling'
              )}

              {/* Vocabulary Score */}
              {renderScoreDatePair(
                'pteHighestVocabularyScore', 
                'pteVocabularyScoreDate', 
                'vocabulary'
              )}

              {/* Written Discourse Score */}
              {renderScoreDatePair(
                'pteHighestWrittenDiscourseScore', 
                'pteWrittenDiscourseScoreDate', 
                'written discourse'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PTEAcademicTestsSection;