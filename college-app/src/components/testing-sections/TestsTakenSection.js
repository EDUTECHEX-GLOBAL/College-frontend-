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
  onScoreDocExtracted,
}) => {
  // CV upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [cvProcessed, setCvProcessed] = useState(false);
  const fileInputRef = useRef(null);

  // Document upload state
  const [docUploading, setDocUploading] = useState(false);
  const [docUploadProgress, setDocUploadProgress] = useState(0);
  const [docError, setDocError] = useState(null);
  const [docFileName, setDocFileName] = useState('');
  const [docProcessed, setDocProcessed] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [selectedTestType, setSelectedTestType] = useState('');
  const [dragOverDoc, setDragOverDoc] = useState(false);
  const docFileInputRef = useRef(null);

  // Shared config
  const testTypes = [
    { id: 'act-tests',             name: 'ACT Tests' },
    { id: 'sat-tests',             name: 'SAT Tests' },
    { id: 'sat-subject-tests',     name: 'SAT Subject Tests' },
    { id: 'ap-subject-tests',      name: 'AP Subject Tests' },
    { id: 'ib-subject-tests',      name: 'IB Subject Tests' },
    { id: 'cambridge',             name: 'Cambridge' },
    { id: 'toefl-ibt',             name: 'TOEFL iBT' },
    { id: 'pte-academic-tests',    name: 'PTE Academic Tests' },
    { id: 'ielts',                 name: 'IELTS' },
    { id: 'duolingo-english-test', name: 'Duolingo English Test' },
  ];

  // Test types supported by the score-doc parser
  const scoreDocTestTypes = [
    { id: 'act-tests',             name: 'ACT' },
    { id: 'sat-tests',             name: 'SAT' },
    { id: 'sat-subject-tests',     name: 'SAT Subject Tests' },
    { id: 'ap-subject-tests',      name: 'AP Subject Tests' },
    { id: 'ib-subject-tests',      name: 'IB Subject Tests' },
    { id: 'cambridge',             name: 'Cambridge' },
    { id: 'ielts',                 name: 'IELTS' },
    { id: 'toefl-ibt',             name: 'TOEFL iBT' },
    { id: 'pte-academic-tests',    name: 'PTE Academic' },
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
    if (ext === 'pdf')               return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    if (ext === 'txt')               return '📃';
    return '📎';
  };

  const validateFile = (file) => {
    if (!VALID_TYPES.includes(file.type)) return 'Please upload a PDF, DOC, DOCX, or TXT file.';
    if (file.size > 5 * 1024 * 1024)    return 'File size must be less than 5 MB.';
    return null;
  };

  // CV helpers
  const resetCV = () => {
    setFileName('');
    setError(null);
    setCvProcessed(false);
    setUploadProgress(0);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // UPDATED: Map extracted data to new schema structure
  const mapExtractedDataToFormData = (extractedData) => {
    const updates = {};

   if (extractedData.testsDetected?.length > 0) {
  updates.selfReportScores = 'yes';

  // ✅ Remove duplicates + ensure valid array
  const uniqueTests = [...new Set(extractedData.testsDetected)];

  updates.testsToReport = uniqueTests;
}

    // ACT - New attempt-based structure
    if (extractedData.actAttempts?.length > 0) {
      updates.actAttempts = extractedData.actAttempts;
      updates.pastACTScores = String(extractedData.actAttempts.length);
    }

    // SAT - New attempt-based structure
    if (extractedData.satAttempts?.length > 0) {
      updates.satAttempts = extractedData.satAttempts;
      updates.pastSATScores = String(extractedData.satAttempts.length);
    }

    // SAT Subject Tests
    if (extractedData.satSubjectTests?.length > 0) {
      updates.satSubjectTests = extractedData.satSubjectTests;
      updates.numberOfSATSubjectTests = String(extractedData.satSubjectTests.length);
    }

    // AP Subject Tests
    if (extractedData.apTests?.length > 0) {
      updates.apSubjectTests = extractedData.apTests.map((t) => ({
        subject: t.subject || '',
        score: t.score || '',
        month: t.month || '',
        year: t.year || '',
      }));
      updates.numberOfAPTests = String(updates.apSubjectTests.length);
    }

    // IB Subject Tests
    if (extractedData.ibTests?.length > 0) {
      updates.ibSubjectTests = extractedData.ibTests.map((t) => ({
        subject: t.subject || '',
        level: t.level === 'HL' ? 'HL' : 'SL',
        score: t.score || '',
        year: t.year || '',
      }));
      updates.numberOfIBTests = String(updates.ibSubjectTests.length);
    }

    // Cambridge Exams
    if (extractedData.cambridgeTests?.length > 0) {
      updates.cambridgeTests = extractedData.cambridgeTests;
      updates.cambridgeNumberOfTests = String(extractedData.cambridgeTests.length);
    }

    // IELTS - Simplified structure
    if (extractedData.ielts) {
      updates.ieltsPastTests = extractedData.ielts.ieltsPastTests || '1';
      updates.ieltsTestDate = extractedData.ielts.ieltsTestDate || '';
      updates.ieltsOverallBandScore = extractedData.ielts.ieltsOverallBandScore || '';
      updates.ieltsListeningScore = extractedData.ielts.ieltsListeningScore || '';
      updates.ieltsReadingScore = extractedData.ielts.ieltsReadingScore || '';
      updates.ieltsWritingScore = extractedData.ielts.ieltsWritingScore || '';
      updates.ieltsSpeakingScore = extractedData.ielts.ieltsSpeakingScore || '';
    }

    // TOEFL - Simplified structure
    if (extractedData.toefl) {
      updates.toeflPastTests = extractedData.toefl.toeflPastTests || '1';
      updates.toeflTestDate = extractedData.toefl.toeflTestDate || '';
      updates.toeflTotalScore = extractedData.toefl.toeflTotalScore || '';
      updates.toeflReadingScore = extractedData.toefl.toeflReadingScore || '';
      updates.toeflListeningScore = extractedData.toefl.toeflListeningScore || '';
      updates.toeflSpeakingScore = extractedData.toefl.toeflSpeakingScore || '';
      updates.toeflWritingScore = extractedData.toefl.toeflWritingScore || '';
    }

    // Duolingo - Simplified structure
    if (extractedData.duolingo) {
      updates.duolingoPastTests = extractedData.duolingo.duolingoPastTests || '1';
      updates.duolingoTestDate = extractedData.duolingo.duolingoTestDate || '';
      updates.duolingoTotalScore = extractedData.duolingo.duolingoTotalScore || '';
      updates.duolingoLiteracyScore = extractedData.duolingo.duolingoLiteracyScore || '';
      updates.duolingoComprehensionScore = extractedData.duolingo.duolingoComprehensionScore || '';
      updates.duolingoConversationScore = extractedData.duolingo.duolingoConversationScore || '';
      updates.duolingoProductionScore = extractedData.duolingo.duolingoProductionScore || '';
    }

    // PTE - Simplified structure
    if (extractedData.pte) {
      updates.ptePastTests = extractedData.pte.ptePastTests || '1';
      updates.pteTestDate = extractedData.pte.pteTestDate || '';
      updates.pteListeningScore = extractedData.pte.pteListeningScore || '';
      updates.pteReadingScore = extractedData.pte.pteReadingScore || '';
      updates.pteSpeakingScore = extractedData.pte.pteSpeakingScore || '';
      updates.pteWritingScore = extractedData.pte.pteWritingScore || '';
      updates.pteGrammarScore = extractedData.pte.pteGrammarScore || '';
      updates.pteVocabularyScore = extractedData.pte.pteVocabularyScore || '';
    }

    return updates;
  };

  const processCVFile = async (file) => {
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }

    setFileName(file.name);
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setCvProcessed(false);

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
        const mappedUpdates = mapExtractedDataToFormData(data.extractedData);
        
        // Log what was extracted for debugging
        console.log('✅ CV Parsed successfully. Extracted fields:', Object.keys(mappedUpdates));
        
        if (onCVDataExtracted) {
          onCVDataExtracted(mappedUpdates);
        } else {
          console.warn('⚠️ onCVDataExtracted prop is not provided');
        }
        
        setCvProcessed(true);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to parse CV');
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error('CV parsing error:', err);
      setError(err.message || 'Failed to parse CV. You can fill the form manually instead.');
      setCvProcessed(false);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCVFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) processCVFile(file);
    e.target.value = '';
  };

  // Score-doc helpers
  const resetDoc = () => {
    setDocFileName('');
    setDocError(null);
    setDocProcessed(false);
    setDocUploadProgress(0);
    setDocUploading(false);
    if (docFileInputRef.current) docFileInputRef.current.value = '';
  };

  const processScoreDocFile = async (file) => {
    if (!selectedTestType) {
      setDocError('Please select the test type before uploading.');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) { setDocError(validationError); return; }

    setDocFileName(file.name);
    setDocUploading(true);
    setDocUploadProgress(0);
    setDocError(null);
    setDocProcessed(false);

    const progressInterval = setInterval(() => {
      setDocUploadProgress((prev) => {
        if (prev >= 85) { clearInterval(progressInterval); return 85; }
        return prev + 8;
      });
    }, 400);

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('testType', selectedTestType);

      const token   = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_BASE_URL || '';

      const response = await fetch(`${API_URL}/api/students/testing/parse-score-doc`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formDataObj,
      });

      clearInterval(progressInterval);
      setDocUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ Score document parsed for ${selectedTestType}. Extracted fields:`, Object.keys(data.extractedFields || {}));
        
      if (onScoreDocExtracted) {
  onScoreDocExtracted(data.extractedFields, selectedTestType);
} else {
  console.warn('⚠️ onScoreDocExtracted prop is not provided');
}

// ✅ ADD THESE 2 LINES (IMPORTANT)
if (!formData.testsToReport?.includes(selectedTestType)) {
  handleArrayChange('testsToReport', selectedTestType);
}

handleInputChange({
  target: { name: 'selfReportScores', value: 'yes' }
});
        
        setDocProcessed(true);
        setDocError(null);
      } else {
        throw new Error(data.message || 'Failed to parse document');
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Score doc parsing error:', err);
      setDocError(err.message || 'Failed to parse document. You can fill the form manually instead.');
      setDocProcessed(false);
    } finally {
      setDocUploading(false);
      setDocUploadProgress(0);
    }
  };

  const handleDocFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) processScoreDocFile(file);
    e.target.value = '';
  };

  const handleDocDragOver  = (e) => { e.preventDefault(); setDragOverDoc(true); };
  const handleDocDragLeave = ()    => setDragOverDoc(false);
  const handleDocDrop      = (e)   => {
    e.preventDefault();
    setDragOverDoc(false);
    const file = e.dataTransfer.files[0];
    if (file) processScoreDocFile(file);
  };

  // Test-selection helpers
  const handleTestSelection = (testId) => handleArrayChange('testsToReport', testId);
  const isTestSelected      = (testId) => formData.testsToReport?.includes(testId) || false;

  return (
    <div className="teststakensection-container">

      {/* Upload Banner */}
      <div className="teststakensection-cv-banner">
        <div className="teststakensection-cv-banner-bg" />

        <div className="teststakensection-cv-banner-left">
          <h3 className="teststakensection-cv-banner-title">Auto-fill your test scores</h3>
          <p className="teststakensection-cv-banner-desc">
            Upload your CV/Résumé to fill all sections at once, or upload a single score report to fill just that section · PDF, DOC, DOCX, TXT
          </p>
        </div>

        <div className="teststakensection-cv-banner-right">
          {/* CV Upload */}
          <button
            type="button"
            className="teststakensection-cv-upload-btn"
            onClick={() => { resetDoc(); setShowDocUpload(false); fileInputRef.current?.click(); }}
            disabled={uploading || docUploading}
          >
            Upload CV / Résumé
          </button>

          {/* Score Document Upload */}
          <button
            type="button"
            className="teststakensection-doc-upload-btn"
            onClick={() => { resetCV(); setShowDocUpload((prev) => !prev); }}
            disabled={uploading || docUploading}
          >
            Upload Score Document
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleCVFileInputChange}
          accept=".pdf,.doc,.docx,.txt"
          style={{ display: 'none' }}
        />
        <input
          type="file"
          ref={docFileInputRef}
          onChange={handleDocFileInputChange}
          accept=".pdf,.doc,.docx,.txt"
          style={{ display: 'none' }}
        />

        {/* CV upload progress / status */}
        {uploading && (
          <div className="teststakensection-cv-progress-wrap">
            <div className="teststakensection-cv-progress-bar">
              <div className="teststakensection-cv-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="teststakensection-cv-progress-text">Parsing your CV… {uploadProgress}%</p>
          </div>
        )}

        {fileName && !uploading && !error && cvProcessed && (
          <div className="teststakensection-cv-status teststakensection-cv-status--success">
            <span className="teststakensection-cv-status-text">{getFileIcon(fileName)} {fileName} — CV parsed successfully</span>
            <button type="button" className="teststakensection-cv-status-clear" onClick={resetCV}>×</button>
          </div>
        )}

        {error && (
          <div className="teststakensection-cv-status teststakensection-cv-status--error">
            <span className="teststakensection-cv-status-text">{error}</span>
            <button
              type="button"
              className="teststakensection-cv-retry-btn"
              onClick={() => { resetCV(); setTimeout(() => fileInputRef.current?.click(), 50); }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Score Document Upload Panel */}
      {showDocUpload && (
        <div className="teststakensection-doc-panel">
          <div className="teststakensection-doc-panel-header">
            <div className="teststakensection-doc-panel-header-left">
              <div>
                <h4 className="teststakensection-doc-panel-title">Upload Score Document</h4>
                <p className="teststakensection-doc-panel-subtitle">
                  Don't have a CV? Upload your SAT, ACT, IELTS, or other score report directly.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="teststakensection-doc-panel-close"
              onClick={() => { setShowDocUpload(false); resetDoc(); setSelectedTestType(''); }}
            >
              ×
            </button>
          </div>

          {/* Step 1 — select test type */}
          <div className="teststakensection-doc-step">
            <span className="teststakensection-doc-step-num">1</span>
            <div className="teststakensection-doc-step-content">
              <label className="teststakensection-doc-step-label">Select the test type for this document</label>
              <div className="teststakensection-doc-type-grid">
                {scoreDocTestTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`teststakensection-doc-type-chip ${selectedTestType === t.id ? 'teststakensection-doc-type-chip--selected' : ''}`}
                    onClick={() => { setSelectedTestType(t.id); resetDoc(); }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2 — upload the file */}
          <div className={`teststakensection-doc-step ${!selectedTestType ? 'teststakensection-doc-step--disabled' : ''}`}>
            <span className="teststakensection-doc-step-num">2</span>
            <div className="teststakensection-doc-step-content">
              <label className="teststakensection-doc-step-label">
                Upload your{' '}
                {selectedTestType
                  ? scoreDocTestTypes.find((t) => t.id === selectedTestType)?.name
                  : 'score'}{' '}
                report
              </label>

              {/* Drop zone */}
              <div
                className={`teststakensection-doc-dropzone ${dragOverDoc ? 'teststakensection-doc-dropzone--drag' : ''} ${!selectedTestType ? 'teststakensection-doc-dropzone--locked' : ''}`}
                onDragOver={selectedTestType ? handleDocDragOver : undefined}
                onDragLeave={selectedTestType ? handleDocDragLeave : undefined}
                onDrop={selectedTestType ? handleDocDrop : undefined}
                onClick={() => selectedTestType && !docUploading && docFileInputRef.current?.click()}
              >
                {docUploading ? (
                  <div className="teststakensection-doc-dropzone-inner">
                    <div className="teststakensection-doc-spinner" />
                    <p className="teststakensection-doc-dropzone-label">Parsing document… {docUploadProgress}%</p>
                    <div className="teststakensection-doc-mini-progress">
                      <div className="teststakensection-doc-mini-fill" style={{ width: `${docUploadProgress}%` }} />
                    </div>
                  </div>
                ) : docProcessed && docFileName ? (
                  <div className="teststakensection-doc-dropzone-inner">
                    <p className="teststakensection-doc-dropzone-label teststakensection-doc-dropzone-label--success">
                      {getFileIcon(docFileName)} {docFileName}
                    </p>
                    <p className="teststakensection-doc-dropzone-hint">Document parsed — fields auto-filled</p>
                    <button
                      type="button"
                      className="teststakensection-doc-replace-btn"
                      onClick={(e) => { e.stopPropagation(); resetDoc(); }}
                    >
                      Replace document
                    </button>
                  </div>
                ) : (
                  <div className="teststakensection-doc-dropzone-inner">
                    <p className="teststakensection-doc-dropzone-label">
                      {selectedTestType
                        ? 'Click to browse or drag & drop your file here'
                        : 'Select a test type above to enable upload'}
                    </p>
                    <p className="teststakensection-doc-dropzone-hint">PDF, DOC, DOCX, TXT — max 5 MB</p>
                  </div>
                )}
              </div>

              {/* Doc error */}
              {docError && (
                <div className="teststakensection-doc-error">
                  <span>{docError}</span>
                  <button
                    type="button"
                    className="teststakensection-doc-error-retry"
                    onClick={() => { resetDoc(); setTimeout(() => docFileInputRef.current?.click(), 50); }}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="teststakensection-card">
        <h2 className="teststakensection-card-title">Tests Taken</h2>
        <hr className="teststakensection-divider" />

        {/* Self-reporting question */}
        <div className="teststakensection-question-block">
          <label className="teststakensection-question-label required">
            Do you wish to self-report scores or future test dates? *
          </label>
          <p className="teststakensection-description">
            In addition to sending official score reports as required by colleges, do you wish to
            self-report scores or future test dates for any of the following standardized tests:
            ACT, SAT/SAT Subject, AP, IB, Cambridge, TOEFL, PTE Academic, IELTS, and Duolingo
            English Test?
          </p>
          <div className="teststakensection-radio-row">
            <button
              type="button"
              className={`teststakensection-radio-btn ${formData.selfReportScores === 'yes' ? 'teststakensection-radio-btn--selected' : ''}`}
              onClick={() => handleInputChange({ target: { name: 'selfReportScores', value: 'yes' } })}
            >
              Yes
            </button>
            <button
              type="button"
              className={`teststakensection-radio-btn ${formData.selfReportScores === 'no' ? 'teststakensection-radio-btn--selected' : ''}`}
              onClick={() => handleInputChange({ target: { name: 'selfReportScores', value: 'no' } })}
            >
              No
            </button>
          </div>
          <button
            type="button"
            className="teststakensection-clear-link"
            onClick={() => clearAnswer('selfReportScores')}
            disabled={!formData.selfReportScores}
          >
            Clear answer
          </button>
        </div>

        {/* Tests to report */}
        {formData.selfReportScores === 'yes' && (
          <div className="teststakensection-question-block" style={{ marginTop: '24px' }}>
            <label className="teststakensection-question-label required">
              Indicate all tests you wish to report *
            </label>
            <p className="teststakensection-description">
              Be sure to include tests you expect to take in addition to tests you have already taken.
            </p>
            <div className="teststakensection-check-row">
              {testTypes.map((test) => (
                <label key={test.id} className="teststakensection-check-option">
                  <input
                    type="checkbox"
                    checked={isTestSelected(test.id)}
                    onChange={() => handleTestSelection(test.id)}
                  />
                  <span>{test.name}</span>
                </label>
              ))}
            </div>
            {formData.testsToReport?.length > 0 && (
              <button
                type="button"
                className="teststakensection-clear-link"
                onClick={() => clearArrayAnswer('testsToReport')}
              >
                Clear all selections
              </button>
            )}
          </div>
        )}

        {/* International applicant question */}
        <div className="teststakensection-question-block" style={{ marginTop: '24px' }}>
          <label className="teststakensection-question-label">
            International applicants: Promotion examinations
          </label>
          <p className="teststakensection-description">
            <strong>International applicants:</strong> Is promotion within your educational system
            based upon standard leaving examinations given at the end of lower and/or senior
            secondary school by a state or national leaving examinations board? (Students studying
            in the US typically answer no to this question.)
          </p>
          <div className="teststakensection-radio-row">
            <button
              type="button"
              className={`teststakensection-radio-btn ${formData.internationalPromotionExams === 'yes' ? 'teststakensection-radio-btn--selected' : ''}`}
              onClick={() => handleInputChange({ target: { name: 'internationalPromotionExams', value: 'yes' } })}
            >
              Yes
            </button>
            <button
              type="button"
              className={`teststakensection-radio-btn ${formData.internationalPromotionExams === 'no' ? 'teststakensection-radio-btn--selected' : ''}`}
              onClick={() => handleInputChange({ target: { name: 'internationalPromotionExams', value: 'no' } })}
            >
              No
            </button>
          </div>
          <button
            type="button"
            className="teststakensection-clear-link"
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