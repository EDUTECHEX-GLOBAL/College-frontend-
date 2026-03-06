// src/components/family-sections/SiblingSection.js
import React from 'react';
import './Sibling.css';

const SiblingSection = ({ 
  familyData, 
  handleInputChange, 
  handleArrayChange, 
  addArrayItem, 
  removeArrayItem 
}) => {
  const { siblings } = familyData;

  const handleHasSiblingsChange = (value) => {
    handleInputChange('siblings', 'hasSiblings', value);

    if (value === 'yes' && siblings.siblingsList.length === 0) {
      addArrayItem('siblings', 'siblingsList', {
        firstName: '',
        lastName: '',
        relationship: '',
        age: '',
        collegeAttended: '',
        degreeEarned: ''
      });
    } else if (value === 'no') {
      handleInputChange('siblings', 'siblingsList', []);
      handleInputChange('siblings', 'numberOfSiblings', 0);
    }
  };

  const defaultSibling = {
    firstName: '',
    lastName: '',
    relationship: '',
    age: '',
    collegeAttended: '',
    degreeEarned: ''
  };

  return (
    <div className="sibling-section">
      {/* Header */}
      <div className="sibling-header">
        <h2 className="sibling-title">Sibling</h2>
        <div className="sibling-status">In progress</div>
      </div>

      <div className="sibling-description">
        Please provide information about your siblings if applicable.
      </div>

      {/* Has Siblings Question */}
      <div className="sibling-form-group">
        <label className="sibling-label sibling-required">
          Do you have any siblings?
        </label>
        <div className="sibling-radio-group">
          <label className="sibling-radio-option">
            <input
              type="radio"
              name="hasSiblings"
              value="yes"
              checked={siblings.hasSiblings === 'yes'}
              onChange={(e) => handleHasSiblingsChange(e.target.value)}
              className="sibling-radio-input"
            />
            <span className="sibling-radio-label">Yes</span>
          </label>
          <label className="sibling-radio-option">
            <input
              type="radio"
              name="hasSiblings"
              value="no"
              checked={siblings.hasSiblings === 'no'}
              onChange={(e) => handleHasSiblingsChange(e.target.value)}
              className="sibling-radio-input"
            />
            <span className="sibling-radio-label">No</span>
          </label>
        </div>
      </div>

      {/* Number of Siblings */}
      {siblings.hasSiblings === 'yes' && (
        <div className="sibling-form-group">
          <label className="sibling-label sibling-required">
            How many siblings do you have?
          </label>
          <input
            type="number"
            className="sibling-input"
            placeholder="Enter number"
            value={siblings.numberOfSiblings || ''}
            onChange={(e) => handleInputChange('siblings', 'numberOfSiblings', parseInt(e.target.value) || 0)}
            min="0"
            max="20"
          />
        </div>
      )}

      {/* Siblings List */}
      {siblings.hasSiblings === 'yes' &&
        siblings.siblingsList &&
        siblings.siblingsList.map((sibling, index) => (
          <div key={index} className="sibling-array-section">
            <div className="sibling-item">
              <div className="sibling-item-header">
                <h4 className="sibling-item-title">Sibling {index + 1}</h4>
                <button
                  type="button"
                  className="sibling-remove-btn"
                  onClick={() => removeArrayItem('siblings', 'siblingsList', index)}
                >
                  Remove
                </button>
              </div>

              <div className="sibling-grid">
                {/* First Name */}
                <div className="sibling-form-group">
                  <label className="sibling-label sibling-required">First Name</label>
                  <input
                    type="text"
                    className="sibling-input"
                    placeholder="Enter first name"
                    value={sibling.firstName || ''}
                    onChange={(e) =>
                      handleArrayChange('siblings', 'siblingsList', index, 'firstName', e.target.value)
                    }
                  />
                </div>

                {/* Last Name */}
                <div className="sibling-form-group">
                  <label className="sibling-label sibling-required">Last Name</label>
                  <input
                    type="text"
                    className="sibling-input"
                    placeholder="Enter last name"
                    value={sibling.lastName || ''}
                    onChange={(e) =>
                      handleArrayChange('siblings', 'siblingsList', index, 'lastName', e.target.value)
                    }
                  />
                </div>

                {/* Relationship */}
                <div className="sibling-form-group">
                  <label className="sibling-label sibling-required">Relationship</label>
                  <select
                    className="sibling-select"
                    value={sibling.relationship || ''}
                    onChange={(e) =>
                      handleArrayChange('siblings', 'siblingsList', index, 'relationship', e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="stepbrother">Stepbrother</option>
                    <option value="stepsister">Stepsister</option>
                    <option value="half-brother">Half-brother</option>
                    <option value="half-sister">Half-sister</option>
                  </select>
                </div>

                {/* Age */}
                <div className="sibling-form-group">
                  <label className="sibling-label">Age</label>
                  <input
                    type="number"
                    className="sibling-input"
                    placeholder="Enter age"
                    value={sibling.age || ''}
                    onChange={(e) =>
                      handleArrayChange('siblings', 'siblingsList', index, 'age', e.target.value)
                    }
                    min="0"
                    max="100"
                  />
                </div>

                {/* College Attended */}
                <div className="sibling-form-group">
                  <label className="sibling-label">College Attended</label>
                  <input
                    type="text"
                    className="sibling-input"
                    placeholder="Enter college name"
                    value={sibling.collegeAttended || ''}
                    onChange={(e) =>
                      handleArrayChange('siblings', 'siblingsList', index, 'collegeAttended', e.target.value)
                    }
                  />
                </div>

                {/* Degree Earned */}
                <div className="sibling-form-group">
                  <label className="sibling-label">Degree Earned</label>
                  <input
                    type="text"
                    className="sibling-input"
                    placeholder="Enter degree"
                    value={sibling.degreeEarned || ''}
                    onChange={(e) =>
                      handleArrayChange('siblings', 'siblingsList', index, 'degreeEarned', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

      {/* Add Sibling Button */}
      {siblings.hasSiblings === 'yes' && (
        <button
          type="button"
          className="sibling-add-btn"
          onClick={() => addArrayItem('siblings', 'siblingsList', defaultSibling)}
        >
          + Add Another Sibling
        </button>
      )}
    </div>
  );
};

export default SiblingSection;
