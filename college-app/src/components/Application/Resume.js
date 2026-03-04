// src/components/Resume.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './Resume.css';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

/* ─────────────────────────────────────────────────
   LABEL MAPS
───────────────────────────────────────────────── */
const DEGREE_LABELS = {
  bachelor: "Bachelor's Degree",
  master:   "Master's Degree",
  diploma:  "Diploma",
  phd:      "PhD / Doctorate",
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};
const degreeLabel = (val) => DEGREE_LABELS[val] || toTitleCase(val) || '—';
const formatDate  = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
};
const extractYear = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{4}$/.test(String(dateStr))) return String(dateStr);
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return String(d.getFullYear());
};

/* ─────────────────────────────────────────────────
   SCORE CONSTANTS
───────────────────────────────────────────────── */
const GRADE_KEYS  = ['grade9', 'grade10', 'grade11', 'grade12'];
const GRADE_LABELS = { grade9: '9th Grade', grade10: '10th Grade', grade11: '11th Grade', grade12: '12th Grade' };
const TEST_LABELS  = { satTotal: 'SAT', act: 'ACT', toefl: 'TOEFL', ielts: 'IELTS', pte: 'PTE', duolingo: 'Duolingo', psatTotal: 'PSAT', ap: 'AP' };
const TEST_MAX     = { satTotal: 1600, act: 36, toefl: 120, ielts: 9, pte: 90, duolingo: 160, psatTotal: 1520, ap: 5 };

const calcAvg = (subjects = []) => {
  const valid = subjects.filter(s => s.marks !== '' && !isNaN(parseFloat(s.marks)));
  if (!valid.length) return null;
  return (valid.reduce((a, b) => a + parseFloat(b.marks), 0) / valid.length).toFixed(1);
};

/* ─────────────────────────────────────────────────
   PARSE SCORES — handles both nested (r.scores.*)
   and flat (r.gradeSubjects) shapes from the API
───────────────────────────────────────────────── */
const parseScores = (r) => {
  // Controller puts scores inside r.scores; fall back to r itself if missing
  const sd = (r.scores && typeof r.scores === 'object' && Object.keys(r.scores).length > 0)
    ? r.scores
    : r;

  const gradeSubjects = (sd.gradeSubjects && typeof sd.gradeSubjects === 'object') ? sd.gradeSubjects : {};
  const subjectMarks  = (sd.subjectMarks  && typeof sd.subjectMarks  === 'object') ? sd.subjectMarks  : {};

  const grades = {};
  GRADE_KEYS.forEach((gk) => {
    const subjectList = Array.isArray(gradeSubjects[gk]) ? gradeSubjects[gk] : [];
    const marksMap    = (subjectMarks[gk] && typeof subjectMarks[gk] === 'object') ? subjectMarks[gk] : {};
    grades[gk] = subjectList.map(s => ({ subject: s, marks: marksMap[s] ?? '' }));
  });

  return {
    grades,
    satTotal:     sd.satTotal     || '',
    satMath:      sd.satMath      || '',
    satReading:   sd.satReading   || '',
    satDate:      sd.satDate      || '',
    psatTotal:    sd.psatTotal    || '',
    psatMath:     sd.psatMath     || '',
    psatReading:  sd.psatReading  || '',
    psatDate:     sd.psatDate     || '',
    act:          sd.act          || '',
    actDate:      sd.actDate      || '',
    toefl:        sd.toefl        || '',
    toeflDate:    sd.toeflDate    || '',
    ielts:        sd.ielts        || '',
    ieltsDate:    sd.ieltsDate    || '',
    ap:           sd.ap           || '',
    apDate:       sd.apDate       || '',
    pte:          sd.pte          || '',
    pteDate:      sd.pteDate      || '',
    duolingo:     sd.duolingo     || '',
    duolingoDate: sd.duolingoDate || '',
  };
};

/* ─────────────────────────────────────────────────
   EDITABLE FIELD
───────────────────────────────────────────────── */
const EditableField = ({ value, onChange, isEditing, multiline = false, className = '', placeholder = '—' }) => {
  if (!isEditing) return <span className={`ev ${className}`}>{value || <span className="ev-empty">{placeholder}</span>}</span>;
  if (multiline)  return (
    <textarea className={`ei ei-ta ${className}`} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} />
  );
  return (
    <input type="text" className={`ei ${className}`} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  );
};

