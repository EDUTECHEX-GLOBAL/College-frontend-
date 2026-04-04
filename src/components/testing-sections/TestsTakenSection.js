// src/components/testing-sections/TestsTakenSection.js
import React, { useState, useRef } from 'react';
import './TestsTakenSection.css';

const TestsTakenSection = ({
  formData,
  handleInputChange,
  handleArrayChange,
  clearAnswer,
  clearArrayAnswer,
  onCVDataExtracted,
}) => {
  // CV upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [cvProcessed, setCvProcessed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const testTypes = [
    { id: 'act-tests', name: 'ACT Tests' },
    { id: 'sat-tests', name: 'SAT Tests' },
    { id: 'sat-subject-tests', name: 'SAT Subject Tests' },
    { id: 'ap-subject-tests', name: 'AP Subject Tests' },
    { id: 'ib-subject-tests', name: 'IB Subject Tests' },
    { id: 'cambridge', name: 'Cambridge' },
    { id: 'toefl-ibt', name: 'TOEFL iBT' },
    { id: 'pte-academic-tests', name: 'PTE Academic Tests' },
    { id: 'ielts', name: 'IELTS' },
    { id: 'duolingo-english-test', name: 'Duolingo English Test' },
  ];

  const VALID_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const getFileIcon = (name = '') => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    if (ext === 'txt') return '📃';
    return '📎';
  };

  const validateFile = (file) => {
    if (!VALID_TYPES.includes(file.type)) return 'Please upload a PDF, DOC, DOCX, or TXT file.';
    if (file.size > 5 * 1024 * 1024) return 'File size must be less than 5 MB.';
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

  const mapExtractedDataToFormData = (extractedData) => {
    const updates = {};

    if (extractedData.testsDetected && extractedData.testsDetected.length > 0) {
      updates.selfReportScores = 'yes';
      updates.testsToReport = extractedData.testsDetected;
    }

    if (extractedData.act) Object.assign(updates, extractedData.act);
    if (extractedData.sat) Object.assign(updates, extractedData.sat);
    
    if (extractedData.apTests && extractedData.apTests.length > 0) {
      updates.apSubjectTests = extractedData.apTests.map((t) => ({
        month: t.month || '',
        year: t.year || '',
        subject: t.subject || '',
        score: t.score || '',
      }));
      updates.numberOfAPTests = String(updates.apSubjectTests.length);
    }
    
    if (extractedData.ibTests && extractedData.ibTests.length > 0) {
      updates.ibSubjectTests = extractedData.ibTests.map((t) => ({
        month: t.month || '',
        year: t.year || '',
        subject: t.subject || '',
        level: t.level || '',
        score: t.score || '',
      }));
      updates.numberOfIBTests = String(updates.ibSubjectTests.length);
    }
    
    if (extractedData.ielts) Object.assign(updates, extractedData.ielts);
    if (extractedData.toefl) Object.assign(updates, extractedData.toefl);
    if (extractedData.duolingo) Object.assign(updates, extractedData.duolingo);
    if (extractedData.pte) Object.assign(updates, extractedData.pte);

    return updates;
  };

  const processFile = async (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setCvProcessed(false);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 8;
      });
    }, 400);

    try {
      const formDataObj = new FormData();
      formDataObj.append('cv', file);

      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_BASE_URL || '';

      const response = await fetch(`${API_URL}/api/students/testing/parse-cv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        const mappedUpdates = mapExtractedDataToFormData(data.extractedData);
        if (onCVDataExtracted) {
          onCVDataExtracted(mappedUpdates);
        }
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

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleTestSelection = (testId) => handleArrayChange('testsToReport', testId);
  const isTestSelected = (testId) => formData.testsToReport.includes(testId);

  return (
    <div className="tt-container">
      {/* CV Upload Banner */}
      <div className="tt-cv-banner">
        <div className="tt-cv-banner-bg"></div>
        <div className="tt-cv-banner-left">
          <h3 className="tt-cv-banner-title">Upload your CV / Résumé to auto-fill everything</h3>
          <p className="tt-cv-banner-desc">We'll fill your test scores in one go · PDF, DOC, DOCX, TXT</p>
        </div>
        
        <div className="tt-cv-banner-right">
          <button 
            type="button" 
            className="tt-cv-upload-btn"
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
          >
            Upload
          </button>
          <button 
            type="button" 
            className="tt-cv-skip-btn"
            onClick={() => {}}
            disabled={uploading}
          >
            Skip — I don't have a CV
          </button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.doc,.docx,.txt"
          style={{ display: 'none' }}
        />

        {/* Upload Status */}
        {uploading && (
          <div className="tt-cv-progress-wrap">
            <div className="tt-cv-progress-bar">
              <div className="tt-cv-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="tt-cv-progress-text">Parsing your CV... {uploadProgress}%</p>
          </div>
        )}

        {fileName && !uploading && !error && cvProcessed && (
          <div className="tt-cv-status tt-cv-status--success">
            <span className="tt-cv-status-icon">✓</span>
            <span className="tt-cv-status-text">{getFileIcon(fileName)} {fileName} - Parsed successfully</span>
            <button type="button" className="tt-cv-status-clear" onClick={resetCV}>×</button>
          </div>
        )}

        {error && (
          <div className="tt-cv-status tt-cv-status--error">
            <span className="tt-cv-status-icon">⚠️</span>
            <span className="tt-cv-status-text">{error}</span>
            <button type="button" className="tt-cv-retry-btn" onClick={() => {
              resetCV();
              setTimeout(() => fileInputRef.current?.click(), 50);
            }}>Retry</button>
          </div>
        )}
      </div>

      {/* Main Form Card */}
      <div className="tt-card">
        <h2 className="tt-card-title">Tests Taken</h2>
        <hr className="tt-divider" />

        {/* Self-reporting question */}
        <div className="tt-question-block">
          <label className="tt-question-label required">
            Do you wish to self-report scores or future test dates? *
          </label>
          <p className="tt-description">
            In addition to sending official score reports as required by colleges, do you wish to
            self-report scores or future test dates for any of the following standardized tests:
            ACT, SAT/SAT Subject, AP, IB, Cambridge, TOEFL, PTE Academic, IELTS, and Duolingo
            English Test?
          </p>
          <div className="tt-radio-row">
            <button
              type="button"
              className={`tt-radio-btn ${formData.selfReportScores === 'yes' ? 'tt-radio-btn--selected' : ''}`}
              onClick={() => handleInputChange({ target: { name: 'selfReportScores', value: 'yes' } })}
            >
              Yes
            </button>
            <button
              type="button"
              className={`tt-radio-btn ${formData.selfReportScores === 'no' ? 'tt-radio-btn--selected' : ''}`}
              onClick={() => handleInputChange({ target: { name: 'selfReportScores', value: 'no' } })}
            >
              No
            </button>
          </div>
          <button
            type="button"
            className="tt-clear-link"
            onClick={() => clearAnswer('selfReportScores')}
            disabled={!formData.selfReportScores}
          >
            Clear answer
          </button>
        </div>

        {/* Tests to report */}
        {formData.selfReportScores === 'yes' && (
          <div className="tt-question-block" style={{ marginTop: '24px' }}>
            <label className="tt-question-label required">
              Indicate all tests you wish to report *
            </label>
            <p className="tt-description">
              Be sure to include tests you expect to take in addition to tests you have already taken.
            </p>
            <div className="tt-check-row">
              {testTypes.map((test) => (
                <label key={test.id} className="tt-check-option">
                  <input
                    type="checkbox"
                    checked={isTestSelected(test.id)}
                    onChange={() => handleTestSelection(test.id)}
                  />
                  <span>{test.name}</span>
                </label>
              ))}
            </div>
            {formData.testsToReport.length > 0 && (
              <button
                type="button"
                className="tt-clear-link"
                onClick={() => clearArrayAnswer('testsToReport')}
              >
                Clear all selections
              </button>
            )}
          </div>
        )}

        {/* International applicant question */}
        <div className="tt-question-block" style={{ marginTop: '24px' }}>
          <label className="tt-question-label">
            International applicants: Promotion examinations
          </label>
          <p className="tt-description">
            <strong>International applicants:</strong> Is promotion within your educational system
            based upon standard leaving examinations given at the end of lower and/or senior
            secondary school by a state or national leaving examinations board? (Students studying
            in the US typically answer no to this question.)
          </p>
          <div className="tt-radio-row">
            <button
              type="button"
              className={`tt-radio-btn ${formData.internationalPromotionExams === 'yes' ? 'tt-radio-btn--selected' : ''}`}
              onClick={() => handleInputChange({ target: { name: 'internationalPromotionExams', value: 'yes' } })}
            >
              Yes
            </button>
            <button
              type="button"
              className={`tt-radio-btn ${formData.internationalPromotionExams === 'no' ? 'tt-radio-btn--selected' : ''}`}
              onClick={() => handleInputChange({ target: { name: 'internationalPromotionExams', value: 'no' } })}
            >
              No
            </button>
          </div>
          <button
            type="button"
            className="tt-clear-link"
            onClick={() => clearAnswer('internationalPromotionExams')}
            disabled={!formData.internationalPromotionExams}
          >
            Clear answer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestsTakenSection;