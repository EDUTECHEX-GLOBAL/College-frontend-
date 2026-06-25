import React, { useState, useEffect, useRef } from 'react';
import './CambridgeSection.css';

const CambridgeSelect = ({
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
  const listboxIdRef = useRef(`cam-select-${Math.random().toString(36).slice(2)}-listbox`);
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
      className={`cam-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}
    >
      <button
        type="button"
        className={`cam-select cam-select-trigger${!selectedOption ? ' is-placeholder' : ''}${hasError ? ' error' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxIdRef.current}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="cam-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="cam-select-menu" id={listboxIdRef.current} role="listbox">
          <button
            type="button"
            className={`cam-select-option${selectedValue === '' ? ' is-selected' : ''}`}
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
              className={`cam-select-option${selectedValue === String(option.value) ? ' is-selected' : ''}`}
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

const CambridgeSection = ({ formData, handleInputChange, handleComplexChange, clearAnswer }) => {
  const [numberOfTests, setNumberOfTests] = useState(formData.cambridgeNumberOfTests || '');
  const [showErrors, setShowErrors] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(null);

  // Subject options
  const subjectOptions = [
    'Accounting', 'Afrikaans Language', 'Agriculture', 'Arabic', 'Art and Design',
    'Biblical Studies (formerly Divinity)', 'Biology', 'Business', 'Chemistry',
    'Chinese Language & Literature (or Chinese)', 'Classical Studies',
    'Co-ordinated Science double', 'Combined Science', 'Communication Technology',
    'Computer Science', 'Design & Technology', 'Design & Textiles',
    'Digital Media & Design', 'Drama', 'Dutch', 'Economics',
    'English (as an Additional Language)', 'English First Language',
    'English General Paper', 'English Language', 'English Language and Literature',
    'English Literature', 'Environmental Management', 'Food and Nutrition',
    'French', 'French Language & Literature', 'French Literature', 'Geography',
    'German', 'German Language & Literature', 'Global Perspectives', 'Greek',
    'Hindi Language', 'Hinduism', 'History', 'History (American)',
    'History (European)', 'History (International)', 'Information Technology',
    'Italian', 'Japanese', 'Latin', 'Law', 'Marine Science', 'Mathematics',
    'Mathematics (Mechanics & Probability & Statistics)', 'Mathematics (Mechanics)',
    'Mathematics (Probability & Statistics)', 'Mathematics (Pure & Mechanics & Probability & Statistics)',
    'Mathematics (Pure & Mechanics)', 'Mathematics (Pure & Probability & Statistics)',
    'Mathematics - Additional', 'Mathematics Further', 'Mathematics International',
    'Mathematics Pure', 'Media Studies', 'Music', 'Physical Science', 'Physics',
    'Portuguese', 'Psychology', 'Sanskrit', 'Sociology', 'Spanish First Language',
    'Spanish Language & Literature (or Spanish)', 'Spanish Literature',
    'Sport & Physical Education (or Physical Education)', 'Statistics', 'Swahili',
    'Tamil Language', 'Thinking Skills', 'Travel & Tourism', 'Urdu Language',
    'Vietnamese First Language', 'World Literature'
  ];

  // Level options (AS/A/O)
  const levelOptions = ['AS', 'A', 'O'];

  // Grade options (A*, A, B, C, D, E, F, G, U, Pending)
  const gradeOptions = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U', 'Pending'];

  const numberOfTestsOptions = Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) }));
  const subjectSelectOptions = subjectOptions.map(subject => ({ value: subject, label: subject }));
  const levelSelectOptions = levelOptions.map(level => ({ value: level, label: level }));
  const gradeSelectOptions = gradeOptions.map(grade => ({ value: grade, label: grade }));

  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  const yearOptions = Array.from({ length: 37 }, (_, i) => {
    const year = 1990 + i;
    return { value: String(year), label: String(year) };
  });

  // Check if section is complete
  const isSectionComplete = () => {
    if (!numberOfTests || numberOfTests === '' || numberOfTests === '0') return false;
    
    const numTests = parseInt(numberOfTests);
    const tests = formData.cambridgeTests || [];
    
    for (let i = 0; i < numTests; i++) {
      const test = tests[i];
      if (!test || !test.subject || !test.level || !test.grade || !test.date) return false;
    }
    
    return true;
  };

  const handleNumberOfTestsChange = (value) => {
    setNumberOfTests(value);
    handleInputChange({ target: { name: 'cambridgeNumberOfTests', value } });
    setShowErrors(false);
    
    if (value && value !== '' && value !== '0') {
      const num = parseInt(value);
      const currentTests = formData.cambridgeTests || [];
      const newTests = [];
      
      for (let i = 0; i < num; i++) {
        newTests.push(currentTests[i] || { subject: '', level: '', grade: '', date: '' });
      }
      
      handleComplexChange('cambridgeTests', newTests);
    } else {
      handleComplexChange('cambridgeTests', []);
    }
  };

  const handleTestFieldChange = (index, field, value) => {
    const updatedTests = [...(formData.cambridgeTests || [])];
    if (!updatedTests[index]) {
      updatedTests[index] = { subject: '', level: '', grade: '', date: '' };
    }
    updatedTests[index][field] = value;
    handleComplexChange('cambridgeTests', updatedTests);
  };

  const handleYearSelect = (index, year) => {
    setSelectedYear(year);
    setCurrentTestIndex(index);
    setShowCalendar(true);
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
  };

  const handleConfirmDate = () => {
    if (selectedMonth && selectedYear && currentTestIndex !== null) {
      const fullDate = `${selectedMonth} ${selectedYear}`;
      handleTestFieldChange(currentTestIndex, 'date', fullDate);
      setShowCalendar(false);
      setSelectedYear(null);
      setSelectedMonth(null);
      setCurrentTestIndex(null);
    }
  };

  const clearTestDate = (index) => {
    handleTestFieldChange(index, 'date', '');
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.cam-calendar-container')) {
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

  // Helper to check if a field is missing
  const isFieldMissing = (test, field) => {
    return showErrors && !test?.[field];
  };

  return (
    <div className="cam-container">
      <div className="cam-card">
        <div className="cam-card-header">
          <h2 className="cam-card-title">Cambridge Exams</h2>
          <div className="cam-status-badge">
            {isSectionComplete() ? 'Complete' : 'In Progress'}
          </div>
        </div>

        <div className="cam-content">
          {/* Number of Tests Question */}
          <div className="cam-form-section">
            <div className="cam-form-group">
              <label className="cam-question-label required">
                Number of Cambridge International subject tests you wish to report, including tests you expect to take*
              </label>
              <div className="cam-input-container">
                <CambridgeSelect
                  value={numberOfTests}
                  options={numberOfTestsOptions}
                  placeholder="- Choose an option -"
                  hasError={showErrors && (!numberOfTests || numberOfTests === '0')}
                  onChange={handleNumberOfTestsChange}
                />
              </div>
              {showErrors && (!numberOfTests || numberOfTests === '0') && (
                <div className="cam-error-message">Please complete this required question.</div>
              )}
            </div>
          </div>

          {/* Dynamic Test Fields - One per test as per document structure */}
          {numberOfTests && numberOfTests !== '' && numberOfTests !== '0' && (
            <div className="cam-tests-section">
              {Array.from({ length: parseInt(numberOfTests) }, (_, index) => {
                const test = formData.cambridgeTests?.[index] || { subject: '', level: '', grade: '', date: '' };
                return (
                  <div key={index} className="cam-test-entry">
                    <h3 className="cam-test-number">Test {index + 1}</h3>
                    
                    <div className="cam-test-fields">
                      {/* Subject Field */}
                      <div className="cam-form-group">
                        <label className="cam-question-label required">Subject*</label>
                        <div className="cam-input-container">
                          <CambridgeSelect
                            value={test.subject || ''}
                            options={subjectSelectOptions}
                            placeholder="- Choose an option -"
                            hasError={isFieldMissing(test, 'subject')}
                            onChange={(nextValue) => handleTestFieldChange(index, 'subject', nextValue)}
                          />
                        </div>
                        {isFieldMissing(test, 'subject') && (
                          <div className="cam-error-message">Please complete this required question.</div>
                        )}
                      </div>

                      {/* Level Field (AS/A/O) */}
                      <div className="cam-form-group">
                        <label className="cam-question-label required">Level (AS/A/O)*</label>
                        <div className="cam-input-container">
                          <CambridgeSelect
                            value={test.level || ''}
                            options={levelSelectOptions}
                            placeholder="- Choose an option -"
                            hasError={isFieldMissing(test, 'level')}
                            onChange={(nextValue) => handleTestFieldChange(index, 'level', nextValue)}
                          />
                        </div>
                        {isFieldMissing(test, 'level') && (
                          <div className="cam-error-message">Please complete this required question.</div>
                        )}
                      </div>

                      {/* Grade Field */}
                      <div className="cam-form-group">
                        <label className="cam-question-label required">Grade*</label>
                        <div className="cam-input-container">
                          <CambridgeSelect
                            value={test.grade || ''}
                            options={gradeSelectOptions}
                            placeholder="- Choose an option -"
                            hasError={isFieldMissing(test, 'grade')}
                            onChange={(nextValue) => handleTestFieldChange(index, 'grade', nextValue)}
                          />
                        </div>
                        {isFieldMissing(test, 'grade') && (
                          <div className="cam-error-message">Please complete this required question.</div>
                        )}
                      </div>

                      {/* Date Field */}
                      <div className="cam-form-group">
                        <label className="cam-question-label required">Date*</label>
                        <div className="cam-input-container">
                          {!test.date ? (
                            <CambridgeSelect
                              value={selectedYear || ''}
                              options={yearOptions}
                              placeholder="- Select Year -"
                              hasError={isFieldMissing(test, 'date')}
                              menuPlacement="up"
                              onChange={(nextValue) => handleYearSelect(index, nextValue)}
                            />
                          ) : (
                            <div className="cam-selected-date">
                              {test.date}
                              <button
                                type="button"
                                className="cam-change-date"
                                onClick={() => clearTestDate(index)}
                              >
                                Change
                              </button>
                            </div>
                          )}
                          <div className="cam-field-note">Date uses "month year" format (e.g., JUN 2020)</div>
                        </div>

                        {/* Calendar Popup */}
                        {showCalendar && currentTestIndex === index && (
                          <div className="cam-calendar-container">
                            <div className="cam-calendar-header">
                              Select Month for {selectedYear}
                            </div>
                            <div className="cam-calendar-grid">
                              {months.map(month => (
                                <button
                                  key={month}
                                  type="button"
                                  className={`cam-calendar-month ${selectedMonth === month ? 'selected' : ''}`}
                                  onClick={() => handleMonthSelect(month)}
                                >
                                  {month}
                                </button>
                              ))}
                            </div>
                            <div className="cam-calendar-actions">
                              <button
                                type="button"
                                className="cam-calendar-confirm"
                                onClick={handleConfirmDate}
                                disabled={!selectedMonth || !selectedYear}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="cam-calendar-cancel"
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
                          <div className="cam-error-message">Please complete this required question.</div>
                        )}
                      </div>
                    </div>
                    
                    {index < parseInt(numberOfTests) - 1 && <div className="cam-test-divider"></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CambridgeSection;
