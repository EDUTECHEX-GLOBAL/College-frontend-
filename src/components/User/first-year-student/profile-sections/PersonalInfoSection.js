import React, { useEffect, useState, useRef } from 'react';
import './PersonalInfoSection.css';
import API_BASE_URL from './../../../../config/api';
import { getActiveToken } from './../../api/axiosInstance';

// ─────────────────────────────────────────────
// Keys that come back from the CV API but are
// NOT simple form fields — handled by their own
// sections (Education, Testing, Activities).
// We must skip these when calling handleInputChange.
// ─────────────────────────────────────────────
const CV_SECTION_KEYS = new Set(['cvEducation', 'cvTesting', 'cvActivities', '_cvMeta', '_passportMeta', 'dobWasExplicit']);

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const CITIZENSHIP_STATUS_OPTIONS = [
  { value: 'us-citizen-national', label: 'U.S. Citizen / National' },
  { value: 'us-permanent-resident', label: 'U.S. Permanent Resident' },
  { value: 'citizen-non-us-country', label: 'Citizen of another country' },
  { value: 'refugee', label: 'Refugee / Asylum Seeker' },
  { value: 'other', label: 'Other' },
];

const PHONE_TYPE_OPTIONS = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
];

const readJsonResponse = async (res) => {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: text || `Request failed with status ${res.status}`,
    };
  }
};

