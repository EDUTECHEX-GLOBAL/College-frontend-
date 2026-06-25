// src/components/masterpreview.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './masterpreview.css';
import axiosInstance from './../../api/axiosInstance';



const formatFileName = (file) => {
  if (!file) return null;
  return file.originalName || file.fileName || file.name || null;
};

const isUploaded = (file) => {
  return !!(file && (file.originalName || file.fileName || file.name));
};

const REQUIRED_FIELDS = [
  'passport', 'photo', 'cert10th', 'cert12th',
  'bachelorTranscript', 'bachelorDegree', 'consolidatedMarksheet',
  'resumeCv', 'statementOfPurpose', 'lettersOfRecommendation', 'englishCertificate',
];

const DOCUMENT_LABELS = [
  { field: 'passport',                label: 'Passport / ID Proof' },
  { field: 'photo',                   label: 'Passport-Size Photo' },
  { field: 'cert10th',                label: '10th Grade Certificate' },
  { field: 'cert12th',                label: '12th Grade Certificate / Higher Secondary' },
  { field: 'bachelorTranscript',      label: "Bachelor's Degree Transcript" },
  { field: 'bachelorDegree',          label: "Bachelor's Degree Certificate" },
  { field: 'provisionalCertificate',  label: 'Provisional Certificate' },
  { field: 'consolidatedMarksheet',   label: 'Consolidated Marksheet' },
  { field: 'resumeCv',                label: 'Resume / CV' },
  { field: 'statementOfPurpose',      label: 'Statement of Purpose (SOP)' },
  { field: 'lettersOfRecommendation', label: 'Letters of Recommendation' },
  { field: 'englishCertificate',      label: 'English Language Proficiency' },
  { field: 'testScores',              label: 'Standardized Test Scores (GRE / GMAT)' },
  { field: 'workExperience',          label: 'Work Experience / Experience Letter' },
];

const TEST_DISPLAY = {
  sat:        { label: 'SAT',                   scoreFields: [{ key: 'total', label: 'Total' }, { key: 'math', label: 'Math' }, { key: 'ebrw', label: 'R&W' }, { key: 'percentile', label: 'Percentile' }] },
  act:        { label: 'ACT',                   scoreFields: [{ key: 'composite', label: 'Composite' }, { key: 'english', label: 'English' }, { key: 'math', label: 'Math' }, { key: 'reading', label: 'Reading' }, { key: 'science', label: 'Science' }] },
  satSubject: { label: 'SAT Subject Tests',     scoreFields: [{ key: 'subject', label: 'Subject' }, { key: 'score', label: 'Score' }] },
  ap:         { label: 'AP Subject Tests',      scoreFields: [{ key: 'subject', label: 'Subject' }, { key: 'score', label: 'Score' }] },
  ib:         { label: 'IB Subject Tests',      scoreFields: [{ key: 'subject', label: 'Subject' }, { key: 'level', label: 'Level' }, { key: 'score', label: 'Score' }] },
  cambridge:  { label: 'Cambridge Exams',       scoreFields: [{ key: 'subject', label: 'Subject' }, { key: 'level', label: 'Level' }, { key: 'grade', label: 'Grade' }] },
  toefl:      { label: 'TOEFL iBT',             scoreFields: [{ key: 'total', label: 'Total' }, { key: 'reading', label: 'Reading' }, { key: 'listening', label: 'Listening' }, { key: 'speaking', label: 'Speaking' }, { key: 'writing', label: 'Writing' }] },
  ielts:      { label: 'IELTS',                 scoreFields: [{ key: 'overall', label: 'Overall' }, { key: 'listening', label: 'Listening' }, { key: 'reading', label: 'Reading' }, { key: 'writing', label: 'Writing' }, { key: 'speaking', label: 'Speaking' }] },
  pte:        { label: 'PTE Academic',          scoreFields: [{ key: 'overall', label: 'Overall' }, { key: 'listening', label: 'Listening' }, { key: 'reading', label: 'Reading' }, { key: 'speaking', label: 'Speaking' }, { key: 'writing', label: 'Writing' }] },
  duolingo:   { label: 'Duolingo English Test', scoreFields: [{ key: 'overall', label: 'Overall' }, { key: 'literacy', label: 'Literacy' }, { key: 'comprehension', label: 'Comprehension' }, { key: 'conversation', label: 'Conversation' }, { key: 'production', label: 'Production' }] },
  gre:        { label: 'GRE',                   scoreFields: [{ key: 'total', label: 'Total' }, { key: 'verbal', label: 'Verbal' }, { key: 'quant', label: 'Quant' }, { key: 'analyticalWrite', label: 'AW' }] },
  gmat:       { label: 'GMAT',                  scoreFields: [{ key: 'total', label: 'Total' }, { key: 'verbal', label: 'Verbal' }, { key: 'quant', label: 'Quant' }, { key: 'dataInsights', label: 'Data Insights' }] },
};

