import React, { useState, useEffect, useRef, useCallback } from 'react';
import './mastercourse.css';
import API_BASE_URL from '../../config/api';



// ─── Reusable Custom Dropdown ─────────────────────────────────────────────────
const CustomDropdown = ({
  name,
  value,
  onChange,
  onBlur,
  options,
  placeholder = 'Select',
  disabled = false,
  hasError = false
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = (optVal) => {
    onChange({ target: { name, value: optVal } });
    setOpen(false);
    if (onBlur) onBlur({ target: { name, value: optVal } });
  };

  const selectedLabel = options.find(o =>
    (typeof o === 'string' ? o : o.value) === value
  );
  const displayLabel = selectedLabel
    ? (typeof selectedLabel === 'string' ? selectedLabel : selectedLabel.label)
    : null;

  return (
    <div
      className={`mastercourse-custom-wrapper${disabled ? ' mastercourse-custom-disabled' : ''}`}
      ref={ref}
    >
      <button
        type="button"
        disabled={disabled}
        className={`mastercourse-custom-trigger${hasError ? ' mastercourse-error' : ''}${!displayLabel ? ' mastercourse-placeholder' : ''}`}
        onClick={() => !disabled && setOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{displayLabel || placeholder}</span>
        <svg
          className={`mastercourse-chevron${open ? ' mastercourse-chevron-open' : ''}`}
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && (
        <ul className="mastercourse-dropdown" role="listbox">
          {options.map(o => {
            const optVal   = typeof o === 'string' ? o : o.value;
            const optLabel = typeof o === 'string' ? o : o.label;
            return (
              <li
                key={optVal}
                role="option"
                aria-selected={value === optVal}
                className={`mastercourse-dropdown-item${value === optVal ? ' mastercourse-dropdown-item-active' : ''}`}
                onClick={() => handleSelect(optVal)}
              >
                {optLabel}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MasterCourse = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    preferredCourse: '',
    specialization: '',
    intake: '',
    modeOfStudy: ''
  });

  const [errors, setErrors] = useState({});
  const debounceRef    = useRef(null);
  const isSavingRef    = useRef(false);
  const lastSavedRef   = useRef(null);
  const lastUpdatedRef = useRef(null);
  const hasFetched     = useRef(false);

  const getToken = () => localStorage.getItem('token');

  // ─── Validation ───────────────────────────────────────────────
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'preferredCourse': return !value?.trim() ? 'Preferred course is required' : '';
      case 'intake':          return !value         ? 'Intake period is required'    : '';
      case 'modeOfStudy':     return !value         ? 'Mode of study is required'    : '';
      default:                return '';
    }
  }, []);

  // ─── Fetch on mount ───────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    const fetchCourseData = async () => {
      const token = getToken();
      if (!token) return;

      try {
   const baseURL = process.env.REACT_APP_API_BASE_URL;
const res = await fetch(`${API_BASE_URL}/api/master-course`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  signal: controller.signal
});

        if (res.status === 404) return;
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const result = await res.json();

        if (result?.success && result?.data) {
          const { preferredCourse, specialization, intake, modeOfStudy } = result.data;
          const loaded = {
            preferredCourse: preferredCourse || '',
            specialization:  specialization  || '',
            intake:          intake          || '',
            modeOfStudy:     modeOfStudy     || ''
          };

          const requiredFields = ['preferredCourse', 'intake', 'modeOfStudy'];
          const isValid  = requiredFields.every(k => !validateField(k, loaded[k]));
          const payload  = { ...loaded, _isValid: isValid };

          lastUpdatedRef.current = JSON.stringify(payload);
          lastSavedRef.current   = loaded;

          setFormData(loaded);
          updateData(payload);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching course data:', err);
      }
    };

    fetchCourseData();

    return () => {
      controller.abort();
      hasFetched.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handle Change ────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const next = { ...prev, [name]: value };
      // Reset specialization when course changes
      if (name === 'preferredCourse') next.specialization = '';
      return next;
    });

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  // ─── Save to backend ──────────────────────────────────────────
  const saveDataToBackend = useCallback(async (currentFormData) => {
    try {
      if (isSavingRef.current) return;
      if (JSON.stringify(lastSavedRef.current) === JSON.stringify(currentFormData)) return;

      isSavingRef.current = true;
      const token = getToken();

const baseURL = process.env.REACT_APP_API_BASE_URL;
const res = await fetch(`${API_BASE_URL}/api/master-course`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    preferredCourse: currentFormData.preferredCourse,
    specialization:  currentFormData.specialization,
    intake:          currentFormData.intake,
    modeOfStudy:     currentFormData.modeOfStudy
  })
});

      const result = await res.json();
      if (result.success) {
        lastSavedRef.current = currentFormData;
      } else {
        console.error('Save failed:', result.message);
      }
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  // ─── Notify parent + debounced save ───────────────────────────
  useEffect(() => {
    const requiredFields = ['preferredCourse', 'intake', 'modeOfStudy'];
    const isValid    = requiredFields.every(k => !validateField(k, formData[k] || ''));
    const nextUpdate = JSON.stringify({ ...formData, _isValid: isValid });

    if (lastUpdatedRef.current === nextUpdate) return;
    lastUpdatedRef.current = nextUpdate;
    updateData({ ...formData, _isValid: isValid });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isValid) saveDataToBackend(formData);
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData, validateField, saveDataToBackend, updateData]);

  // ─── Static data ──────────────────────────────────────────────
  const courses = [
    'Master of Business Administration (MBA)',
    'Master of Science in Computer Science',
    'Master of Engineering',
    'Master of Arts in Economics',
    'Master of Data Science',
    'Master of Artificial Intelligence',
    'Master of Finance'
  ];

  const specializationsMap = {
    'Master of Business Administration (MBA)':   ['Finance', 'Marketing', 'Human Resources', 'Operations', 'International Business'],
    'Master of Science in Computer Science':      ['Software Engineering', 'Cybersecurity', 'Cloud Computing', 'Machine Learning'],
    'Master of Engineering':                      ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering'],
    'Master of Data Science':                     ['Big Data Analytics', 'Business Intelligence', 'Data Engineering'],
    'Master of Artificial Intelligence':          ['Computer Vision', 'NLP', 'Robotics'],
    default:                                      ['General']
  };

  const intakes = [
    { value: 'Fall',   label: 'Fall (September)' },
    { value: 'Spring', label: 'Spring (January)'  },
    { value: 'Summer', label: 'Summer (May)'       }
  ];

  const modesOfStudy = ['Full-time', 'Part-time', 'Online', 'Hybrid'];

  const getSpecializations = () =>
    specializationsMap[formData.preferredCourse] || specializationsMap.default;

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="mastercourse-form">
      <div className="mastercourse-header">
        <h2 className="mastercourse-title">Course Selection</h2>
        <p className="mastercourse-subtitle">Select your preferred program and study mode</p>
      </div>

      <div className="mastercourse-grid">

        {/* Preferred Course */}
        <div className="mastercourse-group mastercourse-group-full">
          <label className="mastercourse-label">
            Preferred Course <span className="mastercourse-required">*</span>
          </label>
          <CustomDropdown
            name="preferredCourse"
            value={formData.preferredCourse}
            onChange={handleChange}
            onBlur={handleBlur}
            options={courses}
            placeholder="Select a course"
            hasError={!!errors.preferredCourse}
          />
          {errors.preferredCourse && (
            <span className="mastercourse-error-text">{errors.preferredCourse}</span>
          )}
        </div>

        {/* Specialization */}
        <div className="mastercourse-group mastercourse-group-full">
          <label className="mastercourse-label">Specialization (Optional)</label>
          <CustomDropdown
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            options={getSpecializations()}
            placeholder="Select specialization (if applicable)"
            disabled={!formData.preferredCourse}
          />
        </div>

        {/* Intake */}
        <div className="mastercourse-group">
          <label className="mastercourse-label">
            Intake <span className="mastercourse-required">*</span>
          </label>
          <CustomDropdown
            name="intake"
            value={formData.intake}
            onChange={handleChange}
            onBlur={handleBlur}
            options={intakes}
            placeholder="Select intake period"
            hasError={!!errors.intake}
          />
          {errors.intake && (
            <span className="mastercourse-error-text">{errors.intake}</span>
          )}
        </div>

        {/* Mode of Study */}
        <div className="mastercourse-group">
          <label className="mastercourse-label">
            Mode of Study <span className="mastercourse-required">*</span>
          </label>
          <CustomDropdown
            name="modeOfStudy"
            value={formData.modeOfStudy}
            onChange={handleChange}
            onBlur={handleBlur}
            options={modesOfStudy}
            placeholder="Select mode of study"
            hasError={!!errors.modeOfStudy}
          />
          {errors.modeOfStudy && (
            <span className="mastercourse-error-text">{errors.modeOfStudy}</span>
          )}
        </div>

      </div>
    </div>
  );
};

export default MasterCourse;