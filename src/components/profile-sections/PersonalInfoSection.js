import React, { useState, useRef } from 'react';
import axiosInstance from '../api/axiosInstance'; // ✅ Use axiosInstance
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
  icon,
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

  // ✅ Correct axios call (no headers, no duplicate)
  const res = await axiosInstance.post(endpoint, formData);

  console.log(`${fieldName} API result:`, res.data);

  // ✅ Safer check
  if (!res?.data?.success) {
    throw new Error(res?.data?.message || 'Upload failed');
  }

  const mapped = res.data.data;

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
}; // ✅ THIS WAS MISSING

const handleDrop = (e) => {
  e.preventDefault();
  handleFile(e.dataTransfer.files[0]);
};
  if (status === 'done') {
    return (
      <div className="passport-banner passport-banner--success">
        <div className="passport-banner__icon">
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="#10b981" />
            <polyline points="4.5,8.5 7,11 11.5,5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="passport-banner__text">
          <span className="passport-banner__title">{successTitle}</span>
          <span className="passport-banner__sub">
            {successSub.replace('{count}', autofillCount)}
          </span>
        </div>
        <button className="passport-banner__dismiss" onClick={onDismiss} aria-label="Dismiss">
          <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
            <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  if (status === 'scanning') {
    return (
      <div className="passport-banner passport-banner--scanning">
        <div className="passport-banner__spinner" />
        <div className="passport-banner__text">
          <span className="passport-banner__title">Reading your document…</span>
          <span className="passport-banner__sub">Extracting your details automatically</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="passport-banner passport-banner--error">
        <div className="passport-banner__icon">
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="#ef4444" />
            <line x1="8" y1="4.5" x2="8" y2="8.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.8" fill="#fff" />
          </svg>
        </div>
        <div className="passport-banner__text">
          <span className="passport-banner__title">Could not read document</span>
          <span className="passport-banner__sub">Please try a clearer image or fill in details manually</span>
        </div>
        <button className="passport-banner__retry" onClick={() => setStatus('idle')}>
          Try again
        </button>
      </div>
    );
  }

  // idle / upload state
  return (
    <div
      className="passport-banner passport-banner--upload"
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
      <div className="passport-banner__upload-icon">{icon}</div>
      <div className="passport-banner__text">
        <span className="passport-banner__title">
          {idleTitle}
          {badgeText && <span className="passport-banner__badge">{badgeText}</span>}
        </span>
        <span className="passport-banner__sub">{idleSub}</span>
      </div>
      <div className="passport-banner__cta">Upload</div>
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
    icon={
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0ba5a0" strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
        <line x1="8" y1="15" x2="13" y2="15" />
        <circle cx="17" cy="17" r="3" fill="#fff" stroke="#0ba5a0" strokeWidth="1.5" />
        <line x1="17" y1="15.5" x2="17" y2="18.5" strokeWidth="1.2" />
        <line x1="15.5" y1="17" x2="18.5" y2="17" strokeWidth="1.2" />
      </svg>
    }
    idleTitle="Upload your CV / Résumé to auto-fill everything"
    idleSub="We'll fill your profile, education, test scores and activities in one go · PDF, JPG or PNG"
    badgeText="Auto-fill all sections"
    successTitle="CV scanned successfully"
    successSub="{count} profile fields filled — education, tests & activities also extracted"
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
    icon={
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0ba5a0" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <line x1="7" y1="10" x2="17" y2="10" />
        <line x1="7" y1="14" x2="13" y2="14" />
      </svg>
    }
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
    icon={
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0ba5a0" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <circle cx="8" cy="12" r="2.5" />
        <path d="M12 10h6M12 14h4" strokeLinecap="round" />
      </svg>
    }
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
      
      // ✅ Use axiosInstance instead of fetch with hardcoded localhost
      const res = await axiosInstance.put('/api/students/profile', {
        ...formData,
        ...payload,
      });
      
      if (!res.data.success) throw new Error(res.data.message || 'Save failed');
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('❌ Failed to persist autofill:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const autoClass = (fieldName) =>
    autofillFields.has(fieldName) ? 'input--autofilled' : '';

  const autoLabel = (fieldName, source = 'passport') =>
    autofillFields.has(fieldName) ? <span className="autofill-tag">{source}</span> : null;

  return (
    <div className="personal-info-section">
      <h2>Personal Information</h2>

      <div className="section-status">
        {formData.profileCompletion?.personalInfo ? '✓ Complete' : '◌ In Progress'}
      </div>

      {/* Background save indicator */}
      {saveStatus === 'saving' && (
        <div className="autofill-save-status autofill-save-status--saving">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', animation: 'spin 0.8s linear infinite' }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Saving data…
        </div>
      )}
      {saveStatus === 'saved' && (
        <div className="autofill-save-status autofill-save-status--saved">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          ✓ Data saved
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="autofill-save-status autofill-save-status--error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          ⚠ Could not save — your changes are visible but may not persist. Try saving manually.
        </div>
      )}

      {/* ── Document upload banners ── */}
      <div className="document-banners-wrapper">

        {cvBannerVisible && (
          <div className="passport-banner-wrapper">
            <CVUploadBanner
              onAutoFill={async (mapped) => {
                await handleAutoFill(mapped);
                handleCvDismiss();
              }}
              onDismiss={handleCvDismiss}
            />
            <button className="passport-skip-link" onClick={handleCvSkip}>
              Skip — I don't have a CV, use passport / Aadhaar instead
            </button>
          </div>
        )}

        {passportBannerVisible && (
          <div className="passport-banner-wrapper">
            <PassportUploadBanner
              onAutoFill={handleAutoFill}
              onDismiss={() => setPassportBannerVisible(false)}
            />
            <button className="passport-skip-link" onClick={() => setPassportBannerVisible(false)}>
              Skip — I'll fill in manually
            </button>
          </div>
        )}

        {aadhaarBannerVisible && (
          <div className="passport-banner-wrapper">
            <AadhaarUploadBanner
              onAutoFill={handleAutoFill}
              onDismiss={() => setAadhaarBannerVisible(false)}
            />
            <button className="passport-skip-link" onClick={() => setAadhaarBannerVisible(false)}>
              Skip — I'll fill in manually
            </button>
          </div>
        )}

      </div>

      <div className="form-content">

        {/* ════════ NAME & BIRTH ════════ */}
        <div className="form-section-heading">Name &amp; Birth</div>

        <div className="form-grid">
          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-group">
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

        <div className="form-group">
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

        <div className="form-group">
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

        {/* ════════ GEOGRAPHY ════════ */}
        <div className="form-section-heading">Geography &amp; Citizenship</div>

        <div className="form-grid">
          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-group">
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

        {/* ════════ ADDRESS ════════ */}
        <div className="form-section-heading">Address</div>

        <div className="form-group">
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

        <div className="form-group">
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

        <div className="form-grid">
          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-group">
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

        {/* ════════ CONTACT ════════ */}
        <div className="form-section-heading">Contact Details</div>

        <div className="form-grid">
          <div className="form-group">
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

          <div className="form-group">
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

        {/* ════════ LANGUAGE ════════ */}
        <div className="form-section-heading">Language</div>

        <div className="form-group">
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

      </div>{/* end .form-content */}
    </div>
  );
};

export default PersonalInfoSection;