import React from 'react';
import './ProfilePreview.css';

const ProfilePreview = ({ formData, onEditSection, onBackToForm, onFinalSubmit, saving }) => {
  return (
    <div className="profile-preview">
      <div className="preview-header">
        <h2>Profile Preview</h2>
        <p>Review your information before final submission</p>
      </div>

      <div className="preview-sections">
        {/* Personal Information Preview */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Personal Information</h3>
            <button 
              className="edit-section-btn"
              onClick={() => onEditSection('personal')}
            >
              Edit
            </button>
          </div>
          <div className="preview-content">
            <p><strong>Legal Name:</strong> {formData.firstName} {formData.middleName} {formData.lastName} {formData.suffix}</p>
            <p><strong>Date of Birth:</strong> {formData.birthDate}</p>
            {formData.useDifferentFirstName === 'yes' && (
              <p><strong>Preferred Name:</strong> {formData.preferredFirstName}</p>
            )}
          </div>
        </div>

        {/* Contact Details Preview */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Contact Details</h3>
            <button 
              className="edit-section-btn"
              onClick={() => onEditSection('contact')}
            >
              Edit
            </button>
          </div>
          <div className="preview-content">
            <p><strong>Primary Phone:</strong> {formData.countryCode} {formData.phone} ({formData.preferredPhoneType})</p>
            {formData.alternatePhone && formData.alternatePhoneType !== 'none' && (
              <p><strong>Alternate Phone:</strong> {formData.alternatePhone} ({formData.alternatePhoneType})</p>
            )}
          </div>
        </div>

        {/* Address Preview */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Address</h3>
            <button 
              className="edit-section-btn"
              onClick={() => onEditSection('address')}
            >
              Edit
            </button>
          </div>
          <div className="preview-content">
            <p><strong>Address Line 1:</strong> {formData.addressLine1}</p>
            {formData.addressLine2 && <p><strong>Address Line 2:</strong> {formData.addressLine2}</p>}
            <p><strong>City:</strong> {formData.city}</p>
            <p><strong>State:</strong> {formData.state}</p>
            <p><strong>ZIP Code:</strong> {formData.zipCode}</p>
            <p><strong>Country:</strong> {formData.country}</p>
          </div>
        </div>

        {/* Demographics Preview */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Demographics</h3>
            <button 
              className="edit-section-btn"
              onClick={() => onEditSection('demographics')}
            >
              Edit
            </button>
          </div>
          <div className="preview-content">
            {formData.gender && <p><strong>Gender:</strong> {formData.gender}</p>}
            {formData.additionalGender && <p><strong>Additional Gender:</strong> {formData.additionalGender}</p>}
            {formData.legalSex && <p><strong>Legal Sex:</strong> {formData.legalSex}</p>}
            {formData.pronouns && <p><strong>Pronouns:</strong> {formData.pronouns}</p>}
            {formData.additionalPronouns && <p><strong>Additional Pronouns:</strong> {formData.additionalPronouns}</p>}
            {formData.armedForcesStatus && <p><strong>Armed Forces Status:</strong> {formData.armedForcesStatus}</p>}
            {formData.hispanicOrLatino && <p><strong>Hispanic or Latino:</strong> {formData.hispanicOrLatino}</p>}
            {formData.ethnicity && formData.ethnicity.length > 0 && (
              <p><strong>Ethnicity:</strong> {formData.ethnicity.join(', ')}</p>
            )}
          </div>
        </div>

        {/* Language Preview */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Language</h3>
            <button 
              className="edit-section-btn"
              onClick={() => onEditSection('language')}
            >
              Edit
            </button>
          </div>
          <div className="preview-content">
            <p><strong>Languages Proficient:</strong> {formData.languagesProficient}</p>
            {formData.languages && formData.languages.length > 0 && (
              <div>
                <p><strong>Languages:</strong></p>
                {formData.languages.map((lang, index) => (
                  <div key={index} style={{marginLeft: '20px', marginBottom: '10px'}}>
                    <p><strong>Language {index + 1}:</strong> {lang.language}</p>
                    <p style={{marginLeft: '10px'}}>
                      <strong>Proficiency:</strong> 
                      {lang.proficiency.firstLanguage && ' First Language'}
                      {lang.proficiency.speak && ' Speak'}
                      {lang.proficiency.read && ' Read'}
                      {lang.proficiency.write && ' Write'}
                      {lang.proficiency.spokenAtHome && ' Spoken at Home'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Geography & Nationality Preview */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Geography & Nationality</h3>
            <button 
              className="edit-section-btn"
              onClick={() => onEditSection('geography')}
            >
              Edit
            </button>
          </div>
          <div className="preview-content">
            {formData.birthCountry && <p><strong>Birth Country:</strong> {formData.birthCountry}</p>}
            {formData.cityOfBirth && <p><strong>City of Birth:</strong> {formData.cityOfBirth}</p>}
            {formData.yearsInUS && <p><strong>Years in US:</strong> {formData.yearsInUS}</p>}
            {formData.citizenshipStatus && <p><strong>Citizenship Status:</strong> {formData.citizenshipStatus}</p>}
          </div>
        </div>

        {/* Removed Fee Waiver Section */}
      </div>

      <div className="preview-actions">
        <button 
          className="preview-secondary-button"
          onClick={onBackToForm}
          disabled={saving}
        >
          ← Back to Form
        </button>
        <button 
          className="preview-primary-button"
          onClick={onFinalSubmit}
          disabled={saving}
        >
          {saving ? 'Submitting...' : 'Submit Profile'}
        </button>
      </div>
    </div>
  );
};

export default ProfilePreview;