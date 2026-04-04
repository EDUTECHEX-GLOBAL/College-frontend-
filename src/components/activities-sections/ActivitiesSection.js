import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import './ActivitiesSection.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const VALID_CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const emptyActivity = () => ({
  id: Date.now(),
  type: '',
  position: '',
  organization: '',
  description: '',
  gradeLevels: [],
  timing: '',
  hoursPerWeek: '',
  weeksPerYear: '',
  continueInCollege: null,
});

const ActivitiesSection = () => {
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────────
  const [hasActivities, setHasActivities] = useState(null);
  const [showActivitiesForm, setShowActivitiesForm] = useState(false);
  const [activities, setActivities] = useState([emptyActivity()]);
  const [loading, setLoading] = useState(false);

  // ── CV upload state ─────────────────────────────────────────
  const [cvUploading, setCvUploading] = useState(false);
  const [cvProgress, setCvProgress] = useState(0);
  const [cvFileName, setCvFileName] = useState('');
  const [cvProcessed, setCvProcessed] = useState(false);
  const [cvError, setCvError] = useState(null);
  const fileInputRef = useRef(null);

  // ── Activity type options ───────────────────────────────────
  const activityTypes = [
    'Social Justice', 'Art', 'Athletics: Club', 'Athletics: JV/Varsity',
    'Career Oriented', 'Community Service', 'Computer/Technology', 'Cultural',
    'Dance', 'Debate/Speech', 'Environmental', 'Family Responsibilities',
    'Foreign Exchange', 'Foreign Language', 'Internship', 'Journalism/Publication',
    'Junior ROTC', 'Music: Instrumental', 'Music: Vocal', 'Religious',
    'Research', 'Robotics', 'School Spirit', 'Science/Math',
    'Student Government', 'Theater/Drama', 'Work (Paid)', 'Other',
  ].map(type => ({ value: type, label: type }));

  // ── React-Select styles (teal theme) ───────────────────────
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '44px',
      border: `1.5px solid ${state.isFocused ? '#0ba5a0' : '#e5e5e5'}`,
      borderRadius: '8px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(11,165,160,0.12)' : 'none',
      backgroundColor: '#fff',
      fontFamily: 'inherit',
      fontSize: '14px',
      '&:hover': { borderColor: state.isFocused ? '#0ba5a0' : '#b2e8e6' },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      border: '1px solid #e5e5e5',
      zIndex: 9999,
      marginTop: '2px',
    }),
    menuList: (base) => ({ ...base, padding: 0, maxHeight: '220px' }),
    option: (base, state) => ({
      ...base,
      fontSize: '14px',
      padding: '11px 14px',
      backgroundColor: state.isSelected ? '#0ba5a0' : state.isFocused ? '#f0fdfa' : 'white',
      color: state.isSelected ? 'white' : '#171717',
      '&:active': { backgroundColor: '#0ba5a0', color: 'white' },
    }),
    placeholder: (base) => ({ ...base, color: '#a3a3a3', fontSize: '14px' }),
    singleValue: (base) => ({ ...base, color: '#171717', fontSize: '14px' }),
  };

  // ── Fetch existing data ─────────────────────────────────────
  useEffect(() => {
    const fetchActivitiesData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_URL}/api/students/activities`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });

        if (response.data.success) {
          const { hasActivities: has, activities: acts } = response.data.activitiesData;
          setHasActivities(has);
          if (has && acts?.length > 0) {
            setActivities(acts.map(a => ({
              ...a,
              type: a.type ? { value: a.type, label: a.type } : '',
            })));
            setShowActivitiesForm(true);
          }
        }
      } catch (err) {
        console.error('Error fetching activities data:', err);
      }
    };
    fetchActivitiesData();
  }, []);

  // ── Navigation ──────────────────────────────────────────────
  const handleBackToDashboard = () => {
    const isFirstYear = window.location.pathname.includes('/firstyear/');
    navigate(isFirstYear ? '/firstyear/dashboard' : '/transfer/dashboard');
  };

  // ── Has-activities answer ───────────────────────────────────
  const handleAnswerSelect = async (answer) => {
    setLoading(true);
    setHasActivities(answer);
    if (answer) {
      setShowActivitiesForm(true);
    } else {
      handleBackToDashboard();
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/sign-in'); return; }
      const response = await axios.post(
        `${API_URL}/api/students/activities/has-activities`,
        { hasActivities: answer },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );
      if (response.data.success) {
        const stored = localStorage.getItem('userData');
        if (stored) {
          const userData = JSON.parse(stored);
          localStorage.setItem('userData', JSON.stringify({
            ...userData,
            applicationProgress: {
              ...userData.applicationProgress,
              activities: response.data.applicationProgress?.activities
                || userData.applicationProgress?.activities,
            },
          }));
        }
      }
    } catch (err) {
      console.error('Error saving activities preference:', err);
      alert('Error saving your preference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAnswer = async () => {
    setLoading(true);
    setHasActivities(null);
    setShowActivitiesForm(false);
    setActivities([emptyActivity()]);
    resetCV();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.delete(`${API_URL}/api/students/activities/has-activities`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const stored = localStorage.getItem('userData');
      if (stored) {
        const userData = JSON.parse(stored);
        localStorage.setItem('userData', JSON.stringify({
          ...userData,
          applicationProgress: { ...userData.applicationProgress, activities: 0 },
        }));
      }
    } catch (err) {
      console.error('Error clearing activities answer:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── CV upload helpers ───────────────────────────────────────
  const resetCV = () => {
    setCvFileName('');
    setCvError(null);
    setCvProcessed(false);
    setCvProgress(0);
    setCvUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateCVFile = (file) => {
    if (!VALID_CV_TYPES.includes(file.type))
      return 'Please upload a PDF, DOC, DOCX, or TXT file.';
    if (file.size > 5 * 1024 * 1024)
      return 'File size must be less than 5 MB.';
    return null;
  };

  // Map parsed CV data → activities array
  const mapCVDataToActivities = (extractedData) => {
    if (!extractedData?.activities?.length) return null;

    return extractedData.activities.map((a, idx) => ({
      id: idx + 1,
      type: a.type ? { value: a.type, label: a.type } : '',
      position: a.position || '',
      organization: a.organization || '',
      description: a.description || '',
      gradeLevels: Array.isArray(a.gradeLevels) ? a.gradeLevels : [],
      timing: a.timing || '',
      hoursPerWeek: String(a.hoursPerWeek) || '',
      weeksPerYear: String(a.weeksPerYear) || '',
      continueInCollege: a.continueInCollege ?? null,
    }));
  };

  const processCVFile = async (file) => {
    const err = validateCVFile(file);
    if (err) {
      setCvError(err);
      return;
    }

    setCvFileName(file.name);
    setCvUploading(true);
    setCvProgress(0);
    setCvError(null);
    setCvProcessed(false);

    // Simulate progress bar
    const interval = setInterval(() => {
      setCvProgress(prev => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 8;
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append('cv', file);
      const token = localStorage.getItem('token');

      if (!token) {
        clearInterval(interval);
        setCvError('Authentication required. Please log in again.');
        setCvUploading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/students/activities/parse-cv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(interval);
      setCvProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        const mapped = mapCVDataToActivities(data.extractedData);
        if (mapped && mapped.length > 0) {
          setActivities(mapped);
          setCvProcessed(true);
          setCvError(null);
        } else {
          setCvError('No activities found in the CV. Please fill the form manually.');
          setCvProcessed(false);
        }
      } else {
        throw new Error(data.message || 'Failed to parse CV');
      }
    } catch (err) {
      clearInterval(interval);
      console.error('CV upload error:', err);
      setCvError(err.message || 'Failed to parse CV. You can fill the form manually instead.');
      setCvProcessed(false);
    } finally {
      setCvUploading(false);
      setCvProgress(0);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processCVFile(file);
    }
    // Reset input value to allow re-uploading the same file
    if (e.target) {
      e.target.value = '';
    }
  };

  // ── Activity CRUD helpers ───────────────────────────────────
  const updateActivity = (index, field, value) => {
    setActivities(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateGradeLevels = (index, grade, checked) => {
    setActivities(prev => {
      const updated = [...prev];
      updated[index].gradeLevels = checked
        ? [...updated[index].gradeLevels, grade]
        : updated[index].gradeLevels.filter(g => g !== grade);
      return updated;
    });
  };

  const addActivity = () => {
    if (activities.length < 10) {
      setActivities(prev => [...prev, emptyActivity()]);
    }
  };

  const removeActivity = (index) => {
    if (activities.length > 1) {
      setActivities(prev => prev.filter((_, i) => i !== index));
    }
  };

  // ── Save & continue ─────────────────────────────────────────
  const handleSaveAndContinue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/sign-in');
        return;
      }

      // Convert activities for backend - extract type value from object
      const activitiesForBackend = activities.map(a => ({
        ...a,
        type: a.type?.value || a.type || '',
      }));

      // Validation: check for empty required fields
      const hasEmptyFields = activitiesForBackend.some(a =>
        !a.type ||
        !a.position ||
        !a.description ||
        a.gradeLevels.length === 0 ||
        !a.timing ||
        !a.hoursPerWeek ||
        !a.weeksPerYear ||
        a.continueInCollege === null
      );

      if (hasEmptyFields) {
        alert('Please fill all required fields for each activity.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/students/activities/details`,
        { activities: activitiesForBackend },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );

      if (response.data.success) {
        // Update local storage
        const stored = localStorage.getItem('userData');
        if (stored) {
          const userData = JSON.parse(stored);
          localStorage.setItem('userData', JSON.stringify({
            ...userData,
            applicationProgress: {
              ...userData.applicationProgress,
              activities: response.data.applicationProgress?.activities || 100,
            },
          }));
        }
        // Navigate to next page
        navigate('/firstyear/dashboard/activities/responsibilities');
      }
    } catch (err) {
      console.error('Error saving activities details:', err);
      alert('Error saving your activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared page header ──────────────────────────────────────
  const PageHeader = () => (
    <div className="act-header">
      <button className="act-back-btn" onClick={handleBackToDashboard} disabled={loading}>
        Back to Dashboard
      </button>
      <h1 className="act-header-title">Complete your Common Application</h1>
      <span className="act-progress-badge">In progress</span>
    </div>
  );

  // ── CV Upload Banner (reused in form screen) ────────────────
  const CVUploadBanner = () => (
    <div className="act-cv-banner">
      {/* decorative circle */}
      <div className="act-cv-banner-bg" />

      <div className="act-cv-banner-left">
        <h3 className="act-cv-banner-title">Upload your CV / Résumé to auto-fill activities</h3>
        <p className="act-cv-banner-desc">
          We'll extract your activities automatically · PDF, DOC, DOCX, TXT
        </p>
      </div>

      <div className="act-cv-banner-right">
        <button
          type="button"
          className="act-cv-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={cvUploading}
        >
          {cvUploading ? `Uploading… ${cvProgress}%` : 'Upload CV'}
        </button>
        <button
          type="button"
          className="act-cv-skip-btn"
          onClick={resetCV}
        >
          Fill manually
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
      />

      {/* Progress bar */}
      {cvUploading && (
        <div className="act-cv-progress-wrap">
          <div className="act-cv-progress-bar">
            <div className="act-cv-progress-fill" style={{ width: `${cvProgress}%` }} />
          </div>
          <p className="act-cv-progress-text">Parsing your CV… {cvProgress}%</p>
        </div>
      )}

      {/* Success */}
      {cvFileName && !cvUploading && !cvError && cvProcessed && (
        <div className="act-cv-status act-cv-status--success">
          <span className="act-cv-status-icon">✓</span>
          <span className="act-cv-status-text">{cvFileName} — Activities filled successfully</span>
          <button type="button" className="act-cv-status-clear" onClick={resetCV}>×</button>
        </div>
      )}

      {/* Error */}
      {cvError && (
        <div className="act-cv-status act-cv-status--error">
          <span className="act-cv-status-icon">!</span>
          <span className="act-cv-status-text">{cvError}</span>
          <button
            type="button"
            className="act-cv-retry-btn"
            onClick={() => {
              resetCV();
              setTimeout(() => fileInputRef.current?.click(), 50);
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // SCREEN 1 — Initial question
  // ══════════════════════════════════════════════════════════
  if (!showActivitiesForm) {
    return (
      <div className="act-container">
        <PageHeader />
        <div className="act-card">
          <h2 className="act-card-title">Activities</h2>
          <hr className="act-divider" />

          <div className="act-description">
            <p>
              Reporting activities can help colleges better understand your life outside of the
              classroom. Examples of activities might include:
            </p>
            <ul>
              <li>Arts or music</li>
              <li>Clubs</li>
              <li>Community engagement</li>
              <li>Family responsibilities</li>
              <li>Hobbies</li>
              <li>Sports</li>
              <li>Work or volunteering</li>
              <li>Other experiences that have been meaningful to you</li>
            </ul>
          </div>

          <div className="act-question-block">
            <label className="act-question-label">
              Do you have any activities that you wish to report?
              <span className="act-req"> *</span>
            </label>
            <div className="act-radio-row">
              <button
                className={`act-radio-btn ${hasActivities === true ? 'act-radio-btn--selected' : ''}`}
                onClick={() => handleAnswerSelect(true)}
                disabled={loading}
              >
                Yes
              </button>
              <button
                className={`act-radio-btn ${hasActivities === false ? 'act-radio-btn--selected' : ''}`}
                onClick={() => handleAnswerSelect(false)}
                disabled={loading}
              >
                No
              </button>
            </div>
            {hasActivities !== null && (
              <button className="act-clear-link" onClick={handleClearAnswer} disabled={loading}>
                Clear answer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SCREEN 2 — Activities form
  // ══════════════════════════════════════════════════════════
  return (
    <div className="act-container">
      <PageHeader />

      {/* ── CV Upload Banner ── */}
      <CVUploadBanner />

      <div className="act-card">
        <h2 className="act-card-title">Activities</h2>
        <hr className="act-divider" />

        <div className="act-info-banner">
          Please list your activities in the order of their importance to you.
        </div>

        {activities.map((activity, index) => (
          <div key={activity.id} className="act-activity-block">
            {/* Activity header */}
            <div className="act-activity-head">
              <h3 className="act-activity-number">Activity {index + 1}</h3>
              {activities.length > 1 && (
                <button
                  type="button"
                  className="act-remove-btn"
                  onClick={() => removeActivity(index)}
                  disabled={loading}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Activity Type */}
            <div className="act-form-group">
              <label className="act-label">
                Activity type <span className="act-req">*</span>
              </label>
              <Select
                options={activityTypes}
                value={activity.type}
                onChange={(opt) => updateActivity(index, 'type', opt)}
                placeholder="Choose an option"
                styles={customStyles}
                isDisabled={loading}
                isSearchable
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>

            {/* Position */}
            <div className="act-form-group">
              <label className="act-label">
                Position/Leadership description (Max characters: 50)
                <span className="act-req"> *</span>
              </label>
              <input
                className="act-input"
                type="text"
                value={activity.position}
                onChange={(e) => updateActivity(index, 'position', e.target.value)}
                maxLength={50}
                placeholder="Enter position or leadership role"
                disabled={loading}
                autoComplete="off"
              />
              <div className="act-char-count">{activity.position.length}/50</div>
            </div>

            {/* Organization */}
            <div className="act-form-group">
              <label className="act-label">
                Organization Name (Max characters: 100)
              </label>
              <input
                className="act-input"
                type="text"
                value={activity.organization}
                onChange={(e) => updateActivity(index, 'organization', e.target.value)}
                maxLength={100}
                placeholder="Enter organization name"
                disabled={loading}
                autoComplete="off"
              />
              <div className="act-char-count">{activity.organization.length}/100</div>
            </div>

            {/* Description */}
            <div className="act-form-group">
              <label className="act-label">
                Please describe this activity, including what you accomplished and any recognition
                you received. (Max characters: 150)
                <span className="act-req"> *</span>
              </label>
              <textarea
                className="act-textarea"
                value={activity.description}
                onChange={(e) => updateActivity(index, 'description', e.target.value)}
                maxLength={150}
                placeholder="Describe your activity"
                rows={3}
                disabled={loading}
              />
              <div className="act-char-count">{activity.description.length}/150</div>
            </div>

            {/* Grade Levels */}
            <div className="act-form-group">
              <label className="act-label">
                Participation grade levels <span className="act-req">*</span>
              </label>
              <div className="act-check-row">
                {[9, 10, 11, 12, 'Post-graduate'].map(grade => (
                  <label key={grade} className="act-check-option">
                    <input
                      type="checkbox"
                      checked={activity.gradeLevels.includes(grade)}
                      onChange={(e) => updateGradeLevels(index, grade, e.target.checked)}
                      disabled={loading}
                    />
                    <span>{grade}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Timing */}
            <div className="act-form-group">
              <label className="act-label">
                Timing of participation <span className="act-req">*</span>
              </label>
              <div className="act-radio-options">
                {['During school year', 'During school break', 'All year'].map(val => (
                  <label key={val} className="act-radio-option">
                    <input
                      type="radio"
                      name={`timing-${index}`}
                      value={val}
                      checked={activity.timing === val}
                      onChange={(e) => updateActivity(index, 'timing', e.target.value)}
                      disabled={loading}
                    />
                    <span>{val}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hours & Weeks */}
            <div className="act-form-row">
              <div className="act-form-group">
                <label className="act-label">
                  Hours spent per week <span className="act-req">*</span>
                </label>
                <input
                  className="act-input"
                  type="number"
                  value={activity.hoursPerWeek}
                  onChange={(e) => updateActivity(index, 'hoursPerWeek', e.target.value)}
                  min="0"
                  max="168"
                  disabled={loading}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
              <div className="act-form-group">
                <label className="act-label">
                  Weeks spent per year <span className="act-req">*</span>
                </label>
                <input
                  className="act-input"
                  type="number"
                  value={activity.weeksPerYear}
                  onChange={(e) => updateActivity(index, 'weeksPerYear', e.target.value)}
                  min="0"
                  max="52"
                  disabled={loading}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Continue in college */}
            <div className="act-form-group">
              <label className="act-label">
                I intend to participate in a similar activity in college.
                <span className="act-req"> *</span>
              </label>
              <div className="act-radio-options">
                <label className="act-radio-option">
                  <input
                    type="radio"
                    name={`continue-${index}`}
                    checked={activity.continueInCollege === true}
                    onChange={() => updateActivity(index, 'continueInCollege', true)}
                    disabled={loading}
                  />
                  <span>Yes</span>
                </label>
                <label className="act-radio-option">
                  <input
                    type="radio"
                    name={`continue-${index}`}
                    checked={activity.continueInCollege === false}
                    onChange={() => updateActivity(index, 'continueInCollege', false)}
                    disabled={loading}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {index < activities.length - 1 && <hr className="act-divider act-divider--inner" />}
          </div>
        ))}

        {/* Add activity */}
        {activities.length < 10 && (
          <div className="act-add-row">
            <span className="act-remaining">{10 - activities.length} of 10 remaining</span>
            <button
              type="button"
              className="act-add-btn"
              onClick={addActivity}
              disabled={loading}
            >
              + Add another activity
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="act-footer">
          <button
            type="button"
            className="act-continue-btn"
            onClick={handleSaveAndContinue}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesSection;