// src/components/Resume.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance'; // ✅ Rule 1
import './Resume.css';

// ✅ Rule 2: API_URL and DOC_API_URL removed entirely

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
const GRADE_KEYS   = ['grade9', 'grade10', 'grade11', 'grade12'];
const GRADE_LABELS = { grade9: '9th Grade', grade10: '10th Grade', grade11: '11th Grade', grade12: '12th Grade' };
const TEST_LABELS  = { satTotal: 'SAT', act: 'ACT', toefl: 'TOEFL', ielts: 'IELTS', pte: 'PTE', duolingo: 'Duolingo', psatTotal: 'PSAT', ap: 'AP' };
const TEST_MAX     = { satTotal: 1600, act: 36, toefl: 120, ielts: 9, pte: 90, duolingo: 160, psatTotal: 1520, ap: 5 };

const calcAvg = (subjects = []) => {
  const valid = subjects.filter(s => s.marks !== '' && !isNaN(parseFloat(s.marks)));
  if (!valid.length) return null;
  return (valid.reduce((a, b) => a + parseFloat(b.marks), 0) / valid.length).toFixed(1);
};

/* ─────────────────────────────────────────────────
   PARSE SCORES
───────────────────────────────────────────────── */
const parseScores = (r) => {
  const sd = (r.scores && typeof r.scores === 'object' && Object.keys(r.scores).length > 0)
    ? r.scores : r;

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
    satTotal: sd.satTotal || '', satMath: sd.satMath || '', satReading: sd.satReading || '', satDate: sd.satDate || '',
    psatTotal: sd.psatTotal || '', psatMath: sd.psatMath || '', psatReading: sd.psatReading || '', psatDate: sd.psatDate || '',
    act: sd.act || '', actDate: sd.actDate || '',
    toefl: sd.toefl || '', toeflDate: sd.toeflDate || '',
    ielts: sd.ielts || '', ieltsDate: sd.ieltsDate || '',
    ap: sd.ap || '', apDate: sd.apDate || '',
    pte: sd.pte || '', pteDate: sd.pteDate || '',
    duolingo: sd.duolingo || '', duolingoDate: sd.duolingoDate || '',
  };
};

