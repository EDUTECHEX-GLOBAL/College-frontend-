// src/components/testing-sections/IELTSSection.js
import React, { useState, useEffect, useRef } from 'react';
import './IELTSSection.css';

const IELTSSelect = ({ value, options, placeholder, onChange, menuPlacement = 'auto' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`ielts-select-${Math.random().toString(36).slice(2)}-listbox`);
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
    <div ref={selectRef} className={`ieltssection-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}>
      <button
        type="button"
        className={`ieltssection-select ieltssection-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
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
        <span className="ieltssection-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="ieltssection-select-menu" id={listboxIdRef.current} role="listbox">
          <button type="button" className={`ieltssection-select-option${selectedValue === '' ? ' is-selected' : ''}`} role="option" aria-selected={selectedValue === ''} onClick={() => handleSelect('')}>
            {placeholder}
          </button>
          {options.map(option => (
            <button type="button" key={option.value} className={`ieltssection-select-option${selectedValue === String(option.value) ? ' is-selected' : ''}`} role="option" aria-selected={selectedValue === String(option.value)} onClick={() => handleSelect(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const bandScoreOptions = bandScores.map(score => ({ value: score, label: score }));

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
                    <IELTSSelect
                      value={selectedYear || ''}
                      options={yearOptions}
                      placeholder="- Select Year -"
                      menuPlacement="up"
                      onChange={(nextValue) => handleYearSelect('ieltsTestDate', nextValue)}
                    />
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
                <IELTSSelect
                  value={formData.ieltsListeningScore || ''}
                  options={bandScoreOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('ieltsListeningScore', nextValue)}
                />
              </div>

              {/* Reading Score */}
              <div className="ieltssection-form-group">
                <label className="ieltssection-question-label">Reading Score</label>
                <IELTSSelect
                  value={formData.ieltsReadingScore || ''}
                  options={bandScoreOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('ieltsReadingScore', nextValue)}
                />
              </div>

              {/* Writing Score */}
              <div className="ieltssection-form-group">
                <label className="ieltssection-question-label">Writing Score</label>
                <IELTSSelect
                  value={formData.ieltsWritingScore || ''}
                  options={bandScoreOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('ieltsWritingScore', nextValue)}
                />
              </div>

              {/* Speaking Score */}
              <div className="ieltssection-form-group">
                <label className="ieltssection-question-label">Speaking Score</label>
                <IELTSSelect
                  value={formData.ieltsSpeakingScore || ''}
                  options={bandScoreOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('ieltsSpeakingScore', nextValue)}
                />
              </div>

              {/* Overall Band Score */}
              <div className="ieltssection-form-group">
                <label className="ieltssection-question-label">Overall Band Score</label>
                <IELTSSelect
                  value={formData.ieltsOverallBandScore || ''}
                  options={bandScoreOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('ieltsOverallBandScore', nextValue)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IELTSSection;
