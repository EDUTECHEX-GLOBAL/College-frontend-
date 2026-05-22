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
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);

  // Determine if we should show score form based on past tests
  useEffect(() => {
    const pastTests = parseInt(formData.ptePastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.ptePastTests]);

  // Score options for dropdowns (0-90 for PTE)
  const scoreOptions = Array.from({ length: 91 }, (_, i) => i);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years from 1990 to 2026
  const generateYears = () => {
    const years = [];
    for (let year = 1990; year <= 2026; year++) {
      years.push(year);
    }
    return years;
  };

  // Check if section is complete
  const isSectionComplete = () => {
    if (!formData.ptePastTests) return false;
    
    const pastTests = parseInt(formData.ptePastTests);
    
    // If past tests > 0, check test date and core scores
    if (pastTests > 0) {
      if (!formData.pteTestDate) return false;
      if (!formData.pteListeningScore) return false;
      if (!formData.pteReadingScore) return false;
      if (!formData.pteSpeakingScore) return false;
      if (!formData.pteWritingScore) return false;
    }
    
    return true;
  };

  // Handle clearing past PTE tests and related fields
  const handleClearPastTests = () => {
    if (clearRelatedFields) {
      clearRelatedFields('ptePastTests', [
        'pteTestDate',
        'pteListeningScore',
        'pteReadingScore',
        'pteSpeakingScore',
        'pteWritingScore',
        'pteGrammarScore',
        'pteVocabularyScore'
      ]);
    } else if (clearAnswer) {
      clearAnswer('ptePastTests');
    }
  };

  // Handle year selection for date picker
  const handleYearSelect = (field, year) => {
    setSelectedYear(year);
    setCurrentDateField(field);
    setShowCalendar(true);
  };

  // Handle month selection for date picker
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
  };

  // Confirm date selection
  const handleConfirmDate = () => {
    if (selectedMonth && selectedYear && currentDateField) {
      const fullDate = `${selectedMonth} ${selectedYear}`;
      const event = {
        target: {
          name: currentDateField,
          value: fullDate
        }
      };
      handleInputChange(event);
      setShowCalendar(false);
      setSelectedYear(null);
      setSelectedMonth(null);
      setCurrentDateField(null);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.pteacademictestssection-calendar-container')) {
        setShowCalendar(false);
        setSelectedYear(null);
        setSelectedMonth(null);
        setCurrentDateField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  return (
    <div className="pteacademictestssection-container">
      <div className="pteacademictestssection-card">
        <div className="pteacademictestssection-card-header">
          <h2 className="pteacademictestssection-card-title">PTE Academic</h2>
          <div className="pteacademictestssection-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="pteacademictestssection-form-content">
          {/* Have you taken the PTE Academic Test? */}
          <div className="pteacademictestssection-form-group">
            <label className="pteacademictestssection-question-label required">
              Have you taken the PTE Academic Test?*
            </label>
            <div className="pteacademictestssection-radio-group-vertical">
              <label className="pteacademictestssection-radio-option">
                <input
                  type="radio"
                  name="ptePastTests"
                  value="1"
                  checked={formData.ptePastTests === '1'}
                  onChange={handleInputChange}
                />
                <span>Yes</span>
              </label>
              <label className="pteacademictestssection-radio-option">
                <input
                  type="radio"
                  name="ptePastTests"
                  value="0"
                  checked={formData.ptePastTests === '0'}
                  onChange={handleInputChange}
                />
                <span>No</span>
              </label>
            </div>
            {formData.ptePastTests !== undefined && formData.ptePastTests !== '' && (
              <button 
                type="button" 
                className="pteacademictestssection-clear-link"
                onClick={handleClearPastTests}
              >
                Clear answer
              </button>
            )}
          </div>

          {/* Score Form - Only show if past tests = Yes */}
          {showScoreForm && (
            <div className="pteacademictestssection-detailed-fields">
              {/* Test Date */}
              <div className="pteacademictestssection-form-group">
                <label className="pteacademictestssection-question-label required">Test Date*</label>
                <div className="pteacademictestssection-input-container">
                  {!formData.pteTestDate ? (
                    <select
                      value={selectedYear || ''}
                      onChange={(e) => handleYearSelect('pteTestDate', e.target.value)}
                      className="pteacademictestssection-select"
                    >
                      <option value="">- Select Year -</option>
                      {generateYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="pteacademictestssection-selected-date">
                      {formData.pteTestDate}
                      <button
                        type="button"
                        className="pteacademictestssection-change-date"
                        onClick={() => {
                          const event = { target: { name: 'pteTestDate', value: '' } };
                          handleInputChange(event);
                        }}
                      >
                        Change
                      </button>
                    </div>
                  )}
                  <div className="pteacademictestssection-field-note">Date uses "month year" format (e.g., August 2020)</div>
                </div>

                {/* Calendar Popup */}
                {showCalendar && currentDateField === 'pteTestDate' && (
                  <div className="pteacademictestssection-calendar-container">
                    <div className="pteacademictestssection-calendar-header">
                      Select Month for {selectedYear}
                    </div>
                    <div className="pteacademictestssection-calendar-grid">
                      {months.map(month => (
                        <button
                          key={month}
                          type="button"
                          className={`pteacademictestssection-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                          onClick={() => handleMonthSelect(month)}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                    <div className="pteacademictestssection-calendar-actions">
                      <button
                        type="button"
                        className="pteacademictestssection-calendar-confirm"
                        onClick={handleConfirmDate}
                        disabled={!selectedMonth || !selectedYear}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="pteacademictestssection-calendar-cancel"
                        onClick={() => {
                          setShowCalendar(false);
                          setSelectedYear(null);
                          setSelectedMonth(null);
                          setCurrentDateField(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Listening Score */}
              <div className="pteacademictestssection-form-group">
                <label className="pteacademictestssection-question-label">Listening Score</label>
                <select 
                  name="pteListeningScore"
                  value={formData.pteListeningScore || ''}
                  onChange={handleInputChange}
                  className="pteacademictestssection-select"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Reading Score */}
              <div className="pteacademictestssection-form-group">
                <label className="pteacademictestssection-question-label">Reading Score</label>
                <select 
                  name="pteReadingScore"
                  value={formData.pteReadingScore || ''}
                  onChange={handleInputChange}
                  className="pteacademictestssection-select"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Speaking Score */}
              <div className="pteacademictestssection-form-group">
                <label className="pteacademictestssection-question-label">Speaking Score</label>
                <select 
                  name="pteSpeakingScore"
                  value={formData.pteSpeakingScore || ''}
                  onChange={handleInputChange}
                  className="pteacademictestssection-select"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Writing Score */}
              <div className="pteacademictestssection-form-group">
                <label className="pteacademictestssection-question-label">Writing Score</label>
                <select 
                  name="pteWritingScore"
                  value={formData.pteWritingScore || ''}
                  onChange={handleInputChange}
                  className="pteacademictestssection-select"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Additional Scores Section */}
              <div className="pteacademictestssection-additional-scores">
                <h3 className="pteacademictestssection-additional-title">Additional Scores</h3>
                
                {/* Grammar Score */}
                <div className="pteacademictestssection-form-group">
                  <label className="pteacademictestssection-question-label">Grammar Score</label>
                  <select 
                    name="pteGrammarScore"
                    value={formData.pteGrammarScore || ''}
                    onChange={handleInputChange}
                    className="pteacademictestssection-select"
                  >
                    <option value="">Choose an option</option>
                    {scoreOptions.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>

                {/* Vocabulary Score */}
                <div className="pteacademictestssection-form-group">
                  <label className="pteacademictestssection-question-label">Vocabulary Score</label>
                  <select 
                    name="pteVocabularyScore"
                    value={formData.pteVocabularyScore || ''}
                    onChange={handleInputChange}
                    className="pteacademictestssection-select"
                  >
                    <option value="">Choose an option</option>
                    {scoreOptions.map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PTEAcademicTestsSection;