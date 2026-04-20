import React, { useState, useEffect, useRef, useCallback } from 'react';
import './mastertests.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

// ─── Test definitions ─────────────────────────────────────────────────────────
const ALL_TESTS = [
  { key: 'ielts',    label: 'IELTS',                range: '0–9',      min: 0,   max: 9,    step: '0.5', placeholder: 'e.g., 7.5'  },
  { key: 'toefl',    label: 'TOEFL iBT',            range: '0–120',    min: 0,   max: 120,  step: '1',   placeholder: 'e.g., 100'  },
  { key: 'pte',      label: 'PTE Academic',          range: '10–90',    min: 10,  max: 90,   step: '1',   placeholder: 'e.g., 65'   },
  { key: 'gre',      label: 'GRE',                  range: '260–340',  min: 260, max: 340,  step: '1',   placeholder: 'e.g., 320'  },
  { key: 'gmat',     label: 'GMAT',                 range: '200–800',  min: 200, max: 800,  step: '1',   placeholder: 'e.g., 650'  },
  { key: 'sat',      label: 'SAT',                  range: '400–1600', min: 400, max: 1600, step: '1',   placeholder: 'e.g., 1200' },
  { key: 'act',      label: 'ACT',                  range: '1–36',     min: 1,   max: 36,   step: '1',   placeholder: 'e.g., 28'   },
  { key: 'duolingo', label: 'Duolingo English Test', range: '10–160',   min: 10,  max: 160,  step: '1',   placeholder: 'e.g., 120'  },
];

// ─── Education level definitions ──────────────────────────────────────────────
const SCHOOL_GRADES = [
  { key: 'grade9',  label: '9th Grade',  gradeSystem: 'out of 100' },
  { key: 'grade10', label: '10th Grade', gradeSystem: 'out of 100' },
  { key: 'grade11', label: '11th Grade', gradeSystem: 'out of 100' },
  { key: 'grade12', label: '12th Grade', gradeSystem: 'out of 100' },
];

const DEGREE_OPTIONS = [
  {
    key: 'btech',
    label: 'B.Tech',
    branches: [
      'Computer Science Engineering (CSE)',
      'Electronics & Communication Engineering (ECE)',
      'Electrical Engineering (EE)',
      'Mechanical Engineering (ME)',
      'Civil Engineering (CE)',
      'Information Technology (IT)',
      'Chemical Engineering',
      'Aerospace Engineering',
      'Biotechnology Engineering',
      'Automobile Engineering',
      'Industrial Engineering',
      'Environmental Engineering',
      'Mining Engineering',
      'Petroleum Engineering',
      'Agricultural Engineering',
    ],
  },
  {
    key: 'be',
    label: 'B.E.',
    branches: [
      'Computer Science Engineering (CSE)',
      'Electronics & Communication Engineering (ECE)',
      'Electrical Engineering (EE)',
      'Mechanical Engineering (ME)',
      'Civil Engineering (CE)',
      'Information Technology (IT)',
      'Chemical Engineering',
      'Aerospace Engineering',
      'Industrial Engineering',
    ],
  },
  {
    key: 'bsc',
    label: 'B.Sc.',
    branches: [
      'Physics',
      'Chemistry',
      'Mathematics',
      'Biology',
      'Computer Science',
      'Statistics',
      'Biotechnology',
      'Microbiology',
      'Environmental Science',
      'Electronics',
    ],
  },
  {
    key: 'bcom',
    label: 'B.Com',
    branches: [
      'General',
      'Accounting & Finance',
      'Banking & Insurance',
      'Computer Applications',
      'Economics',
      'Taxation',
    ],
  },
  {
    key: 'ba',
    label: 'B.A.',
    branches: [
      'English Literature',
      'Economics',
      'Political Science',
      'History',
      'Psychology',
      'Sociology',
      'Geography',
      'Philosophy',
      'Hindi Literature',
    ],
  },
  {
    key: 'mbbs',
    label: 'MBBS',
    branches: ['General Medicine'],
  },
  {
    key: 'bpharm',
    label: 'B.Pharm',
    branches: ['Pharmacy'],
  },
  {
    key: 'mtech',
    label: 'M.Tech',
    branches: [
      'Computer Science Engineering (CSE)',
      'VLSI Design',
      'Power Systems',
      'Structural Engineering',
      'Machine Design',
      'Software Engineering',
      'Embedded Systems',
      'Data Science & AI',
      'Robotics & Automation',
    ],
  },
  {
    key: 'mba',
    label: 'MBA',
    branches: [
      'Finance',
      'Marketing',
      'Human Resources',
      'Operations Management',
      'Information Technology',
      'Business Analytics',
      'International Business',
    ],
  },
  {
    key: 'msc',
    label: 'M.Sc.',
    branches: [
      'Physics',
      'Chemistry',
      'Mathematics',
      'Biology',
      'Computer Science',
      'Data Science',
      'Biotechnology',
      'Environmental Science',
    ],
  },
  {
    key: 'phd',
    label: 'Ph.D.',
    branches: [
      'Engineering',
      'Science',
      'Humanities',
      'Commerce',
      'Medicine',
      'Law',
      'Agriculture',
    ],
  },
];

