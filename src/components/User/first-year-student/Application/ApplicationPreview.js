// src/components/ApplicationPreview.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import axiosInstance from '../../api/axiosInstance';
import { resolveFileUrl } from '../../../../utils/fileUrl';
import EdutechLogo from '../../../../assets/Edutech-logo.svg';
import { FaCheck, FaCheckCircle, FaTimes } from 'react-icons/fa';
import './ApplicationPreview.css';

const COMPLETION_LABELS = {
  personalDone:    'Personal Info',
  addressDone:     'Address',
  educationDone:   'Higher Education',
  documentsDone:   'Documents',
  specialNeedDone: 'Special Needs',
};

const isEntranceQualificationSection = (section = {}) =>
  /entrance qualification/i.test(section.title || '');

const filterRemovedSections = (sections = []) =>
  sections.filter(section => !isEntranceQualificationSection(section));

const pickDisplayValue = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() && value !== 'Not provided' && value !== 'Not uploaded') {
      return value.trim();
    }
  }
  return '';
};

const getSelectionFromPreview = (preview = {}) => {
  const sections = preview.sections || [];
  const universitySection = sections.find(section =>
    section.title?.toLowerCase().includes('university') &&
    (section.title?.toLowerCase().includes('programme') || section.title?.toLowerCase().includes('program'))
  );
  const findValue = (labels) => {
    const row = universitySection?.data?.find(item =>
      labels.some(label => item.label?.toLowerCase() === label)
    );
    return row?.value;
  };

  return {
    universityName: pickDisplayValue(
      preview.selectedCourse?.universityName,
      preview.selectedCourse?.university,
      preview.applicationUniversityName,
      preview.completedUniversityName,
      preview.selectedUniversity?.name,
      preview.selectedUniversity?.universityName,
      preview.universityName,
      preview.university,
      findValue(['university'])
    ),
    programName: pickDisplayValue(
      preview.selectedCourse?.programName,
      preview.selectedCourse?.title,
      preview.selectedCourse?.name,
      preview.applicationProgramName,
      preview.completedProgramName,
      preview.programName,
      findValue(['programme', 'program', 'course'])
    ),
  };
};

const isPreviewFileObject = (value) =>
  value && typeof value === 'object' && !React.isValidElement(value);

const getPreviewFileDisplayName = (value) => {
  if (isPreviewFileObject(value)) {
    return value.displayName || value.originalName || value.fileName || '';
  }
  return typeof value === 'string' ? value : '';
};

const getPreviewFileUrl = (value) =>
  isPreviewFileObject(value) ? value.fileUrl || '' : '';

const isAllowedPreviewUrl = (value = '') =>
  typeof value === 'string' &&
  (
    value.startsWith('/api/files/') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:image/')
  );

const isImagePreviewUrl = (value = '') =>
  isAllowedPreviewUrl(value) &&
  (
    value.startsWith('data:image/') ||
    /\.(png|jpe?g|gif|webp|svg)(?:[?#].*)?$/i.test(value)
  );

const resolvePreviewUrl = (value = '') =>
  value.startsWith('data:image/') ? value : resolveFileUrl(value);

const getPdfTextValue = (value) => {
  if (isPreviewFileObject(value)) {
    return getPreviewFileDisplayName(value) || getPreviewFileUrl(value);
  }

  if (!value || value === 'Not provided' || value === 'Not uploaded') return '';
  return String(value);
};

const formatPdfDate = (value) => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const findSectionValue = (sections = [], sectionTitle = '', label = '') => {
  const section = sections.find(item => String(item.title || '').toLowerCase() === sectionTitle.toLowerCase());
  const row = section?.data?.find(item => String(item.label || '').toLowerCase() === label.toLowerCase());
  return row?.value;
};

const cleanPdfText = (...values) => {
  for (const value of values) {
    const displayValue = getPdfTextValue(value);
    if (displayValue && displayValue !== 'Not provided' && displayValue !== 'Not uploaded') return String(displayValue).trim();
  }
  return '';
};

const hasUploadedDocument = (value) => {
  if (!value) return false;
  if (typeof value === 'object') return !!(value.fileUrl || value.fileName || value.originalName || value.displayName);
  return typeof value === 'string' && value.trim() && value !== 'Not uploaded' && value !== 'Not provided';
};

const loadLogoForPdf = async () => new Promise((resolve) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || 506;
      canvas.height = image.naturalHeight || 106;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      resolve('');
    }
  };
  image.onerror = () => resolve('');
  image.src = EdutechLogo;
});

