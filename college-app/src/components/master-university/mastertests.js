import React, { useState, useEffect, useRef, useCallback } from 'react';
import './mastertests.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const ALL_TESTS = [
  { key: 'ielts',     label: 'IELTS',                 range: '0–9',      min: 0,   max: 9,    step: '0.5', placeholder: 'e.g., 7.5'  },
  { key: 'toefl',     label: 'TOEFL iBT',             range: '0–120',    min: 0,   max: 120,  step: '1',   placeholder: 'e.g., 100'  },
  { key: 'pte',       label: 'PTE Academic',           range: '10–90',    min: 10,  max: 90,   step: '1',   placeholder: 'e.g., 65'   },
  { key: 'gre',       label: 'GRE',                   range: '260–340',  min: 260, max: 340,  step: '1',   placeholder: 'e.g., 320'  },
  { key: 'gmat',      label: 'GMAT',                  range: '200–800',  min: 200, max: 800,  step: '1',   placeholder: 'e.g., 650'  },
  { key: 'sat',       label: 'SAT',                   range: '400–1600', min: 400, max: 1600, step: '1',   placeholder: 'e.g., 1200' },
  { key: 'act',       label: 'ACT',                   range: '1–36',     min: 1,   max: 36,   step: '1',   placeholder: 'e.g., 28'   },
  { key: 'duolingo',  label: 'Duolingo English Test',  range: '10–160',   min: 10,  max: 160,  step: '1',   placeholder: 'e.g., 120'  },
];

