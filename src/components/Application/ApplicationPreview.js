// src/components/ApplicationPreview.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ApplicationPreview.css';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn .25s ease',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px',
        maxWidth: 500, width: '90%', textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,.25)',
        animation: 'slideUp .3s ease',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg,#16a34a,#22c55e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 32,
          boxShadow: '0 8px 24px rgba(22,163,74,.35)',
        }}>✓</div>

        <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 22, fontWeight: 700 }}>
          Application Submitted!
        </h2>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
          Your application has been received and is under review.
        </p>

        {/* App ID */}
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 10, padding: '14px 20px', marginBottom: 20,
        }}>
          <p style={{ margin: '0 0 4px', color: '#1e40af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Application ID
          </p>
          <p style={{ margin: 0, color: '#1e3a5f', fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>
            {applicationId}
          </p>
        </div>

        {/* Email info */}
        {primaryEmail && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: '12px 16px', marginBottom: 24, textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>📧</span>
              <div>
                <p style={{ margin: '0 0 4px', color: '#166534', fontSize: 13 }}>
                  Confirmation email sent to:
                </p>
                <p style={{ margin: 0, color: '#166534', fontSize: 13, fontWeight: 700 }}>
                  {primaryEmail}
                </p>

              </div>
            </div>
          </div>
        )}

        <div style={{
          background: '#fefce8', border: '1px solid #fde68a',
          borderRadius: 8, padding: '14px 16px', marginBottom: 28, textAlign: 'left',
        }}>
          <p style={{ margin: '0 0 8px', color: '#92400e', fontWeight: 700, fontSize: 13 }}>
            What happens next?
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#78350f', fontSize: 13, lineHeight: 1.8 }}>
            <li>Our team will review your application within <strong>4–6 weeks</strong>.</li>
            <li>You will receive an email if additional info is needed.</li>
            <li>A final decision letter will be sent to your email.</li>
          </ul>
        </div>

        <button onClick={onClose} style={{
          width: '100%', padding: '14px 0',
          background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
          color: '#fff', border: 'none', borderRadius: 10,
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(37,99,235,.4)',
        }}>
          Go to Confirmation Page →
        </button>
      </div>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
    </div>
  );
};

/* ──────────────────────────────────────────────────
   RESEND EMAIL MODAL  ← NEW
   Shows when "View Confirmation" is clicked on an
   already-submitted application. Lets admin / student
   verify which email will receive the confirmation
   and re-trigger the send.
────────────────────────────────────────────────── */
const ResendEmailModal = ({ applicationId, loginEmail, personalEmail, onClose }) => {
  const [isSending,  setIsSending]  = useState(false);
  const [sent,       setSent]       = useState(false);
  const [sendError,  setSendError]  = useState('');

  const handleResend = async () => {
    setIsSending(true);
    setSendError('');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_URL}/api/application/preview/resend-email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

  // Only show login email — personal info email is irrelevant for sending
  const primaryEmail = loginEmail || '';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '36px 32px',
        maxWidth: 480, width: '90%',
        boxShadow: '0 25px 60px rgba(0,0,0,.25)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 700 }}>
            Confirmation Email
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 22,
            cursor: 'pointer', color: '#94a3b8', lineHeight: 1,
          }}>×</button>
        </div>

        {/* App ID */}
        <div style={{
          background: '#f8fafc', borderRadius: 8, padding: '12px 16px', marginBottom: 20,
          border: '1px solid #e2e8f0',
        }}>
          <p style={{ margin: '0 0 2px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Application ID</p>
          <p style={{ margin: 0, color: '#1e3a5f', fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>{applicationId}</p>
        </div>

        {/* Email recipients */}
        <p style={{ margin: '0 0 10px', color: '#374151', fontSize: 14, fontWeight: 600 }}>
          Email will be sent to:
        </p>

        {/* Login email */}
        <div style={{
          background: primaryEmail ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${primaryEmail ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: 8, padding: '10px 14px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>📧</span>
          <div>
            <p style={{ margin: '0 0 2px', color: '#374151', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
              Login / Account Email
            </p>
            <p style={{ margin: 0, color: '#166534', fontSize: 14, fontWeight: 700 }}>
              {loginEmail || <span style={{ color: '#dc2626', fontStyle: 'italic' }}>Not found in token</span>}
            </p>
          </div>
        </div>

        {/* Only login email is used for sending */}

        {/* Success / Error states */}
        {sent && (
          <div style={{
            background: '#dcfce7', border: '1px solid #16a34a',
            borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            color: '#166534', fontSize: 14, fontWeight: 600, textAlign: 'center',
          }}>
            ✅ Email sent successfully! Check your inbox.
          </div>
        )}

        {sendError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            color: '#dc2626', fontSize: 13,
          }}>
            ❌ {sendError}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px 0',
            background: '#f1f5f9', color: '#374151',
            border: '1px solid #e2e8f0', borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Close
          </button>
          <button
            onClick={handleResend}
            disabled={isSending || sent}
            style={{
              flex: 2, padding: '12px 0',
              background: sent
                ? '#dcfce7'
                : isSending
                  ? '#94a3b8'
                  : 'linear-gradient(135deg,#1e3a5f,#2563eb)',
              color: sent ? '#166534' : '#fff',
              border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: isSending || sent ? 'not-allowed' : 'pointer',
              boxShadow: isSending || sent ? 'none' : '0 4px 12px rgba(37,99,235,.35)',
            }}
          >
            {isSending ? '⏳ Sending…' : sent ? '✅ Sent!' : '📧 Resend Confirmation Email'}
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

  const getAuthToken = () => localStorage.getItem('token');

  const getLoginEmailFromToken = () => {
    try {
      const token = getAuthToken();
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || '';
    } catch { return ''; }
  };

  const loadPreview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = getAuthToken();
      if (!token) { setIsLoading(false); return; }

      const jwtEmail = getLoginEmailFromToken();
      if (jwtEmail) setLoginEmail(jwtEmail);

      const { data } = await axios.get(`${API_URL}/api/application/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      const token = getAuthToken();
      if (!token) return;
      await axios.patch(
        `${API_URL}/api/application/preview/terms`,
        { agreed: checked },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
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
      const token = getAuthToken();
      if (!token) { alert('Please login to submit.'); return; }

      const { data } = await axios.post(
        `${API_URL}/api/application/preview/submit`,
        { agreedToTerms: true },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

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
      <div className="form-section">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your application preview…</p>
        </div>
      </div>
    );
  }

  const isSubmitted     = applicationStatus === 'submitted';
  const overallComplete = completionStatus.overall;

  return (
    <div className="form-section">

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
      <div className="section-header">
        <div className="section-number">9</div>
        <div>
          <h2 className="section-title">Application Preview</h2>
          <p className="section-subtitle">Review all information before final submission</p>
        </div>
      </div>

      {/* Submitted banner */}
      {isSubmitted && (
        <div style={{
          background: '#f0fdf4', border: '2px solid #16a34a',
          borderRadius: 10, padding: '16px 22px', marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <span style={{ fontSize: 26 }}>✅</span>
          <div>
            <p style={{ margin: '0 0 4px', color: '#166534', fontWeight: 700, fontSize: 15 }}>
              Application Already Submitted
            </p>
            <p style={{ margin: '0 0 2px', color: '#166534', fontSize: 13 }}>
              Application ID: <strong>{applicationId}</strong>
            </p>
            <p style={{ margin: 0, color: '#166534', fontSize: 13 }}>
              Confirmation sent to: <strong>{loginEmail || 'your login email'}</strong>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert" style={{ whiteSpace: 'pre-line' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close-btn">×</button>
        </div>
      )}

      {!isSubmitted && (
        <div className="info-box">
          <p className="info-text">
            Please review all your information carefully. Once submitted, you <strong>cannot edit</strong> your application.
          </p>
        </div>
      )}

      <div className="preview-actions">
        <button className="action-btn print-btn" onClick={() => window.print()}>Print</button>
        <button className="action-btn pdf-btn"   onClick={() => alert('Use Print → Save as PDF')}>PDF</button>
        <button className="action-btn refresh-btn" onClick={loadPreview} disabled={isLoading}>Refresh</button>
      </div>

      <div className="application-summary">

        <div className="applicationpreview-summary-header">
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
              {applicationStatus.replace('_', ' ')}
            </span>
          </div>
        </div>

        {sections.length === 0 ? (
          <div className="no-data-message">
            <p>No application data found. Please fill in your details first.</p>
          </div>
        ) : (
          sections.map((section, si) => (
            <div key={si} className="preview-section">
              <h3 className="preview-section-title">
                <span className="section-number">{si + 1}</span>
                {section.title}
              </h3>
              <div className="preview-grid">
                {section.data.map((item, ii) => (
                  <div key={ii} className="preview-item">
                    <div className="preview-label">{item.label}:</div>
                    <div className={`preview-value ${!item.value || item.value === 'Not provided' || item.value === 'Not uploaded' ? 'empty-value' : ''}`}>
                      {formatValue(item.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {Object.keys(completionStatus).filter(k => k !== 'overall').length > 0 && (
          <div className="preview-section">
            <h3 className="preview-section-title">
              <span className="section-number">{sections.length + 1}</span>
              Completion Status
            </h3>
            <div className="completion-status-bar">
              {Object.entries(completionStatus)
                .filter(([key]) => key !== 'overall')
                .map(([key, done]) => (
                  <span key={key} className={`completion-pill ${done ? 'complete' : 'incomplete'}`}>
                    {COMPLETION_LABELS[key] || key}
                  </span>
                ))}
            </div>
          </div>
        )}

        {!isSubmitted && (
          <div className="declaration-section">
            <h3 className="preview-section-title">
              <span className="section-number">{sections.length + 2}</span>
              Declaration
            </h3>
            <div className="declaration-card">
              <div className="declaration-text">
                <p>I hereby declare that all information provided in this application is true, complete, and accurate to the best of my knowledge.</p>
                <p>I agree to abide by the rules and regulations of the university and understand that all decisions made by the admissions committee are final.</p>
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
        )}
      </div>

      {!isSubmitted && (
        <div className="final-submission">
          <div className="submission-checklist">
            <h3 className="subsection-title">Final Checklist</h3>
            <div className="checklist">
              {[
                { label: 'Personal information completed',      done: completionStatus.personalDone },
                { label: 'Address provided',                    done: completionStatus.addressDone },
                { label: 'Entrance qualification filled',       done: completionStatus.languageDone },
                { label: 'Higher education filled',             done: completionStatus.educationDone },
                { label: 'Required documents uploaded',         done: completionStatus.documentsDone },
                { label: 'Special needs declaration completed', done: completionStatus.specialNeedDone },
                { label: 'Terms and conditions agreed',         done: agreedToTerms },
              ].map(({ label, done }, i) => (
                <div key={i} className={`checklist-item ${done ? 'done' : 'pending'}`}>
                  <span className="checklist-marker">{done ? '✓' : '○'}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="submission-note">
            <div className="note-content">
              <h4>Important Notice</h4>
              <p>After submission you will receive a confirmation email. Keep your Application ID for all future communications. Processing may take 4–6 weeks.</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <div className="applicationpersonal-form-actions">
        <button type="button" className="btn-secondary" onClick={handleBack} disabled={isSubmitting}>
          Back
        </button>

        {!isSubmitted ? (
          <button
            type="button"
            className="applicationpersonal-btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !agreedToTerms || !overallComplete}
            title={!overallComplete ? 'Complete all sections before submitting' : ''}
          >
            {isSubmitting
              ? <><span className="spinner-small" style={{ marginRight: 8 }}></span>Submitting…</>
              : '🚀 Submit Application'}
          </button>
        ) : (
          /* Opens ResendEmailModal so student can verify email & resend */
          <button
            type="button"
            className="applicationpersonal-btn-primary"
            onClick={() => setShowResendModal(true)}
          >
            📧 View Confirmation & Resend Email
          </button>
        )}
      </div>

    </div>
  );
};

export default ApplicationPreview;