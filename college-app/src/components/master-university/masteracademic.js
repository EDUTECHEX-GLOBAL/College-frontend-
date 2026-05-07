import React, { useState, useEffect, useCallback, useRef } from 'react';
import './masteracademic.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

// ─── Cross-tab save lock key ──────────────────────────────────────────────────
// Prevents two tabs from saving at the exact same time (race condition).
const SAVE_LOCK_KEY   = 'masteracademic_saving';
const SAVE_LOCK_TTL   = 5000; // 5 seconds max lock duration

const acquireSaveLock = () => {
  try {
    const existing = localStorage.getItem(SAVE_LOCK_KEY);
    if (existing) {
      const { ts } = JSON.parse(existing);
      // If lock is older than TTL, consider it stale and take over
      if (Date.now() - ts < SAVE_LOCK_TTL) return false;
    }
    localStorage.setItem(SAVE_LOCK_KEY, JSON.stringify({ ts: Date.now() }));
    return true;
  } catch {
    return true; // If localStorage fails, allow save
  }
};

const releaseSaveLock = () => {
  try { localStorage.removeItem(SAVE_LOCK_KEY); } catch {}
};

const MasterAcademic = ({ data, updateData }) => {
  const [academicEntries, setAcademicEntries] = useState([
    { degree: '', university: '', country: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', id: Date.now() }
  ]);

  const [errors, setErrors]             = useState({});
  const [isSaving, setIsSaving]         = useState(false);
  const [saveStatus, setSaveStatus]     = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  // Tells the user if another tab is currently saving
  const [otherTabSaving, setOtherTabSaving] = useState(false);

  const touchedRef      = useRef({});
  const lastUpdatedRef  = useRef(null);
  const hasFetched      = useRef(false);
  const dropdownWrapRef = useRef(null);
  // BroadcastChannel: lets tabs communicate with each other
  const channelRef      = useRef(null);

  const degrees   = ["Bachelor's Degree", "Master's Degree", 'PhD/Doctorate', 'Diploma', 'Associate Degree', 'High School'];
  const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France', 'Other'];

  // ─── BroadcastChannel setup ───────────────────────────────────────────────────
  // When Tab A saves successfully it broadcasts to Tab B so Tab B can reload
  // the latest data without saving again (preventing the double-save race).
  useEffect(() => {
    if (!window.BroadcastChannel) return;

    const channel = new BroadcastChannel('masteracademic_sync');
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type } = event.data || {};

      if (type === 'SAVING_STARTED') {
        setOtherTabSaving(true);
      }

      if (type === 'SAVING_DONE') {
        setOtherTabSaving(false);
        // Another tab saved — re-fetch so this tab shows the latest data
        refetchData();
      }

      if (type === 'SAVING_FAILED') {
        setOtherTabSaving(false);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownWrapRef.current && !dropdownWrapRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // ─── Get token ────────────────────────────────────────────────────────────────
  const getToken = () => localStorage.getItem('token');

  // ─── GPA validation ───────────────────────────────────────────────────────────
  const isValidGpa = (gpaStr) => {
    if (!gpaStr?.trim()) return true;
    const cleaned = gpaStr.trim();
    if (cleaned.endsWith('%')) {
      const num = parseFloat(cleaned);
      return !isNaN(num) && num >= 0 && num <= 100;
    }
    if (cleaned.includes('/')) {
      const parts = cleaned.split('/');
      if (parts.length !== 2) return false;
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      return !isNaN(num) && !isNaN(den) && den > 0 && den <= 100 && num >= 0 && num <= den;
    }
    const num = parseFloat(cleaned);
    return !isNaN(num) && num >= 0 && num <= 10;
  };

  // ─── Validate single entry ────────────────────────────────────────────────────
  const validateEntry = useCallback((entry, entryId, showAll = false) => {
    const touched   = touchedRef.current[entryId] || {};
    const newErrors = {};

    const check = (field, condition, message) => {
      if (showAll || touched[field]) {
        if (condition) newErrors[field] = message;
      }
    };

    check('degree',       !entry.degree?.trim(),       'Degree is required');
    check('university',   !entry.university?.trim(),   'University name is required');
    check('country',      !entry.country?.trim(),      'Country is required');
    check('fieldOfStudy', !entry.fieldOfStudy?.trim(), 'Field of study is required');
    check('startDate',    !entry.startDate,            'Start date is required');
    check('endDate',      !entry.endDate,              'End date is required');

    if (
      (showAll || (touched.startDate && touched.endDate)) &&
      entry.startDate && entry.endDate &&
      new Date(entry.startDate) > new Date(entry.endDate)
    ) {
      newErrors.endDate = 'End date must be after start date';
    }

    if ((showAll || touched.gpa) && entry.gpa?.trim() && !isValidGpa(entry.gpa)) {
      newErrors.gpa = 'Enter a valid GPA up to 10 (e.g. 8.5 or 8.5/10) or percentage (e.g. 85%)';
    }

    setErrors(prev => ({ ...prev, [entryId]: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, []);

  // ─── Check overall validity ───────────────────────────────────────────────────
  const checkIsValid = useCallback((entries) => {
    const allFilled = entries.every(e =>
      e.degree?.trim() &&
      e.university?.trim() &&
      e.country?.trim() &&
      e.fieldOfStudy?.trim() &&
      e.startDate &&
      e.endDate &&
      new Date(e.startDate) <= new Date(e.endDate) &&
      isValidGpa(e.gpa)
    );
    const hasBachelor = entries.some(e => e.degree === "Bachelor's Degree");
    return allFilled && hasBachelor;
  }, []);

  // ─── Fetch helper (reusable) ──────────────────────────────────────────────────
  const fetchAndPopulate = useCallback(async (signal) => {
    const token = getToken();
    if (!token) return;

    const response = await fetch(`${API_URL}/api/master-academic`, {
      method:  'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal,
    });

    if (response.status === 404) return; // No data yet — keep blank form
    if (!response.ok) {
      console.error('❌ Fetch failed:', response.status);
      return;
    }

    const result = await response.json();

    if (
      result?.success &&
      Array.isArray(result?.data?.academics) &&
      result.data.academics.length > 0
    ) {
      const entriesWithIds = result.data.academics.map((entry, index) => ({
        degree:       entry.degree       || '',
        university:   entry.university   || '',
        country:      entry.country      || '',
        fieldOfStudy: entry.fieldOfStudy || '',
        startDate:    entry.startDate    || '',
        endDate:      entry.endDate      || '',
        gpa:          entry.gpa          || '',
        id: Date.now() + index,
      }));

      const touched = {};
      entriesWithIds.forEach(e => {
        touched[e.id] = {
          degree: true, university: true, country: true,
          fieldOfStudy: true, startDate: true, endDate: true, gpa: true,
        };
      });
      touchedRef.current = touched;

      const isValid         = checkIsValid(entriesWithIds);
      const entriesToParent = entriesWithIds.map(({ id, ...rest }) => rest);
      const payload         = { academics: entriesToParent, _isValid: isValid };

      lastUpdatedRef.current = JSON.stringify(payload);
      setAcademicEntries(entriesWithIds);
      updateData(payload);
    }
  }, [checkIsValid, updateData]);

  // ─── Re-fetch when another tab saves ─────────────────────────────────────────
  const refetchData = useCallback(() => {
    const controller = new AbortController();
    fetchAndPopulate(controller.signal).catch(err => {
      if (err.name !== 'AbortError') console.error('❌ Refetch error:', err);
    });
  }, [fetchAndPopulate]);

  // ─── Fetch on mount ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    fetchAndPopulate(controller.signal).catch(err => {
      if (err.name !== 'AbortError') console.error('❌ Fetch error:', err);
    });

    return () => controller.abort();
  }, [fetchAndPopulate]);

  // ─── Save to backend ──────────────────────────────────────────────────────────
  const saveToBackend = useCallback(async (entries) => {
    const token = getToken();
    if (!token) { setSaveStatus('error'); return; }

    // Try to acquire cross-tab lock
    if (!acquireSaveLock()) {
      console.warn('⚠️ Another tab is saving — skipping this save');
      return;
    }

    // Notify other tabs that saving has started
    channelRef.current?.postMessage({ type: 'SAVING_STARTED' });

    setIsSaving(true);
    setSaveStatus('');

    try {
      const cleanEntries = entries.map(({ id, ...rest }) => rest);

      const response = await fetch(`${API_URL}/api/master-academic`, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ academics: cleanEntries }),
      });

      const result = await response.json();
      console.log('📥 Save response:', response.status, result);

      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 3000);
        // Notify other tabs: save done, please re-fetch
        channelRef.current?.postMessage({ type: 'SAVING_DONE' });
      } else {
        setSaveStatus('error');
        console.error('❌ Save failed:', result.message);
        channelRef.current?.postMessage({ type: 'SAVING_FAILED' });
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('❌ Save error:', error);
      channelRef.current?.postMessage({ type: 'SAVING_FAILED' });
    } finally {
      setIsSaving(false);
      releaseSaveLock();
    }
  }, []);

  // ─── Manual save button ───────────────────────────────────────────────────────
  const handleManualSave = useCallback(() => {
    let allValid = true;
    academicEntries.forEach(entry => {
      const valid = validateEntry(entry, entry.id, true);
      if (!valid) allValid = false;
    });

    if (!allValid) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    const hasBachelor = academicEntries.some(e => e.degree === "Bachelor's Degree");
    if (!hasBachelor) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    saveToBackend(academicEntries);
  }, [academicEntries, validateEntry, saveToBackend]);

  // ─── Notify parent + auto-save on valid ──────────────────────────────────────
  useEffect(() => {
    const isValid       = checkIsValid(academicEntries);
    const entriesToSave = academicEntries.map(({ id, ...rest }) => rest);
    const payload       = { academics: entriesToSave, _isValid: isValid };
    const nextUpdate    = JSON.stringify(payload);

    if (lastUpdatedRef.current === nextUpdate) return;
    lastUpdatedRef.current = nextUpdate;

    updateData(payload);
    if (isValid) saveToBackend(academicEntries);
  }, [academicEntries, checkIsValid, updateData, saveToBackend]);

  // ─── Field handlers ───────────────────────────────────────────────────────────
  const handleEntryChange = useCallback((id, field, value) => {
    touchedRef.current = {
      ...touchedRef.current,
      [id]: { ...(touchedRef.current[id] || {}), [field]: true },
    };
    setAcademicEntries(prev => {
      const updated = prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry);
      const entry   = updated.find(e => e.id === id);
      if (entry) validateEntry(entry, id);
      return updated;
    });
  }, [validateEntry]);

  const handleEntryBlur = useCallback((id, field) => {
    touchedRef.current = {
      ...touchedRef.current,
      [id]: { ...(touchedRef.current[id] || {}), [field]: true },
    };
    setAcademicEntries(prev => {
      const entry = prev.find(e => e.id === id);
      if (entry) validateEntry(entry, id);
      return prev;
    });
  }, [validateEntry]);

  const addNewEntry = useCallback(() => {
    setAcademicEntries(prev => [
      ...prev,
      { degree: '', university: '', country: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', id: Date.now() },
    ]);
  }, []);

  const removeEntry = useCallback((id) => {
    setAcademicEntries(prev => {
      if (prev.length === 1) { alert('At least one academic entry is required'); return prev; }
      const updated = prev.filter(entry => entry.id !== id);
      setErrors(e => { const copy = { ...e }; delete copy[id]; return copy; });
      const touched = { ...touchedRef.current };
      delete touched[id];
      touchedRef.current = touched;
      return updated;
    });
  }, []);

  // ─── Custom dropdown ──────────────────────────────────────────────────────────
  const CustomSelect = ({ entryId, field, value, options, placeholder, hasError }) => {
    const dropdownKey = `${field}-${entryId}`;
    const isOpen      = openDropdown === dropdownKey;

    const handleToggle = (e) => {
      e.stopPropagation();
      setOpenDropdown(prev => (prev === dropdownKey ? null : dropdownKey));
    };

    const handleSelect = (optionValue) => {
      handleEntryChange(entryId, field, optionValue);
      touchedRef.current = {
        ...touchedRef.current,
        [entryId]: { ...(touchedRef.current[entryId] || {}), [field]: true },
      };
      setOpenDropdown(null);
    };

    return (
      <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
        <button
          type="button"
          onClick={handleToggle}
          className={`masteracademic-input ${hasError ? 'error' : ''}`}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left',
            background: 'white', color: value ? '#0f172a' : '#94a3b8',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value || placeholder}
          </span>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none"
            style={{ flexShrink: 0, marginLeft: '8px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
          >
            <path d="M1 1l5 5 5-5" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#ffffff', border: '1.5px solid #0891b2', borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(8, 145, 178, 0.15)', zIndex: 9999,
            overflow: 'hidden', maxHeight: '240px', overflowY: 'auto',
          }}>
            {options.map((option) => (
              <div
                key={option}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(option); }}
                onTouchEnd={(e)  => { e.preventDefault(); handleSelect(option); }}
                style={{
                  padding: '12px 16px', fontSize: '14px',
                  color:      value === option ? '#0891b2' : '#0f172a',
                  fontWeight: value === option ? '600' : '400',
                  background: value === option ? '#f0f9ff' : 'transparent',
                  cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                  transition: 'background 0.15s ease', fontFamily: "'Poppins', sans-serif",
                  userSelect: 'none', WebkitUserSelect: 'none',
                }}
                onMouseEnter={e => { if (value !== option) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (value !== option) e.currentTarget.style.background = 'transparent'; }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="masteracademic-form" ref={dropdownWrapRef}>
      <div className="masteracademic-header">
        <h2 className="masteracademic-title">Academic History</h2>
        <p className="masteracademic-subtitle">
          Add all your academic qualifications starting from the most recent
        </p>

        {/* Cross-tab saving warning */}
        {otherTabSaving && (
          <div className="masteracademic-save-status success" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>
            ⚠️ Another tab is saving — please wait…
          </div>
        )}

        {(isSaving || saveStatus) && (
          <div className={`masteracademic-save-status ${saveStatus === 'error' ? 'error' : 'success'}`}>
            {isSaving && 'Saving…'}
            {!isSaving && saveStatus === 'saved'  && '✓ Saved successfully'}
            {!isSaving && saveStatus === 'error'  && '✕ Save failed — please check all fields and try again'}
          </div>
        )}
      </div>

      {academicEntries.map((entry, index) => (
        <div key={entry.id} className="masteracademic-entry">
          <div className="masteracademic-entry-header">
            <h3 className="masteracademic-entry-title">Education #{index + 1}</h3>
            {academicEntries.length > 1 && (
              <button type="button" className="masteracademic-remove-btn" onClick={() => removeEntry(entry.id)}>
                Remove
              </button>
            )}
          </div>

          <div className="masteracademic-grid">

            {/* Degree */}
            <div className="masteracademic-group">
              <label className="masteracademic-label">
                Degree <span className="masteracademic-required">*</span>
              </label>
              <CustomSelect
                entryId={entry.id} field="degree" value={entry.degree}
                options={degrees} placeholder="Select Degree"
                hasError={!!errors[entry.id]?.degree}
              />
              {errors[entry.id]?.degree && (
                <span className="masteracademic-error-text">{errors[entry.id].degree}</span>
              )}
            </div>

            {/* University */}
            <div className="masteracademic-group">
              <label className="masteracademic-label">
                University/College Name <span className="masteracademic-required">*</span>
              </label>
              <input
                type="text" value={entry.university || ''}
                onChange={(e) => handleEntryChange(entry.id, 'university', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'university')}
                placeholder="University name"
                className={`masteracademic-input ${errors[entry.id]?.university ? 'error' : ''}`}
              />
              {errors[entry.id]?.university && (
                <span className="masteracademic-error-text">{errors[entry.id].university}</span>
              )}
            </div>

            {/* Country */}
            <div className="masteracademic-group">
              <label className="masteracademic-label">
                Country <span className="masteracademic-required">*</span>
              </label>
              <CustomSelect
                entryId={entry.id} field="country" value={entry.country}
                options={countries} placeholder="Select Country"
                hasError={!!errors[entry.id]?.country}
              />
              {errors[entry.id]?.country && (
                <span className="masteracademic-error-text">{errors[entry.id].country}</span>
              )}
            </div>

            {/* Field of Study */}
            <div className="masteracademic-group">
              <label className="masteracademic-label">
                Field of Study <span className="masteracademic-required">*</span>
              </label>
              <input
                type="text" value={entry.fieldOfStudy || ''}
                onChange={(e) => handleEntryChange(entry.id, 'fieldOfStudy', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'fieldOfStudy')}
                placeholder="e.g., Computer Science, Business Administration"
                className={`masteracademic-input ${errors[entry.id]?.fieldOfStudy ? 'error' : ''}`}
              />
              {errors[entry.id]?.fieldOfStudy && (
                <span className="masteracademic-error-text">{errors[entry.id].fieldOfStudy}</span>
              )}
            </div>

            {/* Start Date */}
            <div className="masteracademic-group">
              <label className="masteracademic-label">
                Start Date <span className="masteracademic-required">*</span>
              </label>
              <input
                type="month" value={entry.startDate || ''}
                onChange={(e) => handleEntryChange(entry.id, 'startDate', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'startDate')}
                className={`masteracademic-input ${errors[entry.id]?.startDate ? 'error' : ''}`}
              />
              {errors[entry.id]?.startDate && (
                <span className="masteracademic-error-text">{errors[entry.id].startDate}</span>
              )}
            </div>

            {/* End Date */}
            <div className="masteracademic-group">
              <label className="masteracademic-label">
                End Date <span className="masteracademic-required">*</span>
              </label>
              <input
                type="month" value={entry.endDate || ''}
                onChange={(e) => handleEntryChange(entry.id, 'endDate', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'endDate')}
                className={`masteracademic-input ${errors[entry.id]?.endDate ? 'error' : ''}`}
              />
              {errors[entry.id]?.endDate && (
                <span className="masteracademic-error-text">{errors[entry.id].endDate}</span>
              )}
            </div>

            {/* GPA */}
            <div className="masteracademic-group">
              <label className="masteracademic-label">GPA / Percentage (Optional)</label>
              <input
                type="text" value={entry.gpa || ''}
                onChange={(e) => handleEntryChange(entry.id, 'gpa', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'gpa')}
                placeholder="e.g., 8.5/10 or 85%"
                className={`masteracademic-input ${errors[entry.id]?.gpa ? 'error' : ''}`}
              />
              {errors[entry.id]?.gpa && (
                <span className="masteracademic-error-text">{errors[entry.id].gpa}</span>
              )}
            </div>

          </div>
        </div>
      ))}

      <button type="button" className="masteracademic-add-btn" onClick={addNewEntry}>
        + Add Another Qualification
      </button>

      {!academicEntries.some(e => e.degree === "Bachelor's Degree") && (
        <div className="masteracademic-bachelor-warning">
          <div>
            <p className="masteracademic-bachelor-warning-title">Bachelor's Degree Required</p>
            <p className="masteracademic-bachelor-warning-text">
              You must add at least one Bachelor's Degree to be eligible for a master's program application.
            </p>
          </div>
        </div>
      )}

      {/* Manual Save Button */}
      <button
        type="button"
        onClick={handleManualSave}
        disabled={isSaving || otherTabSaving}
        style={{
          marginTop: '24px',
          width: '100%',
          padding: '14px 24px',
          background: (isSaving || otherTabSaving) ? '#94a3b8' : '#0891b2',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: '600',
          fontFamily: "'Poppins', sans-serif",
          cursor: (isSaving || otherTabSaving) ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        {isSaving ? 'Saving…' : otherTabSaving ? 'Another tab is saving…' : 'Save Academic History'}
      </button>

    </div>
  );
};

export default MasterAcademic;