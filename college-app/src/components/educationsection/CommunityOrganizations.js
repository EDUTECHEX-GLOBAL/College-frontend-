// src/components/education-sections/CommunityOrganizationsSection.js
import React from 'react';
import './CommunityOrganizations.css';

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

    const currentOrgs = communityOrganizations.organizations || [];
    const newOrgs = [];

    for (let i = 0; i < numOrgs; i++) {
      newOrgs.push(
        currentOrgs[i] || {
          organizationName: '',
          assistanceType: '',
          duration: '',
          contactPerson: ''
        }
      );
    }

    handleInputChange('communityOrganizations', 'organizations', newOrgs);
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
                    onClick={() => {
                      const updatedOrgs =
                        communityOrganizations.organizations.filter(
                          (_, i) => i !== index
                        );
                      handleInputChange(
                        'communityOrganizations',
                        'organizations',
                        updatedOrgs
                      );
                      handleInputChange(
                        'communityOrganizations',
                        'numberOfOrganizations',
                        updatedOrgs.length
                      );
                    }}
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
                  <select
                    className="community-organizations-select"
                    value={org.assistanceType}
                    onChange={(e) =>
                      handleArrayChange(
                        'communityOrganizations',
                        'organizations',
                        index,
                        'assistanceType',
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select type</option>
                    <option value="counseling">Counseling</option>
                    <option value="tutoring">Tutoring</option>
                    <option value="financial-aid">Financial Aid Assistance</option>
                    <option value="application-help">Application Help</option>
                    <option value="test-prep">Test Preparation</option>
                    <option value="other">Other</option>
                  </select>
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
                handleInputChange(
                  'communityOrganizations',
                  'numberOfOrganizations',
                  communityOrganizations.organizations.length + 1
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
