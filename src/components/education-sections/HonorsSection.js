// src/components/education-sections/HonorsSection.js
import React from 'react';
import './HonorsSection.css';

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
                  <select
                    className="honors-select"
                    value={honor.honorLevel}
                    onChange={(e) =>
                      handleArrayChange('honors', 'honorsList', index, 'honorLevel', e.target.value)
                    }
                  >
                    <option value="">Select level</option>
                    <option value="school">School</option>
                    <option value="district">District</option>
                    <option value="state">State</option>
                    <option value="national">National</option>
                    <option value="international">International</option>
                  </select>
                </div>

                <div className="honors-form-group">
                  <label className="honors-label honors-required">Year Received</label>
                  <select
                    className="honors-select"
                    value={honor.yearReceived}
                    onChange={(e) =>
                      handleArrayChange(
                        'honors',
                        'honorsList',
                        index,
                        'yearReceived',
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select year</option>
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(
                      (year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    )}
                  </select>
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
