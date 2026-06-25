// src/components/education-sections/GradesSection.js
import React, { useEffect, useRef, useState } from 'react';
import './GradesSection.css';

const CLASS_RANK_OPTIONS = [
  { value: 'exact', label: 'Exact' },
  { value: 'decile', label: 'Decile' },
  { value: 'quintile', label: 'Quintile' },
  { value: 'quartile', label: 'Quartile' },
  { value: 'none', label: 'None' },
];

const GPA_SCALE_OPTIONS = [
  { value: '4.0', label: '4.0 Scale' },
  { value: '5.0', label: '5.0 Scale' },
  { value: '100', label: '100 Point Scale' },
  { value: 'other', label: 'Other Scale' },
];

const GradesSelect = ({ value, options, placeholder, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxId = `grades-${placeholder.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-listbox`;
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
      className={`grades-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}
    >
      <button
        type="button"
        className={`grades-select grades-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="grades-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="grades-select-menu" id={listboxId} role="listbox">
          <button
            type="button"
            className={`grades-select-option${value === '' ? ' is-selected' : ''}`}
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
              className={`grades-select-option${value === option.value ? ' is-selected' : ''}`}
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

const GradesSection = ({ educationData, handleInputChange }) => {
  const { grades } = educationData;

  return (
    <div className="grades-section">
      <div className="grades-header">
        <h2 className="grades-title">Grades</h2>
        <div className="grades-status">In progress</div>
      </div>

      <div className="grades-grid">
        {/* Graduating Class Size */}
        <div className="grades-form-group">
          <label className="grades-label grades-required">Graduating Class Size (approx)</label>
          <input
            type="number"
            className="grades-input"
            placeholder="Enter class size"
            value={grades.graduatingClassSize}
            onChange={(e) => handleInputChange('grades', 'graduatingClassSize', e.target.value)}
          />
        </div>

        {/* Class Rank Reporting */}
        <div className="grades-form-group">
          <label className="grades-label grades-required">Class Rank Reporting</label>
          <GradesSelect
            value={grades.classRankReporting}
            options={CLASS_RANK_OPTIONS}
            placeholder="Select reporting type"
            onChange={(nextValue) => handleInputChange('grades', 'classRankReporting', nextValue)}
          />
        </div>

        {/* Class Rank */}
        {grades.classRankReporting && grades.classRankReporting !== 'none' && (
          <div className="grades-form-group">
            <label className="grades-label grades-required">
              {grades.classRankReporting === 'exact'
                ? 'Class Rank'
                : grades.classRankReporting === 'decile'
                ? 'Decile Rank'
                : grades.classRankReporting === 'quintile'
                ? 'Quintile Rank'
                : 'Quartile Rank'}
            </label>
            <input
              type="text"
              className="grades-input"
              placeholder={`Enter ${grades.classRankReporting} rank`}
              value={grades.classRank}
              onChange={(e) => handleInputChange('grades', 'classRank', e.target.value)}
            />
          </div>
        )}

        {/* GPA Scale */}
        <div className="grades-form-group">
          <label className="grades-label grades-required">GPA Scale Reporting</label>
          <GradesSelect
            value={grades.gpaScale}
            options={GPA_SCALE_OPTIONS}
            placeholder="Choose an option"
            onChange={(nextValue) => handleInputChange('grades', 'gpaScale', nextValue)}
          />
        </div>

        {/* Cumulative GPA */}
        <div className="grades-form-group">
          <label className="grades-label grades-required">Cumulative GPA</label>
          <input
            type="number"
            step="0.01"
            className="grades-input"
            placeholder="Enter GPA"
            value={grades.cumulativeGPA}
            onChange={(e) => handleInputChange('grades', 'cumulativeGPA', e.target.value)}
          />
        </div>

        {/* GPA Max Scale */}
        {grades.gpaScale === 'other' && (
          <div className="grades-form-group">
            <label className="grades-label grades-required">Maximum GPA Scale</label>
            <input
              type="number"
              step="0.1"
              className="grades-input"
              placeholder="e.g., 10.0, 12.0"
              value={grades.gpaMaxScale}
              onChange={(e) => handleInputChange('grades', 'gpaMaxScale', e.target.value)}
            />
          </div>
        )}

        {/* GPA Weighting */}
        <div className="grades-form-group grades-full-width">
          <label className="grades-label grades-required">GPA Weighting</label>
          <div className="grades-radio-group">
            <label className="grades-radio-option">
              <input
                type="radio"
                name="gpaWeighting"
                value="weighted"
                checked={grades.gpaWeighting === 'weighted'}
                onChange={(e) => handleInputChange('grades', 'gpaWeighting', e.target.value)}
                className="grades-radio-input"
              />
              <span className="grades-radio-label">Weighted</span>
            </label>
            <label className="grades-radio-option">
              <input
                type="radio"
                name="gpaWeighting"
                value="unweighted"
                checked={grades.gpaWeighting === 'unweighted'}
                onChange={(e) => handleInputChange('grades', 'gpaWeighting', e.target.value)}
                className="grades-radio-input"
              />
              <span className="grades-radio-label">Unweighted</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradesSection;
