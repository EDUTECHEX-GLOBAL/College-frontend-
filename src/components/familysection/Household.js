// src/components/family-sections/HouseholdSection.js
import React from 'react';
import './Household.css';

const HouseholdSection = ({ familyData, handleInputChange }) => {
  const { household } = familyData;

  return (
    <div className="household-section">
      {/* Header */}
      <div className="household-header">
        <h2 className="household-title">Household</h2>
        <div className="household-status">In progress</div>
      </div>

      <div className="household-description">
        Please provide information about your household and family structure.
      </div>

      <div className="household-grid">
        {/* Parents' Marital Status */}
        <div className="household-form-group household-full-width">
          <label className="household-label household-required">
            Parents' marital status (relative to each other)
          </label>
          <select
            className="household-select"
            value={household.parentsMaritalStatus || ''}
            onChange={(e) => handleInputChange('household', 'parentsMaritalStatus', e.target.value)}
          >
            <option value="">- Choose an option -</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="separated">Separated</option>
            <option value="widowed">Widowed</option>
            <option value="never-married">Never Married</option>
            <option value="unmarried-living-together">Unmarried and living together</option>
          </select>
          {!household.parentsMaritalStatus && (
            <div className="household-error">Please complete this required question.</div>
          )}
        </div>

        {/* Permanent Home */}
        <div className="household-form-group household-full-width">
          <label className="household-label household-required">
            With whom do you make your permanent home?
          </label>
          <select
            className="household-select"
            value={household.permanentHome || ''}
            onChange={(e) => handleInputChange('household', 'permanentHome', e.target.value)}
          >
            <option value="">- Choose an option -</option>
            <option value="both-parents">Both Parents</option>
            <option value="parent1">Parent 1</option>
            <option value="parent2">Parent 2</option>
            <option value="legal-guardian">Legal Guardian</option>
            <option value="other-relative">Other Relative</option>
            <option value="foster-care">Foster Care</option>
            <option value="other">Other</option>
          </select>
          {!household.permanentHome && (
            <div className="household-error">Please complete this required question.</div>
          )}
        </div>

        {/* Has Children */}
        <div className="household-form-group household-full-width">
          <label className="household-label household-required">
            Do you have any children?
          </label>
          <div className="household-radio-group">
            <label className="household-radio-option">
              <input
                type="radio"
                name="hasChildren"
                value="yes"
                checked={household.hasChildren === 'yes'}
                onChange={(e) => handleInputChange('household', 'hasChildren', e.target.value)}
                className="household-radio-input"
              />
              <span className="household-radio-label">Yes</span>
            </label>
            <label className="household-radio-option">
              <input
                type="radio"
                name="hasChildren"
                value="no"
                checked={household.hasChildren === 'no'}
                onChange={(e) => handleInputChange('household', 'hasChildren', e.target.value)}
                className="household-radio-input"
              />
              <span className="household-radio-label">No</span>
            </label>
          </div>
          <button
            type="button"
            className="household-clear-btn"
            onClick={() => handleInputChange('household', 'hasChildren', '')}
          >
            Clear answer
          </button>
        </div>

        {/* Number of Children (conditional) */}
        {household.hasChildren === 'yes' && (
          <div className="household-form-group">
            <label className="household-label household-required">
              How many?
            </label>
            <input
              type="number"
              className="household-input"
              placeholder="Enter number"
              value={household.numberOfChildren || ''}
              onChange={(e) => handleInputChange('household', 'numberOfChildren', parseInt(e.target.value) || 0)}
              min="0"
              max="20"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HouseholdSection;