const buildPdfChecklist = (preview = {}, sections = []) => {
  const docs = preview.documents || preview.applicationDocuments || {};
  const personal = preview.personal || preview.personalInfo || {};
  const documentSection = sections.find(section => String(section.title || '').toLowerCase().includes('supporting document')) || {};
  const sectionValue = (labels) => {
    const row = documentSection.data?.find(item => labels.some(label => String(item.label || '').toLowerCase().includes(label)));
    return row?.value;
  };
  return [
    { label: 'Passport', uploaded: hasUploadedDocument(docs.passport) || hasUploadedDocument(personal.passportFileUrl) || hasUploadedDocument(personal.passportFileName) || hasUploadedDocument(sectionValue(['passport', 'id proof'])) },
    { label: 'Photograph', uploaded: hasUploadedDocument(docs.photo) || hasUploadedDocument(personal.photographFileUrl) || hasUploadedDocument(personal.photographFileName) || hasUploadedDocument(sectionValue(['photo'])) },
    { label: 'Resume', uploaded: hasUploadedDocument(docs.cv) || hasUploadedDocument(sectionValue(['resume', 'cv'])) },
    { label: 'Academic Transcript', uploaded: hasUploadedDocument(docs.transcript) || hasUploadedDocument(sectionValue(['transcript'])) },
    { label: 'High School Certificate', uploaded: hasUploadedDocument(docs.diploma) || hasUploadedDocument(docs.cert12th) || hasUploadedDocument(sectionValue(['diploma', 'certificate', '12th'])) },
    { label: 'English Language Test', uploaded: hasUploadedDocument(docs.languageProficiency) || hasUploadedDocument(sectionValue(['english', 'language'])) },
    { label: 'Recommendation Letter', uploaded: hasUploadedDocument(docs.recommendationLetter) || hasUploadedDocument(sectionValue(['recommendation'])) },
  ];
};

const generateApplicationSummaryPDF = async ({
  applicationId,
  submittedAt,
  sections,
  previewSnapshot,
  selectedUniversityName,
  selectedProgramName,
}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const navy = '#163B6C';
  const teal = '#0891B2';
  const border = '#DCE8F5';
  const lightBlue = '#EFF6FF';
  const ink = '#0F172A';
  const muted = '#64748B';
  const generatedAt = new Date();
  const printableSections = filterRemovedSections(sections || []);
  const selection = getSelectionFromPreview({ ...(previewSnapshot || {}), sections: printableSections });
  const selectedCourse = previewSnapshot?.selectedCourse || {};
  const selectedUniversity = previewSnapshot?.selectedUniversity || {};
  const logoDataUrl = await loadLogoForPdf();
  const rawApplicationId = cleanPdfText(applicationId, previewSnapshot?.applicationId, findSectionValue(printableSections, 'Application Details', 'Application ID'), 'Application');
  const displayApplicationId = rawApplicationId.replace(/^EQHE[-\s]*/i, '') || 'Application';
  const universityName = cleanPdfText(selectedUniversityName, selection.universityName, selectedCourse.universityName, selectedUniversity.name, findSectionValue(printableSections, 'Application Details', 'University'));
  const programName = cleanPdfText(selectedProgramName, selection.programName, selectedCourse.programName, selectedCourse.title, findSectionValue(printableSections, 'Application Details', 'Programme'));
  const academicSection = printableSections.find(section => section.title === 'Higher Education') || {};
  const academicData = academicSection.data || [];
  const firstAcademic = (label) => academicData.find(row => String(row.label || '').includes(label))?.value;
  const data = {
    applicationId: displayApplicationId,
    status: cleanPdfText(previewSnapshot?.applicationStatus, findSectionValue(printableSections, 'Application Details', 'Application Status'), 'Submitted'),
    submitted: formatPdfDate(submittedAt || previewSnapshot?.submittedAt || new Date()),
    applicant: cleanPdfText(previewSnapshot?.studentName, findSectionValue(printableSections, 'Application Details', 'Student Name')),
    university: universityName,
    programme: programName,
    degreeLevel: cleanPdfText(selectedCourse.degreeLevel, selectedCourse.degree, selectedCourse.level, selectedCourse.studyLevel, selectedCourse.programLevel, selectedCourse.degreeType),
    studyMode: cleanPdfText(selectedCourse.studyMode, selectedCourse.mode),
    intake: cleanPdfText(selectedCourse.intake, selectedCourse.startDate, selectedCourse.intakeName),
    country: cleanPdfText(selectedCourse.country, selectedCourse.countryName, selectedUniversity.country, selectedUniversity.countryName, selection.country),
    dob: cleanPdfText(findSectionValue(printableSections, 'Personal Information', 'Date of Birth')),
    nationality: cleanPdfText(findSectionValue(printableSections, 'Personal Information', 'Country of Birth')),
    citizenship: cleanPdfText(findSectionValue(printableSections, 'Personal Information', 'Citizenship')),
    email: cleanPdfText(previewSnapshot?.accountEmail, findSectionValue(printableSections, 'Personal Information', 'Email')),
    residence: cleanPdfText(findSectionValue(printableSections, 'Address', 'Country')),
    qualification: cleanPdfText(firstAcademic('Degree')),
    institution: cleanPdfText(firstAcademic('Institution')),
    specialisation: cleanPdfText(firstAcademic('Specialisation')),
    graduationYear: cleanPdfText(firstAcademic('End Date')),
    percentage: cleanPdfText(firstAcademic('Remarks / Percentage')),
  };
  const checklist = buildPdfChecklist(previewSnapshot || {}, printableSections);
  const isVisibleValue = value => {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized && normalized !== 'not provided' && normalized !== 'not uploaded';
  };

  const drawLogo = (x, y, width = 44) => {
    if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', x, y, width, width / 4.8);
    else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(teal);
      doc.text('EDUTECHEX', x, y + 6);
    }
  };

  const header = () => {
    drawLogo(margin, 12, 48);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(navy);
    doc.text('Application Summary', pageWidth - margin, 17, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(muted);
    doc.text(`Application ID: ${data.applicationId}`, pageWidth - margin, 25, { align: 'right' });
    doc.text(`Generated: ${formatPdfDate(generatedAt)}`, pageWidth - margin, 31, { align: 'right' });
    doc.setDrawColor(border);
    doc.setLineWidth(0.3);
    doc.line(margin, 38, pageWidth - margin, 38);
  };

  const footer = () => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(border);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
      drawLogo(margin, pageHeight - 14, 28);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(muted);
      doc.text('Support: support@edutechex.com', margin + 36, pageHeight - 13);
      doc.text('Website: www.ups.edutechex.com', margin + 36, pageHeight - 8);
      doc.text(`Generated: ${generatedAt.toLocaleString('en-US')}`, pageWidth - margin, pageHeight - 13, { align: 'right' });
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  };

  const title = (text, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(navy);
    doc.text(text, margin, y);
    doc.setDrawColor(teal);
    doc.setLineWidth(0.7);
    doc.line(margin, y + 2, margin + 18, y + 2);
  };

  const drawField = (label, value, x, y, maxWidth) => {
    if (!isVisibleValue(value)) return false;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(teal);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.3);
    doc.setTextColor(ink);
    doc.text(String(value), x, y + 5.5, { maxWidth });
    return true;
  };

  const colGap = 14;
  const colW = (contentWidth - colGap) / 2;
  const drawTwoColumnFields = (fields, startY, rowHeight = 21) => {
    fields.forEach(([label, value], index) => {
      const x = margin + (index % 2) * (colW + colGap);
      const fieldY = startY + Math.floor(index / 2) * rowHeight;
      drawField(label, value, x, fieldY, colW);
    });
  };

  const footerTopY = pageHeight - 25;
  let y = 50;
  const addContentPage = () => {
    doc.addPage();
    header();
    y = 50;
  };
  const ensureSpace = (neededHeight = 20) => {
    if (y + neededHeight > footerTopY) {
      addContentPage();
    }
  };

  header();
  ensureSpace(45);
  title('Application Overview', y);
  y += 9;
  doc.setFillColor(lightBlue);
  doc.rect(margin, y, contentWidth, 26, 'F');
  const summaryW = contentWidth / 3;
  drawField('Application ID', data.applicationId, margin + 5, y + 8, summaryW - 10);
  drawField('Status', data.status, margin + summaryW + 5, y + 8, summaryW - 10);
  drawField('Submitted', data.submitted, margin + summaryW * 2 + 5, y + 8, summaryW - 10);
  y += 34;
  drawTwoColumnFields([
    ['Applicant', data.applicant], ['University', data.university],
    ['Programme', data.programme],
  ], y, 20);
  y += 42;
  doc.setDrawColor(border);
  doc.setLineWidth(0.25);
  doc.line(margin, y, pageWidth - margin, y);

  y += 12;
  ensureSpace(80);
  title('Applicant Profile', y);
  y += 10;
  drawTwoColumnFields([
    ['Full Name', data.applicant], ['Date of Birth', data.dob],
    ['Nationality', data.nationality], ['Citizenship', data.citizenship],
    ['Email', data.email], ['Country of Residence', data.residence],
  ], y, 19);

  y += 52;
  ensureSpace(62);
  title('Selected Programme', y);
  y += 8;
  const programmeCardHeight = 50;
  doc.setFillColor(lightBlue);
  doc.rect(margin, y, contentWidth, programmeCardHeight, 'F');
  doc.setFillColor(teal);
  doc.rect(margin, y, 1.5, programmeCardHeight, 'F');
  const programmeFields = [
    ['University', data.university], ['Programme', data.programme],
    ['Degree Level', data.degreeLevel], ['Study Mode', data.studyMode],
    ['Country', data.country], ['Intake', data.intake],
  ];
  programmeFields.forEach(([label, value], index) => {
    const x = margin + 7 + (index % 2) * (colW + colGap - 3);
    const fieldY = y + 8 + Math.floor(index / 2) * 14.5;
    drawField(label, value, x, fieldY, colW - 5);
  });

  addContentPage();
  ensureSpace(82);
  title('Academic Profile', y);
  y += 10;
  drawTwoColumnFields([
    ['Highest Qualification', data.qualification], ['Institution Name', data.institution],
    ['Specialisation', data.specialisation], ['Graduation Year', data.graduationYear],
    ['Percentage / GPA', data.percentage],
  ], y, 22);

  y += 70;
  ensureSpace(95);
  title('Document Checklist', y);
  y += 9;
  doc.setFillColor('#F8FAFC');
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(muted);
  doc.text('DOCUMENT', margin + 5, y + 6.5);
  doc.text('STATUS', pageWidth - margin - 25, y + 6.5, { align: 'center' });
  checklist.forEach((item, index) => {
    const rowY = y + 10 + index * 9;
    doc.setDrawColor(border);
    doc.setLineWidth(0.2);
    doc.line(margin, rowY + 9, pageWidth - margin, rowY + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(ink);
    doc.text(item.label, margin + 5, rowY + 6);
    doc.setFillColor(item.uploaded ? '#DCFCE7' : '#F1F5F9');
    doc.roundedRect(pageWidth - margin - 43, rowY + 1.2, 35, 6.2, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.7);
    doc.setTextColor(item.uploaded ? '#166534' : muted);
    doc.text(item.uploaded ? 'UPLOADED' : 'NOT UPLOADED', pageWidth - margin - 25.5, rowY + 5.2, { align: 'center' });
  });

  y += 83;
  ensureSpace(45);
  title('Declaration', y);
  y += 10;
  doc.setFillColor('#F8FAFC');
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(ink);
  doc.text('I confirm that the information provided in this application is accurate and complete to the best of my knowledge.', margin + 6, y + 9, { maxWidth: contentWidth - 12 });

  y += 36;
  ensureSpace(28);
  title('Application Status Note', y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(muted);
  doc.text('Your application is currently under review. You will receive email notifications as your application progresses.', margin, y, { maxWidth: contentWidth });

  footer();
  doc.save(`Application_${String(rawApplicationId).replace(/[^\w-]/g, '_')}.pdf`);
};
/* Success modal */
const SuccessModal = ({ applicationId, loginEmail, personalEmail, selectedUniversityName, selectedProgramName, onClose }) => {
  const primaryEmail = loginEmail || '';
  const subtitle = selectedUniversityName
    ? `Your application to ${selectedUniversityName} has been received and is under review.`
    : 'Your application has been received and is under review.';

  return (
    <div className="applicationpreview-success-modal-overlay">
      <div className="applicationpreview-success-modal">
        <div className="applicationpreview-success-icon"><FaCheck aria-hidden="true" /></div>

        <h2 className="applicationpreview-success-title">
          Application Submitted!
        </h2>
        <p className="applicationpreview-success-subtitle">
          {subtitle}
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

        {(selectedUniversityName || selectedProgramName) && (
          <div className="applicationpreview-submitted-school-card">
            {selectedUniversityName && (
              <div className="applicationpreview-submitted-school-row">
                <p className="applicationpreview-submitted-school-label">Submitted University</p>
                <p className="applicationpreview-submitted-school-value">{selectedUniversityName}</p>
              </div>
            )}
            {selectedProgramName && (
              <div className="applicationpreview-submitted-school-row">
                <p className="applicationpreview-submitted-school-label">Programme</p>
                <p className="applicationpreview-submitted-school-value">{selectedProgramName}</p>
              </div>
            )}
          </div>
        )}

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
            <li>Our team will review your application within <strong>4-6 weeks</strong>.</li>
            <li>You will receive an email if additional info is needed.</li>
            <li>A final decision letter will be sent to your email.</li>
          </ul>
        </div>

        <button onClick={onClose} className="applicationpreview-success-button">
          Go to Confirmation Page &rarr;
        </button>
      </div>
    </div>
  );
};

/* Resend email modal */
SuccessModal.displayName = 'LegacySuccessModal';

const SuccessPopup = ({
  applicationId,
  selectedUniversityName,
  selectedProgramName,
  onDownloadPDF,
  isDownloadingPDF,
  onClose,
}) => {
  const subtitle = selectedUniversityName
    ? `Submitted to ${selectedUniversityName}`
    : 'Your application has been submitted';

  return (
    <div className="applicationpreview-success-modal-overlay" role="dialog" aria-modal="true">
      <div className="applicationpreview-success-modal applicationpreview-success-modal--compact">
        <button
          type="button"
          className="applicationpreview-success-close"
          onClick={onClose}
          aria-label="Close submission popup"
        >
          <FaTimes size={18} aria-hidden="true" />
        </button>

        <div className="applicationpreview-success-visual" aria-hidden="true">
          <div className="applicationpreview-success-visual-circle">
            <div className="applicationpreview-success-icon"><FaCheck aria-hidden="true" /></div>
          </div>
          <div className="applicationpreview-success-visual-card">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <h2 className="applicationpreview-success-title">Application Submitted!</h2>
        <p className="applicationpreview-success-subtitle">{subtitle}</p>

        {applicationId && (
          <p className="applicationpreview-success-app-id">
            Application ID: <strong>{applicationId}</strong>
          </p>
        )}

        {(selectedUniversityName || selectedProgramName) && (
          <div className="applicationpreview-success-selection">
            {selectedUniversityName && (
              <p><span>University</span>{selectedUniversityName}</p>
            )}
            {selectedProgramName && (
              <p><span>Programme</span>{selectedProgramName}</p>
            )}
          </div>
        )}

        <div className="applicationpreview-success-actions">
          <button
            type="button"
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF}
            className="applicationpreview-success-button applicationpreview-success-button--secondary"
          >
            {isDownloadingPDF ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button type="button" onClick={onClose} className="applicationpreview-success-button">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const ResendEmailModal = ({ applicationId, loginEmail, personalEmail, onClose }) => {
  const [isSending,  setIsSending]  = useState(false);
  const [sent,       setSent]       = useState(false);
  const [sendError,  setSendError]  = useState('');

  const handleResend = async () => {
    setIsSending(true);
    setSendError('');
    try {
      // Token used only for null check
      const token = localStorage.getItem('token');
      if (!token) return;

      // Use axiosInstance with a relative API path
      const currentApplicationId = localStorage.getItem('currentApplicationId') || applicationId;
      const { data } = await axiosInstance.post('/api/application/preview/resend-email', {
        applicationId: currentApplicationId,
      });
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
          <button onClick={onClose} className="applicationpreview-resend-modal-close" aria-label="Close">
            <FaTimes size={18} aria-hidden="true" />
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
            {isSending ? 'Sending...' : sent ? 'Sent!' : 'Resend Confirmation Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* Main component */
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
  const [selectedUniversityName, setSelectedUniversityName] = useState('');
  const [selectedProgramName,    setSelectedProgramName]    = useState('');
  const [previewSnapshot,        setPreviewSnapshot]        = useState({});

  const [showSuccessModal,  setShowSuccessModal]  = useState(false);
  const [showResendModal,   setShowResendModal]   = useState(false);
  const [showConfirmModal,  setShowConfirmModal]  = useState(false);
  const [submittedAppId,    setSubmittedAppId]    = useState('');
  const [submittedAt,       setSubmittedAt]       = useState('');
  const [isDownloadingPDF,  setIsDownloadingPDF]  = useState(false);

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

      // Token used only for null check
      const token = localStorage.getItem('token');
      if (!token) { setIsLoading(false); return; }

      const jwtEmail = getLoginEmailFromToken();
      if (jwtEmail) setLoginEmail(jwtEmail);

      // Use axiosInstance with a relative API path
      const currentApplicationId = localStorage.getItem('currentApplicationId');
      const { data } = await axiosInstance.get('/api/application/preview', {
        params: currentApplicationId ? { applicationId: currentApplicationId } : {},
      });

      if (data.success) {
        const { sections, applicationId, previewDate, agreedToTerms, completionStatus, applicationStatus } = data.preview;
        const selection = getSelectionFromPreview(data.preview);

        setPreviewSnapshot(data.preview || {});
        setSections(sections || []);
        setApplicationId(applicationId || '');
        if (applicationId) localStorage.setItem('currentApplicationId', applicationId);
        setPreviewDate(previewDate ? new Date(previewDate).toLocaleDateString() : new Date().toLocaleDateString());
        setAgreedToTerms(agreedToTerms || false);
        setCompletionStatus(completionStatus || {});
        setApplicationStatus(applicationStatus || 'draft');
        setSelectedUniversityName(selection.universityName);
        setSelectedProgramName(selection.programName);
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
          setSubmittedAt(previewDate || '');
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

      // Token used only for null check
      const token = localStorage.getItem('token');
      if (!token) return;

      // Use axiosInstance with a relative API path
      await axiosInstance.patch('/api/application/preview/terms', { agreed: checked });
    } catch (err) {
      console.error('saveTerms error:', err);
      setAgreedToTerms(!checked);
      if (onInputChange) onInputChange('agreedToTerms', !checked);
    } finally {
      setIsSavingTerms(false);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    if (!agreedToTerms) { alert('Please agree to the terms and conditions before submitting.'); return; }
    setShowConfirmModal(true);
  };

  const confirmSubmitApplication = async () => {
    if (isSubmitting) return;
    setShowConfirmModal(false);

    setIsSubmitting(true);
    setError('');

    try {
      // Token used only for null check
      const token = localStorage.getItem('token');
      if (!token) { alert('Please login to submit.'); return; }

      // Use axiosInstance with a relative API path
      const currentApplicationId = localStorage.getItem('currentApplicationId') || applicationId;
      const { data } = await axiosInstance.post('/api/application/preview/submit', {
        agreedToTerms: true,
        applicationId: currentApplicationId,
      });

      if (data.success) {
        setSubmittedAppId(data.applicationId);
        setSubmittedAt(data.submittedAt || new Date().toISOString());
        if (data.applicationId) localStorage.setItem('currentApplicationId', data.applicationId);
        setSelectedUniversityName(prev => data.universityName || prev);
        setSelectedProgramName(prev => data.programName || prev);
        setApplicationStatus('submitted');
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('submit error:', err);
      const missing = err.response?.data?.missingFields;
      if (missing?.length > 0) {
        setError(`Application incomplete. Please fill in:\n- ${missing.join('\n- ')}`);
      } else {
        setError(err.response?.data?.message || 'Failed to submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
  };

  const handleDownloadPDF = async () => {
    if (isDownloadingPDF) return;
    setIsDownloadingPDF(true);
    try {
      await generateApplicationSummaryPDF({
        applicationId: submittedAppId || applicationId,
        submittedAt,
        sections: filterRemovedSections(sections),
        previewSnapshot,
        selectedUniversityName,
        selectedProgramName,
      });
    } catch (err) {
      console.error('download pdf error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleBack = () => {
    const back = location.pathname.includes('/preview')
      ? location.pathname.replace('/preview', '/documents')
      : '/firstyear/dashboard/application/documents';
    navigate(back);
  };

  const formatValue = (value) => {
    if (!value || value === 'Not provided' || value === 'Not uploaded') return 'Not provided';

    if (isPreviewFileObject(value)) {
      const displayName = getPreviewFileDisplayName(value) || 'Uploaded file';
      const fileUrl = getPreviewFileUrl(value);

      if (isImagePreviewUrl(fileUrl)) {
        return (
          <div className="applicationpreview-file-preview">
            <img
              src={resolvePreviewUrl(fileUrl)}
              alt={displayName}
              onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
            />
            <span>{displayName}</span>
          </div>
        );
      }

      if (isAllowedPreviewUrl(fileUrl)) {
        return (
          <a
            href={resolvePreviewUrl(fileUrl)}
            target="_blank"
            rel="noreferrer"
            className="applicationpreview-file-link"
          >
            {displayName}
          </a>
        );
      }

      return displayName;
    }

    if (typeof value === 'string' && isImagePreviewUrl(value)) {
      return (
        <img
          src={resolvePreviewUrl(value)}
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
          <p>Loading your application preview...</p>
        </div>
      </div>
    );
  }

  const isSubmitted     = applicationStatus === 'submitted';
  const overallComplete = completionStatus.overall;
  const visibleSections = filterRemovedSections(sections);

  return (
    <div className="applicationpreview-form-section">

      {/* Success modal shown after fresh submit */}
      {showSuccessModal && (
        <SuccessPopup
          applicationId={submittedAppId}
          selectedUniversityName={selectedUniversityName}
          selectedProgramName={selectedProgramName}
          onDownloadPDF={handleDownloadPDF}
          isDownloadingPDF={isDownloadingPDF}
          onClose={handleModalClose}
        />
      )}

      {/* Resend modal shown for submitted applications */}
      {showResendModal && (
        <ResendEmailModal
          applicationId={applicationId}
          loginEmail={loginEmail}
          personalEmail={personalEmail}
          onClose={() => setShowResendModal(false)}
        />
      )}

      {showConfirmModal && (
        <div className="applicationpreview-confirm-modal-overlay" role="dialog" aria-modal="true">
          <div className="applicationpreview-confirm-modal">
            <h2 className="applicationpreview-confirm-title">Confirm Application Submission</h2>
            <p className="applicationpreview-confirm-message">
              Are you sure you want to submit your application? Once submitted, you cannot edit your application.
            </p>
            <div className="applicationpreview-confirm-actions">
              <button
                type="button"
                className="applicationpreview-confirm-cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="applicationpreview-confirm-submit"
                onClick={confirmSubmitApplication}
                disabled={isSubmitting}
              >
                Yes, Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="applicationpreview-section-header">
        <div className="applicationpreview-section-number">7</div>
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
            {selectedUniversityName && (
              <p className="applicationpreview-submitted-university">
                University: <strong>{selectedUniversityName}</strong>
              </p>
            )}
            {selectedProgramName && (
              <p className="applicationpreview-submitted-programme">
                Programme: <strong>{selectedProgramName}</strong>
              </p>
            )}
            <p className="applicationpreview-submitted-email">
              Confirmation sent to: <strong>{loginEmail || 'your login email'}</strong>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="applicationpreview-error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError('')} className="applicationpreview-error-close-btn" aria-label="Close"><FaTimes size={16} aria-hidden="true" /></button>
        </div>
      )}

      {!isSubmitted && (
        <div className="applicationpreview-info-box">
          <p className="applicationpreview-info-text">
            Please review all your information carefully. Once submitted, you <strong>cannot edit</strong> your application.
          </p>
        </div>
      )}

      <div className="applicationpreview-application-summary">

        <div className="applicationpreview-summary-header">
          <div className="applicationpreview-applicant-id">
            <span className="applicationpreview-id-label">Application ID:</span>
            <span className="applicationpreview-id-value">{applicationId || '-'}</span>
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

        {visibleSections.length === 0 ? (
          <div className="applicationpreview-no-data-message">
            <p>No application data found. Please fill in your details first.</p>
          </div>
        ) : (
          visibleSections.map((section, si) => (
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
              <span className="applicationpreview-section-number-small">{visibleSections.length + 1}</span>
              Completion Status
            </h3>
            <div className="applicationpreview-completion-status-bar">
              {Object.entries(completionStatus)
                .filter(([key]) => key !== 'overall' && key !== 'languageDone')
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
              <span className="applicationpreview-section-number-small">{visibleSections.length + 2}</span>
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
                    {isSavingTerms && <span className="applicationpreview-saving-indicator"> (saving...)</span>}
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
                { label: 'Higher education filled',             done: completionStatus.educationDone },
                { label: 'Required documents uploaded',         done: completionStatus.documentsDone },
                { label: 'Special needs declaration completed', done: completionStatus.specialNeedDone },
                { label: 'Terms and conditions agreed',         done: agreedToTerms },
              ].map(({ label, done }, i) => (
                <div key={i} className={`applicationpreview-checklist-item ${done ? 'done' : 'pending'}`}>
                  <span className="applicationpreview-checklist-marker">{done ? <FaCheckCircle aria-hidden="true" /> : <span className="applicationpreview-checklist-dot" aria-hidden="true" />}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="applicationpreview-submission-note">
            <div className="applicationpreview-note-content">
              <h4>Important Notice</h4>
              <p>After submission you will receive a confirmation email. Keep your Application ID for all future communications. Processing may take 4-6 weeks.</p>
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
              ? <>Submitting...</>
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
