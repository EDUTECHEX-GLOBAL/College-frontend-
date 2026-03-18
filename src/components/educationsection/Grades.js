// src/components/education-sections/GradesSection.js
import React from 'react';
import './Grades.css';

const GradesSection = ({ educationData, handleInputChange }) => {
  const { grades } = educationData;

  return (
    <div className="grades-section">
      {/* Header */}
      <div className="grades-header">
        <h2 className="grades-title">Grades</h2>
        <div className="grades-status">In progress</div>
      </div>

      <div className="grades-description">
        Please provide information about your grades and class rank.
      </div>

      <div className="grades-grid">
        {/* Graduating Class Size */}
        <div className="grades-form-group grades-full-width">
          <label className="grades-label grades-required">
            Graduating class size (approx.)
          </label>
          <input
            type="number"
            className="grades-input"
            placeholder="Enter class size"
            value={grades.graduatingClassSize || ''}
            onChange={(e) => handleInputChange('grades', 'graduatingClassSize', e.target.value)}
            min="1"
          />
          <div className="grades-hint">
            Enter the approximate number of students in your graduating class
          </div>
        </div>

        {/* Class Rank Reporting */}
        <div className="grades-form-group grades-full-width">
          <label className="grades-label grades-required">
            Class rank reporting
          </label>
          <div className="grades-radio-group-vertical">
            <label className="grades-radio-option">
              <input
                type="radio"
                name="classRankReporting"
                value="exact"
                checked={grades.classRankReporting === 'exact'}
                onChange={(e) => handleInputChange('grades', 'classRankReporting', e.target.value)}
                className="grades-radio-input"
              />
              <span className="grades-radio-label">Exact</span>
            </label>

            <label className="grades-radio-option">
              <input
                type="radio"
                name="classRankReporting"
                value="decile"
                checked={grades.classRankReporting === 'decile'}
                onChange={(e) => handleInputChange('grades', 'classRankReporting', e.target.value)}
                className="grades-radio-input"
              />
              <span className="grades-radio-label">Decile</span>
            </label>

            <label className="grades-radio-option">
              <input
                type="radio"
                name="classRankReporting"
                value="quintile"
                checked={grades.classRankReporting === 'quintile'}
                onChange={(e) => handleInputChange('grades', 'classRankReporting', e.target.value)}
                className="grades-radio-input"
              />
              <span className="grades-radio-label">Quintile</span>
            </label>

            <label className="grades-radio-option">
              <input
                type="radio"
                name="classRankReporting"
                value="quartile"
                checked={grades.classRankReporting === 'quartile'}
                onChange={(e) => handleInputChange('grades', 'classRankReporting', e.target.value)}
                className="grades-radio-input"
              />
              <span className="grades-radio-label">Quartile</span>
            </label>

            <label className="grades-radio-option">
              <input
                type="radio"
                name="classRankReporting"
                value="none"
                checked={grades.classRankReporting === 'none'}
                onChange={(e) => handleInputChange('grades', 'classRankReporting', e.target.value)}
                className="grades-radio-input"
              />
              <span className="grades-radio-label">None</span>
            </label>
          </div>

          <button
            type="button"
            className="grades-clear-btn"
            onClick={() => handleInputChange('grades', 'classRankReporting', '')}
          >
            Clear answer
          </button>
        </div>

        {/* Class Rank (if exact is selected) */}
        {grades.classRankReporting === 'exact' && (
          <div className="grades-form-group">
            <label className="grades-label">Class Rank</label>
            <input
              type="number"
              className="grades-input"
              placeholder="Enter your class rank"
              value={grades.classRank || ''}
              onChange={(e) => handleInputChange('grades', 'classRank', e.target.value)}
              min="1"
            />
          </div>
        )}

        {/* GPA Scale Reporting */}
        <div className="grades-form-group grades-full-width">
          <label className="grades-label grades-required">
            GPA Scale reporting
          </label>
          <select
            className="grades-select"
            value={grades.gpaScale || ''}
            onChange={(e) => handleInputChange('grades', 'gpaScale', e.target.value)}
          >
            <option value="">- Choose an option -</option>
            <option value="4.0">4.0 Scale</option>
            <option value="5.0">5.0 Scale</option>
            <option value="6.0">6.0 Scale</option>
            <option value="10.0">10.0 Scale</option>
            <option value="100">100 Point Scale</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Cumulative GPA */}
        <div className="grades-form-group">
          <label className="grades-label grades-required">
            Cumulative GPA
          </label>
          <input
            type="text"
            className="grades-input"
            placeholder="Enter your GPA"
            value={grades.cumulativeGPA || ''}
            onChange={(e) => handleInputChange('grades', 'cumulativeGPA', e.target.value)}
          />
          <div className="grades-hint">
            Enter your cumulative GPA (e.g., 3.75)
          </div>
        </div>

        {/* GPA Weighting */}
        <div className="grades-form-group grades-full-width">
          <label className="grades-label grades-required">
            GPA weighting
          </label>
          <div className="grades-radio-group-horizontal">
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

          <button
            type="button"
            className="grades-clear-btn"
            onClick={() => handleInputChange('grades', 'gpaWeighting', '')}
          >
            Clear answer
          </button>
        </div>

        {/* GPA Max Scale (if other is selected) */}
        {grades.gpaScale === 'other' && (
          <div className="grades-form-group">
            <label className="grades-label">GPA Max Scale</label>
            <input
              type="text"
              className="grades-input"
              placeholder="Enter max scale (e.g., 12.0)"
              value={grades.gpaMaxScale || ''}
              onChange={(e) => handleInputChange('grades', 'gpaMaxScale', e.target.value)}
            />
            <div className="grades-hint">
              Specify the maximum value of your GPA scale
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradesSection;
