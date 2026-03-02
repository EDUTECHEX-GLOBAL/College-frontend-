// src/components/ApplicationPreview.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ApplicationPreview.css';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

/* ─────────────────────────────────────────────────────
   SECTION ICONS  (one per section title)
───────────────────────────────────────────────────── */
const SECTION_ICONS = {
  'Personal Information':              '👤',
  'Address':                           '🏠',
  'Entrance Qualification (EQHE)':     '🎓',
  'Higher Education':                  '🏫',
  'Supporting Documents':              '📎',
  'Special Needs / Disability':        '♿',
};

/* ─────────────────────────────────────────────────────
   COMPLETION LABEL MAP
───────────────────────────────────────────────────── */
const COMPLETION_LABELS = {
  personalDone:    'Personal Info',
  addressDone:     'Address',
  educationDone:   'Higher Education',
  languageDone:    'Entrance Qualification',
  documentsDone:   'Documents',
  specialNeedDone: 'Special Needs',
};

const ApplicationPreview = ({ onInputChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sections,         setSections]         = useState([]);
  const [applicationId,    setApplicationId]    = useState('');
  const [previewDate,      setPreviewDate]      = useState('');
  const [applicationStatus, setApplicationStatus] = useState('draft');
  const [agreedToTerms,    setAgreedToTerms]    = useState(false);
  const [completionStatus, setCompletionStatus] = useState({});
  const [isLoading,        setIsLoading]        = useState(true);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [isSavingTerms,    setIsSavingTerms]    = useState(false);
  const [error,            setError]            = useState('');

  const getAuthToken = () => localStorage.getItem('token');

  /* ──────────────────────────────────────────────────
     LOAD PREVIEW
  ────────────────────────────────────────────────── */
  const loadPreview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = getAuthToken();
      if (!token) { setIsLoading(false); return; }

      const { data } = await axios.get(`${API_URL}/api/application/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const { sections, applicationId, previewDate, agreedToTerms,
                completionStatus, applicationStatus } = data.preview;
        setSections(sections || []);
        setApplicationId(applicationId || '');
        setPreviewDate(previewDate ? new Date(previewDate).toLocaleDateString() : new Date().toLocaleDateString());
        setAgreedToTerms(agreedToTerms || false);
        setCompletionStatus(completionStatus || {});
        setApplicationStatus(applicationStatus || 'draft');
        if (onInputChange) onInputChange('agreedToTerms', agreedToTerms || false);
      }
    } catch (err) {
      console.error('❌ loadPreview:', err);
      setError(err.response?.data?.message || 'Failed to load application preview.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  /* ──────────────────────────────────────────────────
     TERMS CHECKBOX  — auto-saves to backend
  ────────────────────────────────────────────────── */
  const handleTermsChange = async (e) => {
    const checked = e.target.checked;
    setAgreedToTerms(checked);
    if (onInputChange) onInputChange('agreedToTerms', checked);

    try {
      setIsSavingTerms(true);
      const token = getAuthToken();
      if (!token) return;
      await axios.patch(
        `${API_URL}/api/application/preview/terms`,
        { agreed: checked },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      console.error('❌ saveTerms:', err);
      setAgreedToTerms(!checked);
      if (onInputChange) onInputChange('agreedToTerms', !checked);
    } finally {
      setIsSavingTerms(false);
    }
  };

  /* ──────────────────────────────────────────────────
     SUBMIT
  ────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions before submitting.');
      return;
    }
    if (!window.confirm('Are you sure you want to submit your application? This cannot be undone.')) return;

    setIsSubmitting(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) { alert('Please login to submit.'); return; }

      const { data } = await axios.post(
        `${API_URL}/api/application/preview/submit`,
        { agreedToTerms: true },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (data.success) {
        alert(`✅ Application submitted!\nApplication ID: ${data.applicationId}`);
        const targetPath = location.pathname.includes('/preview')
          ? location.pathname.replace('/preview', '/confirmation')
          : '/firstyear/dashboard/application/confirmation';
        navigate(targetPath);
      }
    } catch (err) {
      console.error('❌ submit:', err);
      const missing = err.response?.data?.missingFields;
      if (missing?.length > 0) {
        alert(`Application incomplete. Please fill in:\n\n• ${missing.join('\n• ')}`);
      } else {
        setError(err.response?.data?.message || 'Failed to submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ──────────────────────────────────────────────────
     NAVIGATION
  ────────────────────────────────────────────────── */
  const handleBack = () => {
    const back = location.pathname.includes('/preview')
      ? location.pathname.replace('/preview', '/special-needs')
      : '/firstyear/dashboard/application/special-needs';
    navigate(back);
  };

  /* ──────────────────────────────────────────────────
     LOADING
  ────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="form-section">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your application preview…</p>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────
     SUBMITTED STATE
  ────────────────────────────────────────────────── */
  if (applicationStatus === 'submitted') {
    return (
      <div className="form-section">
        <div className="submitted-banner">
          <i className="fas fa-check-circle"></i>
          <h2>Application Already Submitted</h2>
          <p>Your application ID is <strong>{applicationId}</strong>. No further changes can be made.</p>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────── */
  const overallComplete = completionStatus.overall;

  return (
    <div className="form-section">

      {/* Header */}
      <div className="section-header">
        <div className="section-number">9</div>
        <div>
          <h2 className="section-title">Application Preview</h2>
          <p className="section-subtitle">Review all information before final submission</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner" role="alert">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close-btn">×</button>
        </div>
      )}

      {/* Info box */}
      <div className="info-box">
        <i className="fas fa-info-circle"></i>
        <p className="info-text">
          Please review all your information carefully. Once submitted, you <strong>cannot edit</strong> your
          application. Use the Print or Download buttons to keep a copy for your records.
        </p>
      </div>

      {/* Action buttons */}
      <div className="preview-actions">
        <button className="action-btn print-btn" onClick={() => window.print()}>
          <i className="fas fa-print"></i> Print Summary
        </button>
        <button className="action-btn pdf-btn" onClick={() => alert('Use Print → Save as PDF')}>
          <i className="fas fa-file-pdf"></i> Download PDF
        </button>
        <button className="action-btn refresh-btn" onClick={loadPreview} disabled={isLoading}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Application summary card */}
      <div className="application-summary">

        {/* Meta row */}
        <div className="summary-header">
          <div className="applicant-id">
            <span className="id-label">Application ID:</span>
            <span className="id-value">{applicationId || '—'}</span>
          </div>
          <div className="submission-date">
            <span className="date-label">Preview Date:</span>
            <span className="date-value">{previewDate}</span>
          </div>
          <div className="app-status-badge">
            <span className={`status-pill status-${applicationStatus}`}>
              {applicationStatus.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Completion pills */}
        {Object.keys(completionStatus).filter(k => k !== 'overall').length > 0 && (
          <div className="completion-status-bar">
            {Object.entries(completionStatus)
              .filter(([key]) => key !== 'overall')
              .map(([key, done]) => (
                <span key={key} className={`completion-pill ${done ? 'complete' : 'incomplete'}`}>
                  <i className={`fas ${done ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                  {' '}{COMPLETION_LABELS[key] || key}
                </span>
              ))}
          </div>
        )}

        {/* Sections */}
        {sections.length === 0 ? (
          <div className="no-data-message">
            <i className="fas fa-folder-open"></i>
            <p>No application data found. Please fill in your details first.</p>
          </div>
        ) : (
          sections.map((section, si) => (
            <div key={si} className="preview-section">
              <h3 className="preview-section-title">
                <span className="section-number">{si + 1}</span>
                {SECTION_ICONS[section.title] || '📋'} {section.title}
              </h3>
              <div className="preview-grid">
                {section.data.map((item, ii) => (
                  <div key={ii} className="preview-item">
                    <div className="preview-label">{item.label}:</div>
                    <div className={`preview-value ${
                      !item.value || item.value === 'Not provided' || item.value === 'Not uploaded'
                        ? 'empty-value' : ''
                    }`}>
                      {item.value || 'Not provided'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Declaration */}
        <div className="declaration-section">
          <h3 className="preview-section-title">Declaration</h3>
          <div className="declaration-card">
            <div className="declaration-text">
              <p>
                I hereby declare that all information provided in this application is true, complete,
                and accurate to the best of my knowledge. I understand that any false statement or
                omission may lead to the rejection of my application or termination of my admission.
              </p>
              <p>
                I agree to abide by the rules and regulations of the university and understand that
                all decisions made by the admissions committee are final.
              </p>
            </div>

            <div className="declaration-agreement">
              <div className="checkbox-option large">
                <input
                  type="checkbox"
                  id="agreedToTerms"
                  checked={agreedToTerms}
                  onChange={handleTermsChange}
                  disabled={isSubmitting || isSavingTerms}
                />
                <label htmlFor="agreedToTerms">
                  I have read and agree to the terms and conditions
                  {isSavingTerms && <span className="saving-indicator"> (saving…)</span>}
                </label>
              </div>
            </div>

            <div className="applicant-signature">
              <div className="signature-line"></div>
              <div className="signature-label">Applicant's Signature</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final checklist */}
      <div className="final-submission">
        <div className="submission-checklist">
          <h3 className="subsection-title">Final Checklist</h3>
          <div className="checklist">
            {[
              { label: 'Personal information completed',        done: completionStatus.personalDone },
              { label: 'Address provided',                      done: completionStatus.addressDone },
              { label: 'Entrance qualification filled',         done: completionStatus.languageDone },
              { label: 'Higher education filled',               done: completionStatus.educationDone },
              { label: 'Required documents uploaded',           done: completionStatus.documentsDone },
              { label: 'Special needs declaration completed',   done: completionStatus.specialNeedDone },
              { label: 'Terms and conditions agreed',           done: agreedToTerms },
            ].map(({ label, done }, i) => (
              <div key={i} className={`checklist-item ${done ? 'done' : 'pending'}`}>
                <i className={`fas ${done ? 'fa-check-circle' : 'fa-circle'}`}></i>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="submission-note">
          <div className="note-icon"><i className="fas fa-exclamation-triangle"></i></div>
          <div className="note-content">
            <h4>Important Notice</h4>
            <p>
              After submission you will receive a confirmation email with your application ID.
              Keep this ID for all future communications. Processing may take 4–6 weeks.
            </p>
          </div>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="applicationpersonal-form-actions">
        <button type="button" className="btn-secondary" onClick={handleBack} disabled={isSubmitting}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <button
          type="button"
          className="applicationpersonal-btn-primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !agreedToTerms || !overallComplete}
          title={!overallComplete ? 'Complete all sections before submitting' : ''}
        >
          {isSubmitting
            ? <><span className="loading-spinner"></span> Submitting…</>
            : <><i className="fas fa-paper-plane"></i> Submit Application</>
          }
        </button>
      </div>

    </div>
  );
};

export default ApplicationPreview;