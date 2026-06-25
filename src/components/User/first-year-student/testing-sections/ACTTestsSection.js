// src/components/testing-sections/ACTTestsSection.js
import React, { useState, useEffect, useRef } from 'react';
import './ACTTestsSection.css';

const SCORE_OPTIONS = Array.from({ length: 37 }, (_, i) => ({
  value: String(i),
  label: String(i),
}));

const PERCENTILE_OPTIONS = Array.from({ length: 101 }, (_, i) => ({
  value: String(i),
  label: String(i),
}));

const YEAR_OPTIONS = (() => {
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let year = 1990; year <= currentYear; year += 1) {
    years.push({ value: String(year), label: String(year) });
  }
  return years;
})();

const ACTSelect = ({ value, options, placeholder, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`acttestssection-${Math.random().toString(36).slice(2)}-listbox`);
  const selectedValue = String(value ?? '');
  const selectedOption = options.find(option => String(option.value) === selectedValue);

  useEffect(() => {
    if (!isOpen) return undefined;

    const updateMenuDirection = () => {
      const rect = selectRef.current?.getBoundingClientRect();
      if (!rect) return;

      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      setOpensUpward(spaceBelow < 240 && spaceAbove > spaceBelow);
    };

    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    updateMenuDirection();
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updateMenuDirection);
    window.addEventListener('scroll', updateMenuDirection, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updateMenuDirection);
      window.removeEventListener('scroll', updateMenuDirection, true);
    };
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={selectRef}
      className={`acttestssection-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}
    >
      <button
        type="button"
        className={`acttestssection-select acttestssection-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxIdRef.current}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="acttestssection-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="acttestssection-select-menu" id={listboxIdRef.current} role="listbox">
          <button
            type="button"
            className={`acttestssection-select-option${selectedValue === '' ? ' is-selected' : ''}`}
            role="option"
            aria-selected={selectedValue === ''}
            onClick={() => handleSelect('')}
          >
            {placeholder}
          </button>

          {options.map(option => (
            <button
              type="button"
              key={option.value}
              className={`acttestssection-select-option${selectedValue === String(option.value) ? ' is-selected' : ''}`}
              role="option"
              aria-selected={selectedValue === String(option.value)}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
                    checked={Number(formData.pastACTScores) === num}
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
                          <ACTSelect
                            value={selectedYear || ''}
                            options={YEAR_OPTIONS}
                            placeholder="- Select Year -"
                            onChange={(nextValue) => handleYearSelect(index, nextValue)}
                          />
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
                      <ACTSelect
                        value={attempt.composite ?? ''}
                        options={SCORE_OPTIONS}
                        placeholder="Select"
                        onChange={(nextValue) => handleAttemptChange(index, 'composite', nextValue)}
                      />
                    </div>

                    {/* Section Scores - 4 columns */}
                    <div className="acttestssection-section-scores">
                      <div className="acttestssection-form-group">
                        <label className="acttestssection-question-label">English Score</label>
                        <ACTSelect
                          value={attempt.english ?? ''}
                          options={SCORE_OPTIONS}
                          placeholder="--"
                          onChange={(nextValue) => handleAttemptChange(index, 'english', nextValue)}
                        />
                      </div>

                      <div className="acttestssection-form-group">
                        <label className="acttestssection-question-label">Math Score</label>
                        <ACTSelect
                          value={attempt.math ?? ''}
                          options={SCORE_OPTIONS}
                          placeholder="--"
                          onChange={(nextValue) => handleAttemptChange(index, 'math', nextValue)}
                        />
                      </div>

                      <div className="acttestssection-form-group">
                        <label className="acttestssection-question-label">Reading Score</label>
                        <ACTSelect
                          value={attempt.reading ?? ''}
                          options={SCORE_OPTIONS}
                          placeholder="--"
                          onChange={(nextValue) => handleAttemptChange(index, 'reading', nextValue)}
                        />
                      </div>

                      <div className="acttestssection-form-group">
                        <label className="acttestssection-question-label">Science Score</label>
                        <ACTSelect
                          value={attempt.science ?? ''}
                          options={SCORE_OPTIONS}
                          placeholder="--"
                          onChange={(nextValue) => handleAttemptChange(index, 'science', nextValue)}
                        />
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
                      <ACTSelect
                        value={attempt.percentile ?? ''}
                        options={PERCENTILE_OPTIONS}
                        placeholder="Select"
                        onChange={(nextValue) => handleAttemptChange(index, 'percentile', nextValue)}
                      />
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
