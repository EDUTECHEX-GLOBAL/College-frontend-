import React, { useState, useEffect, useRef, useCallback } from 'react';
import './masterpersonal.css';
import axiosInstance from './../../api/axiosInstance';

const EMPTY_FORM = {
  _id: null,
  fullName: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  passportNumber: '',
  maritalStatus: ''
};

// ── HELPER FUNCTIONS ──────────────────────────────────────────────────────

/**
 * Sanitize names: allow only letters and spaces
 */
const sanitizeName = (value = '') =>
  value.replace(/[^A-Za-z\s]/g, '').replace(/\s+/g, ' ');

/**
 * Sanitize passport number: uppercase alphanumeric only, max 12 chars
 */
const sanitizePassportNumber = (value = '') =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

const safeDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const getMasterApplicationStorageKey = (userId) =>
  userId ? `masterApplicationData_${userId}` : 'masterApplicationData';

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

const mapApiPersonalData = (source = {}) => ({
  _id: source._id || null,
  fullName: source.fullName || '',
  dateOfBirth: safeDateInputValue(source.dateOfBirth),
  gender: source.gender || '',
  nationality: source.nationality || '',
  passportNumber: source.passportNumber || '',
  maritalStatus: source.maritalStatus || '',
});

const hasPersonalValues = (personal = {}) =>
  ['fullName', 'dateOfBirth', 'gender', 'nationality', 'passportNumber', 'maritalStatus']
    .some((key) => !!personal[key]);

/**
 * Calculate age from date of birth
 */
const calculateAge = (dateValue) => {
  if (!dateValue) return null;
  const dob = new Date(dateValue);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get min/max date strings for date input
 * Master applicants must be 20-40 years old
 */
const getDobLimits = () => {
  const today = new Date();

  const maxDate = new Date(today);
  maxDate.setFullYear(today.getFullYear() - 20);

  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 40);

  return {
    min: minDate.toISOString().split('T')[0],
    max: maxDate.toISOString().split('T')[0],
  };
};