/* ─────────────────────────────────────────────────
   EDITABLE FIELD
───────────────────────────────────────────────── */
const EditableField = ({ value, onChange, isEditing, multiline = false, className = '', placeholder = '—' }) => {
  if (!isEditing) return <span className={`ev ${className}`}>{value || <span className="ev-empty">{placeholder}</span>}</span>;
  if (multiline) return (
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

/* ═════════════════════════════════════════════════
   LOAD SCRIPT HELPER
═════════════════════════════════════════════════ */
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

const ensureLibs = async () => {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
};

/* ═════════════════════════════════════════════════
   MAIN RESUME COMPONENT
═════════════════════════════════════════════════ */
const Resume = ({ onDownload, onPrev }) => {
  const [cv,           setCv]           = useState(null);
  const [scoreData,    setScoreData]    = useState(null);
  const [isEditing,    setIsEditing]    = useState(false);
  const [isSaved,      setIsSaved]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [mobileTab,    setMobileTab]    = useState('main');
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadMsg,    setUploadMsg]    = useState('');

  const cvCardRef = useRef(null);

  /* ── Fetch ─────────────────────────────────────── */
  useEffect(() => {
    const fetchResume = async () => {
      try {
        // ✅ Rule 4: token used only for null check
        const token = localStorage.getItem('token');
        if (!token) { setError('No authentication token. Please sign in.'); setLoading(false); return; }

        // ✅ Rule 3: axiosInstance with clean path, no manual headers
        const res = await axiosInstance.get('/api/application/resume');

        if (res.data?.success) {
          const r = res.data.resume;
          setCv({
            title: r.title || '', firstName: r.firstName || '', lastName: r.lastName || '',
            email: r.email || '', mobile: r.mobile || '',
            dateOfBirth: r.dateOfBirth || '', placeOfBirth: r.placeOfBirth || '',
            countryOfBirth: r.countryOfBirth || '', citizenship: r.citizenship || '',
            gender: r.gender || '', correspondenceLanguage: r.correspondenceLanguage || '',
            isEUCitizen: r.isEUCitizen ?? false, needVisa: r.needVisa || '',
            passportNumber: r.passportNumber || '', passportIssueDate: r.passportIssueDate || '',
            passportExpiryDate: r.passportExpiryDate || '', issuingCountry: r.issuingCountry || '',
            currentAddress: r.currentAddress || r.permanentAddress || '',
            city: r.city || '', state: r.state || '', postalCode: r.postalCode || '', country: r.country || '',
            qualificationLevel: r.education?.degree || '', institutionName: r.education?.institutionName || '',
            boardUniversity: r.education?.boardUniversity || '', countryOfStudy: r.education?.countryOfStudy || '',
            startYear: extractYear(r.education?.startYear || r.education?.startDate || ''),
            endYear: extractYear(r.education?.endYear || r.education?.endDate || ''),
            score: r.education?.score || '',
            englishTestType: r.language?.eqheOriginalTitle || '', eqheCountry: r.language?.eqheCountry || '',
            testScore: r.language?.testScore || '', testDate: r.language?.testDate || '',
            listeningScore: r.language?.listeningScore || '', readingScore: r.language?.readingScore || '',
            writingScore: r.language?.writingScore || '', speakingScore: r.language?.speakingScore || '',
            hasSpecialNeeds: r.specialNeeds?.hasSpecialNeeds || 'no',
            selectedCountry: '', selectedUniversity: '', campus: '', courseName: '',
            programLevel: '', studyMode: '', intakeMonth: '', intakeYear: '',
            secondPreference: '', thirdPreference: '', customSummary: '',
          });
          setScoreData(parseScores(r));
        } else {
          setError('Resume data could not be loaded.');
        }
      } catch (err) {
        console.error('Resume fetch failed', err);
        setError('Failed to load resume. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, []);

  /* ── Helpers ───────────────────────────────────── */
  const update           = useCallback((field) => (value) => setCv(prev => ({ ...prev, [field]: value })), []);
  const handleSave       = () => { setIsEditing(false); setIsSaved(true); setTimeout(() => setIsSaved(false), 3000); };
  const handleCloseError = (e) => { e.preventDefault(); e.stopPropagation(); setError(null); };
  const handleRetry      = (e) => { e.preventDefault(); e.stopPropagation(); setError(null); setLoading(true); window.location.reload(); };
  const handleExitEdit   = (e) => { e.preventDefault(); e.stopPropagation(); if (isEditing) setIsEditing(false); else if (onPrev) onPrev(); };
  const handleClose      = (e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(false); if (onPrev) onPrev(); };

  /* ── Download & Upload ──────────────────────────── */
  const handleDownloadAndUpload = async () => {
    try {
      setUploadStatus('generating');
      setUploadMsg('Generating your PDF…');

      await ensureLibs();
      const { jsPDF } = window.jspdf;

      const cardEl = cvCardRef.current;
      if (!cardEl) throw new Error('CV element not found');

      const canvas = await window.html2canvas(cardEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (el) =>
          el.classList.contains('no-print') ||
          el.classList.contains('rv-toolbar') ||
          el.classList.contains('edit-banner') ||
          el.classList.contains('mobile-tabs') ||
          el.classList.contains('cv-actions'),
      });

      const imgData  = canvas.toDataURL('image/jpeg', 0.92);
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW    = pdf.internal.pageSize.getWidth();
      const pageH    = pdf.internal.pageSize.getHeight();
      const imgRatio = canvas.height / canvas.width;
      const imgH     = pageW * imgRatio;

      if (imgH <= pageH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, imgH);
      } else {
        let yOffset = 0;
        let remaining = imgH;
        while (remaining > 0) {
          const sliceH = Math.min(remaining, pageH);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width  = canvas.width;
          sliceCanvas.height = (sliceH / imgH) * canvas.height;
          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, -(yOffset / imgH) * canvas.height);
          pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, sliceH);
          remaining -= pageH;
          yOffset   += pageH;
          if (remaining > 0) pdf.addPage();
        }
      }

      const fileName = `CV_${cv?.firstName || 'Student'}_${cv?.lastName || ''}.pdf`;
      const pdfBlob  = pdf.output('blob');

      const dlUrl = URL.createObjectURL(pdfBlob);
      const link  = document.createElement('a');
      link.href     = dlUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(dlUrl), 5000);

      setUploadStatus('uploading');
      setUploadMsg('Uploading CV to your application…');

      // ✅ Rule 4: token used only for null check
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');

      const formData = new FormData();
      formData.append('file', new File([pdfBlob], fileName, { type: 'application/pdf' }));

      // ✅ Rule 3: axiosInstance with clean path
      // ✅ Content-Type kept because this is multipart/form-data, not JSON
      const res = await axiosInstance.post('/api/application/documents/upload/cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!res.data?.success) throw new Error(res.data?.message || 'Upload failed');

      setUploadStatus('done');
      setUploadMsg('CV downloaded and uploaded successfully!');

      if (onDownload) {
        const fileData = res.data.fileData || {};
        onDownload({
          ...cv,
          _uploadedFile: {
            name:         fileName,
            size:         pdfBlob.size,
            type:         'application/pdf',
            fileName:     fileData.fileName    || fileName,
            fileKey:      fileData.fileKey     || null,
            fileUrl:      fileData.fileUrl     || null,
            originalName: fileName,
            generated:    true,
            uploadedAt:   new Date().toISOString(),
            completionPercentage: res.data.completionPercentage,
          },
        });
      }

      setTimeout(() => { if (onPrev) onPrev(); }, 1800);

    } catch (err) {
      console.error('Download and Upload failed:', err);
      setUploadStatus('error');
      setUploadMsg(err?.response?.data?.message || err.message || 'Something went wrong. Please try again.');
    }
  };

  /* ── Legacy print ──────────────────────────────── */
  const handlePrint = () => {
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
      .rv-page { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
      .rv-card { box-shadow: none !important; min-height: 0 !important; }
      .no-print, .rv-toolbar, .edit-banner, .mobile-tabs, .cv-actions { display: none !important; }
      @page { margin: 0; size: A4 portrait; }
    </style>
  </head>
  <body>
    ${cvCardEl.outerHTML}
    <script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 600); };<\/script>
  </body>
</html>`);
    printWindow.document.close();
  };

  /* ── Loading ──────────────────────────────────── */
  if (loading) return (
    <div className="rv-wrapper">
      <div className="rv-loading"><div className="rv-spinner" /><p>Loading your CV…</p></div>
    </div>
  );

  /* ── Error ────────────────────────────────────── */
  if (error || !cv) return (
    <div className="rv-wrapper">
      <div className="rv-error-card">
        <button type="button" className="rv-error-close" onClick={handleCloseError} aria-label="Dismiss error">×</button>
        <div className="rv-error-icon">!</div>
        <p className="rv-error-msg">{error || 'No resume data found.'}</p>
        <div className="rv-error-actions">
          <button type="button" className="rv-err-btn primary"   onClick={handleRetry}>Try Again</button>
          <button type="button" className="rv-err-btn secondary" onClick={handleCloseError}>Dismiss</button>
        </div>
      </div>
    </div>
  );

  /* ── Derived values ───────────────────────────── */
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
    { label: 'Listening', score: cv.listeningScore, field: 'listeningScore' },
    { label: 'Reading',   score: cv.readingScore,   field: 'readingScore'   },
    { label: 'Writing',   score: cv.writingScore,   field: 'writingScore'   },
    { label: 'Speaking',  score: cv.speakingScore,  field: 'speakingScore'  },
  ];

  const activeGrades = scoreData ? GRADE_KEYS.filter(gk => scoreData.grades[gk]?.length > 0) : [];
  const activeTests  = scoreData ? Object.entries(TEST_LABELS).filter(([key]) => scoreData[key] && scoreData[key] !== '') : [];

  const isProcessing = uploadStatus === 'generating' || uploadStatus === 'uploading';

  /* ─────────────────────────────────────────────────
     SIDEBAR CONTENT
  ───────────────────────────────────────────────── */
  const SidebarContent = () => (
    <>
      {/* Contact */}
      <div className="sb-section">
        <div className="sb-label">Contact</div>
        <div className="sb-text">
          <EditableField value={cv.mobile} onChange={update('mobile')} isEditing={isEditing} placeholder="Phone" />
        </div>
        <div className="sb-text">
          <EditableField value={cv.email} onChange={update('email')} isEditing={isEditing} placeholder="Email" />
        </div>
        <div className="sb-text">
          <EditableField value={cv.currentAddress} onChange={update('currentAddress')} isEditing={isEditing} placeholder="Address" />
        </div>
        {isEditing ? (
          <div className="addr-row">
            <input className="ei mini" value={cv.city}       onChange={(e) => update('city')(e.target.value)}       placeholder="City"  />
            <input className="ei mini" value={cv.state}      onChange={(e) => update('state')(e.target.value)}      placeholder="State" />
            <input className="ei mini" value={cv.postalCode} onChange={(e) => update('postalCode')(e.target.value)} placeholder="Post"  />
          </div>
        ) : (
          <div className="sb-text">{[cv.city, cv.state, cv.postalCode].filter(Boolean).join(', ') || ''}</div>
        )}
        <div className="sb-text">
          <EditableField value={cv.country} onChange={update('country')} isEditing={isEditing} placeholder="Country" />
        </div>
      </div>

      {/* Summary */}
      <div className="sb-section">
        <div className="sb-label">Summary</div>
        {isEditing && (
          <div className="edit-hint no-print" style={{ marginBottom: 6 }}>Edit or leave blank to auto-generate.</div>
        )}
        <EditableField
          value={isEditing ? (cv.customSummary || '') : displaySummary}
          onChange={update('customSummary')}
          isEditing={isEditing}
          multiline
          className="sb-body-text"
          placeholder={autoSummary}
        />
      </div>

      {/* Education */}
      <div className="sb-section">
        <div className="sb-label">Education</div>
        <div className="sb-edu-block">
          <div className="sb-bold">
            <EditableField value={cv.institutionName} onChange={update('institutionName')} isEditing={isEditing} placeholder="Institution Name" />
          </div>
          <div className="sb-sub">
            {isEditing
              ? <EditableField value={cv.qualificationLevel} onChange={update('qualificationLevel')} isEditing={isEditing} placeholder="Degree" />
              : displayDegree}
          </div>
          <div className="sb-period">
            {cv.startYear || cv.endYear
              ? `${cv.startYear || '?'} – ${cv.endYear || 'Present'}`
              : isEditing
              ? (
                <>
                  <input className="ei mini" value={cv.startYear} onChange={(e) => update('startYear')(e.target.value)} placeholder="Start" />
                  {' – '}
                  <input className="ei mini" value={cv.endYear}   onChange={(e) => update('endYear')(e.target.value)}   placeholder="End"   />
                </>
              )
              : ''}
          </div>
          {cv.boardUniversity && (
            <div className="sb-text">
              <EditableField value={cv.boardUniversity} onChange={update('boardUniversity')} isEditing={isEditing} placeholder="Board/University" />
            </div>
          )}
          {cv.score && (
            <div className="sb-text">
              Score:{' '}
              <EditableField value={cv.score} onChange={update('score')} isEditing={isEditing} placeholder="Score" />
            </div>
          )}
        </div>
      </div>

      {/* Academic Grades (sidebar summary) */}
      {activeGrades.length > 0 && (
        <div className="sb-section">
          <div className="sb-label">Academic Grades</div>
          {activeGrades.map(gk => {
            const avg = calcAvg(scoreData.grades[gk]);
            return (
              <div key={gk} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                <span style={{ color: 'var(--text-soft)' }}>{GRADE_LABELS[gk]}</span>
                {avg !== null && <span className="sb-badge">{avg}%</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Test Scores (sidebar) */}
      {activeTests.length > 0 && (
        <div className="sb-section">
          <div className="sb-label">Test Scores</div>
          <div className="sb-badge-grid">
            {activeTests.map(([key, label]) => (
              <div key={key} className="sb-badge">{label}: {scoreData[key]}</div>
            ))}
          </div>
        </div>
      )}

      {/* Language / EQHE (sidebar) */}
      {(cv.englishTestType || hasEqheScores) && (
        <div className="sb-section">
          <div className="sb-label">Language</div>
          <div className="sb-bold">
            <EditableField value={cv.englishTestType} onChange={update('englishTestType')} isEditing={isEditing} placeholder="Test Type" />
          </div>
          {cv.testScore && <div className="sb-text">Overall: <strong>{cv.testScore}</strong></div>}
          {hasEqheScores && scoreBands.map(b => (
            <SkillBar key={b.label} label={`${b.label}  ${b.score || ''}`} pct={(parseFloat(b.score) / 9) * 100} />
          ))}
        </div>
      )}

      {/* Passport */}
      {(cv.passportNumber || cv.issuingCountry) && (
        <div className="sb-section">
          <div className="sb-label">Passport</div>
          <div className="sb-text">
            No:{' '}
            {isEditing
              ? <input className="ei" value={cv.passportNumber} onChange={(e) => update('passportNumber')(e.target.value)} placeholder="Passport No." />
              : cv.passportNumber || '—'}
          </div>
          <div className="sb-text">
            Issued:{' '}
            {isEditing
              ? <input className="ei" value={cv.issuingCountry} onChange={(e) => update('issuingCountry')(e.target.value)} placeholder="Issuing Country" />
              : cv.issuingCountry || '—'}
          </div>
          <div className="sb-text">Expiry: {formatDate(cv.passportExpiryDate)}</div>
          <div className="sb-text">Visa: {cv.needVisa ? toTitleCase(cv.needVisa) : 'N/A'}</div>
        </div>
      )}
    </>
  );

  /* ─────────────────────────────────────────────────
     MAIN CONTENT
  ───────────────────────────────────────────────── */
  const MainContent = () => (
    <>
      {/* Course Preferences */}
      {(cv.courseName || cv.selectedUniversity || isEditing) && (
        <>
          <div className="sec-title">Course Preferences</div>
          <div className="pref-block">
            <div className="pref-title">
              1st Choice —{' '}
              <EditableField value={cv.courseName} onChange={update('courseName')} isEditing={isEditing} placeholder="Course name" />
            </div>
            <div className="pref-sub">
              <EditableField value={cv.selectedUniversity} onChange={update('selectedUniversity')} isEditing={isEditing} placeholder="University" />
            </div>
            <div className="pref-meta">
              <EditableField value={cv.programLevel} onChange={update('programLevel')} isEditing={isEditing} placeholder="Level" />
              {cv.studyMode && <><span className="dot">·</span><EditableField value={cv.studyMode} onChange={update('studyMode')} isEditing={isEditing} placeholder="Mode" /></>}
              {cv.selectedCountry && <><span className="dot">·</span><EditableField value={cv.selectedCountry} onChange={update('selectedCountry')} isEditing={isEditing} placeholder="Country" /></>}
              {(cv.intakeMonth || cv.intakeYear) && (
                <><span className="dot">·</span>
                  Intake:{' '}
                  <EditableField value={cv.intakeMonth} onChange={update('intakeMonth')} isEditing={isEditing} placeholder="Month" />
                  {' '}
                  <EditableField value={cv.intakeYear} onChange={update('intakeYear')} isEditing={isEditing} placeholder="Year" />
                </>
              )}
            </div>
          </div>
          {(cv.secondPreference || isEditing) && (
            <div className="pref-block">
              <div className="pref-title">
                2nd Choice —{' '}
                <EditableField value={cv.secondPreference} onChange={update('secondPreference')} isEditing={isEditing} placeholder="Second preference" />
              </div>
            </div>
          )}
          {(cv.thirdPreference || isEditing) && (
            <div className="pref-block">
              <div className="pref-title">
                3rd Choice —{' '}
                <EditableField value={cv.thirdPreference} onChange={update('thirdPreference')} isEditing={isEditing} placeholder="Third preference" />
              </div>
            </div>
          )}
        </>
      )}

      {/* Educational Background (main detail) */}
      {(cv.qualificationLevel || cv.institutionName || isEditing) && (
        <>
          <div className="sec-title">Educational Background</div>
          <div className="entry-block">
            <div className="entry-org">
              <EditableField value={cv.institutionName} onChange={update('institutionName')} isEditing={isEditing} placeholder="Institution" />
            </div>
            <div className="entry-title">
              {isEditing
                ? <EditableField value={cv.qualificationLevel} onChange={update('qualificationLevel')} isEditing={isEditing} placeholder="Degree" />
                : displayDegree}
            </div>
            <div className="entry-meta">
              {isEditing ? (
                <>
                  <input className="ei mini" value={cv.startYear} onChange={(e) => update('startYear')(e.target.value)} placeholder="Start" />
                  {' – '}
                  <input className="ei mini" value={cv.endYear}   onChange={(e) => update('endYear')(e.target.value)}   placeholder="End"   />
                </>
              ) : (
                cv.startYear || cv.endYear ? `${cv.startYear || '?'} – ${cv.endYear || 'Present'}` : ''
              )}
              {cv.countryOfStudy && <><span className="dot">·</span>{cv.countryOfStudy}</>}
            </div>
            {(cv.boardUniversity || isEditing) && (
              <div className="entry-detail">
                Awarding Body:{' '}
                <EditableField value={cv.boardUniversity} onChange={update('boardUniversity')} isEditing={isEditing} placeholder="Board / University" />
              </div>
            )}
            {(cv.score || isEditing) && (
              <div className="entry-detail">
                Score / Grade:{' '}
                <EditableField value={cv.score} onChange={update('score')} isEditing={isEditing} placeholder="e.g. 78%" />
              </div>
            )}
          </div>
        </>
      )}

      {/* Academic Scores */}
      {activeGrades.length > 0 && (
        <>
          <div className="sec-title">Academic Scores</div>
          {activeGrades.map(gk => {
            const subjects = scoreData.grades[gk];
            const avg      = calcAvg(subjects);
            return (
              <div key={gk} className="entry-block score-grade-block" style={{ marginBottom: 14 }}>
                <div className="score-grade-header">
                  <span className="score-grade-title">{GRADE_LABELS[gk]}</span>
                  {avg !== null && <span className="score-grade-avg">Average: {avg}%</span>}
                </div>
                <div className="score-subject-table">
                  <div className="score-subject-head">
                    <span>Subject</span><span>Marks</span><span>Grade</span>
                  </div>
                  {subjects.map(({ subject, marks }) => {
                    const num = parseFloat(marks);
                    const grade = marks === '' || isNaN(num) ? '—' : num >= 90 ? 'A+' : num >= 80 ? 'A' : num >= 70 ? 'B+' : num >= 60 ? 'B' : num >= 50 ? 'C' : 'F';
                    const colorClass = marks === '' || isNaN(num) ? '' : num >= 80 ? 'grade-hi' : num >= 60 ? 'grade-mid' : 'grade-lo';
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

      {/* Standardised Test Scores */}
      {activeTests.length > 0 && (
        <>
          <div className="sec-title">Standardised Test Scores</div>
          <div className="score-test-grid" style={{ marginBottom: 14 }}>
            {activeTests.map(([key, label]) => {
              const val       = scoreData[key];
              const max       = TEST_MAX[key];
              const pct       = max ? Math.round((parseFloat(val) / max) * 100) : null;
              const subScores = key === 'satTotal'
                ? [scoreData.satMath ? `Math: ${scoreData.satMath}` : null, scoreData.satReading ? `R&W: ${scoreData.satReading}` : null].filter(Boolean)
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
        </>
      )}

      {/* Entrance Qualification (EQHE) */}
      {(cv.englishTestType || isEditing) && (
        <>
          <div className="sec-title">Entrance Qualification (EQHE)</div>
          <div className="entry-block">
            <div className="entry-org">
              {isEditing
                ? <EditableField value={cv.englishTestType} onChange={update('englishTestType')} isEditing={isEditing} placeholder="Qualification Title" />
                : displayEqhe}
              {cv.testScore && <> — Score {cv.testScore}</>}
              {cv.eqheCountry && <> ({toTitleCase(cv.eqheCountry)})</>}
            </div>
            {cv.testDate && <div className="entry-meta">Test Date: {formatDate(cv.testDate)}</div>}
            {hasEqheScores && (
              <div className="score-grid">
                {scoreBands.map(({ label, score, field }) => (
                  <div key={label} className="score-chip">
                    <div className="score-chip-label">{label}</div>
                    <EditableField
                      value={score}
                      onChange={update(field)}
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

      {/* Skills & Proficiencies */}
      {hasEqheScores && (
        <>
          <div className="sec-title">Skills &amp; Proficiencies</div>
          <div style={{ paddingLeft: 4 }}>
            {scoreBands.filter(b => b.score).map(b => (
              <SkillBar key={b.label} label={`${b.label}: ${b.score}`} pct={(parseFloat(b.score) / 9) * 100} />
            ))}
          </div>
        </>
      )}

      {/* Personal Information */}
      <div className="sec-title">Personal Information</div>
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
            <span className="pi-label">{label}:</span>
            {editable && isEditing
              ? <input className="ei inline" value={cv[field] || ''} onChange={(e) => update(field)(e.target.value)} placeholder={label} />
              : <span className="pi-val">{val || '—'}</span>}
          </div>
        ))}
        {cv.hasSpecialNeeds && cv.hasSpecialNeeds !== 'no' && (
          <div className="pi-row">
            <span className="pi-label">Special Needs:</span>
            <span className="pi-val">{toTitleCase(cv.hasSpecialNeeds)}</span>
          </div>
        )}
      </div>

      {/* References */}
      <div className="sec-title" style={{ marginTop: 20 }}>References</div>
      <p className="ref-text">References available upon request.</p>

      {/* Action Buttons */}
      <div className="cv-actions no-print">
        {isEditing ? (
          <>
            <button type="button" className="cv-btn save"   onClick={handleSave}>Save</button>
            <button type="button" className="cv-btn cancel" onClick={handleExitEdit}>Cancel</button>
          </>
        ) : (
          <>
            <button type="button" className="cv-btn edit" onClick={() => setIsEditing(true)}>Edit CV</button>
            {onPrev && (
              <button type="button" className="cv-btn cancel" onClick={handleClose}>Close</button>
            )}
          </>
        )}
        <button
          type="button"
          className={`cv-btn upload-dl ${uploadStatus === 'done' ? 'upload-dl--done' : ''} ${uploadStatus === 'error' ? 'upload-dl--error' : ''}`}
          onClick={handleDownloadAndUpload}
          disabled={isProcessing || uploadStatus === 'done'}
        >
          {uploadStatus === 'idle'       && 'Download & Upload CV'}
          {uploadStatus === 'generating' && <><span className="cv-spin" /> Generating…</>}
          {uploadStatus === 'uploading'  && <><span className="cv-spin" /> Uploading…</>}
          {uploadStatus === 'done'       && 'Uploaded!'}
          {uploadStatus === 'error'      && 'Retry'}
        </button>
      </div>

      {/* Status message */}
      {uploadMsg && (
        <div className={`cv-upload-msg cv-upload-msg--${uploadStatus}`}>
          {uploadMsg}
          {uploadStatus === 'error' && (
            <button
              type="button"
              className="cv-upload-msg-close"
              onClick={() => { setUploadStatus('idle'); setUploadMsg(''); }}
            >×</button>
          )}
        </div>
      )}
    </>
  );

  /* ── Render ───────────────────────────────────── */
  return (
    <div className="rv-wrapper">

      {/* Toolbar */}
      <div className="rv-toolbar no-print">
        <div className="toolbar-l">
          <span className="toolbar-title">CV Preview</span>
          {isEditing && <span className="toolbar-hint">Click any field to edit</span>}
        </div>
        <div className="toolbar-r">
          {isSaved && <span className="saved-badge">Saved</span>}
          {isEditing ? (
            <button type="button" className="tb-btn tb-save" onClick={handleSave}>Save</button>
          ) : (
            <button type="button" className="tb-btn tb-edit" onClick={() => setIsEditing(true)}>Edit</button>
          )}
          <button type="button" className="tb-btn tb-cancel" onClick={handleExitEdit}>
            {isEditing ? 'Cancel' : 'Close'}
          </button>
          <button type="button" className="tb-btn tb-dl" onClick={handlePrint} title="Print / Save as PDF">Print</button>
          <button
            type="button"
            className="tb-btn tb-upload"
            onClick={handleDownloadAndUpload}
            disabled={isProcessing || uploadStatus === 'done'}
            title="Download PDF and upload to your application"
          >
            {isProcessing ? '…' : uploadStatus === 'done' ? '✓' : 'Upload CV'}
          </button>
        </div>
      </div>

      {/* Edit banner */}
      {isEditing && (
        <div className="edit-banner no-print">
          <span><strong>Edit mode</strong> — tap any highlighted field to change it.</span>
          <button type="button" className="banner-close" onClick={handleExitEdit} aria-label="Exit edit mode">×</button>
        </div>
      )}

      {/* Mobile Tab Bar */}
      <div className="mobile-tabs no-print">
        <button type="button" className={`mob-tab ${mobileTab === 'sidebar' ? 'active' : ''}`} onClick={() => setMobileTab('sidebar')}>Profile</button>
        <button type="button" className={`mob-tab ${mobileTab === 'main'    ? 'active' : ''}`} onClick={() => setMobileTab('main')}>Details</button>
      </div>

      {/* Resume Card */}
      <div className="rv-page">
        <div className="rv-card" ref={cvCardRef}>

          {/* TOP HEADER BAND — full width name + role */}
          <div className="cv-header-band">
            <div className="cv-header-name">
              <EditableField value={cv.firstName} onChange={update('firstName')} isEditing={isEditing} placeholder="First Name" />
              {' '}
              <EditableField value={cv.lastName}  onChange={update('lastName')}  isEditing={isEditing} placeholder="Last Name"  />
            </div>
            <div className="cv-header-role">
              <EditableField
                value={cv.programLevel ? `${toTitleCase(cv.programLevel)} Applicant` : cv.courseName || ''}
                onChange={update('courseName')}
                isEditing={isEditing}
                placeholder="Role / Programme"
              />
            </div>
          </div>

          {/* TWO-COLUMN BODY */}
          <aside className={`rv-sidebar ${mobileTab === 'main'    ? 'mob-hidden' : ''}`}>
            <SidebarContent />
          </aside>
          <main className={`rv-main   ${mobileTab === 'sidebar' ? 'mob-hidden' : ''}`}>
            <MainContent />
          </main>

        </div>
      </div>

    </div>
  );
};

export default Resume;