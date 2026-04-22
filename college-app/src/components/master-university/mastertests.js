import React, { useState, useEffect, useRef, useCallback } from 'react';
import './mastertests.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

// ─── Test Definitions ────────────────────────────────────────────────────────

const TEST_CONFIGS = {
  // ── Undergraduate Admission ──
  sat: {
    key: 'sat',
    label: 'SAT',
    category: 'Undergraduate Admission',
    allowMultiple: true,
    fields: [
      { key: 'testDate',    label: 'Test Date',                    type: 'month',  required: true  },
      { key: 'total',       label: 'Total Score',                  type: 'number', required: true,  min: 400,  max: 1600, placeholder: 'e.g. 1450' },
      { key: 'math',        label: 'Math Score',                   type: 'number', required: true,  min: 200,  max: 800,  placeholder: 'e.g. 720'  },
      { key: 'ebrw',        label: 'Reading & Writing Score',      type: 'number', required: true,  min: 200,  max: 800,  placeholder: 'e.g. 730'  },
      { key: 'percentile',  label: 'Percentile',                   type: 'number', required: false, min: 1,    max: 99,   placeholder: 'e.g. 95'   },
    ],
    futureDates: true,
  },
  act: {
    key: 'act',
    label: 'ACT',
    category: 'Undergraduate Admission',
    allowMultiple: true,
    fields: [
      { key: 'testDate',    label: 'Test Date',          type: 'month',  required: true  },
      { key: 'composite',   label: 'Composite Score',    type: 'number', required: true,  min: 1,   max: 36,  placeholder: 'e.g. 32'  },
      { key: 'english',     label: 'English Score',      type: 'number', required: true,  min: 1,   max: 36,  placeholder: 'e.g. 33'  },
      { key: 'math',        label: 'Math Score',         type: 'number', required: true,  min: 1,   max: 36,  placeholder: 'e.g. 30'  },
      { key: 'reading',     label: 'Reading Score',      type: 'number', required: true,  min: 1,   max: 36,  placeholder: 'e.g. 34'  },
      { key: 'science',     label: 'Science Score',      type: 'number', required: true,  min: 1,   max: 36,  placeholder: 'e.g. 31'  },
      { key: 'writing',     label: 'Writing Score',      type: 'number', required: false, min: 2,   max: 12,  placeholder: 'e.g. 8'   },
      { key: 'percentile',  label: 'Percentile',         type: 'number', required: false, min: 1,   max: 99,  placeholder: 'e.g. 90'  },
    ],
    futureDates: true,
  },
  satSubject: {
    key: 'satSubject',
    label: 'SAT Subject Tests',
    category: 'Subject Tests',
    allowMultiple: true,
    fields: [
      { key: 'subject',     label: 'Subject',            type: 'text',   required: true,  placeholder: 'e.g. Math Level 2' },
      { key: 'score',       label: 'Score',              type: 'number', required: true,  min: 200, max: 800, placeholder: 'e.g. 780' },
      { key: 'testDate',    label: 'Test Date',          type: 'month',  required: true  },
    ],
    futureDates: false,
  },
  ap: {
    key: 'ap',
    label: 'AP Subject Tests',
    category: 'Subject Tests',
    allowMultiple: true,
    fields: [
      { key: 'subject',     label: 'Subject',            type: 'text',   required: true,  placeholder: 'e.g. Calculus BC'  },
      { key: 'score',       label: 'Score',              type: 'number', required: true,  min: 1,   max: 5,   placeholder: '1–5'       },
      { key: 'testDate',    label: 'Test Date (MM/YYYY)',type: 'month',  required: true  },
    ],
    futureDates: true,
  },
  ib: {
    key: 'ib',
    label: 'IB Subject Tests',
    category: 'Subject Tests',
    allowMultiple: true,
    fields: [
      { key: 'subject',     label: 'Subject',            type: 'text',   required: true,  placeholder: 'e.g. Mathematics AA'    },
      { key: 'level',       label: 'Level',              type: 'select', required: true,  options: ['SL', 'HL']                 },
      { key: 'score',       label: 'Score',              type: 'number', required: true,  min: 1,   max: 7,   placeholder: '1–7' },
      { key: 'year',        label: 'Year',               type: 'number', required: true,  min: 2000, max: 2035, placeholder: 'e.g. 2024' },
    ],
    futureDates: false,
  },
  cambridge: {
    key: 'cambridge',
    label: 'Cambridge Exams',
    category: 'Subject Tests',
    allowMultiple: true,
    fields: [
      { key: 'subject',     label: 'Subject',            type: 'text',   required: true,  placeholder: 'e.g. Further Mathematics'  },
      { key: 'level',       label: 'Level',              type: 'select', required: true,  options: ['AS', 'A', 'O']               },
      { key: 'grade',       label: 'Grade',              type: 'select', required: true,  options: ['A*', 'A', 'B', 'C', 'D', 'E', 'U'] },
      { key: 'testDate',    label: 'Date',               type: 'month',  required: true  },
    ],
    futureDates: false,
  },

  // ── English Proficiency ──
  toefl: {
    key: 'toefl',
    label: 'TOEFL iBT',
    category: 'English Proficiency',
    allowMultiple: false,
    fields: [
      { key: 'testDate',    label: 'Test Date',          type: 'month',  required: true  },
      { key: 'reading',     label: 'Reading Score',      type: 'number', required: true,  min: 0,   max: 30,  placeholder: '0–30'      },
      { key: 'listening',   label: 'Listening Score',    type: 'number', required: true,  min: 0,   max: 30,  placeholder: '0–30'      },
      { key: 'speaking',    label: 'Speaking Score',     type: 'number', required: true,  min: 0,   max: 30,  placeholder: '0–30'      },
      { key: 'writing',     label: 'Writing Score',      type: 'number', required: true,  min: 0,   max: 30,  placeholder: '0–30'      },
      { key: 'total',       label: 'Total Score',        type: 'number', required: true,  min: 0,   max: 120, placeholder: '0–120'     },
    ],
    futureDates: false,
  },
  ielts: {
    key: 'ielts',
    label: 'IELTS',
    category: 'English Proficiency',
    allowMultiple: false,
    fields: [
      { key: 'testDate',    label: 'Test Date',          type: 'month',  required: true  },
      { key: 'listening',   label: 'Listening Band',     type: 'number', required: true,  min: 0,   max: 9,   step: '0.5', placeholder: '0–9'    },
      { key: 'reading',     label: 'Reading Band',       type: 'number', required: true,  min: 0,   max: 9,   step: '0.5', placeholder: '0–9'    },
      { key: 'writing',     label: 'Writing Band',       type: 'number', required: true,  min: 0,   max: 9,   step: '0.5', placeholder: '0–9'    },
      { key: 'speaking',    label: 'Speaking Band',      type: 'number', required: true,  min: 0,   max: 9,   step: '0.5', placeholder: '0–9'    },
      { key: 'overall',     label: 'Overall Band Score', type: 'number', required: true,  min: 0,   max: 9,   step: '0.5', placeholder: '0–9'    },
    ],
    futureDates: false,
  },
  pte: {
    key: 'pte',
    label: 'PTE Academic',
    category: 'English Proficiency',
    allowMultiple: false,
    fields: [
      { key: 'testDate',      label: 'Test Date',            type: 'month',  required: true  },
      { key: 'listening',     label: 'Listening Score',      type: 'number', required: true,  min: 10,  max: 90,  placeholder: '10–90' },
      { key: 'reading',       label: 'Reading Score',        type: 'number', required: true,  min: 10,  max: 90,  placeholder: '10–90' },
      { key: 'speaking',      label: 'Speaking Score',       type: 'number', required: true,  min: 10,  max: 90,  placeholder: '10–90' },
      { key: 'writing',       label: 'Writing Score',        type: 'number', required: true,  min: 10,  max: 90,  placeholder: '10–90' },
      { key: 'overall',       label: 'Overall Score',        type: 'number', required: true,  min: 10,  max: 90,  placeholder: '10–90' },
      { key: 'grammar',       label: 'Grammar',              type: 'number', required: false, min: 10,  max: 90,  placeholder: 'Optional' },
      { key: 'vocabulary',    label: 'Vocabulary',           type: 'number', required: false, min: 10,  max: 90,  placeholder: 'Optional' },
      { key: 'oralFluency',   label: 'Oral Fluency',         type: 'number', required: false, min: 10,  max: 90,  placeholder: 'Optional' },
      { key: 'pronunciation', label: 'Pronunciation',        type: 'number', required: false, min: 10,  max: 90,  placeholder: 'Optional' },
      { key: 'spelling',      label: 'Spelling',             type: 'number', required: false, min: 10,  max: 90,  placeholder: 'Optional' },
    ],
    futureDates: false,
  },
  duolingo: {
    key: 'duolingo',
    label: 'Duolingo English Test',
    category: 'English Proficiency',
    allowMultiple: false,
    fields: [
      { key: 'testDate',        label: 'Test Date',             type: 'month',  required: true  },
      { key: 'overall',         label: 'Overall Score',         type: 'number', required: true,  min: 10,  max: 160, placeholder: '10–160' },
      { key: 'literacy',        label: 'Literacy Subscore',     type: 'number', required: true,  min: 10,  max: 160, placeholder: '10–160' },
      { key: 'comprehension',   label: 'Comprehension Subscore',type: 'number', required: true,  min: 10,  max: 160, placeholder: '10–160' },
      { key: 'conversation',    label: 'Conversation Subscore', type: 'number', required: true,  min: 10,  max: 160, placeholder: '10–160' },
      { key: 'production',      label: 'Production Subscore',   type: 'number', required: true,  min: 10,  max: 160, placeholder: '10–160' },
    ],
    futureDates: false,
  },

  // ── Graduate Admission ──
  gre: {
    key: 'gre',
    label: 'GRE',
    category: 'Graduate Admission',
    allowMultiple: false,
    fields: [
      { key: 'testDate',        label: 'Test Date',                          type: 'month',  required: true  },
      { key: 'verbal',          label: 'Verbal Reasoning Score',             type: 'number', required: true,  min: 130, max: 170, placeholder: '130–170' },
      { key: 'verbalPct',       label: 'Verbal Percentile',                  type: 'number', required: false, min: 1,   max: 99,  placeholder: 'e.g. 85' },
      { key: 'quant',           label: 'Quantitative Reasoning Score',       type: 'number', required: true,  min: 130, max: 170, placeholder: '130–170' },
      { key: 'quantPct',        label: 'Quantitative Percentile',            type: 'number', required: false, min: 1,   max: 99,  placeholder: 'e.g. 90' },
      { key: 'analyticalWrite', label: 'Analytical Writing Score',           type: 'number', required: true,  min: 0,   max: 6,   step: '0.5', placeholder: '0–6' },
      { key: 'total',           label: 'Total Score',                        type: 'number', required: true,  min: 260, max: 340, placeholder: '260–340' },
    ],
    futureDates: false,
  },
  gmat: {
    key: 'gmat',
    label: 'GMAT',
    category: 'Graduate Admission',
    allowMultiple: false,
    fields: [
      { key: 'testDate',        label: 'Test Date',                   type: 'month',  required: true  },
      { key: 'total',           label: 'Total Score',                 type: 'number', required: true,  min: 205, max: 805, placeholder: '205–805' },
      { key: 'verbal',          label: 'Verbal Reasoning',            type: 'number', required: true,  min: 60,  max: 90,  placeholder: '60–90'   },
      { key: 'quant',           label: 'Quantitative Reasoning',      type: 'number', required: true,  min: 60,  max: 90,  placeholder: '60–90'   },
      { key: 'dataInsights',    label: 'Data Insights',               type: 'number', required: true,  min: 60,  max: 90,  placeholder: '60–90'   },
      { key: 'awa',             label: 'Analytical Writing (Legacy)',  type: 'number', required: false, min: 0,   max: 6,   step: '0.5', placeholder: 'Legacy GMAT only' },
    ],
    futureDates: false,
  },
};