const MasterTests = ({ data, updateData }) => {
  const [selectedTests, setSelectedTests] = useState([]);
  const [scores, setScores] = useState({});
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saved' | 'error' | ''

  const lastUpdatedRef = useRef(null);
  const lastSavedRef = useRef(null);
  const isSavingRef = useRef(false);
  const hasFetched = useRef(false);
  const debounceRef = useRef(null);

  // ─── Token helper ─────────────────────────────────────────────
  const getToken = () => localStorage.getItem('token');

  // ─── Validate a score field ───────────────────────────────────
  const validateField = useCallback((key, value) => {
    if (value === '' || value === undefined || value === null) return '';
    const num = parseFloat(value);
    const test = ALL_TESTS.find(t => t.key === key);
    if (!test) return '';
    if (isNaN(num) || num < test.min || num > test.max) {
      return `${test.label} score must be between ${test.range}`;
    }
    return '';
  }, []);

  // ─── Fetch saved test scores on mount ────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    const fetchTestData = async () => {
      const token = getToken();
      if (!token) return;

      try {
        console.log('Fetching test scores...');

        const res = await fetch(`${API_URL}/api/master-test`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        if (res.status === 404) {
          console.log('No test data found (first time user)');
          return;
        }

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const result = await res.json();
        console.log('Test data fetched:', result);

        if (result?.success && result?.data) {
          // Pick only fields that exist in ALL_TESTS and have a value
          const loadedScores = {};
          const preSelected = [];

          ALL_TESTS.forEach(t => {
            const val = result.data[t.key];
            if (val !== undefined && val !== null && val !== '') {
              loadedScores[t.key] = String(val); // keep as string for input value
              preSelected.push(t.key);
            }
          });

          if (preSelected.length === 0) return; // nothing saved yet

          // Build parent payload
          const isValid = preSelected.every(k => !validateField(k, loadedScores[k]));
          const payload = { _isValid: isValid };
          preSelected.forEach(k => { payload[k] = loadedScores[k]; });

          // Pre-seed ref so the notify-parent useEffect skips this as already-sent
          lastUpdatedRef.current = JSON.stringify(payload);
          lastSavedRef.current = { ...loadedScores };

          setSelectedTests(preSelected);
          setScores(loadedScores);
          updateData(payload); // notify parent directly
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching test data:', err);
      }
    };

    fetchTestData();

    return () => {
      controller.abort();
      hasFetched.current = false; // reset so navigating back re-fetches
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Save to backend ──────────────────────────────────────────
  const saveToBackend = useCallback(async (currentScores, currentSelected) => {
    if (isSavingRef.current) return;

    // Build payload of only selected tests with scores
    const payload = {};
    currentSelected.forEach(k => {
      if (currentScores[k] !== undefined && currentScores[k] !== '') {
        payload[k] = currentScores[k];
      }
    });

    // Skip if nothing changed since last save
    if (JSON.stringify(lastSavedRef.current) === JSON.stringify(payload)) return;

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveStatus('');

    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/api/master-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload) // backend filters by allowedFields
      });

      const result = await res.json();

      if (result.success) {
        console.log('Test scores saved:', result.data);
        lastSavedRef.current = payload;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        console.error('Save failed:', result.message);
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('API Error:', err);
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, []);

  // ─── Toggle test selection ────────────────────────────────────
  const toggleTest = useCallback((key) => {
    setSelectedTests(prev => {
      if (prev.includes(key)) {
        setScores(s => { const c = { ...s }; delete c[key]; return c; });
        setErrors(e => { const c = { ...e }; delete c[key]; return c; });
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  }, []);

  // ─── Clear all ────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    setSelectedTests([]);
    setScores({});
    setErrors({});
  }, []);

  // ─── Score change ─────────────────────────────────────────────
  const handleScoreChange = useCallback((key, value) => {
    setScores(prev => ({ ...prev, [key]: value }));
    const error = validateField(key, value);
    setErrors(prev => ({ ...prev, [key]: error }));
  }, [validateField]);

  // ─── Notify parent + debounced save on any change ─────────────
  useEffect(() => {
    const hasErrors = Object.values(errors).some(e => e);
    const allScoresFilled = selectedTests.every(
      key => scores[key] !== undefined && scores[key] !== ''
    );
    const isValid = !hasErrors && (selectedTests.length === 0 || allScoresFilled);

    const payload = { _isValid: isValid };
    selectedTests.forEach(key => { payload[key] = scores[key] || ''; });

    const nextUpdate = JSON.stringify(payload);
    if (lastUpdatedRef.current === nextUpdate) return; // no change
    lastUpdatedRef.current = nextUpdate;

    updateData(payload);

    // Debounced backend save — only when all selected scores are valid & filled
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isValid && selectedTests.length > 0) {
        saveToBackend(scores, selectedTests);
      } else if (selectedTests.length === 0) {
        // User cleared everything — send empty to backend to clear record
        saveToBackend({}, []);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedTests, scores, errors, updateData, saveToBackend]);

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="master-tests-form">
      <div className="master-tests-header">
        <h2 className="master-tests-title">Test Scores</h2>
        <p className="master-tests-subtitle">
          Indicate all tests you wish to report. Be sure to include tests you expect
          to take in addition to tests you have already taken.
        </p>

        {/* Save status */}
        {(isSaving || saveStatus) && (
          <div className={`master-tests-save-status ${saveStatus === 'error' ? 'error' : 'success'}`}>
            {isSaving && 'Saving…'}
            {!isSaving && saveStatus === 'saved' && '✓ Saved successfully'}
            {!isSaving && saveStatus === 'error' && '✕ Save failed — please try again'}
          </div>
        )}
      </div>

      {/* ── Test selector chips ── */}
      <div className="master-tests-selector-section">
        <p className="master-tests-selector-label">
          Select tests to report{' '}
          <span className="master-tests-optional">(Optional — select all that apply)</span>
        </p>

        <div className="master-tests-checkboxes">
          {ALL_TESTS.map(test => {
            const isChecked = selectedTests.includes(test.key);
            return (
              <button
                key={test.key}
                type="button"
                className={`master-tests-chip ${isChecked ? 'master-tests-chip--selected' : ''}`}
                onClick={() => toggleTest(test.key)}
              >
                <span className={`master-tests-chip-check ${isChecked ? 'master-tests-chip-check--on' : ''}`}>
                  {isChecked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {test.label}
              </button>
            );
          })}
        </div>

        {selectedTests.length > 0 && (
          <button type="button" className="master-tests-clear" onClick={clearAll}>
            Clear all selections
          </button>
        )}
      </div>

      {/* ── Score inputs for selected tests ── */}
      {selectedTests.length > 0 && (
        <div className="master-tests-scores-section">
          <p className="master-tests-scores-label">Enter your scores</p>
          <div className="master-tests-grid">
            {selectedTests.map(key => {
              const test = ALL_TESTS.find(t => t.key === key);
              if (!test) return null;
              return (
                <div key={key} className="master-tests-group">
                  <label className="master-tests-label">
                    {test.label} Score <span className="master-tests-required">*</span>
                  </label>
                  <input
                    type="number"
                    value={scores[key] || ''}
                    onChange={(e) => handleScoreChange(key, e.target.value)}
                    placeholder={test.placeholder}
                    step={test.step}
                    min={test.min}
                    max={test.max}
                    className={`master-tests-input ${errors[key] ? 'master-tests-error' : ''}`}
                  />
                  {errors[key]
                    ? <span className="master-tests-error-text">{errors[key]}</span>
                    : <span className="master-tests-hint">Score range: {test.range}</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Info note ── */}
      <div className="master-tests-note">
        <i className="fas fa-info-circle"></i>
        <span>All test scores are optional. Please enter only if you have taken or plan to take the test.</span>
      </div>
    </div>
  );
};

export default MasterTests;