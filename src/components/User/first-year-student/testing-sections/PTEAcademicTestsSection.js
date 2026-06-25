// src/components/testing-sections/PTEAcademicTestsSection.js
import React, { useState, useEffect, useRef } from 'react';
import './PTEAcademicTestsSection.css';

const PTESelect = ({ value, options, placeholder, onChange, menuPlacement = 'auto' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`pte-select-${Math.random().toString(36).slice(2)}-listbox`);
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
    <div ref={selectRef} className={`pteacademictestssection-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}>
      <button
        type="button"
        className={`pteacademictestssection-select pteacademictestssection-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
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
        <span className="pteacademictestssection-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="pteacademictestssection-select-menu" id={listboxIdRef.current} role="listbox">
          <button type="button" className={`pteacademictestssection-select-option${selectedValue === '' ? ' is-selected' : ''}`} role="option" aria-selected={selectedValue === ''} onClick={() => handleSelect('')}>
            {placeholder}
          </button>
          {options.map(option => (
            <button type="button" key={option.value} className={`pteacademictestssection-select-option${selectedValue === String(option.value) ? ' is-selected' : ''}`} role="option" aria-selected={selectedValue === String(option.value)} onClick={() => handleSelect(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PTEAcademicTestsSection = ({ 
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
    const pastTests = parseInt(formData.ptePastTests || '0');
    setShowScoreForm(pastTests > 0);
  }, [formData.ptePastTests]);

  // Score options for dropdowns (0-90 for PTE)
  const scoreOptions = Array.from({ length: 91 }, (_, i) => i);
  const scoreSelectOptions = scoreOptions.map(score => ({ value: String(score), label: String(score) }));

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
    if (!formData.ptePastTests) return false;
    
    const pastTests = parseInt(formData.ptePastTests);
    
    // If past tests > 0, check test date and core scores
    if (pastTests > 0) {
      if (!formData.pteTestDate) return false;
      if (!formData.pteListeningScore) return false;
      if (!formData.pteReadingScore) return false;
      if (!formData.pteSpeakingScore) return false;
      if (!formData.pteWritingScore) return false;
    }
    
    return true;
  };

  // Handle clearing past PTE tests and related fields
  const handleClearPastTests = () => {
    if (clearRelatedFields) {
      clearRelatedFields('ptePastTests', [
        'pteTestDate',
        'pteListeningScore',
        'pteReadingScore',
        'pteSpeakingScore',
        'pteWritingScore',
        'pteGrammarScore',
        'pteVocabularyScore'
      ]);
    } else if (clearAnswer) {
      clearAnswer('ptePastTests');
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
      if (showCalendar && !event.target.closest('.pteacademictestssection-calendar-container')) {
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
    <div className="pteacademictestssection-container">
      <div className="pteacademictestssection-card">
        <div className="pteacademictestssection-card-header">
          <h2 className="pteacademictestssection-card-title">PTE Academic</h2>
          <div className="pteacademictestssection-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="pteacademictestssection-form-content">
          {/* Have you taken the PTE Academic Test? */}
          <div className="pteacademictestssection-form-group">
            <label className="pteacademictestssection-question-label required">
              Have you taken the PTE Academic Test?*
            </label>
            <div className="pteacademictestssection-radio-group-vertical">
              <label className="pteacademictestssection-radio-option">
                <input
                  type="radio"
                  name="ptePastTests"
                  value="1"
                  checked={formData.ptePastTests === '1'}
                  onChange={handleInputChange}
                />
                <span>Yes</span>
              </label>
              <label className="pteacademictestssection-radio-option">
                <input
                  type="radio"
                  name="ptePastTests"
                  value="0"
                  checked={formData.ptePastTests === '0'}
                  onChange={handleInputChange}
                />
                <span>No</span>
              </label>
            </div>
            {formData.ptePastTests !== undefined && formData.ptePastTests !== '' && (
              <button 
                type="button" 
                className="pteacademictestssection-clear-link"
                onClick={handleClearPastTests}
              >
                Clear answer
              </button>
            )}
          </div>

          {/* Score Form - Only show if past tests = Yes */}
          {showScoreForm && (
            <div className="pteacademictestssection-detailed-fields">
              {/* Test Date */}
              <div className="pteacademictestssection-form-group">
                <label className="pteacademictestssection-question-label required">Test Date*</label>
                <div className="pteacademictestssection-input-container">
                  {!formData.pteTestDate ? (
                    <PTESelect
                      value={selectedYear || ''}
                      options={yearOptions}
                      placeholder="- Select Year -"
                      menuPlacement="up"
                      onChange={(nextValue) => handleYearSelect('pteTestDate', nextValue)}
                    />
                  ) : (
                    <div className="pteacademictestssection-selected-date">
                      {formData.pteTestDate}
                      <button
                        type="button"
                        className="pteacademictestssection-change-date"
                        onClick={() => {
                          const event = { target: { name: 'pteTestDate', value: '' } };
                          handleInputChange(event);
                        }}
                      >
                        Change
                      </button>
                    </div>
                  )}
                  <div className="pteacademictestssection-field-note">Date uses "month year" format (e.g., August 2020)</div>
                </div>

                {/* Calendar Popup */}
                {showCalendar && currentDateField === 'pteTestDate' && (
                  <div className="pteacademictestssection-calendar-container">
                    <div className="pteacademictestssection-calendar-header">
                      Select Month for {selectedYear}
                    </div>
                    <div className="pteacademictestssection-calendar-grid">
                      {months.map(month => (
                        <button
                          key={month}
                          type="button"
                          className={`pteacademictestssection-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                          onClick={() => handleMonthSelect(month)}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                    <div className="pteacademictestssection-calendar-actions">
                      <button
                        type="button"
                        className="pteacademictestssection-calendar-confirm"
                        onClick={handleConfirmDate}
                        disabled={!selectedMonth || !selectedYear}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="pteacademictestssection-calendar-cancel"
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
              <div className="pteacademictestssection-form-group">
                <label className="pteacademictestssection-question-label">Listening Score</label>
                <PTESelect
                  value={formData.pteListeningScore || ''}
                  options={scoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('pteListeningScore', nextValue)}
                />
              </div>

              {/* Reading Score */}
              <div className="pteacademictestssection-form-group">
                <label className="pteacademictestssection-question-label">Reading Score</label>
                <PTESelect
                  value={formData.pteReadingScore || ''}
                  options={scoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('pteReadingScore', nextValue)}
                />
              </div>

              {/* Speaking Score */}
              <div className="pteacademictestssection-form-group">
                <label className="pteacademictestssection-question-label">Speaking Score</label>
                <PTESelect
                  value={formData.pteSpeakingScore || ''}
                  options={scoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('pteSpeakingScore', nextValue)}
                />
              </div>

              {/* Writing Score */}
              <div className="pteacademictestssection-form-group">
                <label className="pteacademictestssection-question-label">Writing Score</label>
                <PTESelect
                  value={formData.pteWritingScore || ''}
                  options={scoreSelectOptions}
                  placeholder="Choose an option"
                  onChange={(nextValue) => updateField('pteWritingScore', nextValue)}
                />
              </div>

              {/* Additional Scores Section */}
              <div className="pteacademictestssection-additional-scores">
                <h3 className="pteacademictestssection-additional-title">Additional Scores</h3>
                
                {/* Grammar Score */}
                <div className="pteacademictestssection-form-group">
                  <label className="pteacademictestssection-question-label">Grammar Score</label>
                  <PTESelect
                    value={formData.pteGrammarScore || ''}
                    options={scoreSelectOptions}
                    placeholder="Choose an option"
                    onChange={(nextValue) => updateField('pteGrammarScore', nextValue)}
                  />
                </div>

                {/* Vocabulary Score */}
                <div className="pteacademictestssection-form-group">
                  <label className="pteacademictestssection-question-label">Vocabulary Score</label>
                  <PTESelect
                    value={formData.pteVocabularyScore || ''}
                    options={scoreSelectOptions}
                    placeholder="Choose an option"
                    onChange={(nextValue) => updateField('pteVocabularyScore', nextValue)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PTEAcademicTestsSection;
