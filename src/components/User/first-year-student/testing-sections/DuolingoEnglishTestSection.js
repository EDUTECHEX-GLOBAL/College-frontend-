// src/components/testing-sections/DuolingoEnglishTestSection.js
import React, { useState, useEffect, useRef } from 'react';
import './DuolingoEnglishTestSection.css';

const DuolingoSelect = ({ value, options, placeholder, onChange, menuPlacement = 'auto' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`duolingo-select-${Math.random().toString(36).slice(2)}-listbox`);
  const selectedValue = String(value ?? '');
  const selectedOption = options.find(option => String(option.value) === selectedValue);

  useEffect(() => {
    if (!isOpen) return undefined;

    const updateMenuDirection = () => {
      if (menuPlacement === 'up') {
        setOpensUpward(true);
        return;
      }

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
  }, [isOpen, menuPlacement]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={`duolingoenglishtestssection-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}>
      <button
        type="button"
        className={`duolingoenglishtestssection-select duolingoenglishtestssection-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxIdRef.current}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="duolingoenglishtestssection-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="duolingoenglishtestssection-select-menu" id={listboxIdRef.current} role="listbox">
          <button type="button" className={`duolingoenglishtestssection-select-option${selectedValue === '' ? ' is-selected' : ''}`} role="option" aria-selected={selectedValue === ''} onClick={() => handleSelect('')}>
            {placeholder}
          </button>
          {options.map(option => (
            <button type="button" key={option.value} className={`duolingoenglishtestssection-select-option${selectedValue === String(option.value) ? ' is-selected' : ''}`} role="option" aria-selected={selectedValue === String(option.value)} onClick={() => handleSelect(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const scoreSelectOptions = scoreOptions.map(score => ({ value: String(score), label: String(score) }));

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const yearOptions = Array.from({ length: 27 }, (_, i) => {
    const year = 2000 + i;
    return { value: String(year), label: String(year) };
  });

  const updateField = (name, value) => {
    handleInputChange({ target: { name, value } });
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
                    <DuolingoSelect
                      value={selectedYear || ''}
                      options={yearOptions}
                      placeholder="- Select Year -"
                      menuPlacement="up"
                      onChange={(nextValue) => handleYearSelect('duolingoTestDate', nextValue)}
                    />
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
                <DuolingoSelect
                  value={formData.duolingoLiteracyScore || ''}
                  options={scoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('duolingoLiteracyScore', nextValue)}
                />
              </div>

              {/* Comprehension Score */}
              <div className="duolingoenglishtestssection-form-group">
                <label className="duolingoenglishtestssection-question-label">Comprehension Score</label>
                <DuolingoSelect
                  value={formData.duolingoComprehensionScore || ''}
                  options={scoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('duolingoComprehensionScore', nextValue)}
                />
              </div>

              {/* Conversation Score */}
              <div className="duolingoenglishtestssection-form-group">
                <label className="duolingoenglishtestssection-question-label">Conversation Score</label>
                <DuolingoSelect
                  value={formData.duolingoConversationScore || ''}
                  options={scoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('duolingoConversationScore', nextValue)}
                />
              </div>

              {/* Production Score */}
              <div className="duolingoenglishtestssection-form-group">
                <label className="duolingoenglishtestssection-question-label">Production Score</label>
                <DuolingoSelect
                  value={formData.duolingoProductionScore || ''}
                  options={scoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('duolingoProductionScore', nextValue)}
                />
              </div>

              {/* Total Score */}
              <div className="duolingoenglishtestssection-form-group">
                <label className="duolingoenglishtestssection-question-label">Total Score</label>
                <DuolingoSelect
                  value={formData.duolingoTotalScore || ''}
                  options={scoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('duolingoTotalScore', nextValue)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuolingoEnglishTestSection;