// ─── GPA helper ───────────────────────────────────────────────────────────────
const GPA_SYSTEMS = [
  { label: 'Percentage (%)', value: 'percentage', max: 100 },
  { label: '4.0 Scale',      value: '4.0',        max: 4 },
  { label: '10.0 Scale',     value: '10.0',        max: 10 },
  { label: 'CGPA / GPA',     value: 'cgpa',        max: 10 },
];

// ─── Component ────────────────────────────────────────────────────────────────
const MasterTests = ({ data, updateData }) => {
  // Education state
  const [educationMode, setEducationMode] = useState('');
  const [selectedGrades, setSelectedGrades] = useState({});
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [degreeGpa, setDegreeGpa] = useState('');
  const [degreeGpaSystem, setDegreeGpaSystem] = useState('percentage');
  const [degreeYear, setDegreeYear] = useState('');

  // Test state
  const [selectedTests, setSelectedTests] = useState([]);
  const [scores, setScores] = useState({});
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const lastUpdatedRef = useRef(null);
  const lastSavedRef   = useRef(null);
  const isSavingRef    = useRef(false);
  const hasFetched     = useRef(false);
  const debounceRef    = useRef(null);

  const getToken = () => localStorage.getItem('token');

  // Validate score field
  const validateField = useCallback((key, value) => {
    if (value === '' || value === undefined || value === null) return '';
    const num = parseFloat(value);
    const test = ALL_TESTS.find(t => t.key === key);
    if (!test) return '';
    if (isNaN(num) || num < test.min || num > test.max)
      return `${test.label} score must be between ${test.range}`;
    return '';
  }, []);

  // Fetch saved data on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const controller = new AbortController();

    const fetchTestData = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/master-test`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        if (res.status === 404) return;
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const result = await res.json();
        if (result?.success && result?.data) {
          const d = result.data;

          if (d.educationMode) setEducationMode(d.educationMode);
          if (d.selectedGrades) setSelectedGrades(d.selectedGrades);
          if (d.selectedDegree) setSelectedDegree(d.selectedDegree);
          if (d.selectedBranch) setSelectedBranch(d.selectedBranch);
          if (d.degreeGpa)      setDegreeGpa(d.degreeGpa);
          if (d.degreeGpaSystem)setDegreeGpaSystem(d.degreeGpaSystem);
          if (d.degreeYear)     setDegreeYear(d.degreeYear);

          const loadedScores = {};
          const preSelected  = [];
          ALL_TESTS.forEach(t => {
            const val = d[t.key];
            if (val !== undefined && val !== null && val !== '') {
              loadedScores[t.key] = String(val);
              preSelected.push(t.key);
            }
          });

          if (preSelected.length > 0) {
            const isValid  = preSelected.every(k => !validateField(k, loadedScores[k]));
            const payload  = { _isValid: isValid };
            preSelected.forEach(k => { payload[k] = loadedScores[k]; });
            lastUpdatedRef.current = JSON.stringify(payload);
            lastSavedRef.current   = { ...loadedScores };
            setSelectedTests(preSelected);
            setScores(loadedScores);
            updateData(payload);
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching test data:', err);
      }
    };

    fetchTestData();
    return () => { controller.abort(); hasFetched.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to backend
  const saveToBackend = useCallback(async (currentScores, currentSelected) => {
    if (isSavingRef.current) return;

    const payload = {};
    currentSelected.forEach(k => {
      if (currentScores[k] !== undefined && currentScores[k] !== '')
        payload[k] = currentScores[k];
    });

    payload.educationMode  = educationMode;
    payload.selectedGrades = selectedGrades;
    payload.selectedDegree = selectedDegree;
    payload.selectedBranch = selectedBranch;
    payload.degreeGpa      = degreeGpa;
    payload.degreeGpaSystem= degreeGpaSystem;
    payload.degreeYear     = degreeYear;

    if (JSON.stringify(lastSavedRef.current) === JSON.stringify(payload)) return;

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveStatus('');
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/master-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        lastSavedRef.current = payload;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('API Error:', err);
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [educationMode, selectedGrades, selectedDegree, selectedBranch, degreeGpa, degreeGpaSystem, degreeYear]);

  // Toggle test chip
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

  const clearAll = useCallback(() => {
    setSelectedTests([]);
    setScores({});
    setErrors({});
  }, []);

  const handleScoreChange = useCallback((key, value) => {
    setScores(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: validateField(key, value) }));
  }, [validateField]);

  // Grade helpers
  const toggleGrade = (gradeKey) => {
    setSelectedGrades(prev => {
      if (prev[gradeKey]) {
        const updated = { ...prev };
        delete updated[gradeKey];
        return updated;
      }
      return { ...prev, [gradeKey]: { gpa: '', system: 'percentage' } };
    });
  };

  const updateGradeGpa = (gradeKey, value) => {
    setSelectedGrades(prev => ({
      ...prev,
      [gradeKey]: { ...prev[gradeKey], gpa: value },
    }));
  };

  const updateGradeSystem = (gradeKey, value) => {
    setSelectedGrades(prev => ({
      ...prev,
      [gradeKey]: { ...prev[gradeKey], system: value, gpa: '' },
    }));
  };

  // Notify parent + debounced save
  useEffect(() => {
    const hasErrors     = Object.values(errors).some(e => e);
    const allFilled     = selectedTests.every(k => scores[k] !== undefined && scores[k] !== '');
    const isValid       = !hasErrors && (selectedTests.length === 0 || allFilled);
    const payload       = { _isValid: isValid };
    selectedTests.forEach(k => { payload[k] = scores[k] || ''; });

    const nextUpdate = JSON.stringify(payload);
    if (lastUpdatedRef.current === nextUpdate) return;
    lastUpdatedRef.current = nextUpdate;
    updateData(payload);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isValid && selectedTests.length > 0) saveToBackend(scores, selectedTests);
      else if (selectedTests.length === 0)     saveToBackend({}, []);
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [selectedTests, scores, errors, updateData, saveToBackend]);

  // Also debounce-save when education fields change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveToBackend(scores, selectedTests);
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [educationMode, selectedGrades, selectedDegree, selectedBranch, degreeGpa, degreeGpaSystem, degreeYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived
  const currentDegree = DEGREE_OPTIONS.find(d => d.key === selectedDegree);

  // Render
  return (
    <div className="master-tests-form">

      {/* Header */}
      <div className="master-tests-header">
        <h2 className="master-tests-title">Academic Background & Test Scores</h2>
        <p className="master-tests-subtitle">
          Share your educational background and any standardised test scores you wish to report.
        </p>
        {(isSaving || saveStatus) && (
          <div className={`master-tests-save-status ${saveStatus === 'error' ? 'error' : 'success'}`}>
            {isSaving && 'Saving…'}
            {!isSaving && saveStatus === 'saved'  && 'Saved successfully'}
            {!isSaving && saveStatus === 'error'  && 'Save failed — please try again'}
          </div>
        )}
      </div>

      {/* SECTION 1 — EDUCATION LEVEL */}
      <div className="master-tests-section">
        <p className="master-tests-section-title">Education Level</p>
        <p className="master-tests-selector-label">
          What is your current / highest education level?{' '}
          <span className="master-tests-optional">(Select one)</span>
        </p>

        <div className="master-tests-edu-mode-row">
          <button
            type="button"
            className={`master-tests-edu-mode-btn ${educationMode === 'school' ? 'active' : ''}`}
            onClick={() => { setEducationMode(educationMode === 'school' ? '' : 'school'); setSelectedDegree(''); setSelectedBranch(''); }}
          >
            School (9th – 12th)
          </button>
          <button
            type="button"
            className={`master-tests-edu-mode-btn ${educationMode === 'degree' ? 'active' : ''}`}
            onClick={() => { setEducationMode(educationMode === 'degree' ? '' : 'degree'); setSelectedGrades({}); }}
          >
            Degree / Diploma
          </button>
        </div>

        {/* School grades */}
        {educationMode === 'school' && (
          <div className="master-tests-school-section">
            <p className="master-tests-scores-label" style={{ marginTop: 16 }}>
              Select the grades you want to report
            </p>
            <div className="master-tests-checkboxes" style={{ marginBottom: 16 }}>
              {SCHOOL_GRADES.map(grade => {
                const isChecked = !!selectedGrades[grade.key];
                return (
                  <button
                    key={grade.key}
                    type="button"
                    className={`master-tests-chip ${isChecked ? 'master-tests-chip--selected' : ''}`}
                    onClick={() => toggleGrade(grade.key)}
                  >
                    <span className={`master-tests-chip-check ${isChecked ? 'master-tests-chip-check--on' : ''}`}>
                      {isChecked && (
                        <span className="master-tests-chip-check-mark">✓</span>
                      )}
                    </span>
                    {grade.label}
                  </button>
                );
              })}
            </div>

            {Object.keys(selectedGrades).length > 0 && (
              <div className="master-tests-grid">
                {SCHOOL_GRADES.filter(g => selectedGrades[g.key]).map(grade => {
                  const gradeData = selectedGrades[grade.key];
                  const system    = GPA_SYSTEMS.find(s => s.value === gradeData.system) || GPA_SYSTEMS[0];
                  return (
                    <div key={grade.key} className="master-tests-grade-card">
                      <div className="master-tests-grade-card-header">
                        <span className="master-tests-grade-badge">{grade.label}</span>
                        <button
                          type="button"
                          className="master-tests-remove-btn"
                          onClick={() => toggleGrade(grade.key)}
                          title="Remove grade"
                        >×</button>
                      </div>
                      <label className="master-tests-label" style={{ marginBottom: 4 }}>Grading System</label>
                      <select
                        value={gradeData.system}
                        onChange={e => updateGradeSystem(grade.key, e.target.value)}
                        className="master-tests-input master-tests-select"
                      >
                        {GPA_SYSTEMS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <label className="master-tests-label" style={{ marginTop: 10, marginBottom: 4 }}>
                        Score / Grade <span className="master-tests-required">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={system.max}
                        step={gradeData.system === '4.0' ? '0.01' : '0.1'}
                        placeholder={`Out of ${system.max}`}
                        value={gradeData.gpa}
                        onChange={e => updateGradeGpa(grade.key, e.target.value)}
                        className="master-tests-input"
                      />
                      <span className="master-tests-hint">Max: {system.max}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Degree */}
        {educationMode === 'degree' && (
          <div className="master-tests-degree-section">
            <p className="master-tests-scores-label" style={{ marginTop: 16 }}>
              Select your degree program
            </p>
            <div className="master-tests-checkboxes" style={{ marginBottom: 16 }}>
              {DEGREE_OPTIONS.map(deg => {
                const isSelected = selectedDegree === deg.key;
                return (
                  <button
                    key={deg.key}
                    type="button"
                    className={`master-tests-chip ${isSelected ? 'master-tests-chip--selected' : ''}`}
                    onClick={() => {
                      setSelectedDegree(isSelected ? '' : deg.key);
                      setSelectedBranch('');
                    }}
                  >
                    <span className={`master-tests-chip-check ${isSelected ? 'master-tests-chip-check--on' : ''}`}>
                      {isSelected && (
                        <span className="master-tests-chip-check-mark">✓</span>
                      )}
                    </span>
                    {deg.label}
                  </button>
                );
              })}
            </div>

            {/* Branch selector */}
            {currentDegree && currentDegree.branches.length > 1 && (
              <div className="master-tests-branch-section">
                <label className="master-tests-label">
                  Branch / Specialisation <span className="master-tests-required">*</span>
                </label>
                <div className="master-tests-branch-grid">
                  {currentDegree.branches.map(branch => (
                    <button
                      key={branch}
                      type="button"
                      className={`master-tests-branch-btn ${selectedBranch === branch ? 'master-tests-branch-btn--selected' : ''}`}
                      onClick={() => setSelectedBranch(selectedBranch === branch ? '' : branch)}
                    >
                      {branch}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Degree GPA & Year */}
            {selectedDegree && (
              <div className="master-tests-grid" style={{ marginTop: 20 }}>
                <div className="master-tests-group">
                  <label className="master-tests-label">Grading System</label>
                  <select
                    value={degreeGpaSystem}
                    onChange={e => { setDegreeGpaSystem(e.target.value); setDegreeGpa(''); }}
                    className="master-tests-input master-tests-select"
                  >
                    {GPA_SYSTEMS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="master-tests-group">
                  <label className="master-tests-label">
                    GPA / Score <span className="master-tests-required">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={GPA_SYSTEMS.find(s => s.value === degreeGpaSystem)?.max || 100}
                    step="0.01"
                    placeholder={`Out of ${GPA_SYSTEMS.find(s => s.value === degreeGpaSystem)?.max || 100}`}
                    value={degreeGpa}
                    onChange={e => setDegreeGpa(e.target.value)}
                    className="master-tests-input"
                  />
                  <span className="master-tests-hint">
                    Max: {GPA_SYSTEMS.find(s => s.value === degreeGpaSystem)?.max || 100}
                  </span>
                </div>
                <div className="master-tests-group">
                  <label className="master-tests-label">Year of Completion / Expected Year</label>
                  <input
                    type="number"
                    min="1990"
                    max="2035"
                    placeholder="e.g., 2025"
                    value={degreeYear}
                    onChange={e => setDegreeYear(e.target.value)}
                    className="master-tests-input"
                  />
                  <span className="master-tests-hint">Enter the year you completed or expect to complete</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2 — STANDARDISED TESTS */}
      <div className="master-tests-section">
        <p className="master-tests-section-title">Standardised Test Scores</p>

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
                      <span className="master-tests-chip-check-mark">✓</span>
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
                      onChange={e => handleScoreChange(key, e.target.value)}
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
      </div>

      {/* Info note */}
      <div className="master-tests-note">
        <span>All test scores are optional. Enter only if you have taken or plan to take the test.</span>
      </div>
    </div>
  );
};

export default MasterTests;