// Grouped for display
const TEST_CATEGORIES = [
  {
    label: 'Undergraduate Admission',
    tests: ['sat', 'act'],
  },
  {
    label: 'Subject Tests',
    tests: ['satSubject', 'ap', 'ib', 'cambridge'],
  },
  {
    label: 'English Proficiency',
    tests: ['toefl', 'ielts', 'pte', 'duolingo'],
  },
  {
    label: 'Graduate Admission',
    tests: ['gre', 'gmat'],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeEmptyAttempt = (testKey) => {
  const config = TEST_CONFIGS[testKey];
  const attempt = { _id: Date.now() + Math.random() };
  config.fields.forEach(f => { attempt[f.key] = ''; });
  return attempt;
};

const validateAttempt = (testKey, attempt) => {
  const config = TEST_CONFIGS[testKey];
  const errors = {};
  config.fields.forEach(field => {
    const val = attempt[field.key];
    if (field.required && (val === '' || val === undefined || val === null)) {
      errors[field.key] = `${field.label} is required`;
      return;
    }
    if (val !== '' && val !== undefined && val !== null && field.type === 'number') {
      const num = parseFloat(val);
      if (isNaN(num)) { errors[field.key] = 'Must be a number'; return; }
      if (field.min !== undefined && num < field.min) {
        errors[field.key] = `Min is ${field.min}`;
        return;
      }
      if (field.max !== undefined && num > field.max) {
        errors[field.key] = `Max is ${field.max}`;
        return;
      }
    }
  });
  return errors;
};

const isAttemptValid = (testKey, attempt) => {
  const errs = validateAttempt(testKey, attempt);
  return Object.keys(errs).length === 0;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FieldInput = ({ field, value, error, onChange }) => {
  if (field.type === 'select') {
    return (
      <select
        className={`mt-field-input mt-field-select ${error ? 'mt-field-input--error' : ''}`}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {field.options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'month') {
    return (
      <input
        type="month"
        className={`mt-field-input ${error ? 'mt-field-input--error' : ''}`}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      type={field.type === 'number' ? 'number' : 'text'}
      className={`mt-field-input ${error ? 'mt-field-input--error' : ''}`}
      value={value || ''}
      placeholder={field.placeholder || ''}
      step={field.step || (field.type === 'number' ? '1' : undefined)}
      min={field.min}
      max={field.max}
      onChange={e => onChange(e.target.value)}
    />
  );
};

const FutureDateEntry = ({ dates, onChange }) => {
  const addDate = () => onChange([...dates, '']);
  const removeDate = (i) => onChange(dates.filter((_, idx) => idx !== i));
  const updateDate = (i, val) => {
    const copy = [...dates];
    copy[i] = val;
    onChange(copy);
  };

  return (
    <div className="mt-future-dates">
      <p className="mt-future-dates__label">Future Test Dates <span className="mt-optional-tag">Optional</span></p>
      {dates.map((d, i) => (
        <div key={i} className="mt-future-dates__row">
          <input
            type="month"
            className="mt-field-input mt-field-input--future"
            value={d}
            onChange={e => updateDate(i, e.target.value)}
          />
          <button type="button" className="mt-future-dates__remove" onClick={() => removeDate(i)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}
      <button type="button" className="mt-future-dates__add" onClick={addDate}>
        + Add future date
      </button>
    </div>
  );
};

const AttemptCard = ({ testKey, attempt, attemptIndex, totalAttempts, errors, onFieldChange, onRemove, futureDates, futureDateValues, onFutureDatesChange }) => {
  const config = TEST_CONFIGS[testKey];
  const requiredFields = config.fields.filter(f => f.required);
  const optionalFields = config.fields.filter(f => !f.required);
  const [showOptional, setShowOptional] = useState(false);

  return (
    <div className="mt-attempt-card">
      {totalAttempts > 1 && (
        <div className="mt-attempt-card__header">
          <span className="mt-attempt-card__label">Attempt {attemptIndex + 1}</span>
          <button type="button" className="mt-attempt-card__remove" onClick={onRemove}>
            Remove
          </button>
        </div>
      )}
      <div className="mt-fields-grid">
        {requiredFields.map(field => (
          <div key={field.key} className="mt-field-group">
            <label className="mt-field-label">
              {field.label}
              <span className="mt-required-star"> *</span>
            </label>
            <FieldInput
              field={field}
              value={attempt[field.key]}
              error={errors[field.key]}
              onChange={val => onFieldChange(field.key, val)}
            />
            {errors[field.key] && (
              <span className="mt-field-error">{errors[field.key]}</span>
            )}
          </div>
        ))}
      </div>

      {optionalFields.length > 0 && (
        <div className="mt-optional-section">
          <button
            type="button"
            className="mt-optional-toggle"
            onClick={() => setShowOptional(p => !p)}
          >
            <span>{showOptional ? '▾' : '▸'}</span>
            {showOptional ? 'Hide optional fields' : `Show optional fields (${optionalFields.length})`}
          </button>
          {showOptional && (
            <div className="mt-fields-grid mt-fields-grid--optional">
              {optionalFields.map(field => (
                <div key={field.key} className="mt-field-group">
                  <label className="mt-field-label">
                    {field.label}
                    <span className="mt-optional-tag"> Optional</span>
                  </label>
                  <FieldInput
                    field={field}
                    value={attempt[field.key]}
                    error={errors[field.key]}
                    onChange={val => onFieldChange(field.key, val)}
                  />
                  {errors[field.key] && (
                    <span className="mt-field-error">{errors[field.key]}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {futureDates && attemptIndex === totalAttempts - 1 && (
        <FutureDateEntry dates={futureDateValues} onChange={onFutureDatesChange} />
      )}
    </div>
  );
};

const TestPanel = ({ testKey, testData, onChange, onRemove }) => {
  const config = TEST_CONFIGS[testKey];
  const attempts = testData.attempts || [makeEmptyAttempt(testKey)];
  const attemptErrors = testData.attemptErrors || [{}];
  const futureDates = testData.futureDates || [];

  const updateAttempt = (idx, fieldKey, val) => {
    const newAttempts = attempts.map((a, i) =>
      i === idx ? { ...a, [fieldKey]: val } : a
    );
    const newErrors = newAttempts.map((a, i) =>
      i === idx ? validateAttempt(testKey, a) : (attemptErrors[i] || {})
    );
    onChange({ ...testData, attempts: newAttempts, attemptErrors: newErrors });
  };

  const addAttempt = () => {
    const newAttempt = makeEmptyAttempt(testKey);
    onChange({
      ...testData,
      attempts: [...attempts, newAttempt],
      attemptErrors: [...attemptErrors, {}],
    });
  };

  const removeAttempt = (idx) => {
    if (attempts.length === 1) { onRemove(); return; }
    onChange({
      ...testData,
      attempts: attempts.filter((_, i) => i !== idx),
      attemptErrors: attemptErrors.filter((_, i) => i !== idx),
    });
  };

  const updateFutureDates = (dates) => {
    onChange({ ...testData, futureDates: dates });
  };

  return (
    <div className="mt-test-panel">
      <div className="mt-test-panel__header">
        <div className="mt-test-panel__title-row">
          <h3 className="mt-test-panel__title">{config.label}</h3>
          <button type="button" className="mt-test-panel__remove-test" onClick={onRemove}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Remove test
          </button>
        </div>
      </div>

      {attempts.map((attempt, idx) => (
        <AttemptCard
          key={attempt._id || idx}
          testKey={testKey}
          attempt={attempt}
          attemptIndex={idx}
          totalAttempts={attempts.length}
          errors={attemptErrors[idx] || {}}
          onFieldChange={(fKey, val) => updateAttempt(idx, fKey, val)}
          onRemove={() => removeAttempt(idx)}
          futureDates={config.futureDates}
          futureDateValues={futureDates}
          onFutureDatesChange={updateFutureDates}
        />
      ))}

      {config.allowMultiple && (
        <button type="button" className="mt-add-attempt-btn" onClick={addAttempt}>
          + Add another {config.label} attempt
        </button>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MasterTests = ({ data, updateData }) => {
  // activeTests: { [testKey]: { attempts, attemptErrors, futureDates } }
  const [activeTests, setActiveTests] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saved' | 'error' | ''

  const lastUpdatedRef = useRef(null);
  const lastSavedRef = useRef(null);
  const isSavingRef = useRef(false);
  const hasFetched = useRef(false);
  const debounceRef = useRef(null);
  const hasInteracted = useRef(false);   // ← prevents save firing on mount
  const isMounted = useRef(false);       // ← tracks first render

  const getToken = () => localStorage.getItem('token');

  // ─── Fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const controller = new AbortController();

    const fetchData = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/master-test`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const result = await res.json();

        // success: true but data is empty → new user, nothing to load
        if (!result?.success || !result?.data || Object.keys(result.data).length === 0) return;

        const loaded = {};
        Object.keys(result.data).forEach(testKey => {
          if (!TEST_CONFIGS[testKey]) return;
          const raw = result.data[testKey];
          // raw can be array of attempts or single object
          const attemptsRaw = Array.isArray(raw) ? raw : [raw];
          const attempts = attemptsRaw.map(a => ({ _id: Date.now() + Math.random(), ...a }));
          const attemptErrors = attempts.map(a => validateAttempt(testKey, a));
          loaded[testKey] = {
            attempts,
            attemptErrors,
            futureDates: result.data[`${testKey}_futureDates`] || [],
          };
        });
        if (Object.keys(loaded).length > 0) {
          setActiveTests(loaded);
          notifyParent(loaded);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching test data:', err);
      }
    };

    fetchData();
    return () => {
      controller.abort();
      hasFetched.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Build parent payload ────────────────────────────────────────
  const notifyParent = useCallback((tests) => {
    const allValid = Object.entries(tests).every(([testKey, testData]) =>
      (testData.attempts || []).every(a => isAttemptValid(testKey, a))
    );
    const payload = { _isValid: allValid };
    Object.entries(tests).forEach(([testKey, testData]) => {
      payload[testKey] = testData.attempts;
      if ((testData.futureDates || []).length > 0) {
        payload[`${testKey}_futureDates`] = testData.futureDates;
      }
    });
    const next = JSON.stringify(payload);
    if (lastUpdatedRef.current === next) return;
    lastUpdatedRef.current = next;
    updateData(payload);
  }, [updateData]);

  // ─── Save to backend ─────────────────────────────────────────────
  const saveToBackend = useCallback(async (tests) => {
    if (isSavingRef.current) return;

    const payload = {};
    Object.entries(tests).forEach(([testKey, testData]) => {
      payload[testKey] = testData.attempts;
      if ((testData.futureDates || []).length > 0) {
        payload[`${testKey}_futureDates`] = testData.futureDates;
      }
    });

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
    } catch {
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, []);

  // ─── Watch activeTests → notify parent + debounced save ──────────
  useEffect(() => {
    // Skip the very first render — state is still empty at this point.
    // The fetch useEffect handles notifyParent for pre-saved data.
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    notifyParent(activeTests);

    // Only save to backend if the user has actually interacted
    // (selected a test chip or edited a field). Prevents a spurious
    // POST on page load when activeTests is still {}.
    if (!hasInteracted.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const allValid = Object.entries(activeTests).every(([testKey, testData]) =>
        (testData.attempts || []).every(a => isAttemptValid(testKey, a))
      );
      if (allValid && Object.keys(activeTests).length > 0) {
        saveToBackend(activeTests);
      }
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [activeTests, notifyParent, saveToBackend]);

  // ─── Toggle test selection ────────────────────────────────────────
  const toggleTest = useCallback((testKey) => {
    hasInteracted.current = true;   // user made a change — allow saving
    setActiveTests(prev => {
      if (prev[testKey]) {
        const copy = { ...prev };
        delete copy[testKey];
        return copy;
      }
      return {
        ...prev,
        [testKey]: {
          attempts: [makeEmptyAttempt(testKey)],
          attemptErrors: [{}],
          futureDates: [],
        },
      };
    });
  }, []);

  const updateTestData = useCallback((testKey, testData) => {
    hasInteracted.current = true;   // user edited a field — allow saving
    setActiveTests(prev => ({ ...prev, [testKey]: testData }));
  }, []);

  const removeTest = useCallback((testKey) => {
    hasInteracted.current = true;
    setActiveTests(prev => {
      const copy = { ...prev };
      delete copy[testKey];
      return copy;
    });
  }, []);

  const clearAll = useCallback(() => {
    hasInteracted.current = true;
    setActiveTests({});
  }, []);

  const activeTestKeys = Object.keys(activeTests);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="master-tests-form">

      {/* Header */}
      <div className="master-tests-header">
        <h2 className="master-tests-title">Test Scores</h2>
        <p className="master-tests-subtitle">
          Select the tests you wish to report and enter your detailed scores.
          Include tests you have already taken as well as tests you plan to take.
        </p>
        {(isSaving || saveStatus) && (
          <div className={`master-tests-save-status ${saveStatus === 'error' ? 'error' : 'success'}`}>
            {isSaving && 'Saving…'}
            {!isSaving && saveStatus === 'saved'  && '✓ Saved successfully'}
            {!isSaving && saveStatus === 'error'  && '✕ Save failed — please try again'}
          </div>
        )}
      </div>

      {/* Test Selector — grouped by category */}
      <div className="master-tests-selector-section">
        <p className="master-tests-selector-label">
          Select tests to report{' '}
          <span className="master-tests-optional">(Optional — select all that apply)</span>
        </p>

        {TEST_CATEGORIES.map(cat => (
          <div key={cat.label} className="mt-category-group">
            <p className="mt-category-label">{cat.label}</p>
            <div className="master-tests-checkboxes">
              {cat.tests.map(testKey => {
                const config = TEST_CONFIGS[testKey];
                const isChecked = !!activeTests[testKey];
                return (
                  <button
                    key={testKey}
                    type="button"
                    className={`master-tests-chip ${isChecked ? 'master-tests-chip--selected' : ''}`}
                    onClick={() => toggleTest(testKey)}
                  >
                    <span className={`master-tests-chip-check ${isChecked ? 'master-tests-chip-check--on' : ''}`}>
                      {isChecked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {activeTestKeys.length > 0 && (
          <button type="button" className="master-tests-clear" onClick={clearAll}>
            Clear all selections
          </button>
        )}
      </div>

      {/* Test Panels */}
      {activeTestKeys.length > 0 && (
        <div className="mt-panels-section">
          {activeTestKeys.map(testKey => (
            <TestPanel
              key={testKey}
              testKey={testKey}
              testData={activeTests[testKey]}
              onChange={(data) => updateTestData(testKey, data)}
              onRemove={() => removeTest(testKey)}
            />
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="master-tests-note">
        <i className="fas fa-info-circle"></i>
        <span>
          All test scores are optional. Required fields (*) within a selected test must be completed.
          Optional sub-scores can be revealed using the "Show optional fields" toggle on each test.
        </span>
      </div>
    </div>
  );
};

export default MasterTests;