import React, { useState, useEffect, useRef, useCallback } from 'react';
import './mastercontact.css';
import API_BASE_URL from './../../../../config/api';

const EMPTY_FORM = {
  _id: null,
  emailAddress: '',
  mobileNumber: '',
  alternatePhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: '',
  postalCode: ''
};

const MOBILE_REGEX = /^\+?\d{8,15}$/;
const PLACE_REGEX = /^[A-Za-z\s-]+$/;
const ADDRESS_REGEX = /^[A-Za-z0-9\s,/-]+$/;

const sanitizePhone = (value = '') => {
  const cleaned = value.replace(/[^\d+]/g, '');
  const hasPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\+/g, '').slice(0, 15);
  return `${hasPlus ? '+' : ''}${digits}`;
};

const sanitizePlace = (value = '') =>
  value.replace(/[^A-Za-z\s-]/g, '').replace(/\s+/g, ' ');

const sanitizeAddress = (value = '') =>
  value.replace(/[^A-Za-z0-9\s,/-]/g, '').replace(/\s+/g, ' ');

const safeGetLocalStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing localStorage["${key}"]:`, error);
    return false;
  }
};

const getMasterApplicationStorageKey = (userId) =>
  userId ? `masterApplicationData_${userId}` : 'masterApplicationData';

const mapContactData = (source = {}) => ({
  _id: source._id || null,
  emailAddress: source.emailAddress || source.email || '',
  mobileNumber: source.mobileNumber || source.phone || source.mobile || '',
  alternatePhone: source.alternatePhone || source.alternatePhoneNumber || source.landline || '',
  addressLine1: source.addressLine1 || '',
  addressLine2: source.addressLine2 || '',
  city: source.city || '',
  state: source.state || '',
  country: source.country || '',
  postalCode: source.postalCode || source.zipCode || '',
});

const persistMasterContactDraft = (contactData, userId) => {
  const scopedKey = getMasterApplicationStorageKey(userId);
  const legacySaved = safeGetLocalStorage('masterApplicationData') || {};
  const scopedSaved = userId ? safeGetLocalStorage(scopedKey) || {} : {};
  const nextData = {
    ...legacySaved,
    ...scopedSaved,
    contact: contactData,
  };

  safeSetLocalStorage('masterApplicationData', nextData);
  if (userId) safeSetLocalStorage(scopedKey, nextData);
  window.dispatchEvent(new Event('applicationUpdated'));
  window.dispatchEvent(new CustomEvent('masterApplicationUpdated'));
};

// ── Full country list ─────────────────────────────────────────────────────────
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia',
  'Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Belarus',
  'Belgium','Belize','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana',
  'Brazil','Brunei','Bulgaria','Cambodia','Cameroon','Canada','Chile','China',
  'Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark',
  'Dominican Republic','Ecuador','Egypt','El Salvador','Estonia','Ethiopia',
  'Fiji','Finland','France','Georgia','Germany','Ghana','Greece','Guatemala',
  'Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland',
  'Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait',
  'Kyrgyzstan','Latvia','Lebanon','Libya','Lithuania','Luxembourg','Madagascar',
  'Malawi','Malaysia','Maldives','Malta','Mauritius','Mexico','Moldova',
  'Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nepal',
  'Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Macedonia',
  'Norway','Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Poland',
  'Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal',
  'Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa',
  'South Korea','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria',
  'Taiwan','Tanzania','Thailand','Tunisia','Turkey','Turkmenistan','Uganda',
  'Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay',
  'Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe','Other'
];

const MasterContact = ({ data, updateData }) => {
  const [formData,      setFormData]      = useState(EMPTY_FORM);
  const [errors,        setErrors]        = useState({});
  const [fetchState,    setFetchState]    = useState('loading');
  const [countryOpen,   setCountryOpen]   = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryRef      = useRef(null);
  const searchInputRef  = useRef(null);

  const debounceRef          = useRef(null);
  const isSavingRef          = useRef(false);
  const lastSavedRef         = useRef(null);
  const lastUpdatedRef       = useRef(null);
  const lastFetchedUserIdRef = useRef(null);
  const lastStorageRef       = useRef(null);

  const updateDataRef = useRef(updateData);
  useEffect(() => { updateDataRef.current = updateData; }, [updateData]);

  // ── Filtered countries for search ─────────────────────────────────────────
  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
    : COUNTRIES;

  // ── Decode userId from JWT ────────────────────────────────────────────────
  const getTokenUserId = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.userId || payload.id || payload._id || payload.sub || '').toString();
    } catch {
      return null;
    }
  }, []);

  // ── FETCH FROM BACKEND ────────────────────────────────────────────────────
  useEffect(() => {
    const currentUserId = getTokenUserId();
    if (lastFetchedUserIdRef.current === currentUserId && currentUserId !== null) return;

    setFormData(EMPTY_FORM);
    setErrors({});
    setFetchState('loading');
    lastSavedRef.current         = null;
    lastUpdatedRef.current       = null;
    lastStorageRef.current       = null;
    lastFetchedUserIdRef.current = currentUserId;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setFetchState('ready-empty'); return; }

const res = await fetch(`${API_BASE_URL}/api/master-contact/me`, {
  headers: { Authorization: `Bearer ${token}` }
});
        const result = await res.json();
        console.log('Fetched Contact Data:', result);

        if (result.success && result.data) {
          const d = mapContactData(result.data);
          const formatted = {
            _id:            d._id            || null,
            emailAddress:   d.emailAddress   || '',
            mobileNumber:   d.mobileNumber   || '',
            alternatePhone: d.alternatePhone || '',
            addressLine1:   d.addressLine1   || '',
            addressLine2:   d.addressLine2   || '',
            city:           d.city           || '',
            state:          d.state          || '',
            // ✅ FIX: ensure saved country is always used
            country:        d.country        || '',
            postalCode:     d.postalCode     || '',
          };
          setFormData(formatted);
          lastSavedRef.current = result.source === 'master-contact' ? formatted : null;
          persistMasterContactDraft(formatted, currentUserId);
          // ✅ FIX: use 'ready-filled' to skip parent-prop override
          setFetchState('ready-filled');
        } else {
          setFetchState('ready-empty');
        }
      } catch (err) {
        console.error('❌ Fetch Error:', err);
        setFetchState('ready-empty');
      }
    };

    fetchData();
  }, [getTokenUserId]);

  // ── LOAD FROM PARENT — only when DB returned nothing ─────────────────────
  useEffect(() => {
    if (fetchState !== 'ready-empty') return;
    if (!data || Object.keys(data).length === 0) return;

    const { _isValid, ...rest } = data;
    const currentUserId = getTokenUserId();
    if (rest.userId && rest.userId.toString() !== currentUserId) return;

    setFormData(prev => {
      const isSame = Object.keys(rest).every(k => prev[k] === rest[k]);
      return isSame ? prev : { ...prev, ...rest };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchState]);

  // ── VALIDATION ────────────────────────────────────────────────────────────
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'emailAddress':
        if (!value.trim()) return 'Email address is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
      case 'mobileNumber':
        if (!value.trim()) return 'Mobile number is required';
        if (!MOBILE_REGEX.test(value)) return 'Enter a valid mobile number';
        return '';
      case 'alternatePhone':
        if (value.trim() && !MOBILE_REGEX.test(value)) return 'Enter a valid mobile number';
        return '';
      case 'addressLine1':
        if (!value.trim()) return 'Address is required';
        if (!ADDRESS_REGEX.test(value)) return 'Enter a valid address';
        return '';
      case 'addressLine2':
        if (value.trim() && !ADDRESS_REGEX.test(value)) return 'Enter a valid address';
        return '';
      case 'city':
        if (!value.trim()) return 'City is required';
        if (!PLACE_REGEX.test(value)) return 'Enter a valid city';
        return '';
      case 'state':
        if (!value.trim()) return 'State is required';
        if (!PLACE_REGEX.test(value)) return 'Enter a valid state';
        return '';
      case 'country':      return value.trim() ? '' : 'Country is required';
      case 'postalCode':
        if (!value.trim()) return 'Postal code is required';
        if (!/^[A-Za-z0-9\s-]{3,12}$/.test(value)) return 'Enter a valid postal code';
        return '';
      default:             return '';
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'mobileNumber' || name === 'alternatePhone') {
      value = sanitizePhone(value);
    } else if (name === 'city' || name === 'state') {
      value = sanitizePlace(value);
    } else if (name === 'addressLine1' || name === 'addressLine2') {
      value = sanitizeAddress(value);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  }, [validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  }, [validateField]);

  // ✅ FIX: country select handler — also clears search
  const handleCountrySelect = useCallback((country) => {
    setFormData(prev => ({ ...prev, country }));
    setErrors(prev => ({ ...prev, country: validateField('country', country) }));
    setCountryOpen(false);
    setCountrySearch('');
  }, [validateField]);

  // ✅ FIX: when dropdown opens, focus the search input
  const handleCountryOpen = useCallback(() => {
    setCountryOpen(prev => {
      const next = !prev;
      if (next) {
        setCountrySearch('');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      return next;
    });
  }, []);

  // ── SAVE TO BACKEND ───────────────────────────────────────────────────────
  const saveDataToBackend = useCallback(async (snapshot) => {
    if (isSavingRef.current) return;
    if (JSON.stringify(lastSavedRef.current) === JSON.stringify(snapshot)) return;

    isSavingRef.current = true;
    try {
      const token = localStorage.getItem('token');
const res = await fetch(`${API_BASE_URL}/api/master-contact`, {
  method:  'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body:    JSON.stringify(snapshot)
});
      const result = await res.json();
      if (result.success) {
        const savedContact = mapContactData(result.data || snapshot);
        lastSavedRef.current = savedContact;
        persistMasterContactDraft({ ...savedContact, _isValid: true }, getTokenUserId());
        if (!snapshot._id && result.data?._id) {
          setFormData(prev => ({ ...prev, _id: result.data._id }));
        }
      } else {
        console.error('❌ Save failed:', result.message);
      }
    } catch (err) {
      console.error('❌ API Error:', err);
    } finally {
      isSavingRef.current = false;
    }
  }, [getTokenUserId]);

  // ── AUTO-SAVE + NOTIFY PARENT ─────────────────────────────────────────────
  useEffect(() => {
    if (fetchState === 'loading') return;

    const requiredFields = [
      'emailAddress','mobileNumber','addressLine1',
      'city','state','country','postalCode'
    ];
    const isValid = requiredFields.every(k => validateField(k, formData[k] || '') === '');
    const progressData = {
      requiredFields,
      completedFields: requiredFields.filter(k => validateField(k, formData[k] || '') === ''),
      isValid,
    };
    console.log('Validated Contact Form:', formData);
    console.log('Progress Calculation:', progressData);

    const nextPayload = JSON.stringify({ ...formData, _isValid: isValid });
    if (lastUpdatedRef.current !== nextPayload) {
      lastUpdatedRef.current = nextPayload;
      updateDataRef.current({ ...formData, _isValid: isValid });
    }
    if (lastStorageRef.current !== nextPayload) {
      lastStorageRef.current = nextPayload;
      persistMasterContactDraft({ ...formData, _isValid: isValid }, getTokenUserId());
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isValid) saveDataToBackend(formData);
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData, fetchState, validateField, saveDataToBackend, getTokenUserId]);

  // ── CLOSE DROPDOWN ON OUTSIDE CLICK ──────────────────────────────────────
  useEffect(() => {
    if (!countryOpen) return;
    const handleClickOutside = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setCountryOpen(false);
        setCountrySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [countryOpen]);

  // ── LOADING SKELETON ──────────────────────────────────────────────────────
  if (fetchState === 'loading') {
    return (
      <div className="mastercontact-form">
        <div className="mastercontact-header">
          <h2 className="mastercontact-title">Contact Details</h2>
          <p className="mastercontact-subtitle">Loading your details…</p>
        </div>
        <div className="mastercontact-grid" style={{ opacity: 0.4, pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`mastercontact-group${i < 2 ? ' mastercontact-group-full' : ''}`}>
              <div style={{ height: 16, background: '#e0e0e0', borderRadius: 4, marginBottom: 8, width: '40%' }} />
              <div style={{ height: 44, background: '#e0e0e0', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mastercontact-form">
      <div className="mastercontact-header">
        <h2 className="mastercontact-title">Contact Details</h2>
        <p className="mastercontact-subtitle">Please provide your current contact information</p>
      </div>

      <div className="mastercontact-grid">

        {/* Email */}
        <div className="mastercontact-group mastercontact-group-full">
          <label className="mastercontact-label">
            Email Address <span className="mastercontact-required">*</span>
          </label>
          <input
            type="email" name="emailAddress" value={formData.emailAddress}
            onChange={handleChange} onBlur={handleBlur} placeholder="you@example.com"
            className={`mastercontact-input ${errors.emailAddress ? 'mastercontact-error' : ''}`}
          />
          {errors.emailAddress && <span className="mastercontact-error-text">{errors.emailAddress}</span>}
        </div>

        {/* Mobile */}
        <div className="mastercontact-group">
          <label className="mastercontact-label">
            Mobile Number <span className="mastercontact-required">*</span>
          </label>
          <input
            type="tel" name="mobileNumber" value={formData.mobileNumber}
            onChange={handleChange} onBlur={handleBlur} placeholder="+91 234 567 8900"
            className={`mastercontact-input ${errors.mobileNumber ? 'mastercontact-error' : ''}`}
          />
          {errors.mobileNumber && <span className="mastercontact-error-text">{errors.mobileNumber}</span>}
        </div>

        {/* Alternate Phone */}
        <div className="mastercontact-group">
          <label className="mastercontact-label">Alternate Phone Number</label>
          <input
            type="tel" name="alternatePhone" value={formData.alternatePhone}
            onChange={handleChange} placeholder="Optional" className="mastercontact-input"
          />
        </div>

        {/* Address Line 1 */}
        <div className="mastercontact-group mastercontact-group-full">
          <label className="mastercontact-label">
            Address Line 1 <span className="mastercontact-required">*</span>
          </label>
          <input
            type="text" name="addressLine1" value={formData.addressLine1}
            onChange={handleChange} onBlur={handleBlur}
            className={`mastercontact-input ${errors.addressLine1 ? 'mastercontact-error' : ''}`}
          />
          {errors.addressLine1 && <span className="mastercontact-error-text">{errors.addressLine1}</span>}
        </div>

        {/* Address Line 2 */}
        <div className="mastercontact-group mastercontact-group-full">
          <label className="mastercontact-label">Address Line 2</label>
          <input
            type="text" name="addressLine2" value={formData.addressLine2}
            onChange={handleChange} className="mastercontact-input"
          />
        </div>

        {/* City */}
        <div className="mastercontact-group">
          <label className="mastercontact-label">
            City <span className="mastercontact-required">*</span>
          </label>
          <input
            type="text" name="city" value={formData.city}
            onChange={handleChange} onBlur={handleBlur}
            className={`mastercontact-input ${errors.city ? 'mastercontact-error' : ''}`}
          />
          {errors.city && <span className="mastercontact-error-text">{errors.city}</span>}
        </div>

        {/* State */}
        <div className="mastercontact-group">
          <label className="mastercontact-label">
            State <span className="mastercontact-required">*</span>
          </label>
          <input
            type="text" name="state" value={formData.state}
            onChange={handleChange} onBlur={handleBlur}
            className={`mastercontact-input ${errors.state ? 'mastercontact-error' : ''}`}
          />
          {errors.state && <span className="mastercontact-error-text">{errors.state}</span>}
        </div>

        {/* ✅ FIX: Country dropdown with search + key prop forces re-render */}
        <div className="mastercontact-group" ref={countryRef}>
          <label className="mastercontact-label">
            Country <span className="mastercontact-required">*</span>
          </label>
          <div className="mastercontact-custom-select-wrapper">
            {/* ✅ key={formData.country} forces React to remount when value loads from DB */}
            <button
              type="button"
              key={formData.country}
              className={`mastercontact-custom-select-trigger
                ${errors.country ? 'mastercontact-error' : ''}
                ${formData.country ? '' : 'mastercontact-placeholder'}`}
              onClick={handleCountryOpen}
              aria-haspopup="listbox"
              aria-expanded={countryOpen}
            >
              <span>{formData.country || 'Select Country'}</span>
              <svg
                className={`mastercontact-chevron ${countryOpen ? 'mastercontact-chevron-open' : ''}`}
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {countryOpen && (
              <div className="mastercontact-dropdown" role="listbox">
                {/* ✅ Search input inside dropdown */}
                <div className="mastercontact-dropdown-search-wrap">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="mastercontact-dropdown-search"
                    placeholder="Search country…"
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <ul className="mastercontact-dropdown-list">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map(c => (
                      <li
                        key={c}
                        role="option"
                        aria-selected={formData.country === c}
                        className={`mastercontact-dropdown-item
                          ${formData.country === c ? 'mastercontact-dropdown-item-active' : ''}`}
                        onClick={() => handleCountrySelect(c)}
                      >
                        {/* ✅ Checkmark for currently selected country */}
                        {formData.country === c && (
                          <span className="mastercontact-dropdown-check">✓</span>
                        )}
                        {c}
                      </li>
                    ))
                  ) : (
                    <li className="mastercontact-dropdown-item mastercontact-dropdown-no-results">
                      No country found
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
          {errors.country && <span className="mastercontact-error-text">{errors.country}</span>}
        </div>

        {/* Postal Code */}
        <div className="mastercontact-group">
          <label className="mastercontact-label">
            Postal Code <span className="mastercontact-required">*</span>
          </label>
          <input
            type="text" name="postalCode" value={formData.postalCode}
            onChange={handleChange} onBlur={handleBlur}
            className={`mastercontact-input ${errors.postalCode ? 'mastercontact-error' : ''}`}
          />
          {errors.postalCode && <span className="mastercontact-error-text">{errors.postalCode}</span>}
        </div>

      </div>
    </div>
  );
};

export default MasterContact;
