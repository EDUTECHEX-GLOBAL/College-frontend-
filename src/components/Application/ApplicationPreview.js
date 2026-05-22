// src/components/ApplicationPreview.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import './ApplicationPreview.css';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'; // ✅ kept ONLY for image URL construction in formatValue

const COMPLETION_LABELS = {
  personalDone:    'Personal Info',
  addressDone:     'Address',
  educationDone:   'Higher Education',
  languageDone:    'Entrance Qualification',
  documentsDone:   'Documents',
  specialNeedDone: 'Special Needs',
};

/* ──────────────────────────────────────────────────
   SUCCESS MODAL
────────────────────────────────────────────────── */
const SuccessModal = ({ applicationId, loginEmail, personalEmail, onClose }) => {
  const primaryEmail = loginEmail || '';

  return (
    <div className="applicationpreview-success-modal-overlay">
      <div className="applicationpreview-success-modal">
        <div className="applicationpreview-success-icon">✓</div>

        <h2 className="applicationpreview-success-title">
          Application Submitted!
        </h2>
        <p className="applicationpreview-success-subtitle">
          Your application has been received and is under review.
        </p>

        {/* App ID */}
        <div className="applicationpreview-app-id-card">
          <p className="applicationpreview-app-id-label">
            Application ID
          </p>
          <p className="applicationpreview-app-id-value">
            {applicationId}
          </p>
        </div>

        {/* Email info */}
        {primaryEmail && (
          <div className="applicationpreview-email-card">
            <div className="applicationpreview-email-content">
              <div>
                <p className="applicationpreview-email-label">
                  Confirmation email sent to:
                </p>
                <p className="applicationpreview-email-address">
                  {primaryEmail}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="applicationpreview-next-steps-card">
          <p className="applicationpreview-next-steps-title">
            What happens next?
          </p>
          <ul className="applicationpreview-next-steps-list">
            <li>Our team will review your application within <strong>4–6 weeks</strong>.</li>
            <li>You will receive an email if additional info is needed.</li>
            <li>A final decision letter will be sent to your email.</li>
          </ul>
        </div>

        <button onClick={onClose} className="applicationpreview-success-button">
          Go to Confirmation Page →
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────
   RESEND EMAIL MODAL
────────────────────────────────────────────────── */
const ResendEmailModal = ({ applicationId, loginEmail, personalEmail, onClose }) => {
  const [isSending,  setIsSending]  = useState(false);
  const [sent,       setSent]       = useState(false);
  const [sendError,  setSendError]  = useState('');

  const handleResend = async () => {
    setIsSending(true);
    setSendError('');
    try {
      // ✅ Rule 4: token used only for null check
      const token = localStorage.getItem('token');
      if (!token) return;

      // ✅ Rule 3: axiosInstance with clean path, no manual headers
      const { data } = await axiosInstance.post('/api/application/preview/resend-email', {});
      if (data.success) {
        setSent(true);
      } else {
        setSendError(data.message || 'Failed to resend email.');
      }
    } catch (err) {
      setSendError(err.response?.data?.message || 'Failed to resend. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const primaryEmail = loginEmail || '';

  return (
    <div className="applicationpreview-resend-modal-overlay">
      <div className="applicationpreview-resend-modal">
        {/* Header */}
        <div className="applicationpreview-resend-modal-header">
          <h2 className="applicationpreview-resend-modal-title">
            Confirmation Email
          </h2>
          <button onClick={onClose} className="applicationpreview-resend-modal-close">
            ×
          </button>
        </div>

        {/* App ID */}
        <div className="applicationpreview-resend-app-id">
          <p className="applicationpreview-resend-app-id-label">Application ID</p>
          <p className="applicationpreview-resend-app-id-value">{applicationId}</p>
        </div>

        {/* Email recipients */}
        <p className="applicationpreview-resend-email-heading">
          Email will be sent to:
        </p>

        {/* Login email */}
        <div className={`applicationpreview-resend-email-row ${primaryEmail ? 'success' : 'error'}`}>
          <div>
            <p className="applicationpreview-resend-email-type">
              Login / Account Email
            </p>
            <p className="applicationpreview-resend-email-value">
              {loginEmail || <span className="applicationpreview-resend-email-missing">Not found in token</span>}
            </p>
          </div>
        </div>

        {/* Success / Error states */}
        {sent && (
          <div className="applicationpreview-resend-success">
            Email sent successfully! Check your inbox.
          </div>
        )}

        {sendError && (
          <div className="applicationpreview-resend-error">
            {sendError}
          </div>
        )}

        {/* Buttons */}
        <div className="applicationpreview-resend-buttons">
          <button onClick={onClose} className="applicationpreview-resend-close-btn">
            Close
          </button>
          <button
            onClick={handleResend}
            disabled={isSending || sent}
            className={`applicationpreview-resend-send-btn ${sent ? 'sent' : ''}`}
          >
            {isSending ? 'Sending…' : sent ? 'Sent!' : 'Resend Confirmation Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────── */
const ApplicationPreview = ({ onInputChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sections,          setSections]          = useState([]);
  const [applicationId,     setApplicationId]     = useState('');
  const [previewDate,       setPreviewDate]       = useState('');
  const [applicationStatus, setApplicationStatus] = useState('draft');
  const [agreedToTerms,     setAgreedToTerms]     = useState(false);
  const [completionStatus,  setCompletionStatus]  = useState({});
  const [isLoading,         setIsLoading]         = useState(true);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [isSavingTerms,     setIsSavingTerms]     = useState(false);
  const [error,             setError]             = useState('');

  const [loginEmail,        setLoginEmail]        = useState('');
  const [personalEmail,     setPersonalEmail]     = useState('');

  const [showSuccessModal,  setShowSuccessModal]  = useState(false);
  const [showResendModal,   setShowResendModal]   = useState(false);
  const [submittedAppId,    setSubmittedAppId]    = useState('');

  const getLoginEmailFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || '';
    } catch { return ''; }
  };

  const loadPreview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // ✅ Rule 4: token used only for null check
      const token = localStorage.getItem('token');
      if (!token) { setIsLoading(false); return; }

      const jwtEmail = getLoginEmailFromToken();
      if (jwtEmail) setLoginEmail(jwtEmail);

      // ✅ Rule 3: axiosInstance with clean path, no manual headers
      const { data } = await axiosInstance.get('/api/application/preview');

      if (data.success) {
        const { sections, applicationId, previewDate, agreedToTerms, completionStatus, applicationStatus } = data.preview;

        setSections(sections || []);
        setApplicationId(applicationId || '');
        setPreviewDate(previewDate ? new Date(previewDate).toLocaleDateString() : new Date().toLocaleDateString());
        setAgreedToTerms(agreedToTerms || false);
        setCompletionStatus(completionStatus || {});
        setApplicationStatus(applicationStatus || 'draft');
        if (onInputChange) onInputChange('agreedToTerms', agreedToTerms || false);

        if (sections?.length > 0) {
          const personalSection = sections.find(s => s.title === 'Personal Information');
          if (personalSection) {
            const emailRow = personalSection.data.find(d => d.label === 'Email');
            if (emailRow?.value && emailRow.value !== 'Not provided') {
              setPersonalEmail(emailRow.value);
            }
          }
        }

        if (applicationStatus === 'submitted' && applicationId) {
          setSubmittedAppId(applicationId);
        }
      }
    } catch (err) {
      console.error('loadPreview error:', err);
      setError(err.response?.data?.message || 'Failed to load application preview.');
    } finally {
      setIsLoading(false);
    }
  }, [onInputChange]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  const handleTermsChange = async (e) => {
    const checked = e.target.checked;
    setAgreedToTerms(checked);
    if (onInputChange) onInputChange('agreedToTerms', checked);
    try {
      setIsSavingTerms(true);

      // ✅ Rule 4: token used only for null check
      const token = localStorage.getItem('token');
      if (!token) return;

      // ✅ Rule 3: axiosInstance with clean path, no manual headers
      await axiosInstance.patch('/api/application/preview/terms', { agreed: checked });
    } catch (err) {
      console.error('saveTerms error:', err);
      setAgreedToTerms(!checked);
      if (onInputChange) onInputChange('agreedToTerms', !checked);
    } finally {
      setIsSavingTerms(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!agreedToTerms) { alert('Please agree to the terms and conditions before submitting.'); return; }
    if (!window.confirm('Are you sure you want to submit your application? This cannot be undone.')) return;

    setIsSubmitting(true);
    setError('');

    try {
      // ✅ Rule 4: token used only for null check
      const token = localStorage.getItem('token');
      if (!token) { alert('Please login to submit.'); return; }

      // ✅ Rule 3: axiosInstance with clean path, no manual headers
      const { data } = await axiosInstance.post('/api/application/preview/submit', { agreedToTerms: true });

      if (data.success) {
        setSubmittedAppId(data.applicationId);
        setApplicationStatus('submitted');
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('submit error:', err);
      const missing = err.response?.data?.missingFields;
      if (missing?.length > 0) {
        setError(`Application incomplete. Please fill in:\n• ${missing.join('\n• ')}`);
      } else {
        setError(err.response?.data?.message || 'Failed to submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    const targetPath = location.pathname.includes('/preview')
      ? location.pathname.replace('/preview', '/confirmation')
      : '/firstyear/dashboard/application/confirmation';
    navigate(targetPath);
  };

  const handleBack = () => {
    const back = location.pathname.includes('/preview')
      ? location.pathname.replace('/preview', '/special-needs')
      : '/firstyear/dashboard/application/special-needs';
    navigate(back);
  };

  // ✅ API_URL kept here only — used for building image src, NOT for API calls
  const formatValue = (value) => {
    if (!value || value === 'Not provided' || value === 'Not uploaded') return 'Not provided';
    if (typeof value === 'string' && (value.match(/\.(jpg|jpeg|png|gif|svg)$/i) || value.includes('/uploads/'))) {
      return (
        <img
          src={value.startsWith('http') ? value : `${API_URL}${value}`}
          alt="Uploaded document"
          onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.textContent = 'Image failed to load'; }}
        />
      );
    }
    return value;
  };

  if (isLoading) {
    return (
      <div className="applicationpreview-form-section">
        <div className="applicationpreview-loading-state">
          <div className="applicationpreview-loading-spinner"></div>
          <p>Loading your application preview…</p>
        </div>
      </div>
    );
  }

  const isSubmitted     = applicationStatus === 'submitted';
  const overallComplete = completionStatus.overall;

  return (
    <div className="applicationpreview-form-section">

      {/* Success modal — shown after fresh submit */}
      {showSuccessModal && (
        <SuccessModal
          applicationId={submittedAppId}
          loginEmail={loginEmail}
          personalEmail={personalEmail}
          onClose={handleModalClose}
        />
      )}

      {/* Resend modal — shown when "View Confirmation" clicked on already-submitted app */}
      {showResendModal && (
        <ResendEmailModal
          applicationId={applicationId}
          loginEmail={loginEmail}
          personalEmail={personalEmail}
          onClose={() => setShowResendModal(false)}
        />
      )}

      {/* Header */}
      <div className="applicationpreview-section-header">
        <div className="applicationpreview-section-number">9</div>
        <div>
          <h2 className="applicationpreview-section-title">Application Preview</h2>
          <p className="applicationpreview-section-subtitle">Review all information before final submission</p>
        </div>
      </div>

      {/* Submitted banner */}
      {isSubmitted && (
        <div className="applicationpreview-submitted-banner">
          <div>
            <p className="applicationpreview-submitted-title">
              Application Already Submitted
            </p>
            <p className="applicationpreview-submitted-id">
              Application ID: <strong>{applicationId}</strong>
            </p>
            <p className="applicationpreview-submitted-email">
              Confirmation sent to: <strong>{loginEmail || 'your login email'}</strong>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="applicationpreview-error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError('')} className="applicationpreview-error-close-btn">×</button>
        </div>
      )}

      {!isSubmitted && (
        <div className="applicationpreview-info-box">
          <p className="applicationpreview-info-text">
            Please review all your information carefully. Once submitted, you <strong>cannot edit</strong> your application.
          </p>
        </div>
      )}

      <div className="applicationpreview-preview-actions">
        <button className="applicationpreview-action-btn print-btn" onClick={() => window.print()}>Print</button>
        <button className="applicationpreview-action-btn pdf-btn"   onClick={() => alert('Use Print → Save as PDF')}>PDF</button>
        <button className="applicationpreview-action-btn refresh-btn" onClick={loadPreview} disabled={isLoading}>Refresh</button>
      </div>

      <div className="applicationpreview-application-summary">

        <div className="applicationpreview-summary-header">
          <div className="applicationpreview-applicant-id">
            <span className="applicationpreview-id-label">Application ID:</span>
            <span className="applicationpreview-id-value">{applicationId || '—'}</span>
          </div>
          <div className="applicationpreview-submission-date">
            <span className="applicationpreview-date-label">Preview Date:</span>
            <span className="applicationpreview-date-value">{previewDate}</span>
          </div>
          <div className="applicationpreview-app-status-badge">
            <span className={`applicationpreview-status-pill status-${applicationStatus}`}>
              {applicationStatus.replace('_', ' ')}
            </span>
          </div>
        </div>

        {sections.length === 0 ? (
          <div className="applicationpreview-no-data-message">
            <p>No application data found. Please fill in your details first.</p>
          </div>
        ) : (
          sections.map((section, si) => (
            <div key={si} className="applicationpreview-preview-section">
              <h3 className="applicationpreview-preview-section-title">
                <span className="applicationpreview-section-number-small">{si + 1}</span>
                {section.title}
              </h3>
              <div className="applicationpreview-preview-grid">
                {section.data.map((item, ii) => (
                  <div key={ii} className="applicationpreview-preview-item">
                    <div className="applicationpreview-preview-label">{item.label}:</div>
                    <div className={`applicationpreview-preview-value ${(!item.value || item.value === 'Not provided' || item.value === 'Not uploaded') ? 'empty-value' : ''}`}>
                      {formatValue(item.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {Object.keys(completionStatus).filter(k => k !== 'overall').length > 0 && (
          <div className="applicationpreview-preview-section">
            <h3 className="applicationpreview-preview-section-title">
              <span className="applicationpreview-section-number-small">{sections.length + 1}</span>
              Completion Status
            </h3>
            <div className="applicationpreview-completion-status-bar">
              {Object.entries(completionStatus)
                .filter(([key]) => key !== 'overall')
                .map(([key, done]) => (
                  <span key={key} className={`applicationpreview-completion-pill ${done ? 'complete' : 'incomplete'}`}>
                    {COMPLETION_LABELS[key] || key}
                  </span>
                ))}
            </div>
          </div>
        )}

        {!isSubmitted && (
          <div className="applicationpreview-declaration-section">
            <h3 className="applicationpreview-preview-section-title">
              <span className="applicationpreview-section-number-small">{sections.length + 2}</span>
              Declaration
            </h3>
            <div className="applicationpreview-declaration-card">
              <div className="applicationpreview-declaration-text">
                <p>I hereby declare that all information provided in this application is true, complete, and accurate to the best of my knowledge.</p>
                <p>I agree to abide by the rules and regulations of the university and understand that all decisions made by the admissions committee are final.</p>
              </div>
              <div className="applicationpreview-declaration-agreement">
                <div className="applicationpreview-checkbox-option large">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    checked={agreedToTerms}
                    onChange={handleTermsChange}
                    disabled={isSubmitting || isSavingTerms}
                  />
                  <label htmlFor="agreedToTerms">
                    I have read and agree to the terms and conditions
                    {isSavingTerms && <span className="applicationpreview-saving-indicator"> (saving…)</span>}
                  </label>
                </div>
              </div>
              <div className="applicationpreview-applicant-signature">
                <div className="applicationpreview-signature-line"></div>
                <div className="applicationpreview-signature-label">Applicant's Signature</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isSubmitted && (
        <div className="applicationpreview-final-submission">
          <div className="applicationpreview-submission-checklist">
            <h3 className="applicationpreview-subsection-title">Final Checklist</h3>
            <div className="applicationpreview-checklist">
              {[
                { label: 'Personal information completed',      done: completionStatus.personalDone },
                { label: 'Address provided',                    done: completionStatus.addressDone },
                { label: 'Entrance qualification filled',       done: completionStatus.languageDone },
                { label: 'Higher education filled',             done: completionStatus.educationDone },
                { label: 'Required documents uploaded',         done: completionStatus.documentsDone },
                { label: 'Special needs declaration completed', done: completionStatus.specialNeedDone },
                { label: 'Terms and conditions agreed',         done: agreedToTerms },
              ].map(({ label, done }, i) => (
                <div key={i} className={`applicationpreview-checklist-item ${done ? 'done' : 'pending'}`}>
                  <span className="applicationpreview-checklist-marker">{done ? '✓' : '○'}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="applicationpreview-submission-note">
            <div className="applicationpreview-note-content">
              <h4>Important Notice</h4>
              <p>After submission you will receive a confirmation email. Keep your Application ID for all future communications. Processing may take 4–6 weeks.</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <div className="applicationpreview-form-actions">
        <button type="button" className="applicationpreview-btn-secondary" onClick={handleBack} disabled={isSubmitting}>
          Back
        </button>

        {!isSubmitted ? (
          <button
            type="button"
            className="applicationpreview-btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !agreedToTerms || !overallComplete}
            title={!overallComplete ? 'Complete all sections before submitting' : ''}
          >
            {isSubmitting
              ? <>Submitting…</>
              : 'Submit Application'}
          </button>
        ) : (
          <button
            type="button"
            className="applicationpreview-btn-primary"
            onClick={() => setShowResendModal(true)}
          >
            View Confirmation and Resend Email
          </button>
        )}
      </div>

    </div>
  );
};

export default ApplicationPreview;