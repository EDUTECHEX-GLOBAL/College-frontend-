// src/components/testing-sections/APSubjectTestsSection.js
import React, { useState, useEffect, useRef } from 'react';
import './APSubjectTestsSection.css';

const APSelect = ({
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
  const listboxIdRef = useRef(`apsubjecttestssection-${Math.random().toString(36).slice(2)}-listbox`);
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
      className={`ap-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}
    >
      <button
        type="button"
        className={`ap-select ap-select-trigger${!selectedOption ? ' is-placeholder' : ''}${hasError ? ' error' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxIdRef.current}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="ap-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="ap-select-menu" id={listboxIdRef.current} role="listbox">
          <button
            type="button"
            className={`ap-select-option${selectedValue === '' ? ' is-selected' : ''}`}
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
              className={`ap-select-option${selectedValue === String(option.value) ? ' is-selected' : ''}`}
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

const APSubjectTestsSection = ({ formData, handleInputChange }) => {
  const [numberOfTests, setNumberOfTests] = useState(formData.numberOfAPTests || '');
  const [tests, setTests] = useState(formData.apSubjectTests || []);
  const [showErrors, setShowErrors] = useState(false);
  const [showYearGrid, setShowYearGrid] = useState(null);

  // AP Subject options exactly as per Common App
  const subjectOptions = [
    'African American Studies',
    'Art History',
    'Art: 2-D Art & Design',
    'Art: 3-D Art & Design',
    'Art: Drawing',
    'Biology',
    'Calculus AB',
    'Calculus BC',
    'Chemistry',
    'Chinese Language & Culture',
    'Computer Science A',
    'Computer Science Principles',
    'Economics: Macroeconomics',
    'Economics: Microeconomics',
    'English Language & Composition',
    'English Literature & Composition',
    'Environmental Science',
    'European History',
    'French Language & Culture',
    'German Language & Culture',
    'Government & Politics: Comparative',
    'Government & Politics: United States',
    'Human Geography',
    'Italian Language & Culture',
    'Japanese Language & Culture',
    'Latin',
    'Music Theory',
    'Physics 1',
    'Physics 2',
    'Physics C - Electricity & Magnetism',
    'Physics C Mechanics',
    'Precalculus',
    'Psychology',
    'Research',
    'Seminar',
    'Spanish Language & Culture',
    'Spanish Literature & Culture',
    'Statistics',
    'United States History',
    'World History'
  ];

  // Score options for AP Tests (1-5)
  const scoreOptions = [5, 4, 3, 2, 1];

  const numberOfTestsOptions = Array.from({ length: 16 }, (_, i) => ({
    value: String(i),
    label: String(i),
  }));

  const subjectSelectOptions = subjectOptions.map(subject => ({
    value: subject,
    label: subject,
  }));

  // Month options for date selection
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthSelectOptions = monthOptions.map(month => ({
    value: month,
    label: month,
  }));

  // Year options grid (1998 to current year + 1) in 4-column layout
  const currentYear = new Date().getFullYear();
  const startYear = 1998;
  const endYear = currentYear + 1;
  const yearOptions = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  // Group years into rows of 4 for the grid
  const yearRows = [];
  for (let i = 0; i < yearOptions.length; i += 4) {
    yearRows.push(yearOptions.slice(i, i + 4));
  }

  // Initialize tests when number of tests changes
  useEffect(() => {
    if (numberOfTests === '') {
      setTests([]);
      return;
    }

    const count = parseInt(numberOfTests);
    if (isNaN(count) || count < 0) return;

    // If we're reducing the number of tests, truncate the array
    if (count < tests.length) {
      const newTests = tests.slice(0, count);
      setTests(newTests);
      handleInputChange({ target: { name: 'apSubjectTests', value: newTests } });
    } 
    // If we're increasing the number of tests, add empty objects
    else if (count > tests.length) {
      const newTests = [...tests];
      for (let i = tests.length; i < count; i++) {
        newTests.push({ subject: '', score: '', month: '', year: '' });
      }
      setTests(newTests);
      handleInputChange({ target: { name: 'apSubjectTests', value: newTests } });
    }
  }, [numberOfTests]);

  // Handle number of tests change
  const handleNumberOfTestsChange = (value) => {
    setNumberOfTests(value);
    handleInputChange({ target: { name: 'numberOfAPTests', value: value } });
    setShowErrors(false);
  };

  // Handle individual test field changes
  const handleTestChange = (index, field, value) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'apSubjectTests', value: updatedTests } });
  };

  // Handle month selection
  const handleMonthChange = (index, month) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, month, year: test.year } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'apSubjectTests', value: updatedTests } });
  };

  // Handle year selection from grid
  const handleYearSelect = (index, year) => {
    const updatedTests = tests.map((test, i) => 
      i === index ? { ...test, year: year.toString() } : test
    );
    setTests(updatedTests);
    handleInputChange({ target: { name: 'apSubjectTests', value: updatedTests } });
    setShowYearGrid(null);
  };

  // Toggle year grid visibility
  const toggleYearGrid = (index) => {
    setShowYearGrid(showYearGrid === index ? null : index);
  };

  // Check if all required fields for a test are filled
  const isTestComplete = (test) => {
    return test.subject && test.month && test.year;
  };

  // Check if a specific test field is missing
  const isFieldMissing = (test, field) => {
    return showErrors && !test[field];
  };

  // Check if section is complete
  const isSectionComplete = numberOfTests && tests.every(test => isTestComplete(test));

  // Format date for display
  const formatDate = (test) => {
    if (test.month && test.year) {
      return `${test.month} ${test.year}`;
    }
    return '';
  };

  return (
    <div className="ap-container">
      <div className="ap-card">
        <div className="ap-card-header">
          <h2 className="ap-card-title">AP Subject Tests</h2>
          <div className="ap-status-badge">
            {isSectionComplete ? 'Complete' : 'In Progress'}
          </div>
        </div>
        
        <div className="ap-form-content">
          {/* Number of Tests Question */}
          <div className="ap-form-group">
            <label className="ap-question-label required">
              Number of AP Tests you wish to report, including tests you expect to take*
            </label>
            <div className="ap-select-group">
              <APSelect
                value={numberOfTests}
                options={numberOfTestsOptions}
                placeholder="Choose an option"
                hasError={showErrors && !numberOfTests}
                onChange={handleNumberOfTestsChange}
              />
            </div>
            {showErrors && !numberOfTests && (
              <div className="ap-error-message">
                Please complete this required question.
              </div>
            )}
          </div>

          {/* Dynamic Test Forms based on number selected */}
          {numberOfTests && parseInt(numberOfTests) > 0 && (
            <div className="ap-tests-container">
              {tests.map((test, index) => (
                <div key={index} className="ap-test-entry">
                  <h3>Test {index + 1}</h3>
                  
                  {/* Subject Field - First as per document order */}
                  <div className="ap-form-group">
                    <label className="ap-question-label required">Subject*</label>
                    <APSelect
                      value={test.subject || ''}
                      options={subjectSelectOptions}
                      placeholder="Choose an option"
                      hasError={isFieldMissing(test, 'subject')}
                      onChange={(nextValue) => handleTestChange(index, 'subject', nextValue)}
                    />
                    {isFieldMissing(test, 'subject') && (
                      <div className="ap-error-message">
                        Please complete this required question.
                      </div>
                    )}
                  </div>

                  {/* Score Field - Radio buttons for AP scores (1-5) */}
                  <div className="ap-form-group">
                    <label className="ap-question-label">Score (1-5)</label>
                    <div className="ap-score-radio-group-horizontal">
                      {scoreOptions.map(score => (
                        <label key={score} className="ap-score-radio-option">
                          <input
                            type="radio"
                            name={`score-${index}`}
                            value={score}
                            checked={test.score === score.toString()}
                            onChange={(e) => handleTestChange(index, 'score', e.target.value)}
                            className="ap-score-radio-input"
                          />
                          <span className="ap-score-radio-label">{score}</span>
                        </label>
                      ))}
                    </div>
                    {test.score && (
                      <button 
                        type="button" 
                        className="ap-clear-link"
                        onClick={() => handleTestChange(index, 'score', '')}
                      >
                        Clear answer
                      </button>
                    )}
                  </div>

                  {/* Month Field */}
                  <div className="ap-form-group">
                    <label className="ap-question-label required">Month*</label>
                    <div className="ap-month-select-container">
                      <APSelect
                        value={test.month || ''}
                        options={monthSelectOptions}
                        placeholder="Select Month"
                        hasError={isFieldMissing(test, 'month')}
                        onChange={(nextValue) => handleMonthChange(index, nextValue)}
                      />
                    </div>
                    {isFieldMissing(test, 'month') && (
                      <div className="ap-error-message">
                        Please complete this required question.
                      </div>
                    )}
                  </div>

                  {/* Year Field */}
                  <div className="ap-form-group">
                    <label className="ap-question-label required">Year*</label>
                    <div className={`ap-year-select-container${showYearGrid === index ? ' is-open is-upward' : ''}`}>
                      <button
                        type="button"
                        className={`ap-year-display ${isFieldMissing(test, 'year') ? 'error' : ''}`}
                        onClick={() => toggleYearGrid(index)}
                      >
                        {test.year || 'Select Year'}
                        <span className="ap-dropdown-arrow" aria-hidden="true">v</span>
                      </button>
                      
                      {showYearGrid === index && (
                        <div className="ap-year-grid-container">
                          <div className="ap-year-grid">
                            {yearRows.map((row, rowIndex) => (
                              <div key={rowIndex} className="ap-year-row">
                                {row.map(year => (
                                  <div
                                    key={year}
                                    className={`ap-year-option ${test.year === year.toString() ? 'selected' : ''}`}
                                    onClick={() => handleYearSelect(index, year)}
                                  >
                                    {year}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {isFieldMissing(test, 'year') && (
                      <div className="ap-error-message">
                        Please complete this required question.
                      </div>
                    )}
                  </div>

                  {/* Display formatted date */}
                  {formatDate(test) && (
                    <div className="ap-selected-date">
                      Test Date: {formatDate(test)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>  
  );
};

export default APSubjectTestsSection;