const TEST_CATEGORIES = [
  { label: 'Undergraduate Admission', keys: ['sat', 'act'] },
  { label: 'Subject Tests',           keys: ['satSubject', 'ap', 'ib', 'cambridge'] },
  { label: 'English Proficiency',     keys: ['toefl', 'ielts', 'pte', 'duolingo'] },
  { label: 'Graduate Admission',      keys: ['gre', 'gmat'] },
];

const declarationStatements = [
  { title: 'Accuracy of information',  description: 'All information provided in this application is true, accurate, and complete to the best of my knowledge.' },
  { title: 'Legal responsibility',     description: 'I understand that providing false or misleading information may result in rejection, revocation of admission, or dismissal from the university.' },
  { title: 'Consent to verification', description: 'I consent to the university verifying any information submitted as part of this application process.' },
];

const STEP = { personal: 1, contact: 2, course: 3, academic: 4, tests: 5, documents: 6 };

/**
 * FIX: mergeSection — DB data wins unless it's completely empty
 * (no real field values). Prop data is only used as a fallback.
 */
const mergeSection = (fromDB, fromProps) => {
  if (!fromDB || typeof fromDB !== 'object') return fromProps || {};
  // Check if DB object has any meaningful (non-meta) data
  const SKIP_KEYS = new Set(['_id', '_isValid']);
  const hasMeaningfulData = Object.entries(fromDB).some(([k, v]) => {
    if (SKIP_KEYS.has(k)) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
    return v !== '' && v !== null && v !== undefined;
  });
  return hasMeaningfulData ? fromDB : (fromProps || {});
};

const pickMasterValue = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const getMasterUniversityName = (course = {}) =>
  pickMasterValue(
    course.applicationUniversityName,
    course.completedUniversityName,
    course.selectedUniversity?.name,
    course.selectedUniversity?.universityName,
    course.universityName,
    course.university
  ) || '—';

const getMasterCourseName = (course = {}) =>
  pickMasterValue(
    course.applicationProgramName,
    course.completedProgramName,
    course.selectedCourse?.programName,
    course.selectedCourse?.title,
    course.selectedCourse?.name,
    course.preferredCourse,
    course.programName
  ) || '—';