const PersonalInfoSelect = ({
  name,
  value,
  options,
  placeholder,
  onChange,
  className = '',
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectRef = useRef(null);
  const listboxId = `${name}-listbox`;
  const selectedOption = options.find(option => option.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter(option => option.label.toLowerCase().includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange({ target: { name, value: nextValue } });
    setIsOpen(false);
    window.requestAnimationFrame(() => document.getElementById(name)?.focus());
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
      className={`personal-info-custom-select${isOpen ? ' is-open' : ''}`}
    >
      <button
        type="button"
        id={name}
        className={`personal-info-select-trigger ${className}${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="personal-info-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="personal-info-select-menu" id={listboxId} role="listbox">
          {searchable && (
            <input
              type="text"
              className="personal-info-select-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              autoFocus
            />
          )}

          <div className="personal-info-select-options">
            <button
              type="button"
              className={`personal-info-select-option${value === '' ? ' is-selected' : ''}`}
              role="option"
              aria-selected={value === ''}
              onClick={() => handleSelect('')}
            >
              {placeholder}
            </button>

            {filteredOptions.map(option => (
              <button
                type="button"
                key={option.value}
                className={`personal-info-select-option${value === option.value ? ' is-selected' : ''}`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="personal-info-select-empty">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getActiveToken()}` },
        body: formData,
      });
      const result = await readJsonResponse(res);
      console.log(`${fieldName} API result:`, result);

      if (!res.ok || !result.success) {
        throw new Error(result.message || `Request failed with status ${res.status}`);
      }

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
      <div className="passport-banner passport-banner--success">
        <div className="passport-banner__icon passport-banner__icon--success">
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
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0891b2" strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
        <line x1="8" y1="15" x2="13" y2="15" />
        <circle cx="17" cy="17" r="3" fill="#fff" stroke="#0891b2" strokeWidth="1.5" />
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
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0891b2" strokeWidth="1.5">
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
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0891b2" strokeWidth="1.5">
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
const PersonalInfoSection = ({ formData, handleInputChange, fieldErrors = {} }) => {
  const [cvBannerVisible,       setCvBannerVisible]       = useState(true);
  const [passportBannerVisible,  setPassportBannerVisible]  = useState(false);
  const [aadhaarBannerVisible,   setAadhaarBannerVisible]   = useState(false);
  const [autofillFields,         setAutofillFields]         = useState(new Set());
  const [saveStatus,             setSaveStatus]             = useState(null); // null | saving | saved | error

  const handleCvSkip    = () => { setCvBannerVisible(false); setPassportBannerVisible(true); setAadhaarBannerVisible(true); };
  const handleCvDismiss = () => { setCvBannerVisible(false); };

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
    const isCvAutofill = !!mapped._cvMeta;

    // Step 1: apply only flat string/scalar fields to the form
    Object.entries(mapped).forEach(([name, value]) => {
      // Skip meta and CV structured-section keys
      if (CV_SECTION_KEYS.has(name)) return;
      // Skip arrays and plain objects — they're not <input> fields
      if (Array.isArray(value) || (value !== null && typeof value === 'object')) return;
      // Skip empty values
      if (!value && value !== 0) return;

      if (name === 'dateOfBirth' && mapped.dobWasExplicit === true) {
        handleInputChange({ target: { name: 'birthDate', value } });
        filled.add('birthDate');
        return;
      }

      if (name === 'birthDate' || name === 'dob') return;

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

    if (isCvAutofill || !mapped.dobWasExplicit) {
      delete payload.dateOfBirth;
      delete payload.birthDate;
      delete payload.dob;
    } else if (payload.birthDate && !payload.dateOfBirth) {
      payload.dateOfBirth = payload.birthDate;
      delete payload.birthDate;
    }

    Object.keys(payload).forEach((key) => {
      if (
        payload[key] === undefined ||
        payload[key] === null ||
        payload[key] === ""
      ) {
        delete payload[key];
      }
    });

    console.log("AUTOFILL PAYLOAD:", payload);

    if (Object.keys(payload).length === 0) return;

    // Step 3: persist to DB
    try {
      setSaveStatus('saving');

      const res = await fetch(`${API_BASE_URL}/api/students/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getActiveToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await readJsonResponse(res);
      if (!res.ok || !result.success) throw new Error(result.message || 'Save failed');
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

  const inputClass = (fieldName) =>
    [autoClass(fieldName), fieldErrors[fieldName] ? 'error' : ''].filter(Boolean).join(' ');

  const errorMessage = (fieldName) =>
    fieldErrors[fieldName] ? <div className="error-message">{fieldErrors[fieldName]}</div> : null;

  const autoLabel = (fieldName, source = 'passport') =>
    autofillFields.has(fieldName) ? <span className="autofill-tag">{source}</span> : null;

  return (
    <div className="personal-info-section">
      <h2>Personal Information</h2>

      <div className="section-status">
        {formData.profileCompletion?.personalInfo ? 'Complete' : 'In Progress'}
      </div>

      {/* Background save indicator */}
      {saveStatus === 'saving' && (
        <div className="autofill-save-status autofill-save-status--saving">Saving data…</div>
      )}
      {saveStatus === 'saved' && (
        <div className="autofill-save-status autofill-save-status--saved">Data saved</div>
      )}
      {saveStatus === 'error' && (
        <div className="autofill-save-status autofill-save-status--error">
          Could not save — your changes are visible but may not persist. Try saving manually.
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
        <div className="form-section-heading">Name & Birth</div>

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
              className={inputClass('firstName')}
              required
            />
            {errorMessage('firstName')}
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
              className={inputClass('middleName')}
            />
            {errorMessage('middleName')}
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
              className={inputClass('lastName')}
              required
            />
            {errorMessage('lastName')}
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
            className={inputClass('birthDate')}
            required
          />
          {errorMessage('birthDate')}
        </div>

        <div className="form-group">
          <label>
            Gender
            {autoLabel('gender', autofillFields.has('gender') ? 'cv' : 'passport')}
          </label>
          <PersonalInfoSelect
            name="gender"
            value={formData.gender || ''}
            onChange={handleInputChange}
            className={autoClass('gender')}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />
        </div>

        {/* ════════ GEOGRAPHY ════════ */}
        <div className="form-section-heading">Geography & Citizenship</div>

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
              className={inputClass('birthCountry')}
              placeholder="e.g. India"
            />
            {errorMessage('birthCountry')}
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
              className={inputClass('cityOfBirth')}
              placeholder="e.g. Mumbai"
            />
            {errorMessage('cityOfBirth')}
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
              className={inputClass('country')}
              placeholder="e.g. India"
            />
            {errorMessage('country')}
          </div>

          <div className="form-group">
            <label>
              Citizenship Status
              {autoLabel('citizenshipStatus', autofillFields.has('citizenshipStatus') ? 'cv' : 'passport')}
            </label>
            <PersonalInfoSelect
              name="citizenshipStatus"
              value={formData.citizenshipStatus || ''}
              onChange={handleInputChange}
              className={autoClass('citizenshipStatus')}
              options={CITIZENSHIP_STATUS_OPTIONS}
              placeholder="Select status"
              searchable
            />
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
            className={inputClass('addressLine1')}
            placeholder="House / flat / street"
          />
          {errorMessage('addressLine1')}
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
            className={inputClass('addressLine2')}
            placeholder="Apartment, suite, etc. (optional)"
          />
          {errorMessage('addressLine2')}
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
              className={inputClass('city')}
              placeholder="City"
            />
            {errorMessage('city')}
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
              className={inputClass('state')}
              placeholder="State"
            />
            {errorMessage('state')}
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
              className={inputClass('zipCode')}
              placeholder="ZIP / PIN code"
            />
            {errorMessage('zipCode')}
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
              className={inputClass('phone')}
              placeholder="+91 9876543210"
            />
            {errorMessage('phone')}
          </div>

          <div className="form-group">
            <label>
              Preferred Phone Type
              {autoLabel('preferredPhoneType', autofillFields.has('preferredPhoneType') ? 'cv' : 'aadhaar')}
            </label>
            <PersonalInfoSelect
              name="preferredPhoneType"
              value={formData.preferredPhoneType || ''}
              onChange={handleInputChange}
              className={autoClass('preferredPhoneType')}
              options={PHONE_TYPE_OPTIONS}
              placeholder="Select type"
            />
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
            placeholder="e.g. English"
          />
        </div>

      </div>
    </div>
  );
};

export default PersonalInfoSection;
