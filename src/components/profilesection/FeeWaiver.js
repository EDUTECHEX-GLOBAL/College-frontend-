import React from 'react';
import './FeeWaiver.css'; // Add this import

const FeeWaiverSection = ({ formData, handleInputChange, handleArrayChange }) => (
  <div className="fee-waiver-section"> {/* Changed class name */}
    <h2>Common App Fee Waiver</h2>
    <div className="section-status">
      {formData.profileCompletion.feeWaiver ? 'Complete' : 'In Progress'}
    </div>
    <div className="form-content">
      <div className="form-group">
        <p>You are eligible for application fee waivers if you meet one or more of the following criteria:</p>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.feeWaiverCriteria.includes('free-reduced-lunch')}
              onChange={() => handleArrayChange('feeWaiverCriteria', 'free-reduced-lunch')}
            />
            You are enrolled in or eligible to participate in the federal free or reduced price lunch program.
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.feeWaiverCriteria.includes('sat-act-fee-waiver')}
              onChange={() => handleArrayChange('feeWaiverCriteria', 'sat-act-fee-waiver')}
            />
            You have received or are eligible to receive an SAT or ACT fee waiver.
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.feeWaiverCriteria.includes('income-eligibility')}
              onChange={() => handleArrayChange('feeWaiverCriteria', 'income-eligibility')}
            />
            Your annual family income falls within the income eligibility guidelines set by the USDA Food and Nutrition Service.
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.feeWaiverCriteria.includes('public-assistance')}
              onChange={() => handleArrayChange('feeWaiverCriteria', 'public-assistance')}
            />
            Your family receives public assistance.
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.feeWaiverCriteria.includes('low-income-program')}
              onChange={() => handleArrayChange('feeWaiverCriteria', 'low-income-program')}
            />
            You are enrolled in a federal, state, or local program that aids students from low-income families.
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.feeWaiverCriteria.includes('subsidized-housing')}
              onChange={() => handleArrayChange('feeWaiverCriteria', 'subsidized-housing')}
            />
            You live in federally subsidized public housing, a foster home or are homeless.
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.feeWaiverCriteria.includes('ward-or-orphan')}
              onChange={() => handleArrayChange('feeWaiverCriteria', 'ward-or-orphan')}
            />
            You are a ward of the state or an orphan.
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.feeWaiverCriteria.includes('pell-grant')}
              onChange={() => handleArrayChange('feeWaiverCriteria', 'pell-grant')}
            />
            You have received or are eligible to receive a Pell Grant.
          </label>
          <label>
            <input
              type="checkbox"
              checked={formData.feeWaiverCriteria.includes('supporting-statement')}
              onChange={() => handleArrayChange('feeWaiverCriteria', 'supporting-statement')}
            />
            You can provide a supporting statement from a school official, college access counselor, financial aid officer, or community leader.
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="required">Do you meet one or more of the Common App fee waiver eligibility criteria?</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="feeWaiverEligible"
              value={true}
              checked={formData.feeWaiverEligible === true}
              onChange={() => handleInputChange({ target: { name: 'feeWaiverEligible', value: true } })}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="feeWaiverEligible"
              value={false}
              checked={formData.feeWaiverEligible === false}
              onChange={() => handleInputChange({ target: { name: 'feeWaiverEligible', value: false } })}
            />
            No
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Would you like to connect with a UStrive mentor?</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="ustriveMentor"
              value={true}
              checked={formData.ustriveMentor === true}
              onChange={() => handleInputChange({ target: { name: 'ustriveMentor', value: true } })}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="ustriveMentor"
              value={false}
              checked={formData.ustriveMentor === false}
              onChange={() => handleInputChange({ target: { name: 'ustriveMentor', value: false } })}
            />
            No
          </label>
        </div>
      </div>
    </div>
  </div>
);

export default FeeWaiverSection;