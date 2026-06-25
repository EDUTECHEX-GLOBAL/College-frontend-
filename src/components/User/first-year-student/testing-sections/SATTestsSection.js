// src/components/testing-sections/SATTestsSection.js
import React, { useState, useEffect, useRef } from 'react';
import './SATTestsSection.css';

const SECTION_SCORE_OPTIONS = Array.from({ length: 601 }, (_, i) => {
  const score = 800 - i;
  return { value: String(score), label: String(score) };
});

const TOTAL_SCORE_OPTIONS = Array.from({ length: 1201 }, (_, i) => {
  const score = 1600 - i;
  return { value: String(score), label: String(score) };
});

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

const SATSelect = ({ value, options, placeholder, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`sat-${Math.random().toString(36).slice(2)}-listbox`);
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
      className={`sat-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}
    >
      <button
        type="button"
        className={`sat-select sat-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxIdRef.current}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="sat-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="sat-select-menu" id={listboxIdRef.current} role="listbox">
          <button
            type="button"
            className={`sat-select-option${selectedValue === '' ? ' is-selected' : ''}`}
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
              className={`sat-select-option${selectedValue === String(option.value) ? ' is-selected' : ''}`}
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
                    checked={Number(formData.pastSATScores) === num}
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
                        <SATSelect
                          value={selectedYear || ''}
                          options={YEAR_OPTIONS}
                          placeholder="- Select Year -"
                          onChange={(nextValue) => handleYearSelect(index, nextValue)}
                        />
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
                    <SATSelect
                      value={formData[`total_${index}`] ?? ''}
                      options={TOTAL_SCORE_OPTIONS}
                      placeholder="Select"
                      onChange={(nextValue) =>
                        handleInputChange({ target: { name: `total_${index}`, value: nextValue } })
                      }
                    />
                  </div>

                  {/* Math Score (200-800) */}
                  <div className="sat-form-group">
                    <label className="sat-question-label">Math Score (200-800)</label>
                    <SATSelect
                      value={formData[`math_${index}`] ?? ''}
                      options={SECTION_SCORE_OPTIONS}
                      placeholder="Select"
                      onChange={(nextValue) =>
                        handleInputChange({ target: { name: `math_${index}`, value: nextValue } })
                      }
                    />
                  </div>

                  {/* Reading Score (200-800) */}
                  <div className="sat-form-group">
                    <label className="sat-question-label">Reading Score (200-800)</label>
                    <SATSelect
                      value={formData[`reading_${index}`] ?? ''}
                      options={SECTION_SCORE_OPTIONS}
                      placeholder="Select"
                      onChange={(nextValue) =>
                        handleInputChange({ target: { name: `reading_${index}`, value: nextValue } })
                      }
                    />
                  </div>

                  {/* Writing Score (200-800) */}
                  <div className="sat-form-group">
                    <label className="sat-question-label">Writing Score (200-800)</label>
                    <SATSelect
                      value={formData[`writing_${index}`] ?? ''}
                      options={SECTION_SCORE_OPTIONS}
                      placeholder="Select"
                      onChange={(nextValue) =>
                        handleInputChange({ target: { name: `writing_${index}`, value: nextValue } })
                      }
                    />
                  </div>

                  {/* Optional: Percentile */}
                  <div className="sat-form-group">
                    <label className="sat-question-label">Optional: Percentile</label>
                    <SATSelect
                      value={formData[`percentile_${index}`] ?? ''}
                      options={PERCENTILE_OPTIONS}
                      placeholder="Select"
                      onChange={(nextValue) =>
                        handleInputChange({ target: { name: `percentile_${index}`, value: nextValue } })
                      }
                    />
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