const MasterPersonal = ({ data, updateData }) => {
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [errors,     setErrors]     = useState({});
  const [fetchState, setFetchState] = useState('loading'); // 'loading' | 'ready-empty' | 'ready-filled'
  const [dobLimits,  setDobLimits]  = useState(getDobLimits());

  const debounceRef          = useRef(null);
  const isSavingRef          = useRef(false);
  const lastSavedRef         = useRef(null);
  const lastUpdatedRef       = useRef(null);
  const lastFetchedUserIdRef = useRef(null);
  const lastStorageRef       = useRef(null);

  const persistMasterApplicationData = useCallback((personalData) => {
    let currentUserId = null;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = (payload.userId || payload.id || payload._id || payload.sub || '').toString();
      }
    } catch {}

    const scopedKey = getMasterApplicationStorageKey(currentUserId);
    const legacySaved = safeGetLocalStorage('masterApplicationData') || {};
    const scopedSaved = currentUserId ? safeGetLocalStorage(scopedKey) || {} : {};
    const nextData = {
      ...legacySaved,
      ...scopedSaved,
      personal: personalData,
    };

    const payload = JSON.stringify(nextData);
    if (lastStorageRef.current === payload) return;
    lastStorageRef.current = payload;

    safeSetLocalStorage('masterApplicationData', nextData);
    if (currentUserId) safeSetLocalStorage(scopedKey, nextData);
    window.dispatchEvent(new CustomEvent('masterApplicationUpdated'));
  }, []);

  // Keep a stable ref to updateData so we never need it in a dep array
  const updateDataRef = useRef(updateData);
  useEffect(() => { updateDataRef.current = updateData; }, [updateData]);

  // Initialize DOB limits on mount
  useEffect(() => {
    setDobLimits(getDobLimits());
  }, []);

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

  // ── FETCH FROM BACKEND WITH FALLBACK ──────────────────────────────────────
  // Priority:
  // 1. GET /api/master-personal/me
  // 2. GET /api/user/profile (basicInfo)
  // 3. GET /api/account/me
  // 4. Empty fallback
  useEffect(() => {
    const currentUserId = getTokenUserId();

    if (lastFetchedUserIdRef.current === currentUserId && currentUserId !== null) return;

    // Reset for new/different user
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

        const { data: masterResult } = await axiosInstance.get('/api/master-personal/me');
        console.log('Master Personal API Response:', masterResult);

        if (masterResult.success && masterResult.data) {
          const formatted = mapApiPersonalData(masterResult.data);
          console.log('Mapped Autofill Data:', formatted);
          setFormData(formatted);
          lastSavedRef.current = masterResult.source === 'master-personal' ? formatted : null;
          setFetchState(hasPersonalValues(formatted) ? 'ready-filled' : 'ready-empty');
          persistMasterApplicationData(formatted);
          return;
        }

        const autoFillData = {};
        try {
          setFetchState('ready-empty');
        } catch (err) {
          console.warn('⚠️ Profile fetch failed, trying account:', err);
        }

        // Step 3: If profile didn't fill all, try account endpoint
        if (false && (!autoFillData.fullName || !autoFillData.dateOfBirth)) {
          try {
            const accountResult = { success: false, data: null };

            if (accountResult.success && accountResult.data) {
              const account = accountResult.data;
              if (!autoFillData.fullName && account.firstName) {
                autoFillData.fullName = `${account.firstName} ${account.lastName || ''}`.trim();
              }
              if (!autoFillData.dateOfBirth && account.birthDate) {
                autoFillData.dateOfBirth = new Date(account.birthDate).toISOString().split('T')[0];
              }
            }
          } catch (err) {
            console.warn('⚠️ Account fetch failed:', err);
          }
        }

        // Step 4: Set auto-filled or empty form
        if (Object.keys(autoFillData).length > 0) {
          const merged = { ...EMPTY_FORM, ...autoFillData };
          setFormData(merged);
          setFetchState('ready-empty'); // Still "empty" for DB, but pre-filled from account
        } else {
          setFetchState('ready-empty');
        }

      } catch (err) {
        console.error('❌ Fetch Error:', err);
        setFetchState('ready-empty');
      }
    };

    fetchData();
  }, [getTokenUserId, persistMasterApplicationData]);

  // ── LOAD FROM PARENT — only when DB returned nothing ─────────────────────
  useEffect(() => {
    if (fetchState !== 'ready-empty') return;
    if (!data || Object.keys(data).length === 0) return;

    const { _isValid, ...rest } = data;

    const currentUserId = getTokenUserId();
    if (rest.userId && rest.userId.toString() !== currentUserId) {
      console.warn('⚠️ Parent userId mismatch — ignoring stale prop');
      return;
    }

    setFormData(prev => {
      const isSame = Object.keys(rest).every(k => prev[k] === rest[k]);
      return isSame ? prev : { ...prev, ...rest };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchState]); // intentionally omit `data` — only re-check when fetchState changes

  // ── VALIDATION ────────────────────────────────────────────────────────────
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'fullName': {
        if (!value.trim())
          return 'Full name is required';
        if (value.trim().length < 2)
          return 'Name must be at least 2 characters';
        if (!/^[A-Za-z\s]+$/.test(value.trim()))
          return 'Full name must contain only letters and spaces';
        return '';
      }
      case 'dateOfBirth': {
        if (!value)
          return 'Date of birth is required';
        const age = calculateAge(value);
        if (age === null)
          return 'Invalid date of birth';
        if (age < 20)
          return 'Must be at least 20 years old';
        if (age > 40)
          return 'Must not be older than 40 years';
        return '';
      }
      case 'gender':
        return value ? '' : 'Gender is required';
      case 'nationality': {
        if (!value.trim())
          return 'Nationality is required';
        if (!/^[A-Za-z\s]+$/.test(value.trim()))
          return 'Nationality must contain only letters and spaces';
        return '';
      }
      case 'passportNumber': {
        if (!value.trim())
          return 'Passport number is required';
        if (!/^[A-Z0-9]{6,12}$/.test(value))
          return 'Passport must be 6-12 alphanumeric characters (uppercase letters and numbers only)';
        return '';
      }
      case 'maritalStatus':
        return value ? '' : 'Marital status is required';
      default:
        return '';
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name } = e.target;
    let { value } = e.target;

    // Sanitize specific fields
    if (name === 'fullName' || name === 'nationality') {
      value = sanitizeName(value);
    }

    if (name === 'passportNumber') {
      value = sanitizePassportNumber(value);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  }, [validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  }, [validateField]);

  // ── SAVE TO BACKEND ───────────────────────────────────────────────────────
  const saveDataToBackend = useCallback(async (snapshot) => {
    if (isSavingRef.current) return;
    const cleanData = {
      fullName: snapshot.fullName || '',
      dateOfBirth: snapshot.dateOfBirth || '',
      gender: snapshot.gender || '',
      nationality: snapshot.nationality || '',
      passportNumber: snapshot.passportNumber || '',
      maritalStatus: snapshot.maritalStatus || '',
    };
    if (JSON.stringify(lastSavedRef.current) === JSON.stringify(cleanData)) return;

    isSavingRef.current = true;
    try {
      const { data: result } = await axiosInstance.post('/api/master-personal', cleanData);
      if (result.success) {
        lastSavedRef.current = cleanData;
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
  }, []);

  // ── AUTO-SAVE + NOTIFY PARENT ─────────────────────────────────────────────
  useEffect(() => {
    if (fetchState === 'loading') return; // never fire during fetch

    const isValid = Object.keys(formData).every(k => {
      if (k === '_id') return true;
      return validateField(k, formData[k] ?? '') === '';
    });

    const nextPayload = JSON.stringify({ ...formData, _isValid: isValid });
    if (lastUpdatedRef.current !== nextPayload) {
      lastUpdatedRef.current = nextPayload;
      updateDataRef.current({ ...formData, _isValid: isValid }); // ← ref, not dep
    }

    persistMasterApplicationData({ ...formData, _isValid: isValid });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isValid) saveDataToBackend(formData);
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };

  // ✅ updateData is NOT in deps — using ref instead stops the infinite loop
  }, [formData, fetchState, validateField, saveDataToBackend, persistMasterApplicationData]);

  const genderOptions        = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];

  if (fetchState === 'loading') {
    return (
      <div className="masterpersonal-form">
        <div className="masterpersonal-header">
          <h2 className="masterpersonal-title">Personal Information</h2>
          <p className="masterpersonal-subtitle">Loading your details…</p>
        </div>
        <div className="masterpersonal-grid" style={{ opacity: 0.4, pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`masterpersonal-group${i === 0 ? ' masterpersonal-group-full' : ''}`}>
              <div style={{ height: 16, background: '#e0e0e0', borderRadius: 4, marginBottom: 8, width: '40%' }} />
              <div style={{ height: 44, background: '#e0e0e0', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="masterpersonal-form">
      <div className="masterpersonal-header">
        <h2 className="masterpersonal-title">Personal Information</h2>
        <p className="masterpersonal-subtitle">
          Please provide your personal details as per your passport
        </p>
      </div>

      <div className="masterpersonal-grid">

        <div className="masterpersonal-group masterpersonal-group-full">
          <label className="masterpersonal-label">Full Name <span className="masterpersonal-required">*</span></label>
          <input
            type="text" name="fullName" value={formData.fullName}
            onChange={handleChange} onBlur={handleBlur}
            placeholder="Enter your full name as shown on passport"
            className={`masterpersonal-input ${errors.fullName ? 'masterpersonal-error' : ''}`}
          />
          {errors.fullName && <span className="masterpersonal-error-text">{errors.fullName}</span>}
        </div>

        <div className="masterpersonal-group">
          <label className="masterpersonal-label">Date of Birth <span className="masterpersonal-required">*</span></label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            min={dobLimits.min}
            max={dobLimits.max}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`masterpersonal-input ${errors.dateOfBirth ? 'masterpersonal-error' : ''}`}
          />
          {errors.dateOfBirth && <span className="masterpersonal-error-text">{errors.dateOfBirth}</span>}
        </div>

        <div className="masterpersonal-group">
          <label className="masterpersonal-label">Gender <span className="masterpersonal-required">*</span></label>
          <select
            name="gender" value={formData.gender}
            onChange={handleChange} onBlur={handleBlur}
            className={`masterpersonal-select ${errors.gender ? 'masterpersonal-error' : ''}`}
          >
            <option value="">Select Gender</option>
            {genderOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {errors.gender && <span className="masterpersonal-error-text">{errors.gender}</span>}
        </div>

        <div className="masterpersonal-group">
          <label className="masterpersonal-label">Nationality <span className="masterpersonal-required">*</span></label>
          <input
            type="text" name="nationality" value={formData.nationality}
            onChange={handleChange} onBlur={handleBlur}
            placeholder="Enter your nationality"
            className={`masterpersonal-input ${errors.nationality ? 'masterpersonal-error' : ''}`}
          />
          {errors.nationality && <span className="masterpersonal-error-text">{errors.nationality}</span>}
        </div>

        <div className="masterpersonal-group">
          <label className="masterpersonal-label">Passport Number <span className="masterpersonal-required">*</span></label>
          <input
            type="text" name="passportNumber" value={formData.passportNumber}
            onChange={handleChange} onBlur={handleBlur}
            placeholder="Enter your passport number"
            className={`masterpersonal-input ${errors.passportNumber ? 'masterpersonal-error' : ''}`}
          />
          {errors.passportNumber && <span className="masterpersonal-error-text">{errors.passportNumber}</span>}
        </div>

        <div className="masterpersonal-group">
          <label className="masterpersonal-label">Marital Status <span className="masterpersonal-required">*</span></label>
          <select
            name="maritalStatus" value={formData.maritalStatus}
            onChange={handleChange} onBlur={handleBlur}
            className={`masterpersonal-select ${errors.maritalStatus ? 'masterpersonal-error' : ''}`}
          >
            <option value="">Select Marital Status</option>
            {maritalStatusOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {errors.maritalStatus && <span className="masterpersonal-error-text">{errors.maritalStatus}</span>}
        </div>

      </div>
    </div>
  );
};

export default MasterPersonal;
