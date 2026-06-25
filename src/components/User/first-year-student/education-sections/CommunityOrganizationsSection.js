// src/components/education-sections/CommunityOrganizationsSection.js
import React, { useEffect, useRef, useState } from 'react';
import './CommunityOrganizationsSection.css';

const ASSISTANCE_TYPE_OPTIONS = [
  { value: 'counseling', label: 'Counseling' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'financial-aid', label: 'Financial Aid Assistance' },
  { value: 'application-help', label: 'Application Help' },
  { value: 'test-prep', label: 'Test Preparation' },
  { value: 'other', label: 'Other' },
];

const CommunityOrganizationsSelect = ({ value, options, placeholder, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`community-organizations-${Math.random().toString(36).slice(2)}-listbox`);
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
      className={`community-organizations-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}
    >
      <button
        type="button"
        className={`community-organizations-select community-organizations-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxIdRef.current}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="community-organizations-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="community-organizations-select-menu" id={listboxIdRef.current} role="listbox">
          <button
            type="button"
            className={`community-organizations-select-option${value === '' ? ' is-selected' : ''}`}
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
              className={`community-organizations-select-option${value === option.value ? ' is-selected' : ''}`}
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

const CommunityOrganizationsSection = ({
  educationData,
  handleInputChange,
  handleArrayChange,
  addArrayItem,
  removeArrayItem
}) => {
  const { communityOrganizations } = educationData;

  const handleNumberOfOrganizationsChange = (value) => {
    const numOrgs = parseInt(value);
    handleInputChange('communityOrganizations', 'numberOfOrganizations', numOrgs);
  };

  const defaultOrganization = {
    organizationName: '',
    assistanceType: '',
    duration: '',
    contactPerson: ''
  };

  return (
    <div className="community-organizations-section">
      {/* Header */}
      <div className="community-organizations-header">
        <h2 className="community-organizations-title">
          Community-Based Organizations
        </h2>
        <div className="community-organizations-status">In progress</div>
      </div>

      <div className="community-organizations-description">
        Indicate community programs or organizations that have provided you with
        free assistance in your application process.
      </div>

      {/* Number of Organizations */}
      <div className="community-organizations-form-group">
        <label className="community-organizations-label community-organizations-required">
          Number of community programs or organizations
        </label>
        <div className="community-organizations-radio-group">
          {[0, 1, 2, 3].map((num) => (
            <label key={num} className="community-organizations-radio-option">
              <input
                type="radio"
                name="numberOfOrganizations"
                value={num}
                checked={communityOrganizations.numberOfOrganizations === num}
                onChange={(e) => handleNumberOfOrganizationsChange(e.target.value)}
                className="community-organizations-radio-input"
              />
              <span className="community-organizations-radio-label">{num}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Organization Details */}
      {communityOrganizations.organizations &&
        communityOrganizations.organizations.map((org, index) => (
          <div key={index} className="community-organizations-array-section">
            <div className="community-organizations-item">
              <div className="community-organizations-item-header">
                <h4 className="community-organizations-item-title">
                  Organization {index + 1}
                </h4>
                {communityOrganizations.numberOfOrganizations > 0 && (
                  <button
                    type="button"
                    className="community-organizations-remove-btn"
                    onClick={() =>
                      removeArrayItem('communityOrganizations', 'organizations', index)
                    }
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="community-organizations-grid">
                {/* Organization Name */}
                <div className="community-organizations-form-group community-organizations-full-width">
                  <label className="community-organizations-label community-organizations-required">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    className="community-organizations-input"
                    placeholder="Enter organization name"
                    value={org.organizationName}
                    onChange={(e) =>
                      handleArrayChange(
                        'communityOrganizations',
                        'organizations',
                        index,
                        'organizationName',
                        e.target.value
                      )
                    }
                  />
                </div>

                {/* Type of Assistance */}
                <div className="community-organizations-form-group">
                  <label className="community-organizations-label community-organizations-required">
                    Type of Assistance
                  </label>
                  <CommunityOrganizationsSelect
                    value={org.assistanceType}
                    options={ASSISTANCE_TYPE_OPTIONS}
                    placeholder="Select type"
                    onChange={(nextValue) =>
                      handleArrayChange(
                        'communityOrganizations',
                        'organizations',
                        index,
                        'assistanceType',
                        nextValue
                      )
                    }
                  />
                </div>

                {/* Duration of Assistance */}
                <div className="community-organizations-form-group">
                  <label className="community-organizations-label">
                    Duration of Assistance
                  </label>
                  <input
                    type="text"
                    className="community-organizations-input"
                    placeholder="e.g., 6 months, 1 year"
                    value={org.duration}
                    onChange={(e) =>
                      handleArrayChange(
                        'communityOrganizations',
                        'organizations',
                        index,
                        'duration',
                        e.target.value
                      )
                    }
                  />
                </div>

                {/* Contact Person */}
                <div className="community-organizations-form-group">
                  <label className="community-organizations-label">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    className="community-organizations-input"
                    placeholder="Enter contact name"
                    value={org.contactPerson}
                    onChange={(e) =>
                      handleArrayChange(
                        'communityOrganizations',
                        'organizations',
                        index,
                        'contactPerson',
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

      {/* Add Organization Button */}
      {communityOrganizations.numberOfOrganizations < 3 &&
        communityOrganizations.numberOfOrganizations > 0 && (
          <button
            type="button"
            className="community-organizations-add-btn"
            onClick={() => {
              if (communityOrganizations.organizations.length < 3) {
                addArrayItem(
                  'communityOrganizations',
                  'organizations',
                  defaultOrganization
                );
              }
            }}
          >
            + Add Another Organization
          </button>
        )}
    </div>
  );
};

export default CommunityOrganizationsSection;
