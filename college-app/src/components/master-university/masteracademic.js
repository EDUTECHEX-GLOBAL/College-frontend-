import React, { useState, useEffect, useCallback, useRef } from 'react';
import './masteracademic.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const MasterAcademic = ({ data, updateData }) => {
  const [academicEntries, setAcademicEntries] = useState([
    { degree: '', university: '', country: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', id: Date.now() }
  ]);

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const touchedRef = useRef({});
  const lastUpdatedRef = useRef(null);

  // ✅ FIX 1: useRef-based fetch guard (not module-level)
  // Resets on real unmount via cleanup, so navigating away + back re-fetches.
  // StrictMode's fake unmount is handled by AbortController below.
  const hasFetched = useRef(false);

  // ─── Get userId ───────────────────────────────────────────────
  const getUserId = () => {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr || userDataStr === 'undefined') return null;
      const parsed = JSON.parse(userDataStr);
      return parsed._id || parsed.realStudentId || null;
    } catch (e) {
      console.error('Error reading userId:', e);
      return null;
    }
  };

  // ─── Validate (errors only show on touched fields) ────────────
  const validateEntry = useCallback((entry, entryId, showAll = false) => {
    const touched = touchedRef.current[entryId] || {};
    const newErrors = {};

    const check = (field, condition, message) => {
      if (showAll || touched[field]) {
        if (condition) newErrors[field] = message;
      }
    };

    check('degree', !entry.degree?.trim(), 'Degree is required');
    check('university', !entry.university?.trim(), 'University name is required');
    check('country', !entry.country?.trim(), 'Country is required');
    check('fieldOfStudy', !entry.fieldOfStudy?.trim(), 'Field of study is required');
    check('startDate', !entry.startDate, 'Start date is required');
    check('endDate', !entry.endDate, 'End date is required');

    if ((showAll || (touched.startDate && touched.endDate)) &&
      entry.startDate && entry.endDate &&
      new Date(entry.startDate) > new Date(entry.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if ((showAll || touched.gpa) && entry.gpa?.trim()) {
      const gpaNum = parseFloat(entry.gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
        newErrors.gpa = 'GPA must be between 0 and 4.0';
      }
    }

    setErrors(prev => ({ ...prev, [entryId]: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, []);

  // ─── Silent validity check (no state mutation) ────────────────
  const checkIsValid = useCallback((entries) => {
    return entries.every(e =>
      e.degree?.trim() &&
      e.university?.trim() &&
      e.country?.trim() &&
      e.fieldOfStudy?.trim() &&
      e.startDate &&
      e.endDate &&
      new Date(e.startDate) <= new Date(e.endDate)
    );
  }, []);

  // ─── Fetch on mount ───────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // AbortController lets StrictMode's fake-unmount cancel the in-flight
    // request cleanly without triggering the error handler
    const controller = new AbortController();

    const fetchAcademicData = async () => {
      const userId = getUserId();
      if (!userId) return;

      try {
        const token = localStorage.getItem('token');
        console.log('Fetching academic data for userId:', userId);

        const response = await fetch(`${API_URL}/api/master-academic/${userId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        if (response.status === 404) {
          console.log('No academic data found (first time user)');
          return;
        }

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const result = await response.json();
        console.log('Academic data fetched:', result);

        if (
          result?.success &&
          Array.isArray(result?.data?.academics) &&
          result.data.academics.length > 0
        ) {
          const entriesWithIds = result.data.academics.map((entry, index) => ({
            degree: entry.degree || '',
            university: entry.university || '',
            country: entry.country || '',
            fieldOfStudy: entry.fieldOfStudy || '',
            startDate: entry.startDate || '',
            endDate: entry.endDate || '',
            gpa: entry.gpa || '',
            id: Date.now() + index
          }));

          // Mark all fields touched so re-editing shows validation correctly
          const touched = {};
          entriesWithIds.forEach(e => {
            touched[e.id] = {
              degree: true, university: true, country: true,
              fieldOfStudy: true, startDate: true, endDate: true, gpa: true
            };
          });
          touchedRef.current = touched;

          const isValid = checkIsValid(entriesWithIds);
          const entriesToParent = entriesWithIds.map(({ id, ...rest }) => rest);
          const payload = [...entriesToParent, { _isValid: isValid }];

          // ✅ FIX 2: Pre-seed lastUpdatedRef so the notify-parent useEffect
          // below recognises this as already-sent and skips it — preventing
          // an immediate re-save loop right after load
          lastUpdatedRef.current = JSON.stringify(payload);

          setAcademicEntries(entriesWithIds);

          // Call updateData directly here — don't rely on the useEffect below
          // because isInitialMount logic would have blocked it previously
          updateData(payload);
        }
      } catch (error) {
        if (error.name === 'AbortError') return; // StrictMode cleanup — safe
        console.error('Error fetching academic data:', error);
      }
    };

    fetchAcademicData();

    return () => {
      // Cancel any in-flight request on unmount
      controller.abort();
      // ✅ Reset so navigating away + back triggers a fresh fetch
      hasFetched.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Field change ─────────────────────────────────────────────
  const handleEntryChange = useCallback((id, field, value) => {
    touchedRef.current = {
      ...touchedRef.current,
      [id]: { ...(touchedRef.current[id] || {}), [field]: true }
    };

    setAcademicEntries(prev => {
      const updated = prev.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      );
      const entry = updated.find(e => e.id === id);
      if (entry) validateEntry(entry, id);
      return updated;
    });
  }, [validateEntry]);

  // ─── Blur ─────────────────────────────────────────────────────
  const handleEntryBlur = useCallback((id, field) => {
    touchedRef.current = {
      ...touchedRef.current,
      [id]: { ...(touchedRef.current[id] || {}), [field]: true }
    };
    setAcademicEntries(prev => {
      const entry = prev.find(e => e.id === id);
      if (entry) validateEntry(entry, id);
      return prev;
    });
  }, [validateEntry]);

  // ─── Add entry ────────────────────────────────────────────────
  const addNewEntry = useCallback(() => {
    setAcademicEntries(prev => [...prev, {
      degree: '', university: '', country: '', fieldOfStudy: '',
      startDate: '', endDate: '', gpa: '', id: Date.now()
    }]);
  }, []);

  // ─── Remove entry ─────────────────────────────────────────────
  const removeEntry = useCallback((id) => {
    setAcademicEntries(prev => {
      if (prev.length === 1) {
        alert('At least one academic entry is required');
        return prev;
      }
      const updated = prev.filter(entry => entry.id !== id);
      setErrors(e => { const copy = { ...e }; delete copy[id]; return copy; });
      const touched = { ...touchedRef.current };
      delete touched[id];
      touchedRef.current = touched;
      return updated;
    });
  }, []);

  // ─── Save to backend ──────────────────────────────────────────
  const saveToBackend = useCallback(async (entries) => {
    const userId = getUserId();
    if (!userId) return;

    setIsSaving(true);
    setSaveStatus('');

    try {
      const token = localStorage.getItem('token');
      const cleanEntries = entries.map(({ id, ...rest }) => rest);

      const response = await fetch(`${API_URL}/api/master-academic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, academics: cleanEntries })
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('error');
        console.error('Save failed:', result.message);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ─── Notify parent + auto-save on user edits ─────────────────
  // Skips silently if the value matches lastUpdatedRef (set after fetch load)
  useEffect(() => {
    const isValid = checkIsValid(academicEntries);
    const entriesToSave = academicEntries.map(({ id, ...rest }) => rest);
    const nextUpdate = JSON.stringify([...entriesToSave, { _isValid: isValid }]);

    if (lastUpdatedRef.current === nextUpdate) return; // no change
    lastUpdatedRef.current = nextUpdate;

    updateData([...entriesToSave, { _isValid: isValid }]);

    if (isValid) saveToBackend(academicEntries);
  }, [academicEntries, checkIsValid, updateData, saveToBackend]);

  const degrees = ["Bachelor's Degree", "Master's Degree", 'PhD/Doctorate', 'Diploma', 'Associate Degree', 'High School'];
  const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'France', 'Other'];

  return (
    <div className="masteracademic-form">
      <div className="masteracademic-header">
        <h2 className="masteracademic-title">Academic History</h2>
        <p className="masteracademic-subtitle">Add all your academic qualifications starting from the most recent</p>

        {(isSaving || saveStatus) && (
          <div className={`masteracademic-save-status ${saveStatus === 'error' ? 'error' : 'success'}`}>
            {isSaving && 'Saving…'}
            {!isSaving && saveStatus === 'saved' && '✓ Saved successfully'}
            {!isSaving && saveStatus === 'error' && '✕ Save failed — please try again'}
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

            <div className="masteracademic-group">
              <label className="masteracademic-label">Degree <span className="masteracademic-required">*</span></label>
              <select
                value={entry.degree || ''}
                onChange={(e) => handleEntryChange(entry.id, 'degree', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'degree')}
                className={`masteracademic-select ${errors[entry.id]?.degree ? 'error' : ''}`}
              >
                <option value="">Select Degree</option>
                {degrees.map(degree => <option key={degree} value={degree}>{degree}</option>)}
              </select>
              {errors[entry.id]?.degree && <span className="masteracademic-error-text">{errors[entry.id].degree}</span>}
            </div>

            <div className="masteracademic-group">
              <label className="masteracademic-label">University/College Name <span className="masteracademic-required">*</span></label>
              <input
                type="text"
                value={entry.university || ''}
                onChange={(e) => handleEntryChange(entry.id, 'university', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'university')}
                placeholder="University name"
                className={`masteracademic-input ${errors[entry.id]?.university ? 'error' : ''}`}
              />
              {errors[entry.id]?.university && <span className="masteracademic-error-text">{errors[entry.id].university}</span>}
            </div>

            <div className="masteracademic-group">
              <label className="masteracademic-label">Country <span className="masteracademic-required">*</span></label>
              <select
                value={entry.country || ''}
                onChange={(e) => handleEntryChange(entry.id, 'country', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'country')}
                className={`masteracademic-select ${errors[entry.id]?.country ? 'error' : ''}`}
              >
                <option value="">Select Country</option>
                {countries.map(country => <option key={country} value={country}>{country}</option>)}
              </select>
              {errors[entry.id]?.country && <span className="masteracademic-error-text">{errors[entry.id].country}</span>}
            </div>

            <div className="masteracademic-group">
              <label className="masteracademic-label">Field of Study <span className="masteracademic-required">*</span></label>
              <input
                type="text"
                value={entry.fieldOfStudy || ''}
                onChange={(e) => handleEntryChange(entry.id, 'fieldOfStudy', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'fieldOfStudy')}
                placeholder="e.g., Computer Science, Business Administration"
                className={`masteracademic-input ${errors[entry.id]?.fieldOfStudy ? 'error' : ''}`}
              />
              {errors[entry.id]?.fieldOfStudy && <span className="masteracademic-error-text">{errors[entry.id].fieldOfStudy}</span>}
            </div>

            <div className="masteracademic-group">
              <label className="masteracademic-label">Start Date <span className="masteracademic-required">*</span></label>
              <input
                type="month"
                value={entry.startDate || ''}
                onChange={(e) => handleEntryChange(entry.id, 'startDate', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'startDate')}
                className={`masteracademic-input ${errors[entry.id]?.startDate ? 'error' : ''}`}
              />
              {errors[entry.id]?.startDate && <span className="masteracademic-error-text">{errors[entry.id].startDate}</span>}
            </div>

            <div className="masteracademic-group">
              <label className="masteracademic-label">End Date <span className="masteracademic-required">*</span></label>
              <input
                type="month"
                value={entry.endDate || ''}
                onChange={(e) => handleEntryChange(entry.id, 'endDate', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'endDate')}
                className={`masteracademic-input ${errors[entry.id]?.endDate ? 'error' : ''}`}
              />
              {errors[entry.id]?.endDate && <span className="masteracademic-error-text">{errors[entry.id].endDate}</span>}
            </div>

            <div className="masteracademic-group">
              <label className="masteracademic-label">GPA / Percentage (Optional)</label>
              <input
                type="text"
                value={entry.gpa || ''}
                onChange={(e) => handleEntryChange(entry.id, 'gpa', e.target.value)}
                onBlur={() => handleEntryBlur(entry.id, 'gpa')}
                placeholder="e.g., 3.5/4.0 or 85%"
                className={`masteracademic-input ${errors[entry.id]?.gpa ? 'error' : ''}`}
              />
              {errors[entry.id]?.gpa && <span className="masteracademic-error-text">{errors[entry.id].gpa}</span>}
            </div>

          </div>
        </div>
      ))}

      <button type="button" className="masteracademic-add-btn" onClick={addNewEntry}>
        + Add Another Qualification
      </button>
    </div>
  );
};

export default MasterAcademic;