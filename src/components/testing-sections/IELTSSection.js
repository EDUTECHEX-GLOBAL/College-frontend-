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
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);

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
    if (!formData.ieltsPastTests) return false;
    
    const pastTests = parseInt(formData.ieltsPastTests);
    
    // If past tests > 0, check all score fields and test date
    if (pastTests > 0) {
      if (!formData.ieltsTestDate) return false;
      if (!formData.ieltsListeningScore) return false;
      if (!formData.ieltsReadingScore) return false;
      if (!formData.ieltsWritingScore) return false;
      if (!formData.ieltsSpeakingScore) return false;
      if (!formData.ieltsOverallBandScore) return false;
    }
    
    return true;
  };

  // Handle clearing past IELTS tests and related fields
  const handleClearPastTests = () => {
    clearRelatedFields('ieltsPastTests', [
      'ieltsTestDate',
      'ieltsListeningScore',
      'ieltsReadingScore',
      'ieltsWritingScore',
      'ieltsSpeakingScore',
      'ieltsOverallBandScore'
    ]);
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
      if (showCalendar && !event.target.closest('.ieltssection-calendar-container')) {
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
    <div className="ieltssection-container">
      <div className="ieltssection-card">
        <div className="ieltssection-card-header">
          <h2 className="ieltssection-card-title">IELTS</h2>
          <div className="ieltssection-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="ieltssection-form-content">
          {/* Have you taken the IELTS? */}
          <div className="ieltssection-form-group">
            <label className="ieltssection-question-label required">
              Have you taken the IELTS?*
            </label>
            <div className="ieltssection-radio-group-vertical">
              <label className="ieltssection-radio-option">
                <input
                  type="radio"
                  name="ieltsPastTests"
                  value="1"
                  checked={formData.ieltsPastTests === '1'}
                  onChange={handleInputChange}
                />
                <span>Yes</span>
              </label>
              <label className="ieltssection-radio-option">
                <input
                  type="radio"
                  name="ieltsPastTests"
                  value="0"
                  checked={formData.ieltsPastTests === '0'}
                  onChange={handleInputChange}
                />
                <span>No</span>
              </label>
            </div>
            <button 
              type="button" 
              className="ieltssection-clear-link"
              onClick={handleClearPastTests}
              disabled={!formData.ieltsPastTests}
            >
              Clear answer
            </button>
          </div>

          {/* Score Form - Only show if past tests = Yes */}
          {showScoreForm && (
            <div className="ieltssection-detailed-fields">
              {/* Test Date */}
              <div className="ieltssection-form-group">
                <label className="ieltssection-question-label required">Test Date*</label>
                <div className="ieltssection-input-container">
                  {!formData.ieltsTestDate ? (
                    <select
                      value={selectedYear || ''}
                      onChange={(e) => handleYearSelect('ieltsTestDate', e.target.value)}
                      className="ieltssection-select"
                    >
                      <option value="">- Select Year -</option>
                      {generateYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="ieltssection-selected-date">
                      {formData.ieltsTestDate}
                      <button
                        type="button"
                        className="ieltssection-change-date"
                        onClick={() => {
                          const event = { target: { name: 'ieltsTestDate', value: '' } };
                          handleInputChange(event);
                        }}
                      >
                        Change
                      </button>
                    </div>
                  )}
                  <div className="ieltssection-field-note">Date uses "month year" format (e.g., August 2020)</div>
                </div>

                {/* Calendar Popup */}
                {showCalendar && currentDateField === 'ieltsTestDate' && (
                  <div className="ieltssection-calendar-container">
                    <div className="ieltssection-calendar-header">
                      Select Month for {selectedYear}
                    </div>
                    <div className="ieltssection-calendar-grid">
                      {months.map(month => (
                        <button
                          key={month}
                          type="button"
                          className={`ieltssection-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                          onClick={() => handleMonthSelect(month)}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                    <div className="ieltssection-calendar-actions">
                      <button
                        type="button"
                        className="ieltssection-calendar-confirm"
                        onClick={handleConfirmDate}
                        disabled={!selectedMonth || !selectedYear}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="ieltssection-calendar-cancel"
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
              <div className="ieltssection-form-group">
                <label className="ieltssection-question-label">Listening Score</label>
                <select 
                  name="ieltsListeningScore"
                  value={formData.ieltsListeningScore || ''}
                  onChange={handleInputChange}
                  className="ieltssection-select"
                >
                  <option value="">Choose an option</option>
                  {bandScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Reading Score */}
              <div className="ieltssection-form-group">
                <label className="ieltssection-question-label">Reading Score</label>
                <select 
                  name="ieltsReadingScore"
                  value={formData.ieltsReadingScore || ''}
                  onChange={handleInputChange}
                  className="ieltssection-select"
                >
                  <option value="">Choose an option</option>
                  {bandScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Writing Score */}
              <div className="ieltssection-form-group">
                <label className="ieltssection-question-label">Writing Score</label>
                <select 
                  name="ieltsWritingScore"
                  value={formData.ieltsWritingScore || ''}
                  onChange={handleInputChange}
                  className="ieltssection-select"
                >
                  <option value="">Choose an option</option>
                  {bandScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Speaking Score */}
              <div className="ieltssection-form-group">
                <label className="ieltssection-question-label">Speaking Score</label>
                <select 
                  name="ieltsSpeakingScore"
                  value={formData.ieltsSpeakingScore || ''}
                  onChange={handleInputChange}
                  className="ieltssection-select"
                >
                  <option value="">Choose an option</option>
                  {bandScores.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Overall Band Score */}
              <div className="ieltssection-form-group">
                <label className="ieltssection-question-label">Overall Band Score</label>
                <select 
                  name="ieltsOverallBandScore"
                  value={formData.ieltsOverallBandScore || ''}
                  onChange={handleInputChange}
                  className="ieltssection-select"
                >
                  <option value="">Choose an option</option>
                  {bandScores.map(score => (
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

export default IELTSSection;