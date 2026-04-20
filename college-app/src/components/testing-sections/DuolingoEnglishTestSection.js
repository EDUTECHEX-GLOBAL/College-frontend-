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
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentScoreField, setCurrentScoreField] = useState(null);

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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years from 2000 to 2026
  const generateYears = () => {
    const years = [];
    for (let year = 2000; year <= 2026; year++) {
      years.push(year);
    }
    return years;
  };

  // Check if section is complete
  const isSectionComplete = () => {
    if (!formData.duolingoPastTests) return false;
    
    const pastTests = parseInt(formData.duolingoPastTests);
    
    // If past tests > 0, check all score fields and test date
    if (pastTests > 0) {
      if (!formData.duolingoTestDate) return false;
      if (!formData.duolingoLiteracyScore) return false;
      if (!formData.duolingoComprehensionScore) return false;
      if (!formData.duolingoConversationScore) return false;
      if (!formData.duolingoProductionScore) return false;
      if (!formData.duolingoTotalScore) return false;
    }
    
    return true;
  };

  // Handle clearing past Duolingo tests and related fields
  const handleClearPastTests = () => {
    clearRelatedFields('duolingoPastTests', [
      'duolingoTestDate',
      'duolingoLiteracyScore',
      'duolingoComprehensionScore',
      'duolingoConversationScore',
      'duolingoProductionScore',
      'duolingoTotalScore'
    ]);
  };

  // Handle year selection for date picker
  const handleYearSelect = (field, year) => {
    setSelectedYear(year);
    setCurrentScoreField(field);
    setShowCalendar(true);
  };

  // Handle month selection for date picker
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
  };

  // Confirm date selection
  const handleConfirmDate = () => {
    if (selectedMonth && selectedYear && currentScoreField) {
      const fullDate = `${selectedMonth} ${selectedYear}`;
      const event = {
        target: {
          name: currentScoreField,
          value: fullDate
        }
      };
      handleInputChange(event);
      setShowCalendar(false);
      setSelectedYear(null);
      setSelectedMonth(null);
      setCurrentScoreField(null);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.duolingoenglishtestssection-calendar-container')) {
        setShowCalendar(false);
        setSelectedYear(null);
        setSelectedMonth(null);
        setCurrentScoreField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  return (
    <div className="duolingoenglishtestssection-container">
      <div className="duolingoenglishtestssection-card">
        <div className="duolingoenglishtestssection-card-header">
          <h2 className="duolingoenglishtestssection-card-title">Duolingo English Test</h2>
          <div className="duolingoenglishtestssection-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="duolingoenglishtestssection-form-content">
          {/* Have you taken the Duolingo English Test? */}
          <div className="duolingoenglishtestssection-form-group">
            <label className="duolingoenglishtestssection-question-label required">
              Have you taken the Duolingo English Test?*
            </label>
            <div className="duolingoenglishtestssection-radio-group-vertical">
              <label className="duolingoenglishtestssection-radio-option">
                <input
                  type="radio"
                  name="duolingoPastTests"
                  value="1"
                  checked={formData.duolingoPastTests === '1'}
                  onChange={handleInputChange}
                />
                <span>Yes</span>
              </label>
              <label className="duolingoenglishtestssection-radio-option">
                <input
                  type="radio"
                  name="duolingoPastTests"
                  value="0"
                  checked={formData.duolingoPastTests === '0'}
                  onChange={handleInputChange}
                />
                <span>No</span>
              </label>
            </div>
            <button 
              type="button" 
              className="duolingoenglishtestssection-clear-link"
              onClick={handleClearPastTests}
              disabled={!formData.duolingoPastTests}
            >
              Clear answer
            </button>
          </div>

          {/* Score Form - Only show if past tests = Yes */}
          {showScoreForm && (
            <div className="duolingoenglishtestssection-detailed-fields">
              {/* Test Date */}
              <div className="duolingoenglishtestssection-form-group">
                <label className="duolingoenglishtestssection-question-label required">Test Date*</label>
                <div className="duolingoenglishtestssection-input-container">
                  {!formData.duolingoTestDate ? (
                    <select
                      value={selectedYear || ''}
                      onChange={(e) => handleYearSelect('duolingoTestDate', e.target.value)}
                      className="duolingoenglishtestssection-select"
                    >
                      <option value="">- Select Year -</option>
                      {generateYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="duolingoenglishtestssection-selected-date">
                      {formData.duolingoTestDate}
                      <button
                        type="button"
                        className="duolingoenglishtestssection-change-date"
                        onClick={() => {
                          const event = { target: { name: 'duolingoTestDate', value: '' } };
                          handleInputChange(event);
                        }}
                      >
                        Change
                      </button>
                    </div>
                  )}
                  <div className="duolingoenglishtestssection-field-note">Date uses "month year" format (e.g., August 2020)</div>
                </div>

                {/* Calendar Popup */}
                {showCalendar && currentScoreField === 'duolingoTestDate' && (
                  <div className="duolingoenglishtestssection-calendar-container">
                    <div className="duolingoenglishtestssection-calendar-header">
                      Select Month for {selectedYear}
                    </div>
                    <div className="duolingoenglishtestssection-calendar-grid">
                      {months.map(month => (
                        <button
                          key={month}
                          type="button"
                          className={`duolingoenglishtestssection-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                          onClick={() => handleMonthSelect(month)}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                    <div className="duolingoenglishtestssection-calendar-actions">
                      <button
                        type="button"
                        className="duolingoenglishtestssection-calendar-confirm"
                        onClick={handleConfirmDate}
                        disabled={!selectedMonth || !selectedYear}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="duolingoenglishtestssection-calendar-cancel"
                        onClick={() => {
                          setShowCalendar(false);
                          setSelectedYear(null);
                          setSelectedMonth(null);
                          setCurrentScoreField(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Literacy Score */}
              <div className="duolingoenglishtestssection-form-group">
                <label className="duolingoenglishtestssection-question-label">Literacy Score</label>
                <select 
                  name="duolingoLiteracyScore"
                  value={formData.duolingoLiteracyScore || ''}
                  onChange={handleInputChange}
                  className="duolingoenglishtestssection-select"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Comprehension Score */}
              <div className="duolingoenglishtestssection-form-group">
                <label className="duolingoenglishtestssection-question-label">Comprehension Score</label>
                <select 
                  name="duolingoComprehensionScore"
                  value={formData.duolingoComprehensionScore || ''}
                  onChange={handleInputChange}
                  className="duolingoenglishtestssection-select"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Conversation Score */}
              <div className="duolingoenglishtestssection-form-group">
                <label className="duolingoenglishtestssection-question-label">Conversation Score</label>
                <select 
                  name="duolingoConversationScore"
                  value={formData.duolingoConversationScore || ''}
                  onChange={handleInputChange}
                  className="duolingoenglishtestssection-select"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Production Score */}
              <div className="duolingoenglishtestssection-form-group">
                <label className="duolingoenglishtestssection-question-label">Production Score</label>
                <select 
                  name="duolingoProductionScore"
                  value={formData.duolingoProductionScore || ''}
                  onChange={handleInputChange}
                  className="duolingoenglishtestssection-select"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Total Score */}
              <div className="duolingoenglishtestssection-form-group">
                <label className="duolingoenglishtestssection-question-label">Total Score</label>
                <select 
                  name="duolingoTotalScore"
                  value={formData.duolingoTotalScore || ''}
                  onChange={handleInputChange}
                  className="duolingoenglishtestssection-select"
                >
                  <option value="">Choose an option</option>
                  {scoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuolingoEnglishTestSection;