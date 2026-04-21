import React, { useState, useEffect } from 'react';
import './masterpreview.css';

// stepIndex matches STEPS in master.js:
// 0 = Personal, 1 = Contact, 2 = Course, 3 = Academic, 4 = Tests, 5 = Documents
const MasterPreview = ({ data, updateData, onEdit }) => {
  const { personal, contact, course, academic, tests, documents } = data;

  // Declaration state lives here — replaces masterdecl.js
  const [agreed, setAgreed] = useState(data.declaration || false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (updateData) {
      updateData({ ...data, declaration: agreed });
    }
  }, [agreed]);

  const handleDeclarationChange = (e) => {
    setAgreed(e.target.checked);
    if (e.target.checked) setShowWarning(false);
  };

  const formatFileName = (file) => {
    if (file && file.name) return file.name;
    return 'Not uploaded';
  };

  const declarationStatements = [
    {
      icon: 'fas fa-check',
      title: 'Accuracy of information',
      description:
        'All information provided in this application is true, accurate, and complete to the best of my knowledge.',
    },
    {
      icon: 'fas fa-exclamation-triangle',
      title: 'Legal responsibility',
      description:
        'I understand that providing false or misleading information may result in rejection, revocation of admission, or dismissal from the university.',
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Consent to verification',
      description:
        'I consent to the university verifying any information submitted as part of this application process.',
    },
  ];

  // Edit button — calls onEdit(stepIndex) which is navigateToStep in master.js
  const EditButton = ({ stepIndex }) => (
    <button
      onClick={() => onEdit && onEdit(stepIndex)}
      style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 14px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#667eea',
        background: '#fff',
        border: '1px solid #667eea',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#667eea';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#fff';
        e.currentTarget.style.color = '#667eea';
      }}
    >
      <i className="fas fa-pencil-alt" style={{ fontSize: '11px' }}></i> Edit
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

      {/* Personal Information */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-user"></i> Personal Information
          <EditButton stepIndex={0} />
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item">
            <span className="master-preview-label">Full Name:</span>
            <span className="master-preview-value">{personal?.fullName || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Date of Birth:</span>
            <span className="master-preview-value">{personal?.dateOfBirth || '—'}</span>
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

      {/* Contact Details */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-envelope"></i> Contact Details
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

      {/* Course Selection */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-graduation-cap"></i> Course Selection
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

      {/* Academic History */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-book"></i> Academic History
          <EditButton stepIndex={3} />
        </h3>
        {academic && academic.length > 0 && academic.filter(a => a.degree).map((edu, index) => (
          <div key={index} className="master-preview-academic-entry">
            <div className="master-preview-academic-title">
              {edu.degree} in {edu.fieldOfStudy}
            </div>
            <div className="master-preview-academic-details">
              {edu.university}, {edu.country}<br />
              {edu.startDate} - {edu.endDate} | GPA: {edu.gpa || 'N/A'}
            </div>
          </div>
        ))}
        {(!academic || academic.length === 0 || !academic[0]?.degree) && (
          <div className="master-preview-empty">No academic entries added</div>
        )}
      </div>

      {/* Test Scores */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-chart-line"></i> Test Scores
          <EditButton stepIndex={4} />
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item">
            <span className="master-preview-label">IELTS:</span>
            <span className="master-preview-value">{tests?.ielts || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">TOEFL:</span>
            <span className="master-preview-value">{tests?.toefl || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">PTE:</span>
            <span className="master-preview-value">{tests?.pte || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">GRE:</span>
            <span className="master-preview-value">{tests?.gre || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">GMAT:</span>
            <span className="master-preview-value">{tests?.gmat || '—'}</span>
          </div>
        </div>
      </div>

      {/* Uploaded Documents */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-file-upload"></i> Uploaded Documents
          <EditButton stepIndex={5} />
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Passport Copy:</span>
            <span className="master-preview-value master-preview-doc">
              {formatFileName(documents?.passportCopy)}
            </span>
          </div>
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Academic Transcripts:</span>
            <span className="master-preview-value master-preview-doc">
              {formatFileName(documents?.academicTranscripts)}
            </span>
          </div>
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Resume/CV:</span>
            <span className="master-preview-value master-preview-doc">
              {formatFileName(documents?.resumeCv)}
            </span>
          </div>
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Letters of Recommendation:</span>
            <span className="master-preview-value master-preview-doc">
              {formatFileName(documents?.lettersOfRecommendation)}
            </span>
          </div>
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">English Certificate:</span>
            <span className="master-preview-value master-preview-doc">
              {formatFileName(documents?.englishCertificate)}
            </span>
          </div>
        </div>
      </div>

      {/* Declaration — replaces masterdecl.js */}
      <div className="master-preview-section master-preview-declaration">
        <h3 className="master-preview-section-title">
          <i className="fas fa-check-circle"></i> Declaration
        </h3>

        {/* Statement cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
          {declarationStatements.map((stmt, index) => (
            <div
              key={index}
              className="master-preview-academic-entry"
              style={{
                marginBottom: 0,
                paddingBottom: 12,
                borderBottom: index < declarationStatements.length - 1 ? '1px solid #e2e8f0' : 'none',
              }}
            >
              <div
                className="master-preview-academic-title"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className={stmt.icon} style={{ color: '#667eea', fontSize: '13px' }}></i>
                {stmt.title}
              </div>
              <div className="master-preview-academic-details">{stmt.description}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '2px solid #c6f6d5', marginBottom: '16px' }}></div>

        {/* Interactive checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            padding: '14px 16px',
            borderRadius: '12px',
            border: agreed
              ? '2px solid #48bb78'
              : showWarning
              ? '2px solid #fc8181'
              : '2px solid #e2e8f0',
            background: agreed ? '#f0fff4' : showWarning ? '#fff5f5' : '#fff',
            marginBottom: '14px',
            transition: 'all 0.3s ease',
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={handleDeclarationChange}
            style={{ display: 'none' }}
          />

          {/* Custom tick box */}
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '5px',
              border: agreed
                ? '2px solid #48bb78'
                : showWarning
                ? '2px solid #fc8181'
                : '2px solid #a0aec0',
              background: agreed ? '#48bb78' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px',
              transition: 'all 0.3s ease',
            }}
          >
            {agreed && (
              <i className="fas fa-check" style={{ color: '#ffffff', fontSize: '11px' }}></i>
            )}
          </div>

          <span
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: agreed ? '#276749' : '#4a5568',
              fontWeight: '600',
            }}
          >
            I confirm that all information provided in this application is true,
            accurate, and complete to the best of my knowledge. I have read and
            agree to all declarations stated above.
          </span>
        </label>

        {/* Warning */}
        {showWarning && !agreed && (
          <div
            className="master-preview-declaration-status master-preview-pending"
            style={{ marginBottom: '12px' }}
          >
            <i className="fas fa-exclamation-circle"></i>
            You must confirm the declaration before submitting.
          </div>
        )}

        {/* Confirmed badge */}
        {agreed && (
          <div className="master-preview-declaration-status master-preview-approved">
            <i className="fas fa-check-circle"></i>
            Declaration confirmed — ready to submit
          </div>
        )}

        {/* Legal notice */}
        <div
          style={{
            marginTop: '14px',
            padding: '12px 16px',
            background: '#fef5e7',
            borderRadius: '12px',
            border: '1px solid #fbd38d',
            fontSize: '13px',
            color: '#744210',
            lineHeight: '1.6',
          }}
        >
          <strong>Legal Notice:</strong> Providing false or misleading information may result in
          rejection of your application, revocation of admission, or dismissal from the university.
        </div>
      </div>

    </div>
  );
};

export default MasterPreview;