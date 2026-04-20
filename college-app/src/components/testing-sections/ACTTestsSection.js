// src/components/testing-sections/ACTTestsSection.js
import React, { useState, useEffect } from 'react';
import './ACTTestsSection.css';

const ACTTestsSection = ({
  formData,
  handleInputChange,
  clearAnswer,
  clearRelatedFields
}) => {
  const [showDetailed, setShowDetailed] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(null);

  useEffect(() => {
    const pastScores = parseInt(formData.pastACTScores || '0');
    setShowDetailed(pastScores > 0);
  }, [formData.pastACTScores]);

  const scores = Array.from({ length: 37 }, (_, i) => i);
  const writingScores = Array.from({ length: 13 }, (_, i) => i); // 0-12 for writing
  const percentileOptions = Array.from({ length: 101 }, (_, i) => i);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generateYears = () => {
    const years = [];
    for (let year = 1990; year <= 2026; year++) {
      years.push(year);
    }
    return years;
  };

  const handleClearPastScores = () => {
    clearRelatedFields('pastACTScores', ['actAttempts']);
  };

  // Handle attempt field changes using array structure
  const handleAttemptChange = (index, field, value) => {
    const currentAttempts = formData.actAttempts || [];
    const updatedAttempts = [...currentAttempts];
    
    if (!updatedAttempts[index]) {
      updatedAttempts[index] = {};
    }
    
    updatedAttempts[index][field] = value;
    
    handleInputChange({
      target: {
        name: 'actAttempts',
        value: updatedAttempts
      }
    });
  };

  // Handle year selection for date picker
  const handleYearSelect = (index, year) => {
    setSelectedYear(year);
    setCurrentAttemptIndex(index);
    setShowCalendar(true);
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
  };

  const handleConfirmDate = () => {
    if (selectedMonth && selectedYear && currentAttemptIndex !== null) {
      const fullDate = `${selectedMonth} ${selectedYear}`;
      handleAttemptChange(currentAttemptIndex, 'date', fullDate);
      setShowCalendar(false);
      setSelectedYear(null);
      setSelectedMonth(null);
      setCurrentAttemptIndex(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.acttestssection-calendar-container')) {
        setShowCalendar(false);
        setSelectedYear(null);
        setSelectedMonth(null);
        setCurrentAttemptIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const actAttempts = formData.actAttempts || [];

  // Debug logging
  console.log('ACT Section - formData.pastACTScores:', formData.pastACTScores);
  console.log('ACT Section - actAttempts:', actAttempts);

  return (
    <div className="acttestssection-container">
      <div className="acttestssection-card">
        <div className="acttestssection-card-header">
          <h2 className="acttestssection-card-title">ACT Tests</h2>
          <div className="acttestssection-status-badge">
            {formData.pastACTScores ? 'Complete' : 'In Progress'}
          </div>
        </div>

        <div className="acttestssection-form-content">
          {/* ===== Past Attempts ===== */}
          <div className="acttestssection-form-group">
            <label className="acttestssection-question-label required">
              Number of past ACT attempts*
            </label>

            <div className="acttestssection-radio-group-vertical">
              {[0, 1, 2, 3].map(num => (
                <label key={num} className="acttestssection-radio-option">
                  <input
                    type="radio"
                    name="pastACTScores"
                    value={num}
                    checked={formData.pastACTScores == num}
                    onChange={handleInputChange}
                  />
                  <span>{num}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              className="acttestssection-clear-link"
              onClick={handleClearPastScores}
            >
              Clear
            </button>
          </div>

          {/* ===== Attempt-wise Data ===== */}
          {showDetailed &&
            Array.from(
              { length: parseInt(formData.pastACTScores || '0') },
              (_, index) => {
                const attempt = actAttempts[index] || {};
                return (
                  <div key={index} className="acttestssection-attempt-card">
                    <h3>Attempt {index + 1}</h3>

                    {/* Test Date */}
                    <div className="acttestssection-form-group">
                      <label className="acttestssection-question-label required">Test Date (YYYY-MM)*</label>
                      <div className="acttestssection-input-container">
                        {!attempt.date ? (
                          <select
                            value={selectedYear || ''}
                            onChange={(e) => handleYearSelect(index, e.target.value)}
                            className="acttestssection-select"
                          >
                            <option value="">- Select Year -</option>
                            {generateYears().map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="acttestssection-selected-date">
                            {attempt.date}
                            <button
                              type="button"
                              className="acttestssection-change-date"
                              onClick={() => handleAttemptChange(index, 'date', '')}
                            >
                              Change
                            </button>
                          </div>
                        )}
                        <div className="acttestssection-field-note">Date uses "month year" format (e.g., August 2020)</div>
                      </div>

                      {/* Calendar Popup */}
                      {showCalendar && currentAttemptIndex === index && (
                        <div className="acttestssection-calendar-container">
                          <div className="acttestssection-calendar-header">
                            Select Month for {selectedYear}
                          </div>
                          <div className="acttestssection-calendar-grid">
                            {months.map(month => (
                              <button
                                key={month}
                                type="button"
                                className={`acttestssection-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                                onClick={() => handleMonthSelect(month)}
                              >
                                {month}
                              </button>
                            ))}
                          </div>
                          <div className="acttestssection-calendar-actions">
                            <button
                              type="button"
                              className="acttestssection-calendar-confirm"
                              onClick={handleConfirmDate}
                              disabled={!selectedMonth || !selectedYear}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="acttestssection-calendar-cancel"
                              onClick={() => {
                                setShowCalendar(false);
                                setSelectedYear(null);
                                setSelectedMonth(null);
                                setCurrentAttemptIndex(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Composite Score */}
                    <div className="acttestssection-form-group">
                      <label className="acttestssection-question-label">Composite Score (0-36)</label>
                      <select
                        value={attempt.composite || ''}
                        onChange={(e) => handleAttemptChange(index, 'composite', e.target.value)}
                        className="acttestssection-select"
                      >
                        <option value="">Select</option>
                        {scores.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Section Scores - 4 columns */}
                    <div className="acttestssection-section-scores">
                      <div className="acttestssection-form-group">
                        <label className="acttestssection-question-label">English Score</label>
                        <select
                          value={attempt.english || ''}
                          onChange={(e) => handleAttemptChange(index, 'english', e.target.value)}
                          className="acttestssection-select"
                        >
                          <option value="">--</option>
                          {scores.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="acttestssection-form-group">
                        <label className="acttestssection-question-label">Math Score</label>
                        <select
                          value={attempt.math || ''}
                          onChange={(e) => handleAttemptChange(index, 'math', e.target.value)}
                          className="acttestssection-select"
                        >
                          <option value="">--</option>
                          {scores.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="acttestssection-form-group">
                        <label className="acttestssection-question-label">Reading Score</label>
                        <select
                          value={attempt.reading || ''}
                          onChange={(e) => handleAttemptChange(index, 'reading', e.target.value)}
                          className="acttestssection-select"
                        >
                          <option value="">--</option>
                          {scores.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="acttestssection-form-group">
                        <label className="acttestssection-question-label">Science Score</label>
                        <select
                          value={attempt.science || ''}
                          onChange={(e) => handleAttemptChange(index, 'science', e.target.value)}
                          className="acttestssection-select"
                        >
                          <option value="">--</option>
                          {scores.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Optional: Writing Score */}
                    <div className="acttestssection-form-group">
                      <label className="acttestssection-question-label">Optional: Writing Score</label>
                      <input
                        type="number"
                        value={attempt.writing || ''}
                        onChange={(e) => handleAttemptChange(index, 'writing', e.target.value)}
                        placeholder="e.g. 8 (0-12 scale)"
                        className="acttestssection-date-input"
                        min="0"
                        max="12"
                      />
                    </div>

                    {/* Optional: Percentile */}
                    <div className="acttestssection-form-group">
                      <label className="acttestssection-question-label">Optional: Percentile</label>
                      <select
                        value={attempt.percentile || ''}
                        onChange={(e) => handleAttemptChange(index, 'percentile', e.target.value)}
                        className="acttestssection-select"
                      >
                        <option value="">Select</option>
                        {percentileOptions.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              }
            )}

          {/* Helper */}
          <div className="acttestssection-form-helper">
            * Required fields. Enter accurate ACT scores for better college recommendations.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ACTTestsSection;