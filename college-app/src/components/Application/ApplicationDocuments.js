import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Resume from './Resume';
import './ApplicationDocuments.css';

const API_URL = process.env.REACT_APP_API_BASE_URL 
  ? `${process.env.REACT_APP_API_BASE_URL}/api/application/documents`
  : "http://localhost:5000/api/application/documents";

const ApplicationDocuments = ({ formData, onFileUpload }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [isLoading,            setIsLoading]            = useState(true);
  const [isSubmitting,         setIsSubmitting]         = useState(false);
  const [error,                setError]                = useState("");
  const [uploading,            setUploading]            = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [localFormData,        setLocalFormData]        = useState(formData || {});
  const [expandedCategories,   setExpandedCategories]   = useState({
    personal: true,
    certificates: true,
  });
  const [dragActive,      setDragActive]      = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc,     setSelectedDoc]     = useState(null);
  const [searchTerm,      setSearchTerm]      = useState('');

  // CV card mode — 'choose' | 'upload' | 'generate' | 'done'
  const [cvMode, setCvMode] = useState('choose');
  // ✅ CV Generator is ALWAYS a modal — never inline
  const [showCVModal, setShowCVModal] = useState(false);

  const documentTypes = [
    {
      id: 'cv', field: 'cv',
      label: 'Curriculum Vitae (Signed and dated)',
      description: 'Your updated CV/resume with your educational and professional background',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'personal', icon: '📄'
    },
    {
      id: 'photo', field: 'photo',
      label: 'Photo',
      description: 'Recent passport-size photograph',
      required: true, accept: '.jpg,.jpeg,.png', maxSize: 5, category: 'personal', icon: '📷'
    },
    {
      id: 'cert9th', field: 'cert9th',
      label: '9th Grade Certificate',
      description: 'Official certificate / marksheet from your 9th grade',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'certificates', icon: '📜'
    },
    {
      id: 'cert10th', field: 'cert10th',
      label: '10th Grade Certificate',
      description: 'Official certificate / marksheet from your 10th grade (Secondary School)',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'certificates', icon: '📜'
    },
    {
      id: 'cert11th', field: 'cert11th',
      label: '11th Grade Certificate',
      description: 'Official certificate / marksheet from your 11th grade',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'certificates', icon: '📜'
    },
    {
      id: 'cert12th', field: 'cert12th',
      label: '12th Grade Certificate',
      description: 'Official certificate / marksheet from your 12th grade (Higher Secondary / A-Level)',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'certificates', icon: '🎓'
    },
  ];

  const documentCategories = {
    personal: {
      title: 'Personal Documents', icon: '👤', color: '#4299e1',
      documents: documentTypes.filter(doc => doc.category === 'personal')
    },
    certificates: {
      title: 'School Certificates', icon: '📚', color: '#48bb78',
      documents: documentTypes.filter(doc => doc.category === 'certificates')
    },
  };

  const filteredCategories = searchTerm
    ? Object.entries(documentCategories).reduce((acc, [key, category]) => {
        const filteredDocs = category.documents.filter(doc =>
          doc.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredDocs.length > 0) acc[key] = { ...category, documents: filteredDocs };
        return acc;
      }, {})
    : documentCategories;

  // ── Fetch documents ──────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    if (token) fetchDocuments(isMounted);
    else { setError("No authentication token found"); setIsLoading(false); }
    return () => { isMounted = false; };
  }, [token]);

  const fetchDocuments = async (isMounted) => {
    try {
      setIsLoading(true);
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isMounted && res.data.success) {
        if (res.data.documents) {
          setLocalFormData(res.data.documents);
          if (res.data.documents.cv?.fileName) {
            setCvMode(res.data.documents.cv.generated ? 'generate' : 'upload');
          }
        }
        if (res.data.completionPercentage !== undefined) {
          setCompletionPercentage(res.data.completionPercentage);
        }
      }
    } catch (error) {
      console.error("Fetch documents error:", error.response?.data || error.message);
      if (isMounted) {
        if (error.response?.status === 404) {
          const emptyDocs = {};
          documentTypes.forEach(doc => { emptyDocs[doc.field] = null; });
          setLocalFormData(emptyDocs);
        } else {
          setError("Failed to load documents data");
        }
      }
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  // ── Drag and drop ────────────────────────────────────────────
  const handleDrag = (e, field) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(field);
    else if (e.type === "dragleave") setDragActive(null);
  };

  const handleDrop = async (e, field, docType) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(null);
    const files = e.dataTransfer.files;
    if (files && files[0]) await handleFileUpload(files[0], field, docType);
  };

  // ── File upload ──────────────────────────────────────────────
  const handleFileUpload = async (file, field, docType) => {
    if (!file) return;
    if (file.size > docType.maxSize * 1024 * 1024) {
      setError(`File size must be less than ${docType.maxSize}MB`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    const allowedTypes  = docType.accept.split(',');
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setError(`Invalid file type. Allowed: ${docType.accept}`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalFormData(prev => ({ ...prev, [`${field}Preview`]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
    setUploading(prev => ({ ...prev, [field]: true }));
    setShowUploadModal(false);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await axios.post(`${API_URL}/upload/${field}`, uploadData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        const updatedFile = {
          name:       file.name,
          size:       file.size,
          type:       file.type,
          fileName:   res.data.fileData?.fileName || res.data.fileName,
          fileUrl:    res.data.fileData?.fileUrl  || res.data.fileUrl,
          uploadedAt: new Date().toISOString()
        };
        setLocalFormData(prev => ({ ...prev, [field]: updatedFile, [`${field}Preview`]: prev[`${field}Preview`] }));
        if (res.data.completionPercentage !== undefined) setCompletionPercentage(res.data.completionPercentage);
        if (onFileUpload) onFileUpload(field, updatedFile);
        setError('');
        setTimeout(() => alert(`${docType.label} uploaded successfully!`), 100);
      }
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      let msg = "Upload failed. ";
      if (error.response?.data?.message) msg += error.response.data.message;
      else if (error.message) msg += error.message;
      setError(msg);
      setTimeout(() => setError(''), 3000);
      setLocalFormData(prev => ({ ...prev, [`${field}Preview`]: null }));
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleFileChange = async (e, field, docType) => {
    const file = e.target.files[0];
    if (file) await handleFileUpload(file, field, docType);
  };

  // ── Remove file ──────────────────────────────────────────────
  const handleRemoveFile = async (field) => {
    if (!window.confirm('Are you sure you want to remove this file?')) return;
    try {
      if (!localFormData[field] || !localFormData[field].fileName) {
        setLocalFormData(prev => ({ ...prev, [field]: null, [`${field}Preview`]: null }));
        if (onFileUpload) onFileUpload(field, null);
        const requiredDocs     = documentTypes.filter(doc => doc.required);
        const uploadedRequired = requiredDocs.filter(doc => localFormData[doc.field]).length;
        setCompletionPercentage(Math.round((uploadedRequired / requiredDocs.length) * 100));
        if (field === 'cv') setCvMode('choose');
        alert("File removed from local storage");
        return;
      }
      try {
        const res = await axios.delete(`${API_URL}/files/${field}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setLocalFormData(prev => ({ ...prev, [field]: null, [`${field}Preview`]: null }));
          if (res.data.completionPercentage !== undefined) setCompletionPercentage(res.data.completionPercentage);
          if (onFileUpload) onFileUpload(field, null);
          if (field === 'cv') setCvMode('choose');
          alert("File removed successfully!");
        }
      } catch (apiError) {
        setLocalFormData(prev => ({ ...prev, [field]: null, [`${field}Preview`]: null }));
        const requiredDocs = documentTypes.filter(doc => doc.required);
        const updatedData  = { ...localFormData, [field]: null };
        const uploaded     = requiredDocs.filter(doc => updatedData[doc.field]).length;
        setCompletionPercentage(Math.round((uploaded / requiredDocs.length) * 100));
        if (onFileUpload) onFileUpload(field, null);
        if (field === 'cv') setCvMode('choose');
        alert("File removed from local storage (server record not found)");
      }
    } catch (error) {
      console.error("Remove error:", error);
      alert("Failed to remove file. Please try again.");
    }
  };

  // ── CV generated ─────────────────────────────────────────────
  const handleCVGenerated = (cvData) => {
    const generatedCV = {
      name:       `CV_${cvData.firstName || 'Student'}_${cvData.lastName || ''}.pdf`,
      size:       0,
      type:       'application/pdf',
      fileName:   `generated_cv_${Date.now()}`,
      fileUrl:    null,
      generated:  true,
      uploadedAt: new Date().toISOString()
    };
    setLocalFormData(prev => ({ ...prev, cv: generatedCV }));
    if (onFileUpload) onFileUpload('cv', generatedCV);
    // Close modal after generating
    setShowCVModal(false);
    setCvMode('generate');
  };

  // ── Completion ───────────────────────────────────────────────
  const calculateCompletion = useCallback(() => {
    const requiredDocs     = documentTypes.filter(doc => doc.required);
    const uploadedRequired = requiredDocs.filter(doc => localFormData[doc.field]).length;
    return Math.round((uploadedRequired / requiredDocs.length) * 100);
  }, [localFormData]);

  useEffect(() => {
    setCompletionPercentage(calculateCompletion());
  }, [localFormData, calculateCompletion]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // ── Navigation ───────────────────────────────────────────────
  const handleNext = async () => {
    const missingRequired = documentTypes
      .filter(doc => doc.required && !localFormData[doc.field])
      .map(doc => doc.label);
    if (missingRequired.length > 0) {
      setError(`Please upload all required documents:\n\n• ${missingRequired.join('\n• ')}`);
      return;
    }
    setIsSubmitting(true);
    try {
      try {
        await axios.post(
          `${API_URL}/status`,
          { documents: localFormData, completed: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (statusError) {
        console.log("Status endpoint not available, continuing anyway");
      }
      let targetPath = location.pathname.includes('/documents')
        ? location.pathname.replace('/documents', '/special-needs')
        : '/firstyear/dashboard/application/special-needs';
      navigate(targetPath);
    } catch (error) {
      console.error("Error in handleNext:", error);
      let targetPath = location.pathname.includes('/documents')
        ? location.pathname.replace('/documents', '/special-needs')
        : '/firstyear/dashboard/application/special-needs';
      navigate(targetPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    let backPath = location.pathname.includes('/documents')
      ? location.pathname.replace('/documents', '/firsteducation')
      : '/firstyear/dashboard/application/firsteducation';
    navigate(backPath);
  };

  // ✅ Close CV modal — resets to 'choose' only if no CV is saved yet
  const handleCloseCV = () => {
    setShowCVModal(false);
    if (!localFormData.cv?.fileName) {
      setCvMode('choose');
    }
  };

  // ── Helpers ──────────────────────────────────────────────────
  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':  return '📕';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
      case 'doc': case 'docx': return '📘';
      default: return '📄';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="application-documents">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your documents...</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // MAIN UI
  // ════════════════════════════════════════════════════════════
  return (
    <div className="application-documents">

      {/* Header */}
      <div className="documents-header">
        <div className="header-left">
          <h1>BA Communication Design</h1>
          <div className="application-id">
            <span className="id-label">APPLICATION ID</span>
            <span className="id-value">UEG0000104849</span>
          </div>
        </div>
        <div className="progress-container">
          <div className="progress-badge">
            <div className="progress-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle"
                  strokeDasharray={`${completionPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="percentage">{completionPercentage}%</text>
              </svg>
            </div>
            <span className="progress-text">Completed</span>
          </div>
        </div>
      </div>

      {/* Navigation Steps */}
      <div className="application-steps">
        {[
          "Study programme", "Applicant Details", "Address",
          "Entrance qualification", "Higher Education",
          "Application Documents", "Special Needs", "Declaration", "Review"
        ].map((step, index) => {
          let stepClass = "step";
          if (index < 5) stepClass += " completed";
          if (index === 5) stepClass += " active";
          return (
            <div key={step} className={stepClass}>
              <span className="step-number">{index < 5 ? "✓" : index + 1}</span>
              <span className="step-name">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="error-close-btn">×</button>
        </div>
      )}

      {/* Main Form */}
      <div className="documents-form-container">
        <div className="form-header">
          <h2>Application Documents</h2>
          <div className="info-message">
            <i className="fas fa-info-circle"></i>
            <span>Upload all required documents marked with <span className="required-star">*</span></span>
          </div>
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>

          {/* Documents by Category */}
          {Object.entries(filteredCategories).map(([key, category]) => (
            category.documents.length > 0 && (
              <div key={key} className="document-category">
                <div
                  className="category-header"
                  onClick={() => toggleCategory(key)}
                  style={{ borderLeftColor: category.color }}
                >
                  <div className="category-title-wrapper">
                    <span className="category-icon">{category.icon}</span>
                    <h3 className="category-title">{category.title}</h3>
                    <span className="category-count">
                      {category.documents.filter(doc => localFormData[doc.field]).length}/{category.documents.length}
                    </span>
                  </div>
                  <div className="category-actions">
                    <span className="expand-icon">{expandedCategories[key] ? '▼' : '▶'}</span>
                  </div>
                </div>

                {expandedCategories[key] && (
                  <div className="documents-grid">
                    {category.documents.map((doc) => {

                      /* ── SPECIAL CV CARD ── */
                      if (doc.id === 'cv') {
                        return (
                          <div key={doc.id} className="document-card cv-document-card">
                            <div className="document-header">
                              <div className="document-icon">{doc.icon}</div>
                              <div className="document-title-wrapper">
                                <h4 className="document-title">
                                  {doc.label}
                                  {doc.required && <span className="required-badge">*</span>}
                                </h4>
                                <p className="document-description">{doc.description}</p>
                              </div>
                            </div>

                            <div className="document-upload-area">
                              {/* ── CV already saved ── */}
                              {localFormData.cv?.fileName ? (
                                localFormData.cv.generated ? (
                                  <div className="cv-generated-badge">
                                    <span className="cv-gen-check">✅</span>
                                    <div className="cv-gen-info">
                                      <span className="cv-gen-name">{localFormData.cv.name}</span>
                                      <span className="cv-gen-tag">Generated CV</span>
                                    </div>
                                    <div className="cv-gen-actions">
                                      <button type="button" className="cv-action-btn cv-action-edit"
                                        onClick={() => { setCvMode('generate'); setShowCVModal(true); }}>
                                        ✏️ Edit / Re-download
                                      </button>
                                      <button type="button" className="cv-action-btn cv-action-remove"
                                        onClick={() => handleRemoveFile('cv')}>
                                        🗑 Remove
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="file-info">
                                    <span className="file-icon-large">
                                      {getFileIcon(localFormData.cv.name || localFormData.cv.fileName)}
                                    </span>
                                    <div className="file-details">
                                      <span className="file-name">
                                        {localFormData.cv.originalName || localFormData.cv.name || localFormData.cv.fileName || 'Uploaded file'}
                                      </span>
                                      {localFormData.cv.size > 0 && (
                                        <span className="file-size">{formatFileSize(localFormData.cv.size)}</span>
                                      )}
                                    </div>
                                    <div className="file-actions">
                                      {localFormData.cv.fileUrl && (
                                        <a href={localFormData.cv.fileUrl} target="_blank" rel="noopener noreferrer" className="view-link">
                                          <i className="fas fa-eye"></i> View
                                        </a>
                                      )}
                                      <button type="button" className="remove-btn" onClick={() => handleRemoveFile('cv')}>
                                        <i className="fas fa-times"></i> Remove
                                      </button>
                                    </div>
                                  </div>
                                )
                              ) : (
                                /* ── No CV yet: choose mode ── */
                                <>
                                  {cvMode === 'choose' && (
                                    <div className="cv-choice-wrapper">
                                      <p className="cv-choice-prompt">How would you like to provide your CV?</p>
                                      <div className="cv-choice-row">
                                        <button type="button" className="cv-choice-card"
                                          onClick={() => setCvMode('upload')}>
                                          <span className="cv-choice-emoji">📤</span>
                                          <span className="cv-choice-title">Upload CV</span>
                                          <span className="cv-choice-desc">Upload your existing CV as PDF or image</span>
                                        </button>
                                        <div className="cv-choice-or">OR</div>
                                        {/* ✅ Generate CV → opens modal only, NO inline panel */}
                                        <button type="button" className="cv-choice-card cv-choice-card--generate"
                                          onClick={() => { setCvMode('generate'); setShowCVModal(true); }}>
                                          <span className="cv-choice-emoji">✨</span>
                                          <span className="cv-choice-title">Generate CV</span>
                                          <span className="cv-choice-desc">Auto-fill from your form data, edit &amp; download as PDF</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {cvMode === 'upload' && (
                                    <div className="upload-placeholder">
                                      <button type="button" className="cv-back-link"
                                        onClick={() => setCvMode('choose')}>
                                        ← Choose differently
                                      </button>
                                      <div
                                        className={`upload-prompt ${dragActive === doc.field ? 'drag-active' : ''}`}
                                        onDragEnter={(e) => handleDrag(e, doc.field)}
                                        onDragLeave={(e) => handleDrag(e, doc.field)}
                                        onDragOver={(e) => handleDrag(e, doc.field)}
                                        onDrop={(e) => handleDrop(e, doc.field, doc)}
                                      >
                                        <i className="fas fa-cloud-upload-alt upload-icon"></i>
                                        <p>Drag &amp; drop or click to upload</p>
                                        <p className="upload-hint">
                                          {doc.accept.replace(/\./g, '').toUpperCase()} • Max {doc.maxSize}MB
                                        </p>
                                      </div>
                                      <input
                                        type="file"
                                        id="cvFileInput"
                                        accept={doc.accept}
                                        className="file-input-hidden"
                                        onChange={(e) => handleFileChange(e, doc.field, doc)}
                                        disabled={uploading[doc.field] || isSubmitting}
                                      />
                                      <button type="button" className="upload-button"
                                        onClick={() => document.getElementById('cvFileInput').click()}
                                        disabled={uploading[doc.field] || isSubmitting}>
                                        {uploading[doc.field]
                                          ? <><span className="spinner-small"></span> Uploading...</>
                                          : <><i className="fas fa-upload"></i> Browse Files</>
                                        }
                                      </button>
                                    </div>
                                  )}

                                  {/* ✅ cvMode === 'generate' with no saved CV → show "Open Generator" button, NOT inline panel */}
                                  {cvMode === 'generate' && (
                                    <div className="cv-choice-wrapper">
                                      <p className="cv-choice-prompt">CV Generator is ready</p>
                                      <button type="button" className="cv-choice-card cv-choice-card--generate"
                                        onClick={() => setShowCVModal(true)}>
                                        <span className="cv-choice-emoji">✨</span>
                                        <span className="cv-choice-title">Open CV Generator</span>
                                        <span className="cv-choice-desc">Click to edit and download your CV as PDF</span>
                                      </button>
                                      <button type="button" className="cv-back-link"
                                        style={{ marginTop: '8px' }}
                                        onClick={() => setCvMode('choose')}>
                                        ← Choose differently
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }

                      /* ── ALL OTHER DOCUMENT CARDS ── */
                      return (
                        <div
                          key={doc.id}
                          className={`document-card ${localFormData[doc.field] ? 'uploaded' : ''} ${dragActive === doc.field ? 'drag-active' : ''}`}
                          onDragEnter={(e) => handleDrag(e, doc.field)}
                          onDragLeave={(e) => handleDrag(e, doc.field)}
                          onDragOver={(e) => handleDrag(e, doc.field)}
                          onDrop={(e) => handleDrop(e, doc.field, doc)}
                        >
                          <div className="document-header">
                            <div className="document-icon">{doc.icon}</div>
                            <div className="document-title-wrapper">
                              <h4 className="document-title">
                                {doc.label}
                                {doc.required && <span className="required-badge">*</span>}
                              </h4>
                              <p className="document-description">{doc.description}</p>
                              {doc.note && (
                                <p className="document-note">
                                  <i className="fas fa-info-circle"></i>{doc.note}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="document-upload-area">
                            {localFormData[doc.field] && localFormData[doc.field].fileName ? (
                              <div className="file-preview">
                                {localFormData[`${doc.field}Preview`] ? (
                                  <div className="image-preview-container">
                                    <img src={localFormData[`${doc.field}Preview`]} alt={doc.label} className="image-preview" />
                                    <div className="image-preview-overlay">
                                      <button type="button" className="view-image-btn"
                                        onClick={() => window.open(localFormData[`${doc.field}Preview`], '_blank')}>
                                        <i className="fas fa-eye"></i>
                                      </button>
                                      <button type="button" className="remove-image-btn"
                                        onClick={() => handleRemoveFile(doc.field)} disabled={isSubmitting}>
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="file-info">
                                    <span className="file-icon-large">
                                      {getFileIcon(localFormData[doc.field].name || localFormData[doc.field].fileName)}
                                    </span>
                                    <div className="file-details">
                                      <span className="file-name" title={localFormData[doc.field].originalName || localFormData[doc.field].name || localFormData[doc.field].fileName}>
                                        {localFormData[doc.field].originalName || localFormData[doc.field].name || localFormData[doc.field].fileName || 'Uploaded file'}
                                      </span>
                                      {localFormData[doc.field].size && (
                                        <span className="file-size">{formatFileSize(localFormData[doc.field].size)}</span>
                                      )}
                                    </div>
                                    <div className="file-actions">
                                      {localFormData[doc.field].fileUrl && (
                                        <a href={localFormData[doc.field].fileUrl} target="_blank" rel="noopener noreferrer" className="view-link">
                                          <i className="fas fa-eye"></i> View
                                        </a>
                                      )}
                                      <button type="button" className="remove-btn"
                                        onClick={() => handleRemoveFile(doc.field)} disabled={isSubmitting}>
                                        <i className="fas fa-times"></i> Remove
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="upload-placeholder">
                                <div className="upload-prompt">
                                  <i className="fas fa-cloud-upload-alt upload-icon"></i>
                                  <p>Drag &amp; drop or click to upload</p>
                                  <p className="upload-hint">
                                    {doc.accept.replace(/\./g, '').toUpperCase()} • Max {doc.maxSize}MB
                                  </p>
                                </div>
                                <input
                                  type="file"
                                  id={`${doc.field}Upload`}
                                  accept={doc.accept}
                                  className="file-input-hidden"
                                  onChange={(e) => handleFileChange(e, doc.field, doc)}
                                  disabled={uploading[doc.field] || isSubmitting}
                                />
                                <button type="button" className="upload-button"
                                  onClick={() => document.getElementById(`${doc.field}Upload`).click()}
                                  disabled={uploading[doc.field] || isSubmitting}>
                                  {uploading[doc.field]
                                    ? <><span className="spinner-small"></span> Uploading...</>
                                    : <><i className="fas fa-upload"></i> Browse</>
                                  }
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          ))}

          {/* Upload Summary */}
          <div className="documents-summary">
            <div className="summary-header">
              <i className="fas fa-chart-pie"></i>
              <h3>Upload Summary</h3>
            </div>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Required Documents:</span>
                <span className="stat-value">{documentTypes.filter(doc => doc.required).length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Uploaded:</span>
                <span className="stat-value">{documentTypes.filter(doc => localFormData[doc.field]).length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Remaining:</span>
                <span className="stat-value">{documentTypes.filter(doc => doc.required && !localFormData[doc.field]).length}</span>
              </div>
            </div>
            <div className="summary-progress">
              <div className="summary-progress-bar" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleBack} disabled={isSubmitting}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <><span className="spinner-small"></span> Saving...</>
                : <>Next <i className="fas fa-arrow-right"></i></>
              }
            </button>
          </div>

          <div className="language-selector">
            <i className="fas fa-globe"></i>
            <span>English</span>
            <i className="fas fa-chevron-down"></i>
          </div>
        </form>
      </div>

      {/* ── Upload Modal ── */}
      {showUploadModal && selectedDoc && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload {selectedDoc.label}</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-icon">{selectedDoc.icon}</div>
              <p className="modal-description">{selectedDoc.description}</p>
              {selectedDoc.note && <p className="modal-note">{selectedDoc.note}</p>}
              <div className="modal-requirements">
                <p><i className="fas fa-file"></i> Accepted formats: {selectedDoc.accept.replace(/\./g, '').toUpperCase()}</p>
                <p><i className="fas fa-weight-hanging"></i> Maximum size: {selectedDoc.maxSize}MB</p>
              </div>
              <input
                type="file"
                id="modalFileInput"
                accept={selectedDoc.accept}
                className="file-input-hidden"
                onChange={(e) => { handleFileChange(e, selectedDoc.field, selectedDoc); setShowUploadModal(false); }}
              />
              <button className="modal-upload-btn" onClick={() => document.getElementById('modalFileInput').click()}>
                <i className="fas fa-upload"></i> Select File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CV GENERATOR — ALWAYS A FULL-SCREEN MODAL, never inline */}
      {showCVModal && (
        <div className="resume-modal-backdrop" onClick={handleCloseCV}>
          <div className="resume-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="resume-modal-close"
              onClick={handleCloseCV}
              aria-label="Close CV Generator"
            >
              ✕
            </button>
            <Resume
              formData={formData}
              onDownload={(cv) => { handleCVGenerated(cv); }}
              onPrev={handleCloseCV}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicationDocuments;