import React from 'react';
import './masterpreview.css';

const MasterPreview = ({ data }) => {
  const { personal, contact, course, academic, tests, documents, declaration } = data;

  const formatFileName = (file) => {
    if (file && file.name) return file.name;
    return 'Not uploaded';
  };

  return (
    <div className="master-preview-container">
      <div className="master-preview-header">
        <h2 className="master-preview-title">Preview & Review</h2>
        <p className="master-preview-subtitle">Please review all your details before submitting</p>
      </div>

      {/* Personal Information Section */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-user"></i> Personal Information
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item">
            <span className="master-preview-label">Full Name:</span>
            <span className="master-preview-value">{personal.fullName || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">Date of Birth:</span>
            <span className="master-preview-value">{personal.dateOfBirth || '—'}</span>
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

      {/* Contact Details Section */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-envelope"></i> Contact Details
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
              {contact.addressLine1}{contact.addressLine2 ? `, ${contact.addressLine2}` : ''}<br />
              {contact.city}, {contact.state} {contact.postalCode}<br />
              {contact.country}
            </span>
          </div>
        </div>
      </div>

      {/* Course Selection Section */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-graduation-cap"></i> Course Selection
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
        </div>
      </div>

      {/* Academic History Section */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-book"></i> Academic History
        </h3>
        {academic && academic.length > 0 && academic.filter(a => a.degree).map((edu, index) => (
          <div key={index} className="master-preview-academic-entry">
            <div className="master-preview-academic-title">{edu.degree} in {edu.fieldOfStudy}</div>
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

      {/* Test Scores Section */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-chart-line"></i> Test Scores
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item">
            <span className="master-preview-label">IELTS:</span>
            <span className="master-preview-value">{tests.ielts || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">TOEFL:</span>
            <span className="master-preview-value">{tests.toefl || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">PTE:</span>
            <span className="master-preview-value">{tests.pte || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">GRE:</span>
            <span className="master-preview-value">{tests.gre || '—'}</span>
          </div>
          <div className="master-preview-item">
            <span className="master-preview-label">GMAT:</span>
            <span className="master-preview-value">{tests.gmat || '—'}</span>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="master-preview-section">
        <h3 className="master-preview-section-title">
          <i className="fas fa-file-upload"></i> Uploaded Documents
        </h3>
        <div className="master-preview-grid">
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Passport Copy:</span>
            <span className="master-preview-value master-preview-doc">{formatFileName(documents?.passportCopy)}</span>
          </div>
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Academic Transcripts:</span>
            <span className="master-preview-value master-preview-doc">{formatFileName(documents?.academicTranscripts)}</span>
          </div>
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Resume/CV:</span>
            <span className="master-preview-value master-preview-doc">{formatFileName(documents?.resumeCv)}</span>
          </div>
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">Letters of Recommendation:</span>
            <span className="master-preview-value master-preview-doc">{formatFileName(documents?.lettersOfRecommendation)}</span>
          </div>
          <div className="master-preview-item master-preview-item-full">
            <span className="master-preview-label">English Certificate:</span>
            <span className="master-preview-value master-preview-doc">{formatFileName(documents?.englishCertificate)}</span>
          </div>
        </div>
      </div>

      {/* Declaration Status */}
      <div className="master-preview-section master-preview-declaration">
        <h3 className="master-preview-section-title">
          <i className="fas fa-check-circle"></i> Declaration
        </h3>
        <div className={`master-preview-declaration-status ${declaration ? 'master-preview-approved' : 'master-preview-pending'}`}>
          {declaration ? (
            <><i className="fas fa-check-circle"></i> Confirmed: All information is true and accurate</>
          ) : (
            <><i className="fas fa-exclamation-circle"></i> Pending: Declaration not confirmed</>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterPreview;