// src/components/testing-sections/TOEFLiBTSection.js
import React, { useState, useEffect, useRef } from 'react';
import './TOEFLiBTSection.css';

const TOEFLSelect = ({ value, options, placeholder, onChange, menuPlacement = 'auto' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`toefl-select-${Math.random().toString(36).slice(2)}-listbox`);
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
    <div ref={selectRef} className={`toefl-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}>
      <button
        type="button"
        className={`toefl-select toefl-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
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
        <span className="toefl-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="toefl-select-menu" id={listboxIdRef.current} role="listbox">
          <button type="button" className={`toefl-select-option${selectedValue === '' ? ' is-selected' : ''}`} role="option" aria-selected={selectedValue === ''} onClick={() => handleSelect('')}>
            {placeholder}
          </button>
          {options.map(option => (
            <button type="button" key={option.value} className={`toefl-select-option${selectedValue === String(option.value) ? ' is-selected' : ''}`} role="option" aria-selected={selectedValue === String(option.value)} onClick={() => handleSelect(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const sectionScoreSelectOptions = sectionScoreOptions.map(score => ({ value: String(score), label: String(score) }));
  
  // Total score options 0-120
  const totalScoreOptions = Array.from({ length: 121 }, (_, i) => i);
  const totalScoreSelectOptions = totalScoreOptions.map(score => ({ value: String(score), label: String(score) }));

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const yearOptions = Array.from({ length: 37 }, (_, i) => {
    const year = 1990 + i;
    return { value: String(year), label: String(year) };
  });

  const updateField = (name, value) => {
    handleInputChange({ target: { name, value } });
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
                    <TOEFLSelect
                      value={selectedYear || ''}
                      options={yearOptions}
                      placeholder="- Select Year -"
                      menuPlacement="up"
                      onChange={(nextValue) => handleYearSelect('toeflTestDate', nextValue)}
                    />
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
                <TOEFLSelect
                  value={formData.toeflReadingScore || ''}
                  options={sectionScoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('toeflReadingScore', nextValue)}
                />
              </div>

              {/* Listening Score */}
              <div className="toefl-form-group">
                <label className="toefl-question-label">Listening Score (0-30)</label>
                <TOEFLSelect
                  value={formData.toeflListeningScore || ''}
                  options={sectionScoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('toeflListeningScore', nextValue)}
                />
              </div>

              {/* Speaking Score */}
              <div className="toefl-form-group">
                <label className="toefl-question-label">Speaking Score (0-30)</label>
                <TOEFLSelect
                  value={formData.toeflSpeakingScore || ''}
                  options={sectionScoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('toeflSpeakingScore', nextValue)}
                />
              </div>

              {/* Writing Score */}
              <div className="toefl-form-group">
                <label className="toefl-question-label">Writing Score (0-30)</label>
                <TOEFLSelect
                  value={formData.toeflWritingScore || ''}
                  options={sectionScoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('toeflWritingScore', nextValue)}
                />
              </div>

              {/* Total Score */}
              <div className="toefl-form-group">
                <label className="toefl-question-label">Total Score (0-120)</label>
                <TOEFLSelect
                  value={formData.toeflTotalScore || ''}
                  options={totalScoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('toeflTotalScore', nextValue)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TOEFLiBTSection;
