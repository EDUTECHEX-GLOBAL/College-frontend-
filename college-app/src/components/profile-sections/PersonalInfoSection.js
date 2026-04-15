import React, { useState, useRef } from 'react';
import './PersonalInfoSection.css';

// ─────────────────────────────────────────────
// Keys that come back from the CV API but are
// NOT simple form fields — handled by their own
// sections (Education, Testing, Activities).
// We must skip these when calling handleInputChange.
// ─────────────────────────────────────────────
const CV_SECTION_KEYS = new Set(['cvEducation', 'cvTesting', 'cvActivities', '_cvMeta', '_passportMeta']);

// ─────────────────────────────────────────────
// Reusable Upload Banner
// ─────────────────────────────────────────────
const DocumentUploadBanner = ({
  endpoint,
  fieldName,
  idleTitle,
  idleSub,
  badgeText,
  successTitle,
  successSub,
  onAutoFill,
  onDismiss,
}) => {
  const [status, setStatus] = useState('idle'); // idle | scanning | done | error
  const [autofillCount, setAutofillCount] = useState(0);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setStatus('scanning');

    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const result = await res.json();
      console.log(`${fieldName} API result:`, result);

      if (!result.success) throw new Error(result.message);

      const mapped = result.data;

      // Count only the flat profile fields (not arrays/objects)
      const filled = Object.entries(mapped).filter(
        ([key, val]) =>
          !CV_SECTION_KEYS.has(key) &&
          val &&
          typeof val !== 'object' &&
          String(val).trim() !== ''
      ).length;

      setAutofillCount(filled);
      await onAutoFill(mapped);
      setStatus('done');
    } catch (err) {
      console.error(`${fieldName} parse error:`, err);
      setStatus('error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  if (status === 'done') {
    return (
      <div className="personalinfosection-banner personalinfosection-banner--success">
        <div className="personalinfosection-banner__text">
          <span className="personalinfosection-banner__title">{successTitle}</span>
          <span className="personalinfosection-banner__sub">
            {successSub.replace('{count}', autofillCount)}
          </span>
        </div>
        <button className="personalinfosection-banner__dismiss" onClick={onDismiss} aria-label="Dismiss">
          <span className="personalinfosection-banner__dismiss-icon">×</span>
        </button>
      </div>
    );
  }

  if (status === 'scanning') {
    return (
      <div className="personalinfosection-banner personalinfosection-banner--scanning">
        <div className="personalinfosection-banner__spinner"></div>
        <div className="personalinfosection-banner__text">
          <span className="personalinfosection-banner__title">Reading your document…</span>
          <span className="personalinfosection-banner__sub">Extracting your details automatically</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="personalinfosection-banner personalinfosection-banner--error">
        <div className="personalinfosection-banner__text">
          <span className="personalinfosection-banner__title">Could not read document</span>
          <span className="personalinfosection-banner__sub">Please try a clearer image or fill in details manually</span>
        </div>
        <button className="personalinfosection-banner__retry" onClick={() => setStatus('idle')}>
          Try again
        </button>
      </div>
    );
  }

  // idle / upload state
  return (
    <div
      className="personalinfosection-banner personalinfosection-banner--upload"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div className="personalinfosection-banner__text">
        <span className="personalinfosection-banner__title">
          {idleTitle}
          {badgeText && <span className="personalinfosection-banner__badge">{badgeText}</span>}
        </span>
        <span className="personalinfosection-banner__sub">{idleSub}</span>
      </div>
      <div className="personalinfosection-banner__cta">Upload</div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CVUploadBanner
// ─────────────────────────────────────────────
const CVUploadBanner = ({ onAutoFill, onDismiss }) => (
  <DocumentUploadBanner
    endpoint="/api/students/cv/parse"
    fieldName="cv"
    idleTitle="Upload your CV / Résumé to auto-fill everything"
    idleSub="We'll fill your profile, education, test scores and activities in one go · PDF, JPG or PNG"
    badgeText="Auto-fill all sections"
    successTitle="CV scanned successfully"
    successSub="{count} profile fields filled — education, tests and activities also extracted"
    onAutoFill={onAutoFill}
    onDismiss={onDismiss}
  />
);

// ─────────────────────────────────────────────
// PassportUploadBanner
// ─────────────────────────────────────────────
const PassportUploadBanner = ({ onAutoFill, onDismiss }) => (
  <DocumentUploadBanner
    endpoint="/api/students/passport/parse"
    fieldName="passport"
    idleTitle="Save time — upload your passport"
    idleSub="We'll fill in your name, date of birth, nationality, citizenship and more instantly · JPG, PNG or PDF"
    badgeText="Auto-fill"
    successTitle="Passport scanned successfully"
    successSub="{count} fields filled automatically — review and edit below if needed"
    onAutoFill={onAutoFill}
    onDismiss={onDismiss}
  />
);

// ─────────────────────────────────────────────
// AadhaarUploadBanner
// ─────────────────────────────────────────────
const AadhaarUploadBanner = ({ onAutoFill, onDismiss }) => (
  <DocumentUploadBanner
    endpoint="/api/students/aadhaar/parse"
    fieldName="aadhaar"
    idleTitle="Upload Aadhaar / Govt ID to auto-fill address"
    idleSub="We'll extract your address, phone number and contact details instantly · JPG, PNG or PDF"
    badgeText="Auto-fill"
    successTitle="Document scanned successfully"
    successSub="{count} fields filled automatically — review and edit below if needed"
    onAutoFill={onAutoFill}
    onDismiss={onDismiss}
  />
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const PersonalInfoSection = ({ formData, handleInputChange }) => {
  const [cvBannerVisible, setCvBannerVisible] = useState(true);
  const [passportBannerVisible, setPassportBannerVisible] = useState(false);
  const [aadhaarBannerVisible, setAadhaarBannerVisible] = useState(false);
  const [autofillFields, setAutofillFields] = useState(new Set());
  const [saveStatus, setSaveStatus] = useState(null); // null | saving | saved | error

  const handleCvSkip = () => { 
    setCvBannerVisible(false); 
    setPassportBannerVisible(true); 
    setAadhaarBannerVisible(true); 
  };
  
  const handleCvDismiss = () => { 
    setCvBannerVisible(false);
    setPassportBannerVisible(true);
    setAadhaarBannerVisible(true);
  };

  /**
   * handleAutoFill
   *
   * Works for CV, passport and aadhaar responses.
   *
   * KEY FIX: CV responses include cvEducation[], cvTesting{} and cvActivities[]
   * which are NOT simple text/select form fields.  We skip them here so that
   * handleInputChange is never called with an array or object value, which would
   * either crash or silently corrupt the form state.
   *
   * Those three fields are stored separately and consumed by their own sections
   * (Education, Testing, Activities) — the parent form should handle them via
   * a separate onCvDataReceived callback if needed.
   */
  const handleAutoFill = async (mapped) => {
    const filled = new Set();

    // Step 1: apply only flat string/scalar fields to the form
    Object.entries(mapped).forEach(([name, value]) => {
      // Skip meta and CV structured-section keys
      if (CV_SECTION_KEYS.has(name)) return;
      // Skip arrays and plain objects — they're not <input> fields
      if (Array.isArray(value) || (value !== null && typeof value === 'object')) return;
      // Skip empty values
      if (!value && value !== 0) return;

      handleInputChange({ target: { name, value } });
      filled.add(name);
    });

    setAutofillFields(prev => new Set([...prev, ...filled]));

    // Step 2: build DB payload — same flat-field filter
    const payload = {};
    Object.entries(mapped).forEach(([name, value]) => {
      if (CV_SECTION_KEYS.has(name)) return;
      if (Array.isArray(value) || (value !== null && typeof value === 'object')) return;
      if (value && String(value).trim() !== '') payload[name] = value;
    });

    if (Object.keys(payload).length === 0) return;

    // Step 3: persist to DB
    try {
      setSaveStatus('saving');
      const res = await fetch('http://localhost:5000/api/students/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...formData, ...payload }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Failed to persist autofill:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const autoClass = (fieldName) =>
    autofillFields.has(fieldName) ? 'input--autofilled' : '';

  const autoLabel = (fieldName, source = 'passport') =>
    autofillFields.has(fieldName) ? <span className="personalinfosection-autofill-tag">{source}</span> : null;

  return (
    <div className="personalinfosection">
      <h2>Personal Information</h2>

      <div className="personalinfosection-status">
        {formData.profileCompletion?.personalInfo ? 'Complete' : 'In Progress'}
      </div>

      {/* Background save indicator */}
      {saveStatus === 'saving' && (
        <div className="personalinfosection-save-status personalinfosection-save-status--saving">
          <span className="personalinfosection-spinner"></span>
          Saving data…
        </div>
      )}
      {saveStatus === 'saved' && (
        <div className="personalinfosection-save-status personalinfosection-save-status--saved">
          <span className="personalinfosection-check-icon">✓</span>
          Data saved
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="personalinfosection-save-status personalinfosection-save-status--error">
          <span className="personalinfosection-error-icon">!</span>
          Could not save — your changes are visible but may not persist. Try saving manually.
        </div>
      )}

      {/* Document upload banners */}
      <div className="personalinfosection-document-banners">

        {cvBannerVisible && (
          <div className="personalinfosection-banner-wrapper">
            <CVUploadBanner
              onAutoFill={async (mapped) => {
                await handleAutoFill(mapped);
                handleCvDismiss();
              }}
              onDismiss={handleCvDismiss}
            />
            <button className="personalinfosection-skip-link" onClick={handleCvSkip}>
              Skip — I don't have a CV, use passport / Aadhaar instead
            </button>
          </div>
        )}

        {passportBannerVisible && (
          <div className="personalinfosection-banner-wrapper">
            <PassportUploadBanner
              onAutoFill={handleAutoFill}
              onDismiss={() => setPassportBannerVisible(false)}
            />
            <button className="personalinfosection-skip-link" onClick={() => setPassportBannerVisible(false)}>
              Skip — I'll fill in manually
            </button>
          </div>
        )}

        {aadhaarBannerVisible && (
          <div className="personalinfosection-banner-wrapper">
            <AadhaarUploadBanner
              onAutoFill={handleAutoFill}
              onDismiss={() => setAadhaarBannerVisible(false)}
            />
            <button className="personalinfosection-skip-link" onClick={() => setAadhaarBannerVisible(false)}>
              Skip — I'll fill in manually
            </button>
          </div>
        )}

      </div>

      <div className="personalinfosection-form-content">

        {/* Name & Birth */}
        <div className="personalinfosection-section-heading">Name & Birth</div>

        <div className="personalinfosection-form-grid">
          <div className="personalinfosection-form-group">
            <label className="required">
              Legal First/Given Name
              {autoLabel('firstName', autofillFields.has('firstName') ? 'cv' : 'passport')}
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName || ''}
              onChange={handleInputChange}
              className={autoClass('firstName')}
              required
              placeholder="e.g., John"
            />
          </div>

          <div className="personalinfosection-form-group">
            <label>
              Middle Name
              {autoLabel('middleName', autofillFields.has('middleName') ? 'cv' : 'passport')}
            </label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName || ''}
              onChange={handleInputChange}
              className={autoClass('middleName')}
              placeholder="e.g., Robert"
            />
          </div>

          <div className="personalinfosection-form-group">
            <label className="required">
              Last/Family Name
              {autoLabel('lastName', autofillFields.has('lastName') ? 'cv' : 'passport')}
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName || ''}
              onChange={handleInputChange}
              className={autoClass('lastName')}
              required
              placeholder="e.g., Smith"
            />
          </div>
        </div>

        <div className="personalinfosection-form-group">
          <label className="required">
            Date of Birth
            {autoLabel('birthDate', autofillFields.has('birthDate') ? 'cv' : 'passport')}
          </label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate || ''}
            onChange={handleInputChange}
            className={autoClass('birthDate')}
            required
          />
        </div>

        <div className="personalinfosection-form-group">
          <label>
            Gender
            {autoLabel('gender', autofillFields.has('gender') ? 'cv' : 'passport')}
          </label>
          <select
            name="gender"
            value={formData.gender || ''}
            onChange={handleInputChange}
            className={autoClass('gender')}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        {/* Geography & Citizenship */}
        <div className="personalinfosection-section-heading">Geography & Citizenship</div>

        <div className="personalinfosection-form-grid">
          <div className="personalinfosection-form-group">
            <label>
              Birth Country
              {autoLabel('birthCountry', autofillFields.has('birthCountry') ? 'cv' : 'passport')}
            </label>
            <input
              type="text"
              name="birthCountry"
              value={formData.birthCountry || ''}
              onChange={handleInputChange}
              className={autoClass('birthCountry')}
              placeholder="e.g., India"
            />
          </div>

          <div className="personalinfosection-form-group">
            <label>
              City of Birth
              {autoLabel('cityOfBirth', autofillFields.has('cityOfBirth') ? 'cv' : 'passport')}
            </label>
            <input
              type="text"
              name="cityOfBirth"
              value={formData.cityOfBirth || ''}
              onChange={handleInputChange}
              className={autoClass('cityOfBirth')}
              placeholder="e.g., Mumbai"
            />
          </div>

          <div className="personalinfosection-form-group">
            <label>
              Country of Citizenship
              {autoLabel('country', autofillFields.has('country') ? 'cv' : 'passport')}
            </label>
            <input
              type="text"
              name="country"
              value={formData.country || ''}
              onChange={handleInputChange}
              className={autoClass('country')}
              placeholder="e.g., India"
            />
          </div>

          <div className="personalinfosection-form-group">
            <label>
              Citizenship Status
              {autoLabel('citizenshipStatus', autofillFields.has('citizenshipStatus') ? 'cv' : 'passport')}
            </label>
            <select
              name="citizenshipStatus"
              value={formData.citizenshipStatus || ''}
              onChange={handleInputChange}
              className={autoClass('citizenshipStatus')}
            >
              <option value="">Select status</option>
              <option value="us-citizen-national">U.S. Citizen / National</option>
              <option value="us-permanent-resident">U.S. Permanent Resident</option>
              <option value="citizen-non-us-country">Citizen of another country</option>
              <option value="refugee">Refugee / Asylum Seeker</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Address */}
        <div className="personalinfosection-section-heading">Address</div>

        <div className="personalinfosection-form-group">
          <label>
            Address Line 1
            {autoLabel('addressLine1', autofillFields.has('addressLine1') ? 'cv' : 'aadhaar')}
          </label>
          <input
            type="text"
            name="addressLine1"
            value={formData.addressLine1 || ''}
            onChange={handleInputChange}
            className={autoClass('addressLine1')}
            placeholder="House / flat / street"
          />
        </div>

        <div className="personalinfosection-form-group">
          <label>
            Address Line 2
            {autoLabel('addressLine2', autofillFields.has('addressLine2') ? 'cv' : 'aadhaar')}
          </label>
          <input
            type="text"
            name="addressLine2"
            value={formData.addressLine2 || ''}
            onChange={handleInputChange}
            className={autoClass('addressLine2')}
            placeholder="Apartment, suite, etc. (optional)"
          />
        </div>

        <div className="personalinfosection-form-grid">
          <div className="personalinfosection-form-group">
            <label>
              City
              {autoLabel('city', autofillFields.has('city') ? 'cv' : 'aadhaar')}
            </label>
            <input
              type="text"
              name="city"
              value={formData.city || ''}
              onChange={handleInputChange}
              className={autoClass('city')}
              placeholder="City"
            />
          </div>

          <div className="personalinfosection-form-group">
            <label>
              State / Province
              {autoLabel('state', autofillFields.has('state') ? 'cv' : 'aadhaar')}
            </label>
            <input
              type="text"
              name="state"
              value={formData.state || ''}
              onChange={handleInputChange}
              className={autoClass('state')}
              placeholder="State"
            />
          </div>

          <div className="personalinfosection-form-group">
            <label>
              ZIP / Postal Code
              {autoLabel('zipCode', autofillFields.has('zipCode') ? 'cv' : 'aadhaar')}
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode || ''}
              onChange={handleInputChange}
              className={autoClass('zipCode')}
              placeholder="ZIP / PIN code"
            />
          </div>
        </div>

        {/* Contact Details */}
        <div className="personalinfosection-section-heading">Contact Details</div>

        <div className="personalinfosection-form-grid">
          <div className="personalinfosection-form-group">
            <label>
              Phone Number
              {autoLabel('phone', autofillFields.has('phone') ? 'cv' : 'aadhaar')}
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              className={autoClass('phone')}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="personalinfosection-form-group">
            <label>
              Preferred Phone Type
              {autoLabel('preferredPhoneType', autofillFields.has('preferredPhoneType') ? 'cv' : 'aadhaar')}
            </label>
            <select
              name="preferredPhoneType"
              value={formData.preferredPhoneType || ''}
              onChange={handleInputChange}
              className={autoClass('preferredPhoneType')}
            >
              <option value="">Select type</option>
              <option value="mobile">Mobile</option>
              <option value="home">Home</option>
              <option value="work">Work</option>
            </select>
          </div>
        </div>

        {/* Language */}
        <div className="personalinfosection-section-heading">Language</div>

        <div className="personalinfosection-form-group">
          <label>
            Primary Language
            {autoLabel('primaryLanguage', autofillFields.has('primaryLanguage') ? 'cv' : 'passport')}
          </label>
          <input
            type="text"
            name="primaryLanguage"
            value={formData.primaryLanguage || ''}
            onChange={handleInputChange}
            className={autoClass('primaryLanguage')}
            placeholder="e.g., English"
          />
        </div>

      </div>
    </div>
  );
};

export default PersonalInfoSection;