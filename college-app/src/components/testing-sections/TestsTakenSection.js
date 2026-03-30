// src/components/testing-sections/TestsTakenSection.js
import React, { useState, useRef } from 'react';
import './TestsTakenSection.css';

const TestsTakenSection = ({
  formData,
  handleInputChange,
  handleArrayChange,
  clearAnswer,
  clearArrayAnswer,
  onCVDataExtracted, // Callback to parent for auto-filling all test sections
}) => {
  // CV upload state
  const [uploading, setUploading]         = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError]                 = useState(null);
  const [fileName, setFileName]           = useState('');
  const [cvProcessed, setCvProcessed]     = useState(false);
  const [dragOver, setDragOver]           = useState(false);
  const fileInputRef                      = useRef(null);

  const testTypes = [
    { id: 'act-tests',            name: 'ACT Tests' },
    { id: 'sat-tests',            name: 'SAT Tests' },
    { id: 'sat-subject-tests',    name: 'SAT Subject Tests' },
    { id: 'ap-subject-tests',     name: 'AP Subject Tests' },
    { id: 'ib-subject-tests',     name: 'IB Subject Tests' },
    { id: 'cambridge',            name: 'Cambridge' },
    { id: 'toefl-ibt',            name: 'TOEFL iBT' },
    { id: 'pte-academic-tests',   name: 'PTE Academic Tests' },
    { id: 'ielts',                name: 'IELTS' },
    { id: 'duolingo-english-test',name: 'Duolingo English Test' },
  ];

  // ── helpers ────────────────────────────────────────────────────────────────
  const VALID_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const getFileIcon = (name = '') => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf')                   return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    if (ext === 'txt')                   return '📃';
    return '📎';
  };

  const validateFile = (file) => {
    if (!VALID_TYPES.includes(file.type))      return 'Please upload a PDF, DOC, DOCX, or TXT file.';
    if (file.size > 5 * 1024 * 1024)           return 'File size must be less than 5 MB.';
    return null;
  };

  const resetCV = () => {
    setFileName('');
    setError(null);
    setCvProcessed(false);
    setUploadProgress(0);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── core upload ────────────────────────────────────────────────────────────
  const processFile = async (file) => {
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }

    setFileName(file.name);
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setCvProcessed(false);

    // Fake progress so the user sees activity while Textract runs (can take 30-60s)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) { clearInterval(progressInterval); return 85; }
        return prev + 8;
      });
    }, 400);

    try {
      const formDataObj = new FormData();
      formDataObj.append('cv', file);

      const token   = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_BASE_URL || '';

      const response = await fetch(`${API_URL}/api/students/testing/parse-cv`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formDataObj,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        if (onCVDataExtracted) onCVDataExtracted(data.extractedData);
        setCvProcessed(true);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to parse CV');
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error('CV upload error:', err);
      setError(err.message || 'Failed to parse CV. You can fill the form manually instead.');
      setCvProcessed(false);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── event handlers ─────────────────────────────────────────────────────────
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = ()  => setDragOver(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleTestSelection = (testId) => handleArrayChange('testsToReport', testId);
  const isTestSelected      = (testId) => formData.testsToReport.includes(testId);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="tests-taken-section">

      {/* ===== CV Upload Card ===== */}
      <div className="cv-upload-container">
        <div className="cv-upload-header">
          <h3>
            📄 Upload CV / Resume
            <span className="optional-badge">Optional</span>
          </h3>
          <p className="cv-upload-subtitle">
            Upload your CV to automatically fill all testing information, or fill the form below manually.
          </p>
        </div>

        <div className="cv-upload-content">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
          />

          {/* ── IDLE: drop zone ── */}
          {!fileName && !uploading && !error && (
            <div
              className={`cv-upload-area${dragOver ? ' drag-over' : ''}`}
              onClick={() => fileInputRef.current.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current.click()}
              aria-label="Click or drag to upload your CV"
            >
              <div className="upload-icon">📁</div>
              <p className="upload-text">Click to upload or drag &amp; drop</p>
              <p className="upload-hint">PDF, DOC, DOCX, TXT — Max 5 MB</p>
              <button type="button" className="upload-button">Choose File</button>
            </div>
          )}

          {/* ── UPLOADING: progress bar ── */}
          {uploading && (
            <div className="cv-upload-progress">
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="progress-text">
                {uploadProgress < 86
                  ? 'Parsing your CV… this may take up to 60 seconds for PDFs'
                  : 'Almost done…'}
              </p>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {fileName && !uploading && !error && cvProcessed && (
            <div className="cv-file-info success-state">
              <div className="file-details">
                <span className="file-icon">{getFileIcon(fileName)}</span>
                <span className="file-name">{fileName}</span>
                <span className="file-status success">✓ Parsed</span>
              </div>
              <p className="cv-success-text">
                ✓ Test scores detected and auto-filled below. Please review and adjust as needed.
              </p>
              <div className="cv-actions">
                <button
                  type="button"
                  className="cv-action-button upload-new"
                  onClick={() => { resetCV(); setTimeout(() => fileInputRef.current?.click(), 50); }}
                >
                  Upload Different CV
                </button>
                <button type="button" className="cv-action-button manual-fill" onClick={resetCV}>
                  Fill Manually Instead
                </button>
              </div>
            </div>
          )}

          {/* ── UPLOADED but not processed (edge case) ── */}
          {fileName && !uploading && !error && !cvProcessed && (
            <div className="cv-file-info">
              <div className="file-details">
                <span className="file-icon">{getFileIcon(fileName)}</span>
                <span className="file-name">{fileName}</span>
                <span className="file-status">Uploaded</span>
              </div>
              <div className="cv-actions">
                <button
                  type="button"
                  className="cv-action-button upload-new"
                  onClick={() => { resetCV(); setTimeout(() => fileInputRef.current?.click(), 50); }}
                >
                  Upload New
                </button>
                <button type="button" className="cv-action-button manual-fill" onClick={resetCV}>
                  Fill Manually
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {error && (
            <div className="cv-error">
              <span className="error-icon">⚠️</span>
              <div className="error-body">
                <p className="error-message">{error}</p>
                <div className="cv-actions">
                  <button
                    type="button"
                    className="cv-action-button upload-new"
                    onClick={() => { resetCV(); setTimeout(() => fileInputRef.current?.click(), 50); }}
                  >
                    Try Again
                  </button>
                  <button type="button" className="cv-action-button manual-fill" onClick={resetCV}>
                    Fill Manually
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="cv-upload-footer">
          <p className="privacy-note">
            🔒 Your CV is processed securely and is not stored permanently.
          </p>
        </div>
      </div>

      {/* ===== Tests Taken Form ===== */}
      <h2>Tests Taken</h2>
      <div className="section-status">
        {formData.selfReportScores && formData.internationalPromotionExams ? 'Complete' : 'In Progress'}
      </div>

      <div className="form-content">

        {/* Self-reporting question */}
        <div className="form-group">
          <p className="question-text">
            In addition to sending official score reports as required by colleges, do you wish to
            self-report scores or future test dates for any of the following standardized tests:
            ACT, SAT/SAT Subject, AP, IB, Cambridge, TOEFL, PTE Academic, IELTS, and Duolingo
            English Test?*
          </p>
          <div className="radio-group-horizontal">
            <label className="radio-option">
              <input
                type="radio"
                name="selfReportScores"
                value="yes"
                checked={formData.selfReportScores === 'yes'}
                onChange={handleInputChange}
              />
              <span className="radio-label">Yes</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="selfReportScores"
                value="no"
                checked={formData.selfReportScores === 'no'}
                onChange={handleInputChange}
              />
              <span className="radio-label">No</span>
            </label>
          </div>
          <button
            type="button"
            className="clear-answer-button"
            onClick={() => clearAnswer('selfReportScores')}
          >
            Clear answer
          </button>
        </div>

        {/* Tests to report (only shown when selfReportScores = yes) */}
        {formData.selfReportScores === 'yes' && (
          <div className="form-group">
            <p className="question-text">
              Indicate all tests you wish to report. Be sure to include tests you expect to take in
              addition to tests you have already taken.*
            </p>
            <div className="test-types-grid">
              {testTypes.map((test) => (
                <label key={test.id} className="test-checkbox-item">
                  <input
                    type="checkbox"
                    checked={isTestSelected(test.id)}
                    onChange={() => handleTestSelection(test.id)}
                  />
                  <span className="test-checkbox-label">{test.name}</span>
                  {isTestSelected(test.id) && <span className="test-selected-icon">✓</span>}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="clear-answer-button"
              onClick={() => clearArrayAnswer('testsToReport')}
            >
              Clear all selections
            </button>
          </div>
        )}

        {/* International applicant question */}
        <div className="form-group">
          <p className="question-text">
            <strong>International applicants:</strong> Is promotion within your educational system
            based upon standard leaving examinations given at the end of lower and/or senior
            secondary school by a state or national leaving examinations board? (Students studying
            in the US typically answer no to this question.)
          </p>
          <div className="radio-group-horizontal">
            <label className="radio-option">
              <input
                type="radio"
                name="internationalPromotionExams"
                value="yes"
                checked={formData.internationalPromotionExams === 'yes'}
                onChange={handleInputChange}
              />
              <span className="radio-label">Yes</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="internationalPromotionExams"
                value="no"
                checked={formData.internationalPromotionExams === 'no'}
                onChange={handleInputChange}
              />
              <span className="radio-label">No</span>
            </label>
          </div>
          <button
            type="button"
            className="clear-answer-button"
            onClick={() => clearAnswer('internationalPromotionExams')}
          >
            Clear answer
          </button>
        </div>

      </div>
    </div>
  );
};

export default TestsTakenSection;