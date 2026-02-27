// src/components/Resume.js
import React, { useState } from 'react';
import './Resume.css';

// ─────────────────────────────────────────────────────────────────
//  Helper: format ISO date string → "14 May 1999"
// ─────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

// ─────────────────────────────────────────────────────────────────
//  EditableField — plain text normally, input/textarea in edit mode
// ─────────────────────────────────────────────────────────────────
const EditableField = ({
  value,
  onChange,
  isEditing,
  multiline   = false,
  className   = '',
  placeholder = '—',
}) => {
  if (!isEditing) {
    return <span className={`editable-value ${className}`}>{value || placeholder}</span>;
  }
  if (multiline) {
    return (
      <textarea
        className={`editable-input editable-textarea ${className}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
    );
  }
  return (
    <input
      type="text"
      className={`editable-input ${className}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};

// ─────────────────────────────────────────────────────────────────
//  Static sub-components
// ─────────────────────────────────────────────────────────────────
const SideLabel = ({ title }) => (
  <div className="sidebar-section-label">{title}</div>
);

const SectionHeader = ({ title }) => (
  <div className="section-header">
    <div className="section-header-inner">
      <div className="section-header-bar" />
      <span className="section-header-title">{title}</span>
    </div>
    <div className="section-header-line" />
  </div>
);

const EditableContactRow = ({ icon, value, onChange, isEditing, placeholder }) => (
  <div className="contact-row">
    <span className="contact-icon">{icon}</span>
    <EditableField
      value={value}
      onChange={onChange}
      isEditing={isEditing}
      className="contact-text"
      placeholder={placeholder}
    />
  </div>
);

const SkillBar = ({ label, pct }) => (
  <div className="skill-bar-wrapper">
    <div className="skill-bar-label">{label}</div>
    <div className="skill-bar-track">
      <div className="skill-bar-fill" style={{ width: `${Math.min(pct || 0, 100)}%` }} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
//  Main Resume Component
//
//  Props
//    formData   : object  — all fields from the application forms
//    onDownload : fn(cv)  — called when student clicks Download PDF
//                          so Documents section can auto-attach it
// ─────────────────────────────────────────────────────────────────
const Resume = ({ formData = {}, onDownload }) => {

  // ── Local editable copy — pre-filled from formData ───────────────
  const [cv, setCv] = useState({
    // Personal
    title:                  formData.title                  || '',
    firstName:              formData.firstName              || '',
    lastName:               formData.lastName               || '',
    email:                  formData.email                  || '',
    mobile:                 formData.mobile                 || '',
    dateOfBirth:            formData.dateOfBirth            || '',
    placeOfBirth:           formData.placeOfBirth           || '',
    countryOfBirth:         formData.countryOfBirth         || '',
    citizenship:            formData.citizenship            || '',
    gender:                 formData.gender                 || '',
    correspondenceLanguage: formData.correspondenceLanguage || '',
    isEUCitizen:            formData.isEUCitizen,
    needVisa:               formData.needVisa               || '',

    // Passport
    passportNumber:     formData.passportNumber     || '',
    passportExpiryDate: formData.passportExpiryDate || '',
    issuingCountry:     formData.issuingCountry     || '',

    // Address (handles both naming conventions)
    currentAddress: formData.currentAddress || formData.streetAndHouseNumber || '',
    city:           formData.city           || '',
    state:          formData.state          || formData.stateProvince         || '',
    postalCode:     formData.postalCode     || formData.postcode              || '',
    country:        formData.country        || '',

    // Education
    qualificationLevel: formData.qualificationLevel || formData.degree         || '',
    institutionName:    formData.institutionName    || '',
    boardUniversity:    formData.boardUniversity    || formData.specialisation  || '',
    countryOfStudy:     formData.countryOfStudy     || '',
    startYear:          formData.startYear          || '',
    endYear:            formData.endYear            || '',
    score:              formData.score              || formData.remarks         || '',
    resultStatus:       formData.resultStatus       || '',
    gradingSystem:      formData.gradingSystem       || '',

    // Language / EQHE
    englishTestType: formData.englishTestType || formData.eqheOriginalTitle || '',
    testScore:       formData.testScore       || '',
    testDate:        formData.testDate        || formData.eqheDate           || '',
    listeningScore:  formData.listeningScore  || '',
    readingScore:    formData.readingScore    || '',
    writingScore:    formData.writingScore    || '',
    speakingScore:   formData.speakingScore   || '',

    // Course
    selectedCountry:    formData.selectedCountry    || '',
    selectedUniversity: formData.selectedUniversity || '',
    campus:             formData.campus             || '',
    courseName:         formData.courseName         || '',
    programLevel:       formData.programLevel       || '',
    studyMode:          formData.studyMode          || '',
    intakeMonth:        formData.intakeMonth        || '',
    intakeYear:         String(formData.intakeYear  || ''),
    secondPreference:   formData.secondPreference   || '',
    thirdPreference:    formData.thirdPreference    || '',

    // Custom summary (student can personalise)
    customSummary: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaved,   setIsSaved]   = useState(false);

  // Single field updater
  const update = (field) => (value) => setCv(prev => ({ ...prev, [field]: value }));

  // Avatar initials
  const initials = `${(cv.firstName || 'A')[0]}${(cv.lastName || 'S')[0]}`.toUpperCase();

  // Skill bars (only shown when scores exist)
  const ieltsBands = [
    { label: `Listening  ${cv.listeningScore}`, pct: (parseFloat(cv.listeningScore) / 9) * 100 },
    { label: `Reading    ${cv.readingScore}`,   pct: (parseFloat(cv.readingScore)   / 9) * 100 },
    { label: `Writing    ${cv.writingScore}`,   pct: (parseFloat(cv.writingScore)   / 9) * 100 },
    { label: `Speaking   ${cv.speakingScore}`,  pct: (parseFloat(cv.speakingScore)  / 9) * 100 },
  ];
  const hasScores = cv.listeningScore || cv.readingScore || cv.writingScore || cv.speakingScore;

  // Auto-generated summary fallback
  const autoSummary =
    `Motivated and academically accomplished applicant from ${cv.institutionName || 'my institution'}, ` +
    `${cv.countryOfStudy || ''}, holding a ${cv.qualificationLevel || 'degree'}` +
    `${cv.score ? ` with a score of ${cv.score}` : ''}. ` +
    `Currently applying for ${cv.courseName || 'the selected course'} at ` +
    `${cv.selectedUniversity || 'my chosen university'}, ${cv.selectedCountry || ''} ` +
    `for the ${cv.intakeMonth || ''} ${cv.intakeYear || ''} intake. ` +
    `Strong academic background with ${cv.englishTestType || 'English qualification'} ` +
    `${cv.testScore ? `overall score of ${cv.testScore}` : 'proficiency'}. ` +
    `Passionate, disciplined, and eager to contribute to a diverse academic environment.`;

  const displaySummary = cv.customSummary || autoSummary;

  const handleSave = () => {
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDownload = () => {
    if (onDownload) onDownload(cv);   // notify parent to attach CV to documents
    window.print();
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="resume-wrapper">

      {/* ── Toolbar (hidden on print) ── */}
      <div className="resume-toolbar no-print">
        <div className="toolbar-left">
          <span className="toolbar-title">📄 CV Preview</span>
          {isEditing && <span className="toolbar-hint">✏️ Click any field to edit</span>}
        </div>
        <div className="toolbar-right">
          {isSaved && <span className="toolbar-saved">✓ Changes saved</span>}
          {isEditing ? (
            <>
              <button className="toolbar-btn toolbar-btn-save"   onClick={handleSave}>💾 Save Changes</button>
              <button className="toolbar-btn toolbar-btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
            </>
          ) : (
            <button className="toolbar-btn toolbar-btn-edit" onClick={() => setIsEditing(true)}>✏️ Edit CV</button>
          )}
          <button className="toolbar-btn toolbar-btn-download" onClick={handleDownload}>⬇ Download PDF</button>
        </div>
      </div>

      {/* ── Editing banner ── */}
      {isEditing && (
        <div className="edit-banner no-print">
          ✏️ <strong>Editing mode</strong> — All highlighted fields are editable. Click any text to change it.
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          RESUME CARD
      ══════════════════════════════════════════════════════ */}
      <div className="resume-page">
        <div className="resume-card">

          {/* ══════════════ LEFT SIDEBAR ══════════════ */}
          <div className="resume-sidebar">

            {/* Avatar + Name */}
            <div className="sidebar-top">
              <div className="sidebar-avatar">{initials}</div>
              <div className="sidebar-name">
                <EditableField value={cv.firstName} onChange={update('firstName')} isEditing={isEditing} placeholder="First Name" />
                &nbsp;
                <EditableField value={cv.lastName}  onChange={update('lastName')}  isEditing={isEditing} placeholder="Last Name" />
              </div>
              <div className="sidebar-role">
                <EditableField value={cv.programLevel} onChange={update('programLevel')} isEditing={isEditing} placeholder="Program Level" /> Applicant
              </div>
            </div>

            <div className="sidebar-body">

              {/* Contact */}
              <SideLabel title="Contact Details" />
              <EditableContactRow icon="✉"  value={cv.email}          onChange={update('email')}          isEditing={isEditing} placeholder="Email address" />
              <EditableContactRow icon="📱" value={cv.mobile}         onChange={update('mobile')}         isEditing={isEditing} placeholder="Mobile number" />
              <EditableContactRow icon="📍" value={cv.currentAddress} onChange={update('currentAddress')} isEditing={isEditing} placeholder="Street address" />

              {/* City/State/Postcode — combined display, split edit */}
              {isEditing ? (
                <div className="address-edit-row">
                  <input className="editable-input mini" value={cv.city}       onChange={(e) => update('city')(e.target.value)}       placeholder="City"     />
                  <input className="editable-input mini" value={cv.state}      onChange={(e) => update('state')(e.target.value)}      placeholder="State"    />
                  <input className="editable-input mini" value={cv.postalCode} onChange={(e) => update('postalCode')(e.target.value)} placeholder="Postcode" />
                </div>
              ) : (
                <div className="contact-row">
                  <span className="contact-icon">🏙</span>
                  <span className="contact-text">
                    {[cv.city, cv.state, cv.postalCode].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              )}
              <EditableContactRow icon="🌍" value={cv.country} onChange={update('country')} isEditing={isEditing} placeholder="Country" />

              {/* Passport */}
              <SideLabel title="Passport" />
              <div className="contact-row">
                <span className="contact-icon">🛂</span>
                {isEditing
                  ? <input className="editable-input" value={cv.passportNumber} onChange={(e) => update('passportNumber')(e.target.value)} placeholder="Passport Number" />
                  : <span className="contact-text">No: {cv.passportNumber || '—'}</span>
                }
              </div>
              <div className="contact-row">
                <span className="contact-icon">🏳️</span>
                {isEditing
                  ? <input className="editable-input" value={cv.issuingCountry} onChange={(e) => update('issuingCountry')(e.target.value)} placeholder="Issuing Country" />
                  : <span className="contact-text">Issued: {cv.issuingCountry || '—'}</span>
                }
              </div>
              <div className="contact-row">
                <span className="contact-icon">📅</span>
                <span className="contact-text">Expiry: {formatDate(cv.passportExpiryDate)}</span>
              </div>
              <div className="contact-row">
                <span className="contact-icon">✈️</span>
                <span className="contact-text">Visa Required: {cv.needVisa || 'N/A'}</span>
              </div>

              {/* Education summary */}
              <SideLabel title="Education" />
              <EditableField value={cv.qualificationLevel} onChange={update('qualificationLevel')} isEditing={isEditing} className="sidebar-edu-degree"      placeholder="Degree" />
              <EditableField value={cv.institutionName}    onChange={update('institutionName')}    isEditing={isEditing} className="sidebar-edu-institution" placeholder="Institution" />
              <div className="sidebar-edu-period">
                <EditableField value={cv.startYear} onChange={update('startYear')} isEditing={isEditing} placeholder="Start" />
                {' – '}
                <EditableField value={cv.endYear}   onChange={update('endYear')}   isEditing={isEditing} placeholder="End" />
                {cv.score ? ` · ${cv.score}` : ''}
              </div>

              {/* EQHE / English */}
              <SideLabel title="Entrance Qualification" />
              <EditableField value={cv.englishTestType} onChange={update('englishTestType')} isEditing={isEditing} className="sidebar-eqhe-title" placeholder="EQHE Title" />
              <div className="sidebar-eqhe-date">Date: {formatDate(cv.testDate)}</div>
              {hasScores && (
                <>
                  <div className="ielts-overall-row">
                    <span className="ielts-label">Overall</span>
                    <EditableField value={cv.testScore} onChange={update('testScore')} isEditing={isEditing} className="ielts-score" placeholder="—" />
                  </div>
                  {ieltsBands.map(b => <SkillBar key={b.label} label={b.label} pct={b.pct} />)}
                </>
              )}

              {/* Target University */}
              <SideLabel title="Target University" />
              <EditableContactRow icon="🎓" value={cv.selectedUniversity} onChange={update('selectedUniversity')} isEditing={isEditing} placeholder="University" />
              <EditableContactRow icon="🌍" value={cv.selectedCountry}    onChange={update('selectedCountry')}    isEditing={isEditing} placeholder="Country" />
              {isEditing ? (
                <div className="address-edit-row">
                  <input className="editable-input mini" value={cv.intakeMonth} onChange={(e) => update('intakeMonth')(e.target.value)} placeholder="Month" />
                  <input className="editable-input mini" value={cv.intakeYear}  onChange={(e) => update('intakeYear')(e.target.value)}  placeholder="Year"  />
                </div>
              ) : (
                <div className="contact-row">
                  <span className="contact-icon">📆</span>
                  <span className="contact-text">{cv.intakeMonth} {cv.intakeYear}</span>
                </div>
              )}

            </div>
          </div>
          {/* end sidebar */}

          {/* ══════════════ MAIN CONTENT ══════════════ */}
          <div className="resume-main">

            {/* Name / Role */}
            <div className="main-name">
              <EditableField value={cv.firstName} onChange={update('firstName')} isEditing={isEditing} placeholder="First Name" />
              &nbsp;
              <EditableField value={cv.lastName}  onChange={update('lastName')}  isEditing={isEditing} placeholder="Last Name" />
            </div>
            <div className="main-role">
              <EditableField value={cv.courseName}         onChange={update('courseName')}         isEditing={isEditing} placeholder="Course Name" />
              &nbsp;·&nbsp;
              <EditableField value={cv.selectedUniversity} onChange={update('selectedUniversity')} isEditing={isEditing} placeholder="University" />
            </div>

            {/* Summary */}
            <SectionHeader title="Personal Summary" />
            {isEditing && (
              <div className="summary-edit-hint no-print">
                ✏️ Personalise your summary below. Leave blank to use the auto-generated version.
              </div>
            )}
            <EditableField
              value={isEditing ? (cv.customSummary || '') : displaySummary}
              onChange={update('customSummary')}
              isEditing={isEditing}
              multiline={true}
              className="summary-text"
              placeholder={autoSummary}
            />

            {/* Course Preferences */}
            <SectionHeader title="Course Preferences" />

            <div className="exp-block">
              <div className="exp-title">
                1st Choice —&nbsp;
                <EditableField value={cv.courseName} onChange={update('courseName')} isEditing={isEditing} placeholder="Course Name" />
              </div>
              <div className="exp-org">
                <EditableField value={cv.selectedUniversity} onChange={update('selectedUniversity')} isEditing={isEditing} placeholder="University" />
                {cv.campus && `, ${cv.campus}`}
              </div>
              <div className="exp-period">
                <EditableField value={cv.programLevel}    onChange={update('programLevel')}    isEditing={isEditing} placeholder="Level" />
                &nbsp;·&nbsp;
                <EditableField value={cv.studyMode}       onChange={update('studyMode')}       isEditing={isEditing} placeholder="Study Mode" />
                &nbsp;·&nbsp;
                <EditableField value={cv.selectedCountry} onChange={update('selectedCountry')} isEditing={isEditing} placeholder="Country" />
              </div>
              <div className="exp-bullet">
                Intake:&nbsp;
                <EditableField value={cv.intakeMonth} onChange={update('intakeMonth')} isEditing={isEditing} placeholder="Month" />
                &nbsp;
                <EditableField value={cv.intakeYear}  onChange={update('intakeYear')}  isEditing={isEditing} placeholder="Year" />
              </div>
            </div>

            {(cv.secondPreference || isEditing) && (
              <div className="exp-block">
                <div className="exp-title">
                  2nd Choice —&nbsp;
                  <EditableField value={cv.secondPreference} onChange={update('secondPreference')} isEditing={isEditing} placeholder="Second preference" />
                </div>
              </div>
            )}

            {(cv.thirdPreference || isEditing) && (
              <div className="exp-block">
                <div className="exp-title">
                  3rd Choice —&nbsp;
                  <EditableField value={cv.thirdPreference} onChange={update('thirdPreference')} isEditing={isEditing} placeholder="Third preference" />
                </div>
              </div>
            )}

            {/* Educational Background */}
            <SectionHeader title="Educational Background" />
            <div className="exp-block">
              <div className="exp-title">
                <EditableField value={cv.qualificationLevel} onChange={update('qualificationLevel')} isEditing={isEditing} placeholder="Degree / Qualification" />
              </div>
              <div className="exp-org">
                <EditableField value={cv.institutionName} onChange={update('institutionName')} isEditing={isEditing} placeholder="Institution Name" />
              </div>
              <div className="exp-period">
                <EditableField value={cv.startYear}      onChange={update('startYear')}      isEditing={isEditing} placeholder="Start Year" />
                &nbsp;–&nbsp;
                <EditableField value={cv.endYear}        onChange={update('endYear')}        isEditing={isEditing} placeholder="End Year" />
                &nbsp;·&nbsp;
                <EditableField value={cv.countryOfStudy} onChange={update('countryOfStudy')} isEditing={isEditing} placeholder="Country" />
              </div>
              <div className="exp-bullet">
                Awarding Body:&nbsp;
                <EditableField value={cv.boardUniversity} onChange={update('boardUniversity')} isEditing={isEditing} placeholder="Board / University" />
              </div>
              <div className="exp-bullet">
                Score / Grade:&nbsp;
                <EditableField value={cv.score} onChange={update('score')} isEditing={isEditing} placeholder="e.g. 78%, First Class" />
              </div>
            </div>

            {/* EQHE */}
            <SectionHeader title="Entrance Qualification (EQHE)" />
            <div className="exp-block">
              <div className="exp-title">
                <EditableField value={cv.englishTestType} onChange={update('englishTestType')} isEditing={isEditing} placeholder="Qualification Title" />
                {cv.testScore && ` — Score ${cv.testScore}`}
              </div>
              <div className="exp-period">Test Date: {formatDate(cv.testDate)}</div>
              {hasScores && (
                <div className="score-boxes-row">
                  {[
                    ['Listening', 'listeningScore'],
                    ['Reading',   'readingScore'],
                    ['Writing',   'writingScore'],
                    ['Speaking',  'speakingScore'],
                  ].map(([label, field]) => (
                    <div key={label} className="score-box">
                      <div className="score-box-label">{label}</div>
                      <EditableField value={cv[field]} onChange={update(field)} isEditing={isEditing} className="score-box-value" placeholder="—" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Personal Information grid */}
            <SectionHeader title="Personal Information" />
            <div className="personal-info-grid">
              {[
                ['Date of Birth',     'dateOfBirth',            false, true],   // [label, field, editable, dateFormat]
                ['Gender',            'gender',                 true,  false],
                ['Nationality',       'citizenship',            true,  false],
                ['Place of Birth',    'placeOfBirth',           true,  false],
                ['Country of Birth',  'countryOfBirth',         true,  false],
                ['Correspondence',    'correspondenceLanguage', true,  false],
                ['Visa Required',     'needVisa',               true,  false],
              ].map(([label, field, editable, isDate]) => (
                <div key={label} className="personal-info-row">
                  <span className="personal-info-label">{label}: </span>
                  {editable && isEditing ? (
                    <input
                      className="editable-input inline"
                      value={cv[field] || ''}
                      onChange={(e) => update(field)(e.target.value)}
                      placeholder={label}
                    />
                  ) : (
                    <span className="personal-info-value">
                      {isDate ? formatDate(cv[field]) : (cv[field] || '—')}
                    </span>
                  )}
                </div>
              ))}
              <div className="personal-info-row">
                <span className="personal-info-label">EU Citizen: </span>
                <span className="personal-info-value">{cv.isEUCitizen ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* References */}
            <SectionHeader title="References" />
            <p className="references-text">References available upon request.</p>

            {/* Action Buttons */}
            <div className="resume-actions no-print">
              {isEditing ? (
                <>
                  <button className="btn btn-save" onClick={handleSave}>💾 Save Changes</button>
                  <button className="btn btn-cancel" onClick={() => setIsEditing(false)}>✕ Cancel</button>
                </>
              ) : (
                <button className="btn btn-edit" onClick={() => setIsEditing(true)}>✏️ Edit CV</button>
              )}
              <button className="btn btn-download" onClick={handleDownload}>⬇ Download PDF</button>
              <button className="btn btn-print"    onClick={() => window.print()}>🖨 Print</button>
            </div>

          </div>
          {/* end resume-main */}

        </div>
        {/* end resume-card */}
      </div>
      {/* end resume-page */}

    </div>
  );
};

export default Resume;