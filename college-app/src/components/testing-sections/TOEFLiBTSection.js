// src/components/testing-sections/TOEFLiBTSection.js
import React, { useState, useEffect } from 'react';
import './TOEFLiBTSection.css';

const TOEFLiBTSection = ({
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
    const pastTests = parseInt(formData.toeflPastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.toeflPastTests]);

  // Score options 0-30 for individual sections
  const sectionScoreOptions = Array.from({ length: 31 }, (_, i) => i);
  
  // Total score options 0-120
  const totalScoreOptions = Array.from({ length: 121 }, (_, i) => i);

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

  // Handle clearing past TOEFL tests and related fields
  const handleClearPastTests = () => {
    if (clearRelatedFields) {
      clearRelatedFields('toeflPastTests', [
        'toeflTestDate',
        'toeflReadingScore',
        'toeflListeningScore',
        'toeflSpeakingScore',
        'toeflWritingScore',
        'toeflTotalScore'
      ]);
    } else if (clearAnswer) {
      clearAnswer('toeflPastTests');
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
      if (showCalendar && !event.target.closest('.toefl-calendar-container')) {
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

  const hasPastTestsValue = formData.toeflPastTests !== undefined && 
                            formData.toeflPastTests !== '' && 
                            formData.toeflPastTests !== null;

  return (
    <div className="toefl-container">
      <div className="toefl-card">
        <div className="toefl-card-header">
          <h2 className="toefl-card-title">TOEFL iBT</h2>
          <div className="toefl-status-badge">
            {hasPastTestsValue ? 'Complete' : 'In Progress'}
          </div>
        </div>

        <div className="toefl-form-content">
          {/* Have you taken the TOEFL iBT? */}
          <div className="toefl-form-group">
            <label className="toefl-question-label required">
              Have you taken the TOEFL iBT?*
            </label>
            <div className="toefl-radio-group-vertical">
              <label className="toefl-radio-option">
                <input
                  type="radio"
                  name="toeflPastTests"
                  value="1"
                  checked={formData.toeflPastTests === '1'}
                  onChange={handleInputChange}
                />
                <span>Yes</span>
              </label>
              <label className="toefl-radio-option">
                <input
                  type="radio"
                  name="toeflPastTests"
                  value="0"
                  checked={formData.toeflPastTests === '0'}
                  onChange={handleInputChange}
                />
                <span>No</span>
              </label>
            </div>
            {hasPastTestsValue && (
              <button 
                type="button" 
                className="toefl-clear-link"
                onClick={handleClearPastTests}
              >
                Clear answer
              </button>
            )}
          </div>

          {/* Score Form - Only show if past tests = Yes */}
          {showScoreForm && (
            <div className="toefl-detailed-fields">
              {/* Test Date */}
              <div className="toefl-form-group">
                <label className="toefl-question-label required">Test Date*</label>
                <div className="toefl-input-container">
                  {!formData.toeflTestDate ? (
                    <select
                      value={selectedYear || ''}
                      onChange={(e) => handleYearSelect('toeflTestDate', e.target.value)}
                      className="toefl-select"
                    >
                      <option value="">- Select Year -</option>
                      {generateYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="toefl-selected-date">
                      {formData.toeflTestDate}
                      <button
                        type="button"
                        className="toefl-change-date"
                        onClick={() => {
                          const event = { target: { name: 'toeflTestDate', value: '' } };
                          handleInputChange(event);
                        }}
                      >
                        Change
                      </button>
                    </div>
                  )}
                  <div className="toefl-field-note">Date uses "month year" format (e.g., August 2020)</div>
                </div>

                {/* Calendar Popup */}
                {showCalendar && currentDateField === 'toeflTestDate' && (
                  <div className="toefl-calendar-container">
                    <div className="toefl-calendar-header">
                      Select Month for {selectedYear}
                    </div>
                    <div className="toefl-calendar-grid">
                      {months.map(month => (
                        <button
                          key={month}
                          type="button"
                          className={`toefl-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                          onClick={() => handleMonthSelect(month)}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                    <div className="toefl-calendar-actions">
                      <button
                        type="button"
                        className="toefl-calendar-confirm"
                        onClick={handleConfirmDate}
                        disabled={!selectedMonth || !selectedYear}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="toefl-calendar-cancel"
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

              {/* Reading Score */}
              <div className="toefl-form-group">
                <label className="toefl-question-label">Reading Score (0-30)</label>
                <select 
                  name="toeflReadingScore"
                  value={formData.toeflReadingScore || ''}
                  onChange={handleInputChange}
                  className="toefl-select"
                >
                  <option value="">Choose an option</option>
                  {sectionScoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Listening Score */}
              <div className="toefl-form-group">
                <label className="toefl-question-label">Listening Score (0-30)</label>
                <select 
                  name="toeflListeningScore"
                  value={formData.toeflListeningScore || ''}
                  onChange={handleInputChange}
                  className="toefl-select"
                >
                  <option value="">Choose an option</option>
                  {sectionScoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Speaking Score */}
              <div className="toefl-form-group">
                <label className="toefl-question-label">Speaking Score (0-30)</label>
                <select 
                  name="toeflSpeakingScore"
                  value={formData.toeflSpeakingScore || ''}
                  onChange={handleInputChange}
                  className="toefl-select"
                >
                  <option value="">Choose an option</option>
                  {sectionScoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Writing Score */}
              <div className="toefl-form-group">
                <label className="toefl-question-label">Writing Score (0-30)</label>
                <select 
                  name="toeflWritingScore"
                  value={formData.toeflWritingScore || ''}
                  onChange={handleInputChange}
                  className="toefl-select"
                >
                  <option value="">Choose an option</option>
                  {sectionScoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Total Score */}
              <div className="toefl-form-group">
                <label className="toefl-question-label">Total Score (0-120)</label>
                <select 
                  name="toeflTotalScore"
                  value={formData.toeflTotalScore || ''}
                  onChange={handleInputChange}
                  className="toefl-select"
                >
                  <option value="">Choose an option</option>
                  {totalScoreOptions.map(score => (
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

export default TOEFLiBTSection;