/* ── Test Scores Section ── */
const TestScoresSection = ({ tests }) => {
  if (!tests || typeof tests !== 'object') {
    return <div className="master-preview-empty">No test scores added</div>;
  }
  const activeCategories = TEST_CATEGORIES.map(cat => ({
    ...cat,
    activeTests: cat.keys.filter(key => Array.isArray(tests[key]) && tests[key].length > 0),
  })).filter(cat => cat.activeTests.length > 0);

  if (activeCategories.length === 0) {
    return <div className="master-preview-empty">No test scores added</div>;
  }
  return (
    <div className="master-preview-test-scores">
      {activeCategories.map(cat => (
        <div key={cat.label} className="master-preview-test-category">
          <p className="master-preview-test-category-title">{cat.label}</p>
          <div className="master-preview-test-list">
            {cat.activeTests.map(testKey => {
              const display     = TEST_DISPLAY[testKey];
              const attempts    = tests[testKey];
              const futureDates = tests[`${testKey}_futureDates`] || [];
              return (
                <div key={testKey} className="master-preview-test-card">
                  <div className="master-preview-test-header">
                    <span className="master-preview-test-dot"></span>
                    <span className="master-preview-test-name">{display.label}</span>
                    {attempts.length > 1 && (
                      <span className="master-preview-test-attempt-badge">{attempts.length} attempts</span>
                    )}
                  </div>
                  {attempts.map((attempt, idx) => (
                    <div key={idx} className="master-preview-test-attempt">
                      {attempts.length > 1 && (
                        <p className="master-preview-test-attempt-label">
                          Attempt {idx + 1}{attempt.testDate && ` — ${attempt.testDate}`}
                        </p>
                      )}
                      <div className="master-preview-test-score-grid">
                        {attempts.length === 1 && attempt.testDate && (
                          <div className="master-preview-test-score-box">
                            <span className="master-preview-test-score-label">Test Date</span>
                            <span className="master-preview-test-score-value">{attempt.testDate}</span>
                          </div>
                        )}
                        {display.scoreFields.map(sf => {
                          const val = attempt[sf.key];
                          if (val === undefined || val === null || val === '') return null;
                          return (
                            <div key={sf.key} className="master-preview-test-score-box">
                              <span className="master-preview-test-score-label">{sf.label}</span>
                              <span className="master-preview-test-score-value">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {futureDates.length > 0 && (
                    <div className="master-preview-test-future-dates">
                      <span className="master-preview-test-future-label">Planned:</span>
                      <span className="master-preview-test-future-value">
                        {futureDates.filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Success Modal ── */
// eslint-disable-next-line no-unused-vars
const SuccessModal = ({ applicationId, loginEmail, universityName, courseName, onClose }) => {
  const hasUniversity = universityName && universityName !== '—';
  const hasCourse = courseName && courseName !== '—';
  return (
    <div className="master-preview-success-overlay">
      <div className="master-preview-success-modal">
        <div className="master-preview-success-icon"></div>
        <h2 className="master-preview-success-title">Application Submitted!</h2>
        <p className="master-preview-success-subtitle">
          {hasUniversity
            ? `Your application to ${universityName} has been received and is under review.`
            : 'Your application has been received and is under review.'}
        </p>
        <div className="master-preview-success-id-card">
          <p className="master-preview-success-id-label">Application ID</p>
          <p className="master-preview-success-id-value">{applicationId}</p>
        </div>
        {(hasUniversity || hasCourse) && (
          <div className="master-preview-selection-card">
            {hasUniversity && (
              <div className="master-preview-selection-row">
                <p className="master-preview-selection-label">University Applied To</p>
                <p className="master-preview-selection-value">{universityName}</p>
              </div>
            )}
            {hasCourse && (
              <div className="master-preview-selection-row">
                <p className="master-preview-selection-label">Course / Programme</p>
                <p className="master-preview-selection-value">{courseName}</p>
              </div>
            )}
          </div>
        )}
        {loginEmail && (
          <div className="master-preview-success-email-card">
            <p className="master-preview-success-email-label">Confirmation email sent to:</p>
            <p className="master-preview-success-email-address">{loginEmail}</p>
            <p className="master-preview-success-email-hint">
              Your application summary PDF is attached to the email for your records.
            </p>
          </div>
        )}
        <div className="master-preview-success-next-steps">
          <p className="master-preview-success-steps-title">What happens next?</p>
          <ul className="master-preview-success-steps-list">
            <li>Our team will review your application within 4–6 weeks.</li>
            <li>You will receive an email if additional info is needed.</li>
            <li>A final decision letter will be sent to your email.</li>
          </ul>
        </div>
        <button onClick={onClose} className="master-preview-success-btn">
          Close
        </button>
      </div>
    </div>
  );
};

/* ── Resend Email Modal ── */
const ApplicationSubmittedModal = ({
  applicationId,
  loginEmail,
  universityName,
  courseName,
  onDownloadPDF,
  isDownloadingPDF,
  pdfDownloaded,
  onResendEmail,
}) => {
  const [copyToast, setCopyToast] = useState('');
  const [showConfetti, setShowConfetti] = useState(true);
  const displayedApplicationId = applicationId || 'Pending';
  const displayedUniversityName = universityName && universityName !== '—' ? universityName : 'Not available';
  const displayedCourseName = courseName && courseName !== '—' ? courseName : 'Not available';
  const displayedEmail = loginEmail || 'Not available';

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyApplicationId = async () => {
    try {
      await navigator.clipboard.writeText(displayedApplicationId);
      setCopyToast('Application ID copied');
      setTimeout(() => setCopyToast(''), 2200);
    } catch {
      setCopyToast('Copy failed');
      setTimeout(() => setCopyToast(''), 2200);
    }
  };

  const handleGoToDashboard = () => {
    window.location.assign('/firstyear/dashboard');
  };

  return (
    <div className="master-preview-success-overlay">
      {showConfetti && (
        <div className="master-preview-confetti" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} style={{ '--i': index }} />
          ))}
        </div>
      )}

      <div className="master-preview-success-modal master-preview-success-modal--redesigned">
        {copyToast && <div className="master-preview-copy-toast">{copyToast}</div>}

        <div className="master-preview-success-header">
          <div className="master-preview-success-icon"></div>
          <h2 className="master-preview-success-title">Application Submitted Successfully</h2>
          <p className="master-preview-success-subtitle">
            Your application has been submitted and is currently under review.
          </p>
        </div>

        <div className="master-preview-success-id-card">
          <div className="master-preview-success-id-main">
            <p className="master-preview-success-id-label">Application ID</p>
            <p className="master-preview-success-id-value">{displayedApplicationId}</p>
          </div>
          <button type="button" className="master-preview-copy-id-btn" onClick={handleCopyApplicationId}>
            Copy ID
          </button>
        </div>

        <div className="master-preview-selection-card">
          <div className="master-preview-selection-row">
            <span className="master-preview-selection-icon" aria-hidden="true">🏛</span>
            <div>
              <p className="master-preview-selection-type">University</p>
              <p className="master-preview-selection-label">University Applied To</p>
              <p className="master-preview-selection-value">{displayedUniversityName}</p>
            </div>
          </div>
          <div className="master-preview-selection-row">
            <span className="master-preview-selection-icon" aria-hidden="true">🎓</span>
            <div>
              <p className="master-preview-selection-type">Programme</p>
              <p className="master-preview-selection-label">Programme Selected</p>
              <p className="master-preview-selection-value">{displayedCourseName}</p>
            </div>
          </div>
        </div>

        <div className="master-preview-success-email-card">
          <div className="master-preview-success-email-copy">
            <span className="master-preview-email-icon" aria-hidden="true">📧</span>
            <div>
              <p className="master-preview-success-email-label">Confirmation Sent</p>
              <p className="master-preview-success-email-address">{displayedEmail}</p>
              <p className="master-preview-success-email-hint">Application summary PDF attached.</p>
            </div>
          </div>
          <button type="button" className="master-preview-resend-inline-btn" onClick={onResendEmail}>
            Resend Email
          </button>
        </div>

        <div className="master-preview-success-next-steps">
          <p className="master-preview-success-steps-title">Next Steps</p>
          <div className="master-preview-success-timeline">
            {[
              'Application Submitted',
              'Under Review',
              'Additional Documents (if required)',
              'Admission Decision',
            ].map((step) => (
              <div key={step} className="master-preview-success-timeline-row">
                <span className="master-preview-success-timeline-check">✓</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="master-preview-review-time">
            <span>Estimated Review Time:</span>
            <strong>4-6 Weeks</strong>
          </div>
        </div>

        <div className="master-preview-success-actions">
          <button
            type="button"
            className={`master-preview-success-action-btn ${pdfDownloaded ? 'is-downloaded' : ''}`}
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF}
          >
            {isDownloadingPDF ? 'Generating PDF...' : pdfDownloaded ? '✓ PDF Downloaded' : 'Download PDF'}
          </button>
          <button
            type="button"
            className="master-preview-success-action-btn master-preview-success-action-btn--primary"
            onClick={handleGoToDashboard}
          >
            Go To Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

const ResendEmailModal = ({ applicationId, loginEmail, universityName, courseName, onClose }) => {
  const [isSending, setIsSending] = useState(false);
  const [sent,      setSent]      = useState(false);
  const [sendError, setSendError] = useState('');
  const hasUniversity = universityName && universityName !== '—';
  const hasCourse = courseName && courseName !== '—';

  const handleResend = async () => {
    setIsSending(true);
    setSendError('');
    try {
      const res = await axiosInstance.post('/api/master-preview/resend-email');
      const data = res.data;
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

  return (
    <div className="master-preview-resend-overlay">
      <div className="master-preview-resend-modal">
        <div className="master-preview-resend-header">
          <h2 className="master-preview-resend-title">Confirmation Email</h2>
          <button onClick={onClose} className="master-preview-resend-close">×</button>
        </div>
        <div className="master-preview-resend-id">
          <p className="master-preview-resend-id-label">Application ID</p>
          <p className="master-preview-resend-id-value">{applicationId}</p>
        </div>
        {(hasUniversity || hasCourse) && (
          <div className="master-preview-selection-card master-preview-selection-card--resend">
            {hasUniversity && (
              <div className="master-preview-selection-row">
                <p className="master-preview-selection-label">University Applied To</p>
                <p className="master-preview-selection-value">{universityName}</p>
              </div>
            )}
            {hasCourse && (
              <div className="master-preview-selection-row">
                <p className="master-preview-selection-label">Course / Programme</p>
                <p className="master-preview-selection-value">{courseName}</p>
              </div>
            )}
          </div>
        )}
        <p className="master-preview-resend-email-heading">Email will be sent to:</p>
        <div className={`master-preview-resend-email-row ${loginEmail ? 'success' : 'error'}`}>
          <p className="master-preview-resend-email-type">Login / Account Email</p>
          <p className="master-preview-resend-email-value">
            {loginEmail || <span className="master-preview-resend-email-missing">Not found</span>}
          </p>
        </div>
        <div className="master-preview-resend-attach-note">
          The email will include your application summary as a PDF attachment.
        </div>
        {sent && (
          <div className="master-preview-resend-success">
            Email sent successfully! Check your inbox.
          </div>
        )}
        {sendError && (
          <div className="master-preview-resend-error">{sendError}</div>
        )}
        <div className="master-preview-resend-buttons">
          <button onClick={onClose} className="master-preview-resend-close-btn">Close</button>
          <button
            onClick={handleResend}
            disabled={isSending || sent}
            className={`master-preview-resend-send-btn ${sent ? 'sent' : ''}`}
          >
            {isSending ? 'Sending…' : sent ? 'Sent ✓' : 'Resend Confirmation Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const MasterPreview = ({ data, updateData, onEdit, onSubmitSuccess }) => {

  // FIX: seed initial state from props immediately (avoids flash of empty content)
  const [previewData, setPreviewData] = useState(() => ({
    personal:  data?.personal  || {},
    contact:   data?.contact   || {},
    course:    data?.course    || {},
    academic:  data?.academic  || {},
    tests:     data?.tests     || {},
    documents: data?.documents || {},
  }));

  const [loading,           setLoading]           = useState(true);
  const [fetchError,        setFetchError]        = useState(null);
  const [agreed,            setAgreed]            = useState(data?.declaration || false);
  const [showWarning,       setShowWarning]       = useState(false);

  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [isDownloadingPDF,  setIsDownloadingPDF]  = useState(false);
  const [pdfDownloaded,     setPdfDownloaded]     = useState(false);
  const [submitError,       setSubmitError]       = useState('');
  const [applicationStatus, setApplicationStatus] = useState('draft');
  const [applicationId,     setApplicationId]     = useState('');
  const [loginEmail,        setLoginEmail]        = useState('');
  const [submittedUniversityName, setSubmittedUniversityName] = useState('');
  const [submittedCourseName,     setSubmittedCourseName]     = useState('');
  const [showSuccessModal,  setShowSuccessModal]  = useState(false);
  const [showResendModal,   setShowResendModal]   = useState(false);

  const fetchedOnce   = useRef(false);
  const lastAgreedRef = useRef(agreed);

  // FIX: stable helper — does not recreate on every render
  const getLoginEmailFromToken = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || '';
    } catch { return ''; }
  }, []);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    const token    = localStorage.getItem('token');
    const jwtEmail = getLoginEmailFromToken();
    if (jwtEmail) setLoginEmail(jwtEmail);

    const fetchPreview = async () => {
      try {
        const res = await axiosInstance.get('/api/master-preview');
        const json = res.data;
        if (json.success && json.data) {
          const db    = json.data;
          // FIX: use current props snapshot captured at mount — no stale closure
          const props = {
            personal:  data?.personal  || {},
            contact:   data?.contact   || {},
            course:    data?.course    || {},
            academic:  data?.academic  || {},
            tests:     data?.tests     || {},
            documents: data?.documents || {},
          };

          // DB data wins over prop data where DB has real content
          setPreviewData({
            personal:  mergeSection(db.personal,  props.personal),
            contact:   mergeSection(db.contact,   props.contact),
            course:    mergeSection(db.course,    props.course),
            academic:  mergeSection(db.academic,  props.academic),
            tests:     mergeSection(db.tests,     props.tests),
            documents: mergeSection(db.documents, props.documents),
          });

          const status = db.personal?.applicationStatus || 'draft';
          setApplicationStatus(status);

          // FIX: restore applicationId when already submitted
          if (status === 'submitted') {
            try {
              const tkPayload = JSON.parse(atob(token.split('.')[1]));
              const uid = tkPayload.userId || tkPayload.id || tkPayload._id || '';
              if (uid) setApplicationId(`UEG-M-${uid.slice(-10).toUpperCase()}`);
            } catch { /* ignore */ }
          }

          // Declaration is never pre-checked from DB (security: user must re-agree)
          setAgreed(false);
        } else {
          throw new Error(json.message || 'Preview fetch failed');
        }
      } catch (err) {
        console.error('MasterPreview fetch error:', err);
        setFetchError(err.message);
        // Props data already seeded in initial state — nothing extra needed
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount only

  // Sync declaration state up to parent
  useEffect(() => {
    if (lastAgreedRef.current === agreed) return;
    lastAgreedRef.current = agreed;
    if (updateData) updateData({ declaration: agreed });
  }, [agreed, updateData]);

  const handleDeclarationChange = (e) => {
    setAgreed(e.target.checked);
    if (e.target.checked) setShowWarning(false);
  };

  const handleSubmit = async () => {
    if (!agreed) {
      setShowWarning(true);
      return;
    }

    if (!window.confirm('Are you sure you want to submit your application? This cannot be undone.')) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await axiosInstance.post('/api/master-preview/submit', {
        agreedToTerms: true,
      });
      const responseData = res.data;

      if (responseData.success) {
        setApplicationId(responseData.applicationId);
        setSubmittedUniversityName(responseData.universityName || '');
        setSubmittedCourseName(responseData.courseName || '');
        setApplicationStatus('submitted');
        setShowSuccessModal(true);
        if (onSubmitSuccess) onSubmitSuccess(responseData);
      } else {
        // Handle already-submitted case gracefully
        if (responseData.alreadySubmitted) {
          setApplicationId(responseData.applicationId);
          setSubmittedUniversityName(responseData.universityName || '');
          setSubmittedCourseName(responseData.courseName || '');
          setApplicationStatus('submitted');
        } else {
          setSubmitError(responseData.message || 'Failed to submit.');
        }
      }
    } catch (err) {
      console.error('submit error:', err);
      const errData = err.response?.data;
      let errMsg = errData?.message || 'Failed to submit. Please try again.';
      if (errData?.missingFields?.length) {
        errMsg += '\n\nMissing fields:\n• ' + errData.missingFields.join('\n• ');
      }
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Download application as PDF */
  const handleDownloadPDF = async () => {
    if (isDownloadingPDF) return;
    setIsDownloadingPDF(true);
    try {
      const res = await axiosInstance.get('/api/master-preview/download-pdf', {
        responseType: 'blob',
      });

      const blob    = new Blob([res.data], { type: 'application/pdf' });
      const url     = window.URL.createObjectURL(blob);
      const link    = document.createElement('a');
      link.href     = url;
      link.download = `Application_${applicationId || 'Summary'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setPdfDownloaded(true);
    } catch (err) {
      console.error('PDF download error:', err);
      alert(err.response?.data?.message || 'Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const isSubmitted = applicationStatus === 'submitted';

  // FIX: EditButton defined inside render to access isSubmitted without prop drilling
  const EditButton = ({ section }) => (
    <button
      className="master-preview-edit-btn"
      onClick={() => onEdit && onEdit(STEP[section])}
      disabled={isSubmitted}
      aria-disabled={isSubmitted}
    >
      Edit
    </button>
  );

  const personal        = previewData.personal  || {};
  const contact         = previewData.contact   || {};
  const course          = previewData.course    || {};
  const selectedUniversityName = submittedUniversityName || getMasterUniversityName(course);
  const selectedCourseName = submittedCourseName || getMasterCourseName(course);
  const tests           = previewData.tests     || {};
  const documents       = previewData.documents || {};
  const academicEntries = Array.isArray(previewData.academic)
    ? previewData.academic
    : (previewData.academic?.academics || []);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', fontSize: '15px' }}>
        Loading your application data…
      </div>
    );
  }

  return (
    <div className="master-preview-container">

      {showSuccessModal && (
        <ApplicationSubmittedModal
          applicationId={applicationId}
          loginEmail={loginEmail}
          universityName={selectedUniversityName}
          courseName={selectedCourseName}
          onDownloadPDF={handleDownloadPDF}
          isDownloadingPDF={isDownloadingPDF}
          pdfDownloaded={pdfDownloaded}
          onResendEmail={() => {
            setShowSuccessModal(false);
            setShowResendModal(true);
          }}
        />
      )}

      {showResendModal && (
        <ResendEmailModal
          applicationId={applicationId}
          loginEmail={loginEmail}
          universityName={selectedUniversityName}
          courseName={selectedCourseName}
          onClose={() => setShowResendModal(false)}
        />
      )}

      <div className="master-preview-header">
        <h2 className="master-preview-title">Preview & Review</h2>
        <p className="master-preview-subtitle">
          Review your details below. Use the Edit button on any section to make changes.
        </p>
        {fetchError && (
          <p style={{ color: '#e11d48', fontSize: '13px', marginTop: '8px' }}>
            Could not refresh from server — showing locally saved data.
          </p>
        )}
      </div>

      {isSubmitted && (
        <div className="master-preview-submitted-banner">
          <p className="master-preview-submitted-title">Application Already Submitted</p>
          <p className="master-preview-submitted-id">
            Application ID: <strong>{applicationId}</strong>
          </p>
          {selectedUniversityName !== '—' && (
            <p className="master-preview-submitted-detail">
              University: <strong>{selectedUniversityName}</strong>
            </p>
          )}
          {selectedCourseName !== '—' && (
            <p className="master-preview-submitted-detail">
              Course: <strong>{selectedCourseName}</strong>
            </p>
          )}
          <p className="master-preview-submitted-email">
            Confirmation sent to: <strong>{loginEmail || 'your login email'}</strong>
          </p>
        </div>
      )}

      {submitError && (
        <div className="master-preview-error-banner" role="alert">
          <span style={{ whiteSpace: 'pre-line' }}>{submitError}</span>
          <button onClick={() => setSubmitError('')} className="master-preview-error-close">×</button>
        </div>
      )}

      {!isSubmitted && (
        <div className="master-preview-info-box">
          <p>
            Please review all your information carefully. Once submitted, you <strong>cannot edit</strong> your application.
          </p>
        </div>
      )}

      {/* Actions bar */}
      <div className="master-preview-actions-bar">
        <button
          className="master-preview-action-btn"
          onClick={handleDownloadPDF}
          disabled={isDownloadingPDF}
          title="Download your application summary as a PDF file"
        >
          {isDownloadingPDF ? (
            <>
              <span className="master-preview-btn-spinner" aria-hidden="true" />
              Generating PDF…
            </>
          ) : (
            'Download PDF'
          )}
        </button>
      </div>

      {/* Personal Information */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Personal Information
          <EditButton section="personal" />
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item">
            <span className="master-preview-label">Full Name:</span>
            <span className="master-preview-value">{personal.fullName || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Date of Birth:</span>
            <span className="master-preview-value">
              {personal.dateOfBirth
                ? new Date(personal.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'}
            </span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Gender:</span>
            <span className="master-preview-value">{personal.gender || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Nationality:</span>
            <span className="master-preview-value">{personal.nationality || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Passport Number:</span>
            <span className="master-preview-value">{personal.passportNumber || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Marital Status:</span>
            <span className="master-preview-value">{personal.maritalStatus || '—'}</span>
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Contact Details
          <EditButton section="contact" />
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item">
            <span className="master-preview-label">Email:</span>
            <span className="master-preview-value">{contact.emailAddress || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Mobile:</span>
            <span className="master-preview-value">{contact.mobileNumber || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Alternate Phone:</span>
            <span className="master-preview-value">{contact.alternatePhone || '—'}</span>
          </div>
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Address:</span>
            <span className="master-preview-value">
              {contact.addressLine1
                ? <>
                    {contact.addressLine1}
                    {contact.addressLine2 ? `, ${contact.addressLine2}` : ''}<br />
                    {[contact.city, contact.state, contact.postalCode].filter(Boolean).join(', ')}<br />
                    {contact.country}
                  </>
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Course Selection */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Course Selection
          <EditButton section="course" />
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Preferred Course:</span>
            <span className="master-preview-value">{course.preferredCourse || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Specialization:</span>
            <span className="master-preview-value">{course.specialization || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Intake:</span>
            <span className="master-preview-value">{course.intake || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Mode of Study:</span>
            <span className="master-preview-value">{course.modeOfStudy || '—'}</span>
          </div>
          {course.universityName && (
            <div className="master-preview-item">
              <span className="master-preview-label">University:</span>
              <span className="master-preview-value">{course.universityName}</span>
            </div>
          )}
          {course.duration && (
            <div className="master-preview-item">
              <span className="master-preview-label">Duration:</span>
              <span className="master-preview-value">{course.duration}</span>
            </div>
          )}
        </div>
      </div>

      {/* Academic History */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Academic History
          <EditButton section="academic" />
        </h3>
        {academicEntries.length > 0 && academicEntries.filter(a => a.degree).length > 0
          ? academicEntries.filter(a => a.degree).map((edu, index) => (
              <div key={index} className="master-preview-academic-entry">
                <div className="master-preview-academic-title">
                  {edu.degree} in {edu.fieldOfStudy}
                </div>
                <div className="master-preview-academic-details">
                  {edu.university}, {edu.country}<br />
                  {edu.startDate} – {edu.endDate} | GPA: {edu.gpa || 'N/A'}
                </div>
              </div>
            ))
          : <div className="master-preview-empty">No academic entries added</div>
        }
      </div>

      {/* Test Scores */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Test Scores
          <EditButton section="tests" />
        </h3>
        <TestScoresSection tests={tests} />
      </div>

      {/* Uploaded Documents */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Uploaded Documents
          <EditButton section="documents" />
        </h3>
        <div className="master-preview-docs-list">
          {DOCUMENT_LABELS.map(({ field, label }) => {
            const raw        = documents[field];
            const uploaded   = raw && (typeof raw === 'string' ? !!raw : isUploaded(raw));
            const display    = raw ? (typeof raw === 'string' ? raw : formatFileName(raw)) : null;
            const isRequired = REQUIRED_FIELDS.includes(field);

            return (
              <div key={field} className="master-preview-doc-row">
                <div className="master-preview-doc-label-wrap">
                  <span className="master-preview-doc-label">{label}</span>
                  {isRequired
                    ? <span className="master-preview-doc-badge master-preview-doc-badge--required">Required</span>
                    : <span className="master-preview-doc-badge master-preview-doc-badge--optional">Optional</span>
                  }
                </div>
                {uploaded ? (
                  <span className="master-preview-doc-status master-preview-doc-status--uploaded">Uploaded: {display}</span>
                ) : isRequired ? (
                  <span className="master-preview-doc-status master-preview-doc-status--missing">Not uploaded</span>
                ) : (
                  <span className="master-preview-doc-status master-preview-doc-status--optional">Not uploaded (optional)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Declaration */}
      {!isSubmitted && (
        <div className="master-preview-section master-preview-declaration">
          <h3 className="master-preview-section-title">Declaration</h3>
          <div className="master-preview-declaration-statements">
            {declarationStatements.map((stmt, index) => (
              <div key={index} className="master-preview-declaration-statement">
                <div className="master-preview-declaration-statement-title">{stmt.title}</div>
                <div className="master-preview-declaration-statement-desc">{stmt.description}</div>
              </div>
            ))}
          </div>

          <div className="master-preview-declaration-divider"></div>

          <label className={`master-preview-checkbox-label ${agreed ? 'checked' : ''} ${showWarning && !agreed ? 'warning' : ''}`}>
            <input type="checkbox" checked={agreed} onChange={handleDeclarationChange} />
            <span className="master-preview-custom-checkbox">
              {agreed && <span className="master-preview-checkmark">✓</span>}
            </span>
            <span className="master-preview-checkbox-text">
              I confirm that all information provided in this application is true,
              accurate, and complete to the best of my knowledge. I have read and
              agree to all declarations stated above.
            </span>
          </label>

          {showWarning && !agreed && (
            <div className="master-preview-declaration-status pending">
              You must confirm the declaration before submitting.
            </div>
          )}
          {agreed && (
            <div className="master-preview-declaration-status approved">
              Declaration confirmed — ready to submit
            </div>
          )}

          <div className="master-preview-legal-notice">
            <strong>Legal Notice:</strong> Providing false or misleading information may result in
            rejection of your application, revocation of admission, or dismissal from the university.
          </div>
        </div>
      )}

      {!isSubmitted && (
        <div className="master-preview-submission-note">
          <h4>Important Notice</h4>
          <p>
            After submission you will receive a confirmation email with your application
            summary attached as a PDF file. Keep your Application ID for all future
            communications. Processing may take 4–6 weeks.
          </p>
        </div>
      )}

      <div className="master-preview-form-actions">
        {!isSubmitted ? (
          <button
            className="master-preview-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || !agreed}
            title={!agreed ? 'Please confirm the declaration before submitting' : ''}
          >
            {isSubmitting ? 'Submitting…' : 'Submit Application'}
          </button>
        ) : (
          <button
            className="master-preview-submit-btn"
            onClick={() => setShowResendModal(true)}
          >
            View Confirmation & Resend Email
          </button>
        )}
      </div>

    </div>
  );
};

export default MasterPreview;
