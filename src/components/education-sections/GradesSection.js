// src/components/education-sections/GradesSection.js
import React from 'react';
import './GradesSection.css';

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
          <select
            className="grades-select"
            value={grades.classRankReporting}
            onChange={(e) => handleInputChange('grades', 'classRankReporting', e.target.value)}
          >
            <option value="">Select reporting type</option>
            <option value="exact">Exact</option>
            <option value="decile">Decile</option>
            <option value="quintile">Quintile</option>
            <option value="quartile">Quartile</option>
            <option value="none">None</option>
          </select>
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
          <select
            className="grades-select"
            value={grades.gpaScale}
            onChange={(e) => handleInputChange('grades', 'gpaScale', e.target.value)}
          >
            <option value="">Choose an option</option>
            <option value="4.0">4.0 Scale</option>
            <option value="5.0">5.0 Scale</option>
            <option value="100">100 Point Scale</option>
            <option value="other">Other Scale</option>
          </select>
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