/* ─────────────────────────────────────────────────
   SKILL BAR
───────────────────────────────────────────────── */
const SkillBar = ({ label, pct }) => (
  <div className="skill-bar">
    <div className="skill-bar-label">{label}</div>
    <div className="skill-bar-track">
      <div className="skill-bar-fill" style={{ width: `${Math.min(pct || 0, 100)}%` }} />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────
   SECTION TITLE
───────────────────────────────────────────────── */
const SectionTitle = ({ title, icon }) => (
  <div className="sec-title">
    {icon && <span className="sec-icon">{icon}</span>}
    <span>{title}</span>
  </div>
);

/* ─────────────────────────────────────────────────
   INFO ROW
───────────────────────────────────────────────── */
const InfoRow = ({ icon, children }) => (
  <div className="info-row">
    <span className="info-icon">{icon}</span>
    <span className="info-text">{children}</span>
  </div>
);

/* ═════════════════════════════════════════════════
   MAIN RESUME COMPONENT
═════════════════════════════════════════════════ */
const Resume = ({ onDownload, onPrev }) => {
  const [cv,        setCv]        = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved,   setIsSaved]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [mobileTab, setMobileTab] = useState('main');

  /* ── Single fetch — controller embeds scores inside resume ── */
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setError('No authentication token. Please sign in.'); setLoading(false); return; }

        const res = await axios.get(`${API_URL}/api/application/resume`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          const r = res.data.resume;

          setCv({
            title:       r.title       || '',
            firstName:   r.firstName   || '',
            lastName:    r.lastName    || '',
            email:       r.email       || '',
            mobile:      r.mobile      || '',
            dateOfBirth:            r.dateOfBirth            || '',
            placeOfBirth:           r.placeOfBirth           || '',
            countryOfBirth:         r.countryOfBirth         || '',
            citizenship:            r.citizenship            || '',
            gender:                 r.gender                 || '',
            correspondenceLanguage: r.correspondenceLanguage || '',
            isEUCitizen:            r.isEUCitizen            ?? false,
            needVisa:               r.needVisa               || '',
            passportNumber:     r.passportNumber     || '',
            passportIssueDate:  r.passportIssueDate  || '',
            passportExpiryDate: r.passportExpiryDate || '',
            issuingCountry:     r.issuingCountry     || '',
            currentAddress: r.currentAddress || r.permanentAddress || '',
            city:           r.city           || '',
            state:          r.state          || '',
            postalCode:     r.postalCode     || '',
            country:        r.country        || '',
            qualificationLevel: r.education?.degree          || '',
            institutionName:    r.education?.institutionName || '',
            boardUniversity:    r.education?.boardUniversity || '',
            countryOfStudy:     r.education?.countryOfStudy  || '',
            startYear: extractYear(r.education?.startYear || r.education?.startDate || ''),
            endYear:   extractYear(r.education?.endYear   || r.education?.endDate   || ''),
            score:     r.education?.score || '',
            englishTestType: r.language?.eqheOriginalTitle || '',
            eqheCountry:     r.language?.eqheCountry       || '',
            testScore:       r.language?.testScore         || '',
            testDate:        r.language?.testDate          || '',
            listeningScore:  r.language?.listeningScore    || '',
            readingScore:    r.language?.readingScore      || '',
            writingScore:    r.language?.writingScore      || '',
            speakingScore:   r.language?.speakingScore     || '',
            hasSpecialNeeds:    r.specialNeeds?.hasSpecialNeeds || 'no',
            selectedCountry:    '',
            selectedUniversity: '',
            campus:             '',
            courseName:         '',
            programLevel:       '',
            studyMode:          '',
            intakeMonth:        '',
            intakeYear:         '',
            secondPreference:   '',
            thirdPreference:    '',
            customSummary:      '',
          });

          // Parse scores — works whether they're in r.scores or flat on r
          setScoreData(parseScores(r));

        } else {
          setError('Resume data could not be loaded.');
        }
      } catch (err) {
        console.error('❌ Resume fetch failed', err);
        setError('Failed to load resume. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, []);

  /* ── Helpers ── */
  const update = useCallback((field) => (value) => setCv(prev => ({ ...prev, [field]: value })), []);

  const handleSave       = () => { setIsEditing(false); setIsSaved(true); setTimeout(() => setIsSaved(false), 3000); };
  const handleCloseError = (e) => { e.preventDefault(); e.stopPropagation(); setError(null); };
  const handleRetry      = (e) => { e.preventDefault(); e.stopPropagation(); setError(null); setLoading(true); window.location.reload(); };

  const handleExitEdit = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isEditing) setIsEditing(false);
    else if (onPrev) onPrev();
  };

  const handleClose = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsEditing(false);
    if (onPrev) onPrev();
  };

  const handleDownload = () => {
    if (onDownload) onDownload(cv);
    const cvCardEl = document.querySelector('.rv-card');
    if (!cvCardEl) { window.print(); return; }

    const stylesHtml = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML).join('\n');

    const printWindow = window.open('', '_blank', 'width=960,height=720');
    if (!printWindow) { window.print(); return; }

    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>CV — ${cv?.firstName || ''} ${cv?.lastName || ''}</title>
    ${stylesHtml}
    <style>
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .rv-card {
        display: flex !important; width: 100% !important;
        min-height: 100vh !important; box-shadow: none !important;
        border-radius: 0 !important; margin: 0 !important;
      }
      .rv-sidebar {
        min-width: 220px !important; max-width: 260px !important;
        background: #1a2236 !important; color: #fff !important;
        padding: 24px 16px !important;
      }
      .rv-main { flex: 1 !important; padding: 32px 40px !important; }
      .no-print, .rv-toolbar, .edit-banner, .mobile-tabs, .cv-actions { display: none !important; }
      @page { margin: 0; size: A4 portrait; }
    </style>
  </head>
  <body>
    ${cvCardEl.outerHTML}
    <script>
      window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 600); };
    <\/script>
  </body>
