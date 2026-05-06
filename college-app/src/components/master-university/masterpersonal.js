import React, { useState, useEffect, useRef, useCallback } from 'react';
import './masterpersonal.css';

const EMPTY_FORM = {
  _id: null,
  fullName: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  passportNumber: '',
  maritalStatus: ''
};

const MasterPersonal = ({ data, updateData }) => {
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [errors,     setErrors]     = useState({});
  const [fetchState, setFetchState] = useState('loading'); // 'loading' | 'ready-empty' | 'ready-filled'

  const debounceRef          = useRef(null);
  const isSavingRef          = useRef(false);
  const lastSavedRef         = useRef(null);
  const lastUpdatedRef       = useRef(null);
  const lastFetchedUserIdRef = useRef(null);

  // Keep a stable ref to updateData so we never need it in a dep array
  const updateDataRef = useRef(updateData);
  useEffect(() => { updateDataRef.current = updateData; }, [updateData]);

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

    // Reset for new/different user
    setFormData(EMPTY_FORM);
    setErrors({});
    setFetchState('loading');
    lastSavedRef.current         = null;
    lastUpdatedRef.current       = null;
    lastFetchedUserIdRef.current = currentUserId;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setFetchState('ready-empty'); return; }

        const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const res = await fetch(`${baseURL}/api/master-personal/me`, {
  headers: { Authorization: `Bearer ${token}` }
});
        const result = await res.json();

        if (result.success && result.data) {
          const formatted = {
            ...result.data,
            dateOfBirth: result.data.dateOfBirth
              ? new Date(result.data.dateOfBirth).toISOString().split('T')[0]
              : ''
          };
          setFormData(formatted);
          lastSavedRef.current = formatted;
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
      case 'fullName':
        if (!value.trim())           return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'dateOfBirth': {
        if (!value) return 'Date of birth is required';
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        if (age < 16)  return 'Must be at least 16 years old';
        if (age > 100) return 'Invalid date of birth';
        return '';
      }
      case 'gender':        return value ? '' : 'Gender is required';
      case 'nationality':   return value.trim() ? '' : 'Nationality is required';
      case 'passportNumber':
        if (!value.trim())           return 'Passport number is required';
        if (value.trim().length < 6) return 'Valid passport number required';
        return '';
      case 'maritalStatus': return value ? '' : 'Marital status is required';
      default:              return '';
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
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
    const cleanData = { ...snapshot };
    delete cleanData._id;
    if (JSON.stringify(lastSavedRef.current) === JSON.stringify(cleanData)) return;

    isSavingRef.current = true;
    try {
      const token = localStorage.getItem('token');
     const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const res = await fetch(`${baseURL}/api/master-personal`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(cleanData)
});
      const result = await res.json();
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

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isValid) saveDataToBackend(formData);
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };

  // ✅ updateData is NOT in deps — using ref instead stops the infinite loop
  }, [formData, fetchState, validateField, saveDataToBackend]);

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
            type="date" name="dateOfBirth" value={formData.dateOfBirth}
            onChange={handleChange} onBlur={handleBlur}
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