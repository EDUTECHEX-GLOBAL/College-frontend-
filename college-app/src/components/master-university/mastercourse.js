import React, { useState, useEffect, useRef, useCallback } from 'react';
import './mastercourse.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const MasterCourse = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    preferredCourse: '',
    specialization: '',
    intake: '',
    modeOfStudy: ''
  });

  const [errors, setErrors] = useState({});
  const debounceRef = useRef(null);
  const isSavingRef = useRef(false);
  const lastSavedRef = useRef(null);
  const lastUpdatedRef = useRef(null);
  const hasFetched = useRef(false);

  // ─── Get token ────────────────────────────────────────────────
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

  // ─── Fetch saved course data on mount ────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    const fetchCourseData = async () => {
      const token = getToken();
      if (!token) return;

      try {
        console.log('Fetching course data...');

        const res = await fetch(`${API_URL}/api/master-course`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        if (res.status === 404) {
          console.log('No course data found (first time user)');
          return;
        }

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const result = await res.json();
        console.log('Course data fetched:', result);

        if (result?.success && result?.data) {
          const { preferredCourse, specialization, intake, modeOfStudy } = result.data;

          const loaded = {
            preferredCourse: preferredCourse || '',
            specialization:  specialization  || '',
            intake:          intake          || '',
            modeOfStudy:     modeOfStudy     || ''
          };

          const requiredFields = ['preferredCourse', 'intake', 'modeOfStudy'];
          const isValid = requiredFields.every(k => !validateField(k, loaded[k]));
          const payload = { ...loaded, _isValid: isValid };

          // Pre-seed ref so the notify-parent useEffect skips this as already-sent
          lastUpdatedRef.current = JSON.stringify(payload);
          lastSavedRef.current = loaded;

          setFormData(loaded);
          updateData(payload); // notify parent directly
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching course data:', err);
      }
    };

    fetchCourseData();

    return () => {
      controller.abort();
      hasFetched.current = false; // reset so navigating back re-fetches
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handle Change ────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // ─── Handle Blur ─────────────────────────────────────────────
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

      const res = await fetch(`${API_URL}/api/master-course`, {
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
        console.log('Course Saved:', result.data);
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

  // ─── Notify parent + debounced save on user edits ─────────────
  useEffect(() => {
    const requiredFields = ['preferredCourse', 'intake', 'modeOfStudy'];
    const isValid = requiredFields.every(k => !validateField(k, formData[k] || ''));
    const nextUpdate = JSON.stringify({ ...formData, _isValid: isValid });

    if (lastUpdatedRef.current === nextUpdate) return; // no change — skip
    lastUpdatedRef.current = nextUpdate;

    updateData({ ...formData, _isValid: isValid });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isValid) saveDataToBackend(formData);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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

  const specializations = {
    'Master of Business Administration (MBA)':    ['Finance', 'Marketing', 'Human Resources', 'Operations', 'International Business'],
    'Master of Science in Computer Science':       ['Software Engineering', 'Cybersecurity', 'Cloud Computing', 'Machine Learning'],
    'Master of Engineering':                       ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering'],
    'Master of Data Science':                      ['Big Data Analytics', 'Business Intelligence', 'Data Engineering'],
    'Master of Artificial Intelligence':           ['Computer Vision', 'NLP', 'Robotics'],
    'default':                                     ['General']
  };

  const intakes = [
    { value: 'Fall',   label: 'Fall (September)' },
    { value: 'Spring', label: 'Spring (January)'  },
    { value: 'Summer', label: 'Summer (May)'       }
  ];

  const modesOfStudy = ['Full-time', 'Part-time', 'Online', 'Hybrid'];

  const getSpecializations = () =>
    specializations[formData.preferredCourse] || specializations['default'];

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="mastercourse-form">
      <div className="mastercourse-header">
        <h2 className="mastercourse-title">Course Selection</h2>
        <p className="mastercourse-subtitle">Select your preferred program and study mode</p>
      </div>

      <div className="mastercourse-grid">

        <div className="mastercourse-group mastercourse-group-full">
          <label className="mastercourse-label">
            Preferred Course <span className="mastercourse-required">*</span>
          </label>
          <select
            name="preferredCourse"
            value={formData.preferredCourse}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mastercourse-select ${errors.preferredCourse ? 'mastercourse-error' : ''}`}
          >
            <option value="">Select a course</option>
            {courses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
          {errors.preferredCourse && (
            <span className="mastercourse-error-text">{errors.preferredCourse}</span>
          )}
        </div>

        <div className="mastercourse-group mastercourse-group-full">
          <label className="mastercourse-label">Specialization (Optional)</label>
          <select
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            className="mastercourse-select"
            disabled={!formData.preferredCourse}
          >
            <option value="">Select specialization (if applicable)</option>
            {getSpecializations().map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div className="mastercourse-group">
          <label className="mastercourse-label">
            Intake <span className="mastercourse-required">*</span>
          </label>
          <select
            name="intake"
            value={formData.intake}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mastercourse-select ${errors.intake ? 'mastercourse-error' : ''}`}
          >
            <option value="">Select intake period</option>
            {intakes.map(intake => (
              <option key={intake.value} value={intake.value}>{intake.label}</option>
            ))}
          </select>
          {errors.intake && (
            <span className="mastercourse-error-text">{errors.intake}</span>
          )}
        </div>

        <div className="mastercourse-group">
          <label className="mastercourse-label">
            Mode of Study <span className="mastercourse-required">*</span>
          </label>
          <select
            name="modeOfStudy"
            value={formData.modeOfStudy}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mastercourse-select ${errors.modeOfStudy ? 'mastercourse-error' : ''}`}
          >
            <option value="">Select mode of study</option>
            {modesOfStudy.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
          {errors.modeOfStudy && (
            <span className="mastercourse-error-text">{errors.modeOfStudy}</span>
          )}
        </div>

      </div>
    </div>
  );
};

export default MasterCourse;