</html>`);
    printWindow.document.close();
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="rv-wrapper">
      <div className="rv-loading"><div className="rv-spinner" /><p>Loading your CV…</p></div>
    </div>
  );

  /* ── Error ── */
  if (error || !cv) return (
    <div className="rv-wrapper">
      <div className="rv-error-card">
        <button type="button" className="rv-error-close" onClick={handleCloseError} aria-label="Dismiss error">✕</button>
        <div className="rv-error-icon">⚠️</div>
        <p className="rv-error-msg">{error || 'No resume data found.'}</p>
        <div className="rv-error-actions">
          <button type="button" className="rv-err-btn primary"   onClick={handleRetry}>↺ Try Again</button>
          <button type="button" className="rv-err-btn secondary" onClick={handleCloseError}>Dismiss</button>
        </div>
      </div>
    </div>
  );

  /* ── Derived values ── */
  const initials      = `${(cv.firstName || 'A')[0]}${(cv.lastName || 'S')[0]}`.toUpperCase();
  const displayDegree = degreeLabel(cv.qualificationLevel);
  const displayEqhe   = toTitleCase(cv.englishTestType) || '—';
  const hasEqheScores = cv.listeningScore || cv.readingScore || cv.writingScore || cv.speakingScore;

  const autoSummary =
    `Motivated and academically accomplished applicant` +
    `${cv.institutionName ? ` from ${cv.institutionName}` : ''}` +
    `${cv.countryOfStudy  ? `, ${cv.countryOfStudy}`      : ''}` +
    `, holding a ${displayDegree}` +
    `${cv.score ? ` with a score of ${cv.score}` : ''}. ` +
    `${cv.courseName ? `Currently applying for ${cv.courseName}` : 'Currently applying'}` +
    `${cv.selectedUniversity ? ` at ${cv.selectedUniversity}` : ''}. ` +
    `Strong academic background with ${displayEqhe} proficiency. ` +
    `Passionate, disciplined, and eager to contribute to a diverse academic environment.`;

  const displaySummary = cv.customSummary || autoSummary;

  const scoreBands = [
    { label: 'Listening', score: cv.listeningScore },
    { label: 'Reading',   score: cv.readingScore   },
    { label: 'Writing',   score: cv.writingScore   },
    { label: 'Speaking',  score: cv.speakingScore  },
  ];

  // Only show grades/tests that actually have data
  const activeGrades = scoreData
    ? GRADE_KEYS.filter(gk => scoreData.grades[gk]?.length > 0)
    : [];
  const activeTests = scoreData
    ? Object.entries(TEST_LABELS).filter(([key]) => scoreData[key] && scoreData[key] !== '')
    : [];

  /* ─────────────────────────────────────────────
     SIDEBAR CONTENT
  ───────────────────────────────────────────── */
  const SidebarContent = () => (
    <>
      <div className="sb-top">
        <div className="sb-avatar">{initials}</div>
        <div className="sb-name">
          <EditableField value={cv.firstName} onChange={update('firstName')} isEditing={isEditing} placeholder="First Name" />
          {' '}
          <EditableField value={cv.lastName}  onChange={update('lastName')}  isEditing={isEditing} placeholder="Last Name" />
        </div>
        <div className="sb-role">
          <EditableField value={cv.programLevel ? toTitleCase(cv.programLevel) : ''} onChange={update('programLevel')} isEditing={isEditing} placeholder="Program Level" /> Applicant
        </div>
      </div>

      <div className="sb-body">
        {/* Contact */}
        <div className="sb-label">Contact</div>
        <InfoRow icon="✉"><EditableField value={cv.email}  onChange={update('email')}  isEditing={isEditing} placeholder="Email" /></InfoRow>
        <InfoRow icon="📱"><EditableField value={cv.mobile} onChange={update('mobile')} isEditing={isEditing} placeholder="Mobile" /></InfoRow>
        <InfoRow icon="📍"><EditableField value={cv.currentAddress} onChange={update('currentAddress')} isEditing={isEditing} placeholder="Address" /></InfoRow>
        {isEditing ? (
          <div className="addr-row">
            <input className="ei mini" value={cv.city}       onChange={(e) => update('city')(e.target.value)}       placeholder="City"     />
            <input className="ei mini" value={cv.state}      onChange={(e) => update('state')(e.target.value)}      placeholder="State"    />
            <input className="ei mini" value={cv.postalCode} onChange={(e) => update('postalCode')(e.target.value)} placeholder="Postcode" />
          </div>
        ) : (
          <InfoRow icon="🏙">{[cv.city, cv.state, cv.postalCode].filter(Boolean).join(', ') || '—'}</InfoRow>
        )}
        <InfoRow icon="🌍"><EditableField value={cv.country} onChange={update('country')} isEditing={isEditing} placeholder="Country" /></InfoRow>

        {/* Passport */}
        <div className="sb-label">Passport</div>
        <InfoRow icon="🛂">
          {isEditing
            ? <input className="ei" value={cv.passportNumber} onChange={(e) => update('passportNumber')(e.target.value)} placeholder="Passport No." />
            : `No: ${cv.passportNumber || '—'}`}
        </InfoRow>
        <InfoRow icon="🏳️">
          {isEditing
            ? <input className="ei" value={cv.issuingCountry} onChange={(e) => update('issuingCountry')(e.target.value)} placeholder="Issuing Country" />
            : `Issued: ${cv.issuingCountry || '—'}`}
        </InfoRow>
        <InfoRow icon="📅">Expiry: {formatDate(cv.passportExpiryDate)}</InfoRow>
        <InfoRow icon="✈️">Visa: {cv.needVisa ? toTitleCase(cv.needVisa) : 'N/A'}</InfoRow>

        {/* Education */}
        <div className="sb-label">Education</div>
        {isEditing
          ? <EditableField value={cv.qualificationLevel} onChange={update('qualificationLevel')} isEditing={isEditing} className="sb-deg" placeholder="Degree" />
          : <span className="ev sb-deg">{displayDegree}</span>}
        <EditableField value={cv.institutionName} onChange={update('institutionName')} isEditing={isEditing} className="sb-inst" placeholder="Institution" />
        <div className="sb-period">
          {cv.startYear || cv.endYear ? `${cv.startYear || '?'} – ${cv.endYear || 'Present'}` : '—'}
          {cv.score ? ` · ${cv.score}` : ''}
        </div>

        {/* Entrance Qual. */}
        <div className="sb-label">Entrance Qual.</div>
        {isEditing
          ? <EditableField value={cv.englishTestType} onChange={update('englishTestType')} isEditing={isEditing} className="sb-eqhe" placeholder="EQHE Title" />
          : <span className="ev sb-eqhe">{displayEqhe}</span>}
        {cv.eqheCountry && <div className="sb-period">Country: {toTitleCase(cv.eqheCountry)}</div>}
        {cv.testDate    && <div className="sb-period">Date: {formatDate(cv.testDate)}</div>}
        {hasEqheScores && (
          <div className="sb-scores">
            <div className="sb-overall-row">
              <span className="sb-overall-label">Overall</span>
              <EditableField value={cv.testScore} onChange={update('testScore')} isEditing={isEditing} className="sb-overall-score" placeholder="—" />
            </div>
            {scoreBands.map(b => (
              <SkillBar key={b.label} label={`${b.label}  ${b.score || ''}`} pct={(parseFloat(b.score) / 9) * 100} />
            ))}
          </div>
        )}

        {/* ── Academic Grades Summary (sidebar) ── */}
        {activeGrades.length > 0 && (
          <>
            <div className="sb-label">Academic Grades</div>
            {activeGrades.map(gk => {
              const avg = calcAvg(scoreData.grades[gk]);
              return (
                <div key={gk} className="sb-grade-row">
                  <span className="sb-grade-label">{GRADE_LABELS[gk]}</span>
                  {avg !== null && <span className="sb-grade-avg">{avg}%</span>}
                </div>
              );
            })}
          </>
        )}

        {/* ── Test Score Badges (sidebar) ── */}
        {activeTests.length > 0 && (
          <>
            <div className="sb-label">Test Scores</div>
            <div className="sb-test-badges">
              {activeTests.map(([key, label]) => (
                <div key={key} className="sb-test-badge">
                  <span className="sb-test-name">{label}</span>
                  <span className="sb-test-score">{scoreData[key]}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Target University */}
        <div className="sb-label">Target University</div>
        <InfoRow icon="🎓"><EditableField value={cv.selectedUniversity} onChange={update('selectedUniversity')} isEditing={isEditing} placeholder="University" /></InfoRow>
        <InfoRow icon="🌍"><EditableField value={cv.selectedCountry}    onChange={update('selectedCountry')}    isEditing={isEditing} placeholder="Country" /></InfoRow>
        {isEditing ? (
          <div className="addr-row">
            <input className="ei mini" value={cv.intakeMonth} onChange={(e) => update('intakeMonth')(e.target.value)} placeholder="Month" />
            <input className="ei mini" value={cv.intakeYear}  onChange={(e) => update('intakeYear')(e.target.value)}  placeholder="Year"  />
          </div>
        ) : (
          <InfoRow icon="📆">
            {cv.intakeMonth || cv.intakeYear ? `${cv.intakeMonth} ${cv.intakeYear}`.trim() : '—'}
          </InfoRow>
        )}
      </div>
    </>
  );

  /* ─────────────────────────────────────────────
     MAIN CONTENT
  ───────────────────────────────────────────── */
  const MainContent = () => (
    <>
      <div className="main-header">
        <div className="main-name">{cv.firstName} {cv.lastName}</div>
        {(cv.courseName || cv.selectedUniversity) && (
          <div className="main-sub">
            {[cv.courseName, cv.selectedUniversity].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      {/* Personal Summary */}
      <SectionTitle title="Personal Summary" icon="📝" />
      {isEditing && (
        <div className="edit-hint no-print">✏️ Personalise your summary below, or leave blank to auto-generate.</div>
      )}
      <EditableField
        value={isEditing ? (cv.customSummary || '') : displaySummary}
        onChange={update('customSummary')}
        isEditing={isEditing}
        multiline
        className="summary-text"
        placeholder={autoSummary}
      />

      {/* Course Preferences */}
      {(cv.courseName || cv.selectedUniversity || isEditing) && (
        <>
          <SectionTitle title="Course Preferences" icon="🎯" />
          <div className="entry-block">
            <div className="entry-title">1st Choice — <EditableField value={cv.courseName} onChange={update('courseName')} isEditing={isEditing} placeholder="Course name" /></div>
            <div className="entry-org"><EditableField value={cv.selectedUniversity} onChange={update('selectedUniversity')} isEditing={isEditing} placeholder="University" /></div>
            <div className="entry-meta">
              <EditableField value={cv.programLevel} onChange={update('programLevel')} isEditing={isEditing} placeholder="Level" />
              {cv.studyMode       && <><span className="dot">·</span><EditableField value={cv.studyMode}       onChange={update('studyMode')}       isEditing={isEditing} placeholder="Mode" /></>}
              {cv.selectedCountry && <><span className="dot">·</span><EditableField value={cv.selectedCountry} onChange={update('selectedCountry')} isEditing={isEditing} placeholder="Country" /></>}
            </div>
            {(cv.intakeMonth || cv.intakeYear || isEditing) && (
              <div className="entry-detail">
                Intake: <EditableField value={cv.intakeMonth} onChange={update('intakeMonth')} isEditing={isEditing} placeholder="Month" />
                {' '}<EditableField value={cv.intakeYear} onChange={update('intakeYear')} isEditing={isEditing} placeholder="Year" />
              </div>
            )}
          </div>
          {(cv.secondPreference || isEditing) && (
            <div className="entry-block">
              <div className="entry-title">2nd Choice — <EditableField value={cv.secondPreference} onChange={update('secondPreference')} isEditing={isEditing} placeholder="Second preference" /></div>
            </div>
          )}
          {(cv.thirdPreference || isEditing) && (
            <div className="entry-block">
              <div className="entry-title">3rd Choice — <EditableField value={cv.thirdPreference} onChange={update('thirdPreference')} isEditing={isEditing} placeholder="Third preference" /></div>
            </div>
          )}
        </>
      )}

      {/* Educational Background */}
      {(cv.qualificationLevel || cv.institutionName || isEditing) && (
        <>
          <SectionTitle title="Educational Background" icon="🎓" />
          <div className="entry-block">
            <div className="entry-title">
              {isEditing
                ? <EditableField value={cv.qualificationLevel} onChange={update('qualificationLevel')} isEditing={isEditing} placeholder="Degree" />
                : displayDegree}
            </div>
            <div className="entry-org"><EditableField value={cv.institutionName} onChange={update('institutionName')} isEditing={isEditing} placeholder="Institution" /></div>
            <div className="entry-meta">
              {isEditing ? (
                <>
                  <EditableField value={cv.startYear} onChange={update('startYear')} isEditing={isEditing} placeholder="Start" />
                  {' – '}
                  <EditableField value={cv.endYear}   onChange={update('endYear')}   isEditing={isEditing} placeholder="End" />
                </>
              ) : (
                cv.startYear || cv.endYear ? `${cv.startYear || '?'} – ${cv.endYear || 'Present'}` : '—'
              )}
              {cv.countryOfStudy && <><span className="dot">·</span>{cv.countryOfStudy}</>}
            </div>
            {(cv.boardUniversity || isEditing) && <div className="entry-detail">Awarding Body: <EditableField value={cv.boardUniversity} onChange={update('boardUniversity')} isEditing={isEditing} placeholder="Board / University" /></div>}
            {(cv.score || isEditing) && <div className="entry-detail">Score / Grade: <EditableField value={cv.score} onChange={update('score')} isEditing={isEditing} placeholder="e.g. 78%" /></div>}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          ACADEMIC SCORES — subject-wise tables
      ══════════════════════════════════════════ */}
      {activeGrades.length > 0 && (
        <>
          <SectionTitle title="Academic Scores" icon="📊" />
          {activeGrades.map(gk => {
            const subjects = scoreData.grades[gk];
            const avg      = calcAvg(subjects);
            return (
              <div key={gk} className="entry-block score-grade-block">
                <div className="score-grade-header">
                  <span className="score-grade-title">{GRADE_LABELS[gk]}</span>
                  {avg !== null && <span className="score-grade-avg">Average: {avg}%</span>}
                </div>
                <div className="score-subject-table">
                  <div className="score-subject-head">
                    <span>Subject</span>
                    <span>Marks</span>
                    <span>Grade</span>
                  </div>
                  {subjects.map(({ subject, marks }) => {
                    const num = parseFloat(marks);
                    const grade =
                      marks === '' || isNaN(num) ? '—'
                      : num >= 90 ? 'A+'
                      : num >= 80 ? 'A'
                      : num >= 70 ? 'B+'
                      : num >= 60 ? 'B'
                      : num >= 50 ? 'C'
                      : 'F';
                    const colorClass =
                      marks === '' || isNaN(num) ? ''
                      : num >= 80 ? 'grade-hi'
                      : num >= 60 ? 'grade-mid'
                      : 'grade-lo';
                    return (
                      <div key={subject} className="score-subject-row">
                        <span className="score-subject-name">{subject}</span>
                        <span className="score-subject-marks">{marks !== '' ? `${marks}/100` : '—'}</span>
                        <span className={`score-subject-grade ${colorClass}`}>{grade}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ══════════════════════════════════════════
          STANDARDISED TEST SCORES — card grid
      ══════════════════════════════════════════ */}
      {activeTests.length > 0 && (
        <>
          <SectionTitle title="Standardised Test Scores" icon="🏆" />
          <div className="entry-block">
            <div className="score-test-grid">
              {activeTests.map(([key, label]) => {
                const val       = scoreData[key];
                const max       = TEST_MAX[key];
                const pct       = max ? Math.round((parseFloat(val) / max) * 100) : null;
                const subScores = key === 'satTotal'
                  ? [
                      scoreData.satMath    ? `Math: ${scoreData.satMath}`   : null,
                      scoreData.satReading ? `R&W: ${scoreData.satReading}` : null,
                    ].filter(Boolean)
                  : [];
                const dateKey  = key.replace('Total', '') + 'Date';
                const testDate = scoreData[dateKey];
                return (
                  <div key={key} className="score-test-card">
                    <div className="score-test-top">
                      <span className="score-test-label">{label}</span>
                      <span className="score-test-val">{val}{max ? `/${max}` : ''}</span>
                    </div>
                    {pct !== null && (
                      <div className="score-test-bar-wrap">
                        <div className="score-test-bar" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    {subScores.length > 0 && <div className="score-test-sub">{subScores.join('  ·  ')}</div>}
                    {testDate && <div className="score-test-date">{formatDate(testDate)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Entrance Qualification (EQHE) */}
      {(cv.englishTestType || isEditing) && (
        <>
          <SectionTitle title="Entrance Qualification (EQHE)" icon="📋" />
          <div className="entry-block">
            <div className="entry-title">
              {isEditing
                ? <EditableField value={cv.englishTestType} onChange={update('englishTestType')} isEditing={isEditing} placeholder="Qualification Title" />
                : displayEqhe}
              {cv.testScore   && <> — Score {cv.testScore}</>}
              {cv.eqheCountry && <> ({toTitleCase(cv.eqheCountry)})</>}
            </div>
            {cv.testDate && <div className="entry-meta">Test Date: {formatDate(cv.testDate)}</div>}
            {hasEqheScores && (
              <div className="score-grid">
                {scoreBands.map(({ label, score }, idx) => (
                  <div key={label} className="score-chip">
                    <div className="score-chip-label">{label}</div>
                    <EditableField
                      value={score}
                      onChange={update(['listeningScore','readingScore','writingScore','speakingScore'][idx])}
                      isEditing={isEditing}
                      className="score-chip-val"
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Personal Information */}
      <SectionTitle title="Personal Information" icon="👤" />
      <div className="pi-grid">
        {[
          ['Date of Birth',    formatDate(cv.dateOfBirth),             false, null],
          ['Gender',           toTitleCase(cv.gender),                 true,  'gender'],
          ['Nationality',      toTitleCase(cv.citizenship),            true,  'citizenship'],
          ['Place of Birth',   cv.placeOfBirth,                        true,  'placeOfBirth'],
          ['Country of Birth', cv.countryOfBirth,                      true,  'countryOfBirth'],
          ['Correspondence',   toTitleCase(cv.correspondenceLanguage), false, null],
          ['Visa Required',    toTitleCase(cv.needVisa) || 'N/A',      false, null],
          ['EU Citizen',       cv.isEUCitizen === true ? 'Yes' : cv.isEUCitizen === false ? 'No' : '—', false, null],
        ].map(([label, val, editable, field]) => (
          <div key={label} className="pi-row">
            <span className="pi-label">{label}</span>
            {editable && isEditing
              ? <input className="ei inline" value={cv[field] || ''} onChange={(e) => update(field)(e.target.value)} placeholder={label} />
              : <span className="pi-val">{val || '—'}</span>}
          </div>
        ))}
        {cv.hasSpecialNeeds && cv.hasSpecialNeeds !== 'no' && (
          <div className="pi-row">
            <span className="pi-label">Special Needs</span>
            <span className="pi-val">{toTitleCase(cv.hasSpecialNeeds)}</span>
          </div>
        )}
      </div>

      {/* References */}
      <SectionTitle title="References" icon="🤝" />
      <p className="ref-text">References available upon request.</p>

      {/* Action buttons */}
      <div className="cv-actions no-print">
        {isEditing ? (
          <>
            <button type="button" className="cv-btn save"   onClick={handleSave}>💾 Save</button>
            <button type="button" className="cv-btn cancel" onClick={handleExitEdit}>✕ Cancel</button>
          </>
        ) : (
          <>
            <button type="button" className="cv-btn edit" onClick={() => setIsEditing(true)}>✏️ Edit CV</button>
            {onPrev && (
              <button type="button" className="cv-btn cancel" onClick={handleClose}>✕ Close</button>
            )}
          </>
        )}
        <button type="button" className="cv-btn download" onClick={handleDownload}>⬇ Download PDF</button>
        <button type="button" className="cv-btn print"    onClick={handleDownload}>🖨 Print</button>
      </div>
    </>
  );

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="rv-wrapper">

      {/* Toolbar */}
      <div className="rv-toolbar no-print">
        <div className="toolbar-l">
          <span className="toolbar-title">📄 CV Preview</span>
          {isEditing && <span className="toolbar-hint">✏️ Click any field to edit</span>}
        </div>
        <div className="toolbar-r">
          {isSaved && <span className="saved-badge">✓ Saved</span>}
          {isEditing ? (
            <button type="button" className="tb-btn tb-save" onClick={handleSave}>💾 Save</button>
          ) : (
            <button type="button" className="tb-btn tb-edit" onClick={() => setIsEditing(true)}>✏️ Edit</button>
          )}
          <button type="button" className="tb-btn tb-cancel" onClick={handleExitEdit}>
            {isEditing ? '✕ Cancel' : '✕ Close'}
          </button>
          <button type="button" className="tb-btn tb-dl" onClick={handleDownload}>⬇ PDF</button>
        </div>
      </div>

      {/* Edit banner */}
      {isEditing && (
        <div className="edit-banner no-print">
          <span>✏️ <strong>Edit mode</strong> — tap any highlighted field to change it.</span>
          <button type="button" className="banner-close" onClick={handleExitEdit} aria-label="Exit edit mode">✕</button>
        </div>
      )}

      {/* Mobile Tab Bar */}
      <div className="mobile-tabs no-print">
        <button type="button" className={`mob-tab ${mobileTab === 'sidebar' ? 'active' : ''}`} onClick={() => setMobileTab('sidebar')}>Profile</button>
        <button type="button" className={`mob-tab ${mobileTab === 'main'    ? 'active' : ''}`} onClick={() => setMobileTab('main')}>Details</button>
      </div>

      {/* Resume Card */}
      <div className="rv-page">
        <div className="rv-card">
          <aside className={`rv-sidebar ${mobileTab === 'main'    ? 'mob-hidden' : ''}`}><SidebarContent /></aside>
          <main  className={`rv-main   ${mobileTab === 'sidebar' ? 'mob-hidden' : ''}`}><MainContent /></main>
        </div>
      </div>

    </div>
  );
};

export default Resume;
// file written OK