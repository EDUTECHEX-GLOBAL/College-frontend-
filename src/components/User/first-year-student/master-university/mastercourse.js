import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './mastercourse.css';
import API_BASE_URL from './../../../../config/api';

const normalizeCourseText = (value = '') =>
  value.toString().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
const normalizeCategoryName = (value = '') => value.toString().trim();
const findCourseSegment = () => '';
const segmentNamesMatch = (left = '', right = '') =>
  Boolean(left && right && left.toString().trim() === right.toString().trim());


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
const getTokenUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.userId || payload.id || payload._id || payload.sub || '').toString();
  } catch {
    return '';
  }
};

const safeGetLocalStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const persistMasterCourseDraft = (courseData) => {
  const userId = getTokenUserId();
  const legacyData = safeGetLocalStorage('masterApplicationData');
  const scopedKey = userId ? `masterApplicationData_${userId}` : 'masterApplicationData';
  const scopedData = userId ? safeGetLocalStorage(scopedKey) : {};
  const nextData = {
    ...legacyData,
    ...scopedData,
    course: courseData
  };

  localStorage.setItem('masterApplicationData', JSON.stringify(nextData));
  if (userId) localStorage.setItem(scopedKey, JSON.stringify(nextData));
  window.dispatchEvent(new Event("applicationUpdated"));
};

const FIELD_OF_STUDY_OPTIONS = [];

const COURSE_OPTIONS = [];

const uniqueStrings = (values = []) => (
  [...new Set(values.filter(Boolean).map(value => value.toString().trim()).filter(Boolean))]
);

const INTAKE_OPTIONS = [
  { value: 'Fall',   label: 'Fall (September)' },
  { value: 'Spring', label: 'Spring (January)'  },
  { value: 'Summer', label: 'Summer (May)'       }
];

const MODE_OPTIONS = ['Full-time', 'Part-time', 'Online', 'Hybrid'];

