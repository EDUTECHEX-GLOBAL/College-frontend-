// src/components/activities-sections/ResponsibilitiesSection.js
import React from 'react';
import './Responsibilities.css';

const ResponsibilitiesSection = ({ activitiesData, handleInputChange }) => {
  const { responsibilities } = activitiesData;

  // Responsibilities options
  const responsibilitiesOptions = [
    'Assisting family or household members with tasks such as doctors\' appointments, bank visits, or visa interviews',
    'Farm work or unpaid work for a family business',
    'Interpreting or translating for family or household members',
    'Managing family or household finances, budget, or paying bills',
    'Providing transportation for family or household members',
    'Taking care of sick, disabled, and/or elderly members of my family or household',
    'Taking care of younger family or household members',
    'Taking care of my own child or children',
    'Working at a paid job to contribute to my household\'s income',
    'Other',
    'None of these'
  ];

  // Circumstances options
  const circumstancesOptions = [
    'Commuting 60 minutes or more to and from school each day',
    'Experiencing homelessness or another unstable living situation',
    'Living without consistent heat, power, water, or access to food',
    'Living without reliable or usable internet',
    'Living independently or living on my own (not including boarding school)',
    'None of these'
  ];

  const handleResponsibilityChange = (responsibility) => {
    const currentResponsibilities = responsibilities.selectedResponsibilities || [];
    let updatedResponsibilities;

    if (responsibility === 'None of these') {
      updatedResponsibilities = currentResponsibilities.includes('None of these') ? [] : ['None of these'];
    } else {
      if (currentResponsibilities.includes(responsibility)) {
        updatedResponsibilities = currentResponsibilities.filter(r => r !== responsibility);
      } else {
        updatedResponsibilities = [...currentResponsibilities.filter(r => r !== 'None of these'), responsibility];
      }
    }

    handleInputChange('responsibilities', 'selectedResponsibilities', updatedResponsibilities);
  };

  const handleCircumstanceChange = (circumstance) => {
    const currentCircumstances = responsibilities.selectedCircumstances || [];
    let updatedCircumstances;

    if (circumstance === 'None of these') {
      updatedCircumstances = currentCircumstances.includes('None of these') ? [] : ['None of these'];
    } else {
      if (currentCircumstances.includes(circumstance)) {
        updatedCircumstances = currentCircumstances.filter(c => c !== circumstance);
      } else {
        updatedCircumstances = [...currentCircumstances.filter(c => c !== 'None of these'), circumstance];
      }
    }

    handleInputChange('responsibilities', 'selectedCircumstances', updatedCircumstances);
  };

  return (
    <div className="responsibilities-section">
      {/* Header */}
      <div className="responsibilities-header">
        <h2 className="responsibilities-title">Responsibilities and circumstances</h2>
        <div className="responsibilities-status">Complete</div>
      </div>

      <div className="responsibilities-description">
        <p>
          Sometimes academics and activities are impacted by household responsibilities or other circumstances. Sharing this information with colleges can help them better understand the context of your application. You may repeat information you already provided elsewhere in your application.
        </p>
      </div>

      {/* Responsibilities Question */}
      <div className="responsibilities-question">
        <label className="responsibilities-label">
          <span className="error-indicator">⚠</span> Please select which responsibilities you spend 4 or more hours per week doing. *
        </label>
        <div className="checkboxes-list">
          {responsibilitiesOptions.map((option, index) => (
            <label key={index} className="checkbox-option">
              <input
                type="checkbox"
                checked={responsibilities.selectedResponsibilities?.includes(option) || false}
                onChange={() => handleResponsibilityChange(option)}
                className="checkbox-input"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        {(!responsibilities.selectedResponsibilities || responsibilities.selectedResponsibilities.length === 0) && (
          <p className="error-message">Please complete this required question.</p>
        )}
      </div>

      {/* Circumstances Question */}
      <div className="responsibilities-question">
        <label className="responsibilities-label">
          <span className="error-indicator">⚠</span> Please select which circumstances you've experienced. *
        </label>
        <div className="checkboxes-list">
          {circumstancesOptions.map((option, index) => (
            <label key={index} className="checkbox-option">
              <input
                type="checkbox"
                checked={responsibilities.selectedCircumstances?.includes(option) || false}
                onChange={() => handleCircumstanceChange(option)}
                className="checkbox-input"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        {(!responsibilities.selectedCircumstances || responsibilities.selectedCircumstances.length === 0) && (
          <p className="error-message">Please complete this required question.</p>
        )}
      </div>
    </div>
  );
};

export default ResponsibilitiesSection;
