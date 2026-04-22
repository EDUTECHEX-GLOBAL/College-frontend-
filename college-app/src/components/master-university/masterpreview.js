import React, { useState, useEffect } from 'react';
import './masterpreview.css';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatFileName = (file) => {
  if (!file) return null;
  return file.originalName || file.fileName || file.name || null;
};

const isUploaded = (file) => {
  return !!(file && (file.originalName || file.fileName || file.name));
};

// ─── Required fields ──────────────────────────────────────────────────────────
const REQUIRED_FIELDS = [
  'passport',
  'photo',
  'cert10th',
  'cert12th',
  'bachelorTranscript',
  'bachelorDegree',
  'consolidatedMarksheet',
  'resumeCv',
  'statementOfPurpose',
  'lettersOfRecommendation',
  'englishCertificate',
];

// ─── Document labels ───────────────────────────────────────────────────────────
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

// ─── Test display config ───────────────────────────────────────────────────────
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

// ─── TestScoresSection ─────────────────────────────────────────────────────────
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
                          Attempt {idx + 1}
                          {attempt.testDate && ` — ${attempt.testDate}`}
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
                      <span className="master-preview-test-future-value">{futureDates.filter(Boolean).join(', ')}</span>
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

// ─── Declaration Statements ────────────────────────────────────────────────────
const declarationStatements = [
  {
    title: 'Accuracy of information',
    description: 'All information provided in this application is true, accurate, and complete to the best of my knowledge.',
  },
  {
    title: 'Legal responsibility',
    description: 'I understand that providing false or misleading information may result in rejection, revocation of admission, or dismissal from the university.',
  },
  {
    title: 'Consent to verification',
    description: 'I consent to the university verifying any information submitted as part of this application process.',
  },
];

// ─── Main Component ────────────────────────────────────────────────────────────
const MasterPreview = ({ data, updateData, onEdit }) => {
  const { personal, contact, course, tests, documents } = data;

  // ✅ FIX: academic is now { academics: [...], _isValid: bool }
  // Support both old array shape and new object shape for safety
  const academicEntries = Array.isArray(data.academic)
    ? data.academic
    : (data.academic?.academics || []);

  const [agreed, setAgreed]           = useState(data.declaration || false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (updateData) {
      updateData({ ...data, declaration: agreed });
    }
  }, [agreed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeclarationChange = (e) => {
    setAgreed(e.target.checked);
    if (e.target.checked) setShowWarning(false);
  };

  const EditButton = ({ stepIndex }) => (
    <button className="master-preview-edit-btn" onClick={() => onEdit && onEdit(stepIndex)}>
      Edit
    </button>
  );

  return (
    <div className="master-preview-container">
      <div className="master-preview-header">
        <h2 className="master-preview-title">Preview & Review</h2>
        <p className="master-preview-subtitle">
          Review your details below. Use the Edit button on any section to make changes.
        </p>
      </div>

      {/* ── Personal Information ─────────────────────────────────── */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Personal Information
          <EditButton stepIndex={0} />
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item">
            <span className="master-preview-label">Full Name:</span>
            <span className="master-preview-value">{personal?.fullName || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Date of Birth:</span>
           <span className="master-preview-value">
    {personal?.dateOfBirth
        ? new Date(personal.dateOfBirth).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
        : '—'}
</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Gender:</span>
            <span className="master-preview-value">{personal?.gender || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Nationality:</span>
            <span className="master-preview-value">{personal?.nationality || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Passport Number:</span>
            <span className="master-preview-value">{personal?.passportNumber || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Marital Status:</span>
            <span className="master-preview-value">{personal?.maritalStatus || '—'}</span>
          </div>
        </div>
      </div>

      {/* ── Contact Details ──────────────────────────────────────── */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Contact Details
          <EditButton stepIndex={1} />
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item">
            <span className="master-preview-label">Email:</span>
            <span className="master-preview-value">{contact?.emailAddress || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Mobile:</span>
            <span className="master-preview-value">{contact?.mobileNumber || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Alternate Phone:</span>
            <span className="master-preview-value">{contact?.alternatePhone || '—'}</span>
          </div>
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Address:</span>
            <span className="master-preview-value">
              {contact?.addressLine1}
              {contact?.addressLine2 ? `, ${contact.addressLine2}` : ''}<br />
              {contact?.city}, {contact?.state} {contact?.postalCode}<br />
              {contact?.country}
            </span>
          </div>
        </div>
      </div>

      {/* ── Course Selection ─────────────────────────────────────── */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Course Selection
          <EditButton stepIndex={2} />
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Preferred Course:</span>
            <span className="master-preview-value">{course?.preferredCourse || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Specialization:</span>
            <span className="master-preview-value">{course?.specialization || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Intake:</span>
            <span className="master-preview-value">{course?.intake || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Mode of Study:</span>
            <span className="master-preview-value">{course?.modeOfStudy || '—'}</span>
          </div>
        </div>
      </div>

      {/* ── Academic History ─────────────────────────────────────── */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Academic History
          <EditButton stepIndex={3} />
        </h3>

        {/* ✅ FIX: use academicEntries (normalized array) instead of raw academic */}
        {academicEntries.length > 0 && academicEntries.filter(a => a.degree).length > 0
          ? academicEntries.filter(a => a.degree).map((edu, index) => (
              <div key={index} className="master-preview-academic-entry">
                <div className="master-preview-academic-title">
                  {edu.degree} in {edu.fieldOfStudy}
                </div>
                <div className="master-preview-academic-details">
                  {edu.university}, {edu.country}<br />
                  {edu.startDate} - {edu.endDate} | GPA: {edu.gpa || 'N/A'}
                </div>
              </div>
            ))
          : (
            <div className="master-preview-empty">No academic entries added</div>
          )
        }
      </div>

      {/* ── Test Scores ──────────────────────────────────────────── */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Test Scores
          <EditButton stepIndex={4} />
        </h3>
        <TestScoresSection tests={tests} />
      </div>

      {/* ── Uploaded Documents ───────────────────────────────────── */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          Uploaded Documents
          <EditButton stepIndex={5} />
        </h3>
        <div className="master-preview-docs-list">
          {DOCUMENT_LABELS.map(({ field, label }) => {
            const raw        = documents?.[field];
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
                  <span className="master-preview-doc-status master-preview-doc-status--uploaded">
                    ✓ {display}
                  </span>
                ) : isRequired ? (
                  <span className="master-preview-doc-status master-preview-doc-status--missing">
                    ✗ Not uploaded
                  </span>
                ) : (
                  <span className="master-preview-doc-status master-preview-doc-status--optional">
                    — Not uploaded (optional)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Declaration ──────────────────────────────────────────── */}
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
    </div>
  );
};

export default MasterPreview;