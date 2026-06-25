// src/components/education-sections/HonorsSection.js
import React, { useEffect, useRef, useState } from 'react';
import './HonorsSection.css';

const HONOR_LEVEL_OPTIONS = [
  { value: 'school', label: 'School' },
  { value: 'district', label: 'District' },
  { value: 'state', label: 'State' },
  { value: 'national', label: 'National' },
  { value: 'international', label: 'International' },
];

const HONOR_YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: String(year), label: String(year) };
});

const HonorsSelect = ({ value, options, placeholder, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`honors-${Math.random().toString(36).slice(2)}-listbox`);
  const selectedOption = options.find(option => String(option.value) === String(value || ''));

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
      className={`honors-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}
    >
      <button
        type="button"
        className={`honors-select honors-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxIdRef.current}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="honors-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="honors-select-menu" id={listboxIdRef.current} role="listbox">
          <button
            type="button"
            className={`honors-select-option${String(value || '') === '' ? ' is-selected' : ''}`}
            role="option"
            aria-selected={String(value || '') === ''}
            onClick={() => handleSelect('')}
          >
            {placeholder}
          </button>

          {options.map(option => (
            <button
              type="button"
              key={option.value}
              className={`honors-select-option${String(value || '') === String(option.value) ? ' is-selected' : ''}`}
              role="option"
              aria-selected={String(value || '') === String(option.value)}
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

const HonorsSection = ({
  educationData,
  handleInputChange,
  handleArrayChange,
  addArrayItem,
  removeArrayItem
}) => {
  const { honors } = educationData;

  const handleReportHonorsChange = (value) => {
    handleInputChange('honors', 'reportHonors', value);

    if (value === 'yes' && (!honors.honorsList || honors.honorsList.length === 0)) {
      handleInputChange('honors', 'honorsList', [
        { honorName: '', honorLevel: '', yearReceived: '', description: '' }
      ]);
    } else if (value === 'no') {
      handleInputChange('honors', 'honorsList', []);
    }
  };

  const defaultHonor = {
    honorName: '',
    honorLevel: '',
    yearReceived: '',
    description: ''
  };

  return (
    <div className="honors-section">
      {/* Header */}
      <div className="honors-header">
        <h2 className="honors-title">Honors</h2>
        <div className="honors-status">In progress</div>
      </div>

      <div className="honors-description">
        Report any honors related to your academic achievements beginning with the ninth grade or
        international equivalent.
      </div>

      {/* Report Honors Question */}
      <div className="honors-form-group">
        <label className="honors-label honors-required">
          Do you wish to report any honors?
        </label>
        <div className="honors-radio-group">
          <label className="honors-radio-option">
            <input
              type="radio"
              name="reportHonors"
              value="yes"
              checked={honors.reportHonors === 'yes'}
              onChange={(e) => handleReportHonorsChange(e.target.value)}
              className="honors-radio-input"
            />
            <span className="honors-radio-label">Yes</span>
          </label>
          <label className="honors-radio-option">
            <input
              type="radio"
              name="reportHonors"
              value="no"
              checked={honors.reportHonors === 'no'}
              onChange={(e) => handleReportHonorsChange(e.target.value)}
              className="honors-radio-input"
            />
            <span className="honors-radio-label">No</span>
          </label>
        </div>
      </div>

      {/* Honors List */}
      {honors.reportHonors === 'yes' &&
        honors.honorsList?.map((honor, index) => (
          <div key={index} className="honors-array-section">
            <div className="honors-item">
              <div className="honors-item-header">
                <h4 className="honors-item-title">Honor {index + 1}</h4>
                <button
                  type="button"
                  className="honors-remove-btn"
                  onClick={() => removeArrayItem('honors', 'honorsList', index)}
                >
                  Remove
                </button>
              </div>

              <div className="honors-grid">
                <div className="honors-form-group honors-full-width">
                  <label className="honors-label honors-required">Honor Name</label>
                  <input
                    type="text"
                    className="honors-input"
                    placeholder="Enter honor name"
                    value={honor.honorName}
                    onChange={(e) =>
                      handleArrayChange('honors', 'honorsList', index, 'honorName', e.target.value)
                    }
                  />
                </div>

                <div className="honors-form-group">
                  <label className="honors-label honors-required">Honor Level</label>
                  <HonorsSelect
                    value={honor.honorLevel}
                    options={HONOR_LEVEL_OPTIONS}
                    placeholder="Select level"
                    onChange={(nextValue) =>
                      handleArrayChange('honors', 'honorsList', index, 'honorLevel', nextValue)
                    }
                  />
                </div>

                <div className="honors-form-group">
                  <label className="honors-label honors-required">Year Received</label>
                  <HonorsSelect
                    value={honor.yearReceived}
                    options={HONOR_YEAR_OPTIONS}
                    placeholder="Select year"
                    onChange={(nextValue) =>
                      handleArrayChange(
                        'honors',
                        'honorsList',
                        index,
                        'yearReceived',
                        nextValue
                      )
                    }
                  />
                </div>

                <div className="honors-form-group honors-full-width">
                  <label className="honors-label">Description</label>
                  <textarea
                    className="honors-textarea"
                    placeholder="Brief description of the honor"
                    rows="3"
                    value={honor.description}
                    onChange={(e) =>
                      handleArrayChange(
                        'honors',
                        'honorsList',
                        index,
                        'description',
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

      {/* Add Honor Button */}
      {honors.reportHonors === 'yes' && (
        <button
          type="button"
          className="honors-add-btn"
          onClick={() => addArrayItem('honors', 'honorsList', defaultHonor)}
        >
          + Add Another Honor
        </button>
      )}
    </div>
  );
};

export default HonorsSection;
