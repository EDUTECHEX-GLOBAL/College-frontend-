// src/components/education-sections/FuturePlansSection.js
import React, { useEffect, useRef, useState } from 'react';
import './FuturePlansSection.css';

const HIGHEST_DEGREE_OPTIONS = [
  { value: 'associate', label: "Associate's Degree" },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate/PhD' },
  { value: 'professional', label: 'Professional Degree (MD, JD, etc.)' },
  { value: 'undecided', label: 'Undecided' },
];

const CAREER_INTEREST_OPTIONS = [
  { value: 'business', label: 'Business' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'technology', label: 'Technology' },
  { value: 'arts', label: 'Arts & Humanities' },
  { value: 'sciences', label: 'Sciences' },
  { value: 'social-sciences', label: 'Social Sciences' },
  { value: 'undecided', label: 'Undecided' },
];

const FuturePlansSelect = ({ value, options, placeholder, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`future-plans-${Math.random().toString(36).slice(2)}-listbox`);
  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    if (!isOpen) return undefined;

    const updateMenuDirection = () => {
      const rect = selectRef.current?.getBoundingClientRect();
      if (!rect) return;

      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      setOpensUpward(spaceBelow < 220 && spaceAbove > spaceBelow);
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
      className={`future-plans-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}
    >
      <button
        type="button"
        className={`future-plans-select future-plans-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxIdRef.current}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="future-plans-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="future-plans-select-menu" id={listboxIdRef.current} role="listbox">
          <button
            type="button"
            className={`future-plans-select-option${value === '' ? ' is-selected' : ''}`}
            role="option"
            aria-selected={value === ''}
            onClick={() => handleSelect('')}
          >
            {placeholder}
          </button>

          {options.map(option => (
            <button
              type="button"
              key={option.value}
              className={`future-plans-select-option${value === option.value ? ' is-selected' : ''}`}
              role="option"
              aria-selected={value === option.value}
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

const FuturePlansSection = ({ educationData, handleInputChange }) => {
  const { futurePlans } = educationData;

  return (
    <div className="future-plans-section">
      {/* Header */}
      <div className="future-plans-header">
        <h2 className="future-plans-title">Future Plans</h2>
        <div className="future-plans-status">In progress</div>
      </div>

      <div className="future-plans-grid">
        {/* Student Type */}
        <div className="future-plans-form-group future-plans-full-width">
          <label className="future-plans-label future-plans-required">
            Which best describes you? I am:
          </label>
          <div className="future-plans-radio-group">
            <label className="future-plans-radio-option">
              <input
                type="radio"
                name="studentType"
                value="first-year-2025-2026"
                checked={futurePlans.studentType === 'first-year-2025-2026'}
                onChange={(e) =>
                  handleInputChange('futurePlans', 'studentType', e.target.value)
                }
                className="future-plans-radio-input"
              />
              <span className="future-plans-radio-label">
                Applying as a first-year student and plan to start college in 2025 or 2026
              </span>
            </label>

            <label className="future-plans-radio-option">
              <input
                type="radio"
                name="studentType"
                value="start-2027"
                checked={futurePlans.studentType === 'start-2027'}
                onChange={(e) =>
                  handleInputChange('futurePlans', 'studentType', e.target.value)
                }
                className="future-plans-radio-input"
              />
              <span className="future-plans-radio-label">
                Planning to start college in 2027
              </span>
            </label>

            <label className="future-plans-radio-option">
              <input
                type="radio"
                name="studentType"
                value="start-2028-beyond"
                checked={futurePlans.studentType === 'start-2028-beyond'}
                onChange={(e) =>
                  handleInputChange('futurePlans', 'studentType', e.target.value)
                }
                className="future-plans-radio-input"
              />
              <span className="future-plans-radio-label">
                Planning to start college in 2028 or beyond
              </span>
            </label>

            <label className="future-plans-radio-option">
              <input
                type="radio"
                name="studentType"
                value="already-college-student"
                checked={futurePlans.studentType === 'already-college-student'}
                onChange={(e) =>
                  handleInputChange('futurePlans', 'studentType', e.target.value)
                }
                className="future-plans-radio-input"
              />
              <span className="future-plans-radio-label">
                Already a college student
              </span>
            </label>
          </div>
        </div>

        {/* Highest Degree */}
        <div className="future-plans-form-group">
          <label className="future-plans-label future-plans-required">
            Highest degree you intend to earn
          </label>
          <FuturePlansSelect
            value={futurePlans.highestDegree}
            options={HIGHEST_DEGREE_OPTIONS}
            placeholder="Choose an option"
            onChange={(nextValue) =>
              handleInputChange('futurePlans', 'highestDegree', nextValue)
            }
          />
        </div>

        {/* Career Interest */}
        <div className="future-plans-form-group">
          <label className="future-plans-label future-plans-required">
            Career interest
          </label>
          <FuturePlansSelect
            value={futurePlans.careerInterest}
            options={CAREER_INTEREST_OPTIONS}
            placeholder="Choose an option"
            onChange={(nextValue) =>
              handleInputChange('futurePlans', 'careerInterest', nextValue)
            }
          />
        </div>

        {/* Additional Interests */}
        <div className="future-plans-form-group future-plans-full-width">
          <label className="future-plans-label">
            Additional Career Interests
          </label>
          <div className="future-plans-checkbox-group">
            {[
              'Entrepreneurship',
              'Research',
              'Public Service',
              'Creative Arts',
              'Sports & Athletics',
              'Environmental Science',
              'International Relations'
            ].map((interest) => (
              <label key={interest} className="future-plans-checkbox-option">
                <input
                  type="checkbox"
                  checked={
                    futurePlans.additionalInterests?.includes(interest) || false
                  }
                  onChange={(e) => {
                    const currentInterests = futurePlans.additionalInterests || [];
                    const updatedInterests = e.target.checked
                      ? [...currentInterests, interest]
                      : currentInterests.filter((item) => item !== interest);
                    handleInputChange(
                      'futurePlans',
                      'additionalInterests',
                      updatedInterests
                    );
                  }}
                  className="future-plans-checkbox-input"
                />
                <span className="future-plans-checkbox-label">{interest}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturePlansSection;