const MasterCourse = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    fieldOfStudy: '',
    preferredCourse: '',
    specialization: '',
    intake: '',
    modeOfStudy: ''
  });

  const [errors, setErrors] = useState({});
  const [dynamicCourseOptions, setDynamicCourseOptions] = useState([]);
  const debounceRef    = useRef(null);
  const isSavingRef    = useRef(false);
  const lastSavedRef   = useRef(null);
  const lastUpdatedRef = useRef(null);
  const hasFetched     = useRef(false);

  const getToken = () => localStorage.getItem('token');

  const fieldOfStudyOptions = useMemo(() => uniqueStrings([
    ...FIELD_OF_STUDY_OPTIONS,
    ...dynamicCourseOptions.map(course => course.fieldOfStudy)
  ]), [dynamicCourseOptions]);
  const courses = useMemo(() => (formData.fieldOfStudy
    ? uniqueStrings([
      ...COURSE_OPTIONS,
      ...dynamicCourseOptions
        .filter(course => !course.fieldOfStudy || segmentNamesMatch(course.fieldOfStudy, formData.fieldOfStudy))
        .map(course => course.title)
    ])
    : []), [dynamicCourseOptions, formData.fieldOfStudy]);
  const intakes = INTAKE_OPTIONS;
  const modesOfStudy = MODE_OPTIONS;
  const normalizeOptionText = useCallback((value = '') => normalizeCourseText(value), []);

  const getOptionValue = useCallback((option) => (typeof option === 'string' ? option : option.value), []);

  const matchOptionValue = useCallback((value, options) => {
    const normalized = normalizeOptionText(value);
    if (!normalized) return '';

    const exact = options.find(option => getOptionValue(option) === value);
    if (exact) return getOptionValue(exact);

    const normalizedMatch = options.find(option => normalizeOptionText(getOptionValue(option)) === normalized);
    if (normalizedMatch) return getOptionValue(normalizedMatch);

    return '';
  }, [getOptionValue, normalizeOptionText]);

  const addDynamicCourseOption = useCallback((raw = {}) => {
    const selectedCourse = raw.selectedCourse && typeof raw.selectedCourse === 'object'
      ? raw.selectedCourse
      : {};
    const title = [
      raw.preferredCourse,
      selectedCourse.title,
      selectedCourse.name,
      selectedCourse.program_name,
      typeof raw.selectedCourse === 'string' ? raw.selectedCourse : '',
      raw.title,
      raw.name,
      raw.program_name,
    ].find(value => value && value.toString().trim())?.toString().trim() || '';

    const rawField = [
      raw.fieldOfStudy,
      raw.selectedCategory,
      selectedCourse.category,
      selectedCourse.field,
      selectedCourse.major_area,
      selectedCourse.majorArea,
      raw.selectedSegment?.name,
      raw.education?.field,
      raw.segment,
      raw.majorArea,
      title ? findCourseSegment(title, 'PG') : '',
    ].find(value => value && value.toString().trim())?.toString().trim() || '';

    const fieldOfStudy = normalizeCategoryName(rawField, title) || rawField;
    if (!title && !fieldOfStudy) return;

    setDynamicCourseOptions(prev => {
      const nextItem = { title, fieldOfStudy };
      const nextKey = `${normalizeCourseText(title)}|${normalizeCourseText(fieldOfStudy)}`;
      if (prev.some(item => `${normalizeCourseText(item.title)}|${normalizeCourseText(item.fieldOfStudy)}` === nextKey)) {
        return prev;
      }
      return [...prev, nextItem];
    });
  }, []);

  const mapFetchedCourseData = useCallback((raw = {}) => {
    const rawSelectedCourse = typeof raw.selectedCourse === 'object'
      ? (raw.selectedCourse?.title || raw.selectedCourse?.name || raw.selectedCourse?.program_name || '')
      : raw.selectedCourse;
    const rawCourse = raw.preferredCourse || rawSelectedCourse || '';
    const preferredCourse = matchOptionValue(
      rawCourse,
      COURSE_OPTIONS
    ) || rawCourse;
    const inferredField = findCourseSegment(preferredCourse || rawCourse, 'PG');
    const rawField = raw.fieldOfStudy || raw.selectedCategory || raw.specialization || inferredField || '';
    const fieldOfStudy = matchOptionValue(
      rawField,
      fieldOfStudyOptions
    ) || normalizeCategoryName(rawField, preferredCourse || rawCourse) || rawField || inferredField;

    return {
      fieldOfStudy,
      preferredCourse,
      specialization: raw.specialization && !segmentNamesMatch(raw.specialization, fieldOfStudy) ? raw.specialization : '',
      intake: matchOptionValue(raw.intake || '', intakes),
      modeOfStudy: matchOptionValue(raw.modeOfStudy || raw.studyMode || '', modesOfStudy)
    };
  }, [fieldOfStudyOptions, intakes, matchOptionValue, modesOfStudy]);

  // ─── Validation ───────────────────────────────────────────────
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'preferredCourse':
        if (!value?.trim()) return 'Preferred course is required';
        return courses.includes(value) ? '' : 'Please select a valid preferred course';
      case 'fieldOfStudy':
        if (!value?.trim()) return 'Field of study is required';
        return fieldOfStudyOptions.includes(value) ? '' : 'Please select a valid field of study';
      case 'intake':          return !value         ? 'Intake period is required'    : '';
      case 'modeOfStudy':
        if (!value) return 'Mode of study is required';
        return modesOfStudy.includes(value) ? '' : 'Please select a valid mode of study';
      default:                return '';
    }
  }, [courses, fieldOfStudyOptions, modesOfStudy]);

  // ─── Fetch on mount ───────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    const fetchCourseData = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/master-course/me`, {
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
          addDynamicCourseOption(result.data);
          const loaded = mapFetchedCourseData(result.data);

          const requiredFields = ['fieldOfStudy', 'preferredCourse', 'intake', 'modeOfStudy'];
          const isValid  = requiredFields.every(k => !validateField(k, loaded[k]));
          const payload  = { ...loaded, programType: 'PG', _isValid: isValid };

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
    if (name === 'fieldOfStudy' && value && !fieldOfStudyOptions.includes(value)) return;
    if (name === 'preferredCourse' && value && !courses.includes(value)) return;
    if (name === 'modeOfStudy' && value && !modesOfStudy.includes(value)) return;

    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'fieldOfStudy') next.preferredCourse = '';
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

      const res = await fetch(`${API_BASE_URL}/api/master-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          preferredCourse: currentFormData.preferredCourse,
          specialization:  currentFormData.specialization,
          fieldOfStudy:    currentFormData.fieldOfStudy,
          intake:          currentFormData.intake,
          modeOfStudy:     currentFormData.modeOfStudy,
          programType:     'PG'
        })
      });

      const result = await res.json();
      if (result.success) {
        lastSavedRef.current = currentFormData;
        const savedCourse = result.data ? mapFetchedCourseData(result.data) : currentFormData;
        const requiredFields = ['fieldOfStudy', 'preferredCourse', 'intake', 'modeOfStudy'];
        const isValid = requiredFields.every(k => !validateField(k, savedCourse[k] || ''));
        persistMasterCourseDraft({ ...savedCourse, _isValid: isValid });
      } else {
        console.error('Save failed:', result.message);
      }
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [mapFetchedCourseData, validateField]);

  // ─── Notify parent + debounced save ───────────────────────────
  useEffect(() => {
    const requiredFields = ['fieldOfStudy', 'preferredCourse', 'intake', 'modeOfStudy'];
    const isValid    = requiredFields.every(k => !validateField(k, formData[k] || ''));
    const payload = { ...formData, programType: 'PG', _isValid: isValid };
    const nextUpdate = JSON.stringify(payload);

    if (lastUpdatedRef.current === nextUpdate) return;
    lastUpdatedRef.current = nextUpdate;
    updateData(payload);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isValid) saveDataToBackend(formData);
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData, validateField, saveDataToBackend, updateData]);

  // ─── Static data ──────────────────────────────────────────────
  const getCourses = () => courses;

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="mastercourse-form">
      <div className="mastercourse-header">
        <h2 className="mastercourse-title">Course Selection</h2>
        <p className="mastercourse-subtitle">Select your preferred program and study mode</p>
      </div>

      <div className="mastercourse-grid">

        {/* Field of Study */}
        <div className="mastercourse-group mastercourse-group-full">
          <label className="mastercourse-label">
            Field of Study <span className="mastercourse-required">*</span>
          </label>
          <CustomDropdown
            name="fieldOfStudy"
            value={formData.fieldOfStudy}
            onChange={handleChange}
            onBlur={handleBlur}
            options={fieldOfStudyOptions}
            placeholder="Select a field"
            hasError={!!errors.fieldOfStudy}
          />
          {errors.fieldOfStudy && (
            <span className="mastercourse-error-text">{errors.fieldOfStudy}</span>
          )}
        </div>

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
            options={getCourses()}
            placeholder="Select a course"
            disabled={!formData.fieldOfStudy}
            hasError={!!errors.preferredCourse}
          />
          {errors.preferredCourse && (
            <span className="mastercourse-error-text">{errors.preferredCourse}</span>
          )}
        </div>

        {/* Specialization */}
        <div className="mastercourse-group mastercourse-group-full">
          <label className="mastercourse-label">Specialization (Optional)</label>
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            placeholder="Enter specialization (if applicable)"
            className="mastercourse-input"
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
