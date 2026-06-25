// src/components/testing-sections/SATSubjectTestsSection.js
import React, { useState, useEffect, useRef } from 'react';
import './SATSubjectTestsSection.css';

const SUBJECT_OPTIONS = [
  'Biology - Ecological',
  'Biology - Molecular',
  'Chemistry',
  'Chinese with Listening',
  'French Reading',
  'French with Listening',
  'German Reading',
  'German with Listening',
  'Italian Reading',
  'Japanese with Listening',
  'Korean with Listening',
  'Latin Reading',
  'Literature',
  'Math Level 1',
  'Math Level 2',
  'Modern Hebrew Reading',
  'Physics',
  'Spanish Reading',
  'Spanish with Listening',
  'US History',
  'World History',
  'Writing'
].map(subject => ({ value: subject, label: subject }));

const SCORE_OPTIONS = Array.from({ length: 601 }, (_, i) => {
  const score = 800 - i;
  return { value: String(score), label: String(score) };
});

const NUMBER_OF_TESTS_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
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

const SATSubjectSelect = ({
  value,
  options,
  placeholder,
  onChange,
  hasError = false,
  menuPlacement = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`satsubjecttestssection-${Math.random().toString(36).slice(2)}-listbox`);
  const selectedValue = String(value ?? '');
  const selectedOption = options.find(option => String(option.value) === selectedValue);

  useEffect(() => {
    if (!isOpen) return undefined;

    const updateMenuDirection = () => {
      if (menuPlacement === 'up') {
        setOpensUpward(true);
        return;
      }

      if (menuPlacement === 'down') {
        setOpensUpward(false);
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

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={selectRef}
      className={`satsubjecttestssection-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}
    >
      <button
        type="button"
        className={`satsubjecttestssection-select satsubjecttestssection-select-trigger${!selectedOption ? ' is-placeholder' : ''}${hasError ? ' error' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxIdRef.current}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="satsubjecttestssection-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="satsubjecttestssection-select-menu" id={listboxIdRef.current} role="listbox">
          <button
            type="button"
            className={`satsubjecttestssection-select-option${selectedValue === '' ? ' is-selected' : ''}`}
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
              className={`satsubjecttestssection-select-option${selectedValue === String(option.value) ? ' is-selected' : ''}`}
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

const SATSubjectTestsSection = ({ 
  formData = {}, 
  handleInputChange,
  clearAnswer,
  clearRelatedFields 
}) => {
  const [numberOfTests, setNumberOfTests] = useState(() => {
    return formData.numberOfSATSubjectTests || '';
  });
  const [tests, setTests] = useState(() => {
    return formData.satSubjectTests || [];
  });
  const [showErrors, setShowErrors] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Check if section is complete
  const isSectionComplete = () => {
    if (!numberOfTests || numberOfTests === '') return false;
    
    const count = parseInt(numberOfTests);
    if (count === 0) return true;
    
    for (let i = 0; i < count; i++) {
      const test = tests[i];
      if (!test || !test.subject || !test.date) {
        return false;
      }
    }
    
    return true;
  };

  // Initialize tests when number of tests changes
  useEffect(() => {
    if (numberOfTests === '') {
      setTests([]);
      return;
    }

    const count = parseInt(numberOfTests);
    if (isNaN(count) || count < 0) return;

    if (count < tests.length) {
      const newTests = tests.slice(0, count);
      setTests(newTests);
      if (handleInputChange) {
        handleInputChange({ target: { name: 'satSubjectTests', value: newTests } });
      }
    } 
    else if (count > tests.length) {
      const newTests = [...tests];
      for (let i = tests.length; i < count; i++) {
        newTests.push({ subject: '', score: '', date: '' });
      }
      setTests(newTests);
      if (handleInputChange) {
        handleInputChange({ target: { name: 'satSubjectTests', value: newTests } });
      }
    }
  }, [numberOfTests]);

  // Handle number of tests change
  const handleNumberOfTestsChange = (value) => {
    setNumberOfTests(value);
    if (handleInputChange) {
      handleInputChange({ target: { name: 'numberOfSATSubjectTests', value: value } });
    }
    setShowErrors(false);
    
    if (value === '0' && clearRelatedFields) {
      clearRelatedFields('numberOfSATSubjectTests', ['satSubjectTests']);
    }
  };

  // Handle individual test field changes
  const handleTestChange = (index, field, value) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    );
    setTests(updatedTests);
    if (handleInputChange) {
      handleInputChange({ target: { name: 'satSubjectTests', value: updatedTests } });
    }
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
      handleTestChange(currentTestIndex, 'date', fullDate);
      setShowCalendar(false);
      setSelectedYear(null);
      setSelectedMonth(null);
      setCurrentTestIndex(null);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.satsubjecttestssection-calendar-container')) {
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

  // Check if a specific test field is missing
  const isFieldMissing = (test, field) => {
    return showErrors && !test?.[field];
  };

  // Handle clearing all tests
  const handleClearAllTests = () => {
    setNumberOfTests('');
    setTests([]);
    if (clearRelatedFields) {
      clearRelatedFields('numberOfSATSubjectTests', ['satSubjectTests']);
    } else if (clearAnswer) {
      clearAnswer('numberOfSATSubjectTests');
      clearAnswer('satSubjectTests');
    }
  };

  // Check if any test has data
  const hasAnyTestData = () => {
    return tests.some(test => 
      test.subject || test.score || test.date
    );
  };

  return (
    <div className="satsubjecttestssection-container">
      <div className="satsubjecttestssection-card">
        <div className="satsubjecttestssection-card-header">
          <h2 className="satsubjecttestssection-card-title">SAT Subject Tests</h2>
          <div className="satsubjecttestssection-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="satsubjecttestssection-form-content">
          {/* Number of Tests Question */}
          <div className="satsubjecttestssection-form-group">
            <label className="satsubjecttestssection-question-label required">
              Number of SAT Subject Tests you wish to report, including tests you expect to take*
            </label>
            <div className="satsubjecttestssection-select-group">
              <SATSubjectSelect
                value={numberOfTests}
                options={NUMBER_OF_TESTS_OPTIONS}
                placeholder="Choose an option"
                hasError={showErrors && !numberOfTests}
                onChange={handleNumberOfTestsChange}
              />
            </div>
            {numberOfTests && numberOfTests !== '0' && hasAnyTestData() && (
              <button 
                type="button" 
                className="satsubjecttestssection-clear-link"
                onClick={handleClearAllTests}
              >
                Clear all tests
              </button>
            )}
            {showErrors && !numberOfTests && (
              <div className="satsubjecttestssection-error-message">
                Please complete this required question.
              </div>
            )}
          </div>

          {/* Dynamic Test Forms based on number selected */}
          {numberOfTests && parseInt(numberOfTests) > 0 && (
            <div className="satsubjecttestssection-tests-container">
              {tests.map((test, index) => (
                <div key={index} className="satsubjecttestssection-test-entry">
                  <h3>Test {index + 1}</h3>
                  
                  {/* Subject Field - First as per document order */}
                  <div className="satsubjecttestssection-form-group">
                    <label className="satsubjecttestssection-question-label required">Subject*</label>
                    <SATSubjectSelect
                      value={test.subject || ''}
                      options={SUBJECT_OPTIONS}
                      placeholder="Choose an option"
                      hasError={isFieldMissing(test, 'subject')}
                      onChange={(nextValue) => handleTestChange(index, 'subject', nextValue)}
                    />
                    {isFieldMissing(test, 'subject') && (
                      <div className="satsubjecttestssection-error-message">
                        Please complete this required question.
                      </div>
                    )}
                  </div>

                  {/* Score Field - Optional as per document */}
                  <div className="satsubjecttestssection-form-group">
                    <label className="satsubjecttestssection-question-label">Score (200-800)</label>
                    <SATSubjectSelect
                      value={test.score || ''}
                      options={SCORE_OPTIONS}
                      placeholder="Choose an option"
                      onChange={(nextValue) => handleTestChange(index, 'score', nextValue)}
                    />
                  </div>

                  {/* Test Date Field */}
                  <div className="satsubjecttestssection-form-group">
                    <label className="satsubjecttestssection-question-label required">Test Date*</label>
                    <div className="satsubjecttestssection-input-container">
                      {!test.date ? (
                        <SATSubjectSelect
                          value={selectedYear || ''}
                          options={YEAR_OPTIONS}
                          placeholder="- Select Year -"
                          hasError={isFieldMissing(test, 'date')}
                          menuPlacement="up"
                          onChange={(nextValue) => handleYearSelect(index, nextValue)}
                        />
                      ) : (
                        <div className="satsubjecttestssection-selected-date">
                          {test.date}
                          <button
                            type="button"
                            className="satsubjecttestssection-change-date"
                            onClick={() => handleTestChange(index, 'date', '')}
                          >
                            Change
                          </button>
                        </div>
                      )}
                      <div className="satsubjecttestssection-field-note">Date uses "month year" format (e.g., August 2020)</div>
                    </div>

                    {/* Calendar Popup */}
                    {showCalendar && currentTestIndex === index && (
                      <div className="satsubjecttestssection-calendar-container">
                        <div className="satsubjecttestssection-calendar-header">
                          Select Month for {selectedYear}
                        </div>
                        <div className="satsubjecttestssection-calendar-grid">
                          {months.map(month => (
                            <button
                              key={month}
                              type="button"
                              className={`satsubjecttestssection-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                              onClick={() => handleMonthSelect(month)}
                            >
                              {month}
                            </button>
                          ))}
                        </div>
                        <div className="satsubjecttestssection-calendar-actions">
                          <button
                            type="button"
                            className="satsubjecttestssection-calendar-confirm"
                            onClick={handleConfirmDate}
                            disabled={!selectedMonth || !selectedYear}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="satsubjecttestssection-calendar-cancel"
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
                    {isFieldMissing(test, 'date') && (
                      <div className="satsubjecttestssection-error-message">
                        Please complete this required question.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SATSubjectTestsSection;
