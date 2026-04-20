// src/components/testing-sections/SATTestsSection.js
import React, { useState, useEffect } from 'react';
import './SATTestsSection.css';

const SATTestsSection = ({ 
  formData = {}, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [showDetailed, setShowDetailed] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(null);

  // Determine if we should show detailed form based on past tests
  useEffect(() => {
    const pastScores = parseInt(formData.pastSATScores || '0');
    setShowDetailed(pastScores > 0);
  }, [formData.pastSATScores]);

  // Score options for section scores (200-800)
  const sectionScoreOptions = Array.from({ length: 601 }, (_, i) => 800 - i);
  
  // Total score options (400-1600)
  const totalScoreOptions = Array.from({ length: 1201 }, (_, i) => 1600 - i);

  // Percentile options (0-100)
  const percentileOptions = Array.from({ length: 101 }, (_, i) => i);

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

  // Clear handlers
  const handleClearPastScores = () => {
    clearRelatedFields('pastSATScores', Object.keys(formData));
  };

  // Handle year selection for date picker
  const handleYearSelect = (index, year) => {
    setSelectedYear(year);
    setCurrentTestIndex(index);
    setShowCalendar(true);
  };

  // Handle month selection for date picker
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
  };

  // Confirm date selection
  const handleConfirmDate = () => {
    if (selectedMonth && selectedYear && currentTestIndex !== null) {
      const fullDate = `${selectedMonth} ${selectedYear}`;
      const event = {
        target: {
          name: `date_${currentTestIndex}`,
          value: fullDate
        }
      };
      handleInputChange(event);
      setShowCalendar(false);
      setSelectedYear(null);
      setSelectedMonth(null);
      setCurrentTestIndex(null);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.sat-calendar-container')) {
        setShowCalendar(false);
        setSelectedYear(null);
        setSelectedMonth(null);
        setCurrentTestIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  return (
    <div className="sat-container">
      <div className="sat-card">
        <div className="sat-card-header">
          <h2 className="sat-card-title">SAT Tests</h2>
          <div className="sat-status-badge">
            {formData.pastSATScores ? 'Complete' : 'In Progress'}
          </div>
        </div>

        <div className="sat-form-content">
          {/* ===== Past Attempts ===== */}
          <div className="sat-form-group">
            <label className="sat-question-label required">
              Number of past SAT scores you wish to report*
            </label>

            <div className="sat-radio-group-vertical">
              {[0, 1, 2, 3, 4, 5].map(num => (
                <label key={num} className="sat-radio-option">
                  <input
                    type="radio"
                    name="pastSATScores"
                    value={num}
                    checked={formData.pastSATScores == num}
                    onChange={handleInputChange}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              className="sat-clear-link"
              onClick={handleClearPastScores}
            >
              Clear
            </button>
          </div>

          {/* ===== Attempt-wise Data ===== */}
          {showDetailed &&
            Array.from(
              { length: parseInt(formData.pastSATScores || '0') },
              (_, index) => (
                <div key={index} className="sat-attempt-card">
                  <h3>Attempt {index + 1}</h3>

                  {/* Test Date */}
                  <div className="sat-form-group">
                    <label className="sat-question-label required">Test Date (YYYY-MM)*</label>
                    <div className="sat-input-container">
                      {!formData[`date_${index}`] ? (
                        <select
                          value={selectedYear || ''}
                          onChange={(e) => handleYearSelect(index, e.target.value)}
                          className="sat-select"
                        >
                          <option value="">- Select Year -</option>
                          {generateYears().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="sat-selected-date">
                          {formData[`date_${index}`]}
                          <button
                            type="button"
                            className="sat-change-date"
                            onClick={() => {
                              const event = { target: { name: `date_${index}`, value: '' } };
                              handleInputChange(event);
                            }}
                          >
                            Change
                          </button>
                        </div>
                      )}
                      <div className="sat-field-note">Date uses "month year" format (e.g., August 2020)</div>
                    </div>

                    {/* Calendar Popup */}
                    {showCalendar && currentTestIndex === index && (
                      <div className="sat-calendar-container">
                        <div className="sat-calendar-header">
                          Select Month for {selectedYear}
                        </div>
                        <div className="sat-calendar-grid">
                          {months.map(month => (
                            <button
                              key={month}
                              type="button"
                              className={`sat-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                              onClick={() => handleMonthSelect(month)}
                            >
                              {month}
                            </button>
                          ))}
                        </div>
                        <div className="sat-calendar-actions">
                          <button
                            type="button"
                            className="sat-calendar-confirm"
                            onClick={handleConfirmDate}
                            disabled={!selectedMonth || !selectedYear}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="sat-calendar-cancel"
                            onClick={() => {
                              setShowCalendar(false);
                              setSelectedYear(null);
                              setSelectedMonth(null);
                              setCurrentTestIndex(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total Score (400-1600) */}
                  <div className="sat-form-group">
                    <label className="sat-question-label">Total Score (400-1600)</label>
                    <select
                      name={`total_${index}`}
                      value={formData[`total_${index}`] || ''}
                      onChange={handleInputChange}
                      className="sat-select"
                    >
                      <option value="">Select</option>
                      {totalScoreOptions.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>

                  {/* Math Score (200-800) */}
                  <div className="sat-form-group">
                    <label className="sat-question-label">Math Score (200-800)</label>
                    <select
                      name={`math_${index}`}
                      value={formData[`math_${index}`] || ''}
                      onChange={handleInputChange}
                      className="sat-select"
                    >
                      <option value="">Select</option>
                      {sectionScoreOptions.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reading Score (200-800) */}
                  <div className="sat-form-group">
                    <label className="sat-question-label">Reading Score (200-800)</label>
                    <select
                      name={`reading_${index}`}
                      value={formData[`reading_${index}`] || ''}
                      onChange={handleInputChange}
                      className="sat-select"
                    >
                      <option value="">Select</option>
                      {sectionScoreOptions.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>

                  {/* Writing Score (200-800) */}
                  <div className="sat-form-group">
                    <label className="sat-question-label">Writing Score (200-800)</label>
                    <select
                      name={`writing_${index}`}
                      value={formData[`writing_${index}`] || ''}
                      onChange={handleInputChange}
                      className="sat-select"
                    >
                      <option value="">Select</option>
                      {sectionScoreOptions.map(score => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                  </div>

                  {/* Optional: Percentile */}
                  <div className="sat-form-group">
                    <label className="sat-question-label">Optional: Percentile</label>
                    <select
                      name={`percentile_${index}`}
                      value={formData[`percentile_${index}`] || ''}
                      onChange={handleInputChange}
                      className="sat-select"
                    >
                      <option value="">Select</option>
                      {percentileOptions.map(percentile => (
                        <option key={percentile} value={percentile}>{percentile}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            )}

          {/* Helper */}
          <div className="sat-form-helper">
            * Required fields. Enter accurate SAT scores for better college recommendations.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SATTestsSection;