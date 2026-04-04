import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Resume from './Resume';
import './ApplicationDocuments.css';

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api/application/documents`
  : "http://localhost:5000/api/application/documents";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// =====================================================
// ✅ HELPER: Resolve any file URL to a viewable URL
// Handles:
//   1. Full S3 URL (new uploads)     → return as-is
//   2. Local /uploads/... path (old) → prepend BASE_URL (server will redirect to S3)
//   3. null/undefined                → return null
// =====================================================
const resolveFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('https://') || fileUrl.startsWith('http://')) return fileUrl;
  if (fileUrl.startsWith('/uploads/')) return `${BASE_URL}${fileUrl}`;
  return fileUrl;
};

const ApplicationDocuments = ({ formData, onFileUpload }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const token     = localStorage.getItem("token");

  const [isLoading,            setIsLoading]            = useState(true);
  const [isSubmitting,         setIsSubmitting]         = useState(false);
  const [error,                setError]                = useState("");
  const [uploading,            setUploading]            = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [localFormData,        setLocalFormData]        = useState(formData || {});
  const [expandedCategories,   setExpandedCategories]   = useState({
    personal: true,
    academic: true,
    certificates: true,
    optional: true,
  });
  const [dragActive,      setDragActive]      = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc,     setSelectedDoc]     = useState(null);
  const [searchTerm,      setSearchTerm]      = useState('');

  // CV state
  const [cvMode,      setCvMode]      = useState('choose');
  const [showCVModal, setShowCVModal] = useState(false);

  // Certificate availability state
  const [certAvailability, setCertAvailability] = useState({
    cert9th:  null,
    cert10th: null,
    cert11th: null,
    cert12th: null,
  });

  const [certExpectedMonth, setCertExpectedMonth] = useState({
    cert9th:  '',
    cert10th: '',
    cert11th: '',
    cert12th: '',
  });
  const [certExpectedYear, setCertExpectedYear] = useState({
    cert9th:  '',
    cert10th: '',
    cert11th: '',
    cert12th: '',
  });

  const CERT_FIELDS = ['cert9th', 'cert10th', 'cert11th', 'cert12th'];

  const MONTHS = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 6 }, (_, i) => String(currentYear + i));

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
      id: 'passport', field: 'passport',
      label: 'Passport / ID Proof',
      description: 'Upload your passport or government-issued ID.',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 10, category: 'personal', icon: '🪪'
    },
    {
      id: 'transcript', field: 'transcript',
      label: 'High School Transcript',
      description: 'Upload your official high school transcript. Must be translated if not in English.',
      required: true, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'academic', icon: '📋'
    },
    {
      id: 'diploma', field: 'diploma',
      label: 'High School Diploma / Graduation Certificate',
      description: 'Upload your Diploma/Graduation Certificate.',
      required: true, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'academic', icon: '🎓'
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
    {
      id: 'testScores', field: 'testScores',
      label: 'Standardized Test Scores (Optional)',
      description: 'Upload SAT or ACT score report if required.',
      required: false, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'optional', icon: '📊'
    },
    {
      id: 'languageProficiency', field: 'languageProficiency',
      label: 'English Language Proficiency (International Students)',
      description: 'Upload TOEFL, IELTS, or Duolingo scores.',
      required: false, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'optional', icon: '🌐'
    },
    {
      id: 'recommendationLetter', field: 'recommendationLetter',
      label: 'Letters of Recommendation (Optional)',
      description: 'Upload your letters of recommendation & personal statement about academic goals and motivations.',
      required: false, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'optional', icon: '✉️'
    },
  ];

  const documentCategories = {
    personal: {
      title: 'Personal Documents', icon: '👤', color: '#4299e1',
      documents: documentTypes.filter(doc => doc.category === 'personal')
    },
    academic: {
      title: 'Academic Documents', icon: '🏫', color: '#ed8936',
      documents: documentTypes.filter(doc => doc.category === 'academic')
    },
    certificates: {
      title: 'School Certificates', icon: '📚', color: '#48bb78',
      documents: documentTypes.filter(doc => doc.category === 'certificates')
    },
    optional: {
      title: 'Optional Documents', icon: '📎', color: '#9f7aea',
      documents: documentTypes.filter(doc => doc.category === 'optional')
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
          const avail  = {};
          const months = {};
          const years  = {};
          CERT_FIELDS.forEach(field => {
            if (res.data.documents[field]?.fileName) {
              avail[field] = 'yes';
            } else if (res.data.documents[`${field}_expectedDate`]) {
              avail[field] = 'no';
              const saved = res.data.documents[`${field}_expectedDate`];
              const parts = saved.split('-');
              years[field]  = parts[0] || '';
              months[field] = parts[1] || '';
            } else {
              avail[field] = null;
            }
            months[field] = months[field] || '';
            years[field]  = years[field]  || '';
          });
          setCertAvailability(prev => ({ ...prev, ...avail }));
          setCertExpectedMonth(prev => ({ ...prev, ...months }));
          setCertExpectedYear(prev  => ({ ...prev, ...years }));
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

  // ── Cert availability handlers ───────────────────────────────
  const handleCertAvailability = (field, answer) => {
    setCertAvailability(prev => ({ ...prev, [field]: answer }));
    if (answer === 'yes') {
      setCertExpectedMonth(prev => ({ ...prev, [field]: '' }));
      setCertExpectedYear(prev  => ({ ...prev, [field]: '' }));
      setLocalFormData(prev => ({ ...prev, [`${field}_expectedDate`]: '' }));
    }
    if (answer === 'no' && localFormData[field]?.fileName) {
      handleRemoveFile(field);
    }
  };

  const handleExpectedMonthChange = async (field, month) => {
    setCertExpectedMonth(prev => ({ ...prev, [field]: month }));
    const year = certExpectedYear[field];
    const combined = year && month ? `${year}-${month}` : '';
    setLocalFormData(prev => ({ ...prev, [`${field}_expectedDate`]: combined }));
    if (year && month) {
      try {
        await axios.post(
          `${API_URL}/cert-expected-date`,
          { field, expectedDate: combined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Failed to save cert expected date:', err.response?.data || err.message);
      }
    }
  };

  const handleExpectedYearChange = async (field, year) => {
    setCertExpectedYear(prev => ({ ...prev, [field]: year }));
    const month = certExpectedMonth[field];
    const combined = year && month ? `${year}-${month}` : '';
    setLocalFormData(prev => ({ ...prev, [`${field}_expectedDate`]: combined }));
    if (year && month) {
      try {
        await axios.post(
          `${API_URL}/cert-expected-date`,
          { field, expectedDate: combined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Failed to save cert expected date:', err.response?.data || err.message);
      }
    }
  };

  const handleCertAvailReset = async (field) => {
    setCertAvailability(prev  => ({ ...prev, [field]: null }));
    setCertExpectedMonth(prev => ({ ...prev, [field]: '' }));
    setCertExpectedYear(prev  => ({ ...prev, [field]: '' }));
    setLocalFormData(prev => ({ ...prev, [`${field}_expectedDate`]: '' }));
    try {
      await axios.delete(
        `${API_URL}/cert-expected-date/${field}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Failed to clear cert expected date:', err.response?.data || err.message);
    }
  };

  const getCertExpectedDate = (field) => {
    const m = certExpectedMonth[field];
    const y = certExpectedYear[field];
    return m && y ? `${y}-${m}` : '';
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
        // ✅ Resolve S3 URL properly
        const rawUrl = res.data.fileData?.fileUrl || res.data.fileUrl || null;
        const updatedFile = {
          name:         file.name,
          size:         file.size,
          type:         file.type,
          fileName:     res.data.fileData?.fileName   || res.data.fileName,
          fileKey:      res.data.fileData?.fileKey    || null,
          fileUrl:      resolveFileUrl(rawUrl),         // ✅ always a valid URL
          originalName: res.data.fileData?.originalName || file.name,
          uploadedAt:   new Date().toISOString()
        };
        setLocalFormData(prev => ({
          ...prev,
          [field]: updatedFile,
          [`${field}Preview`]: prev[`${field}Preview`]
        }));
        if (res.data.completionPercentage !== undefined) {
          setCompletionPercentage(res.data.completionPercentage);
        }
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
    setShowCVModal(false);
    setCvMode('generate');
  };

  // ── Completion ───────────────────────────────────────────────
  const calculateCompletion = useCallback(() => {
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const uploadedOrDeclared = requiredDocs.filter(doc => {
      if (localFormData[doc.field]) return true;
      if (CERT_FIELDS.includes(doc.field)) {
        return getCertExpectedDate(doc.field) !== '';
      }
      return false;
    }).length;
    return Math.round((uploadedOrDeclared / requiredDocs.length) * 100);
  }, [localFormData, certExpectedMonth, certExpectedYear]);

  useEffect(() => {
    setCompletionPercentage(calculateCompletion());
  }, [localFormData, calculateCompletion]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // ── Navigation ───────────────────────────────────────────────
  const handleNext = async () => {
    const missingRequired = documentTypes.filter(doc => {
      if (!doc.required) return false;
      if (localFormData[doc.field]) return false;
      if (CERT_FIELDS.includes(doc.field)) {
        if (getCertExpectedDate(doc.field) !== '') return false;
      }
      return true;
    }).map(doc => doc.label);

    if (missingRequired.length > 0) {
      setError(`Please upload all required documents or provide an expected month & year:\n\n• ${missingRequired.join('\n• ')}`);
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
        ? location.pathname.replace('/documents', '/preview')
        : '/firstyear/dashboard/application/preview';
      navigate(targetPath);
    } catch (error) {
      console.error("Error in handleNext:", error);
      let targetPath = location.pathname.includes('/documents')
        ? location.pathname.replace('/documents', '/preview')
        : '/firstyear/dashboard/application/preview';
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

  const handleCloseCV = () => {
    setShowCVModal(false);
    if (!localFormData.cv?.fileName) setCvMode('choose');
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

  // ✅ Helper to get viewable URL for any file field
  const getViewUrl = (fileData) => {
    if (!fileData) return null;
    return resolveFileUrl(fileData.fileUrl) || null;
  };

  // ── Certificate Upload Area ──────────────────────────────────
  const CertUploadArea = ({ doc }) => {
    const field        = doc.field;
    const availability = certAvailability[field];
    const month        = certExpectedMonth[field];
    const year         = certExpectedYear[field];
    const fileData     = localFormData[field];
    const expectedDate = getCertExpectedDate(field);
    const viewUrl      = getViewUrl(fileData); // ✅ resolved S3 URL

    if (fileData?.fileName) {
      return (
        <div className="file-preview">
          {localFormData[`${field}Preview`] ? (
            <div className="image-preview-container">
              <img src={localFormData[`${field}Preview`]} alt={doc.label} className="image-preview" />
              <div className="image-preview-overlay">
                <button type="button" className="view-image-btn"
                  onClick={() => window.open(localFormData[`${field}Preview`], '_blank')}>
                  <i className="fas fa-eye"></i>
                </button>
                <button type="button" className="remove-image-btn"
                  onClick={() => { handleRemoveFile(field); handleCertAvailReset(field); }}
                  disabled={isSubmitting}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ) : (
            <div className="file-info">
              <span className="file-icon-large">{getFileIcon(fileData.name || fileData.fileName)}</span>
              <div className="file-details">
                <span className="file-name" title={fileData.originalName || fileData.name || fileData.fileName}>
                  {fileData.originalName || fileData.name || fileData.fileName || 'Uploaded file'}
                </span>
                {fileData.size > 0 && <span className="file-size">{formatFileSize(fileData.size)}</span>}
              </div>
              <div className="file-actions">
                {/* ✅ Use resolved S3 URL */}
                {viewUrl && (
                  <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="view-link">
                    <i className="fas fa-eye"></i> View
                  </a>
                )}
                <button type="button" className="remove-btn"
                  onClick={() => { handleRemoveFile(field); handleCertAvailReset(field); }}
                  disabled={isSubmitting}>
                  <i className="fas fa-times"></i> Remove
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (availability === null) {
      return (
        <div className="cert-availability-question">
          <div className="cert-question-icon">🎓</div>
          <p className="cert-question-text">
            Do you currently have your <strong>{doc.label}</strong>?
          </p>
          <div className="cert-yn-buttons">
            <button type="button" className="cert-yn-btn cert-yn-yes"
              onClick={() => handleCertAvailability(field, 'yes')}>
              ✅ Yes, I have it
            </button>
            <button type="button" className="cert-yn-btn cert-yn-no"
              onClick={() => handleCertAvailability(field, 'no')}>
              ❌ No, not yet
            </button>
          </div>
        </div>
      );
    }

    if (availability === 'yes') {
      return (
        <div className="upload-placeholder">
          <button type="button" className="cert-change-answer"
            onClick={() => handleCertAvailReset(field)}>
            ← Change answer
          </button>
          <div
            className={`upload-prompt ${dragActive === field ? 'drag-active' : ''}`}
            onDragEnter={(e) => handleDrag(e, field)}
            onDragLeave={(e) => handleDrag(e, field)}
            onDragOver={(e) => handleDrag(e, field)}
            onDrop={(e) => handleDrop(e, field, doc)}
          >
            <i className="fas fa-cloud-upload-alt upload-icon"></i>
            <p>Drag &amp; drop or click to upload</p>
            <p className="upload-hint">
              {doc.accept.replace(/\./g, '').toUpperCase()} • Max {doc.maxSize}MB
            </p>
          </div>
          <input
            type="file"
            id={`${field}Upload`}
            accept={doc.accept}
            className="file-input-hidden"
            onChange={(e) => handleFileChange(e, field, doc)}
            disabled={uploading[field] || isSubmitting}
          />
          <button type="button" className="upload-button"
            onClick={() => document.getElementById(`${field}Upload`).click()}
            disabled={uploading[field] || isSubmitting}>
            {uploading[field]
              ? <><span className="spinner-small"></span> Uploading...</>
              : <><i className="fas fa-upload"></i> Browse Files</>
            }
          </button>
        </div>
      );
    }

    if (availability === 'no') {
      return (
        <div className="cert-expected-date-wrapper">
          <button type="button" className="cert-change-answer"
            onClick={() => handleCertAvailReset(field)}>
            ← Change answer
          </button>
          <div className="cert-no-icon">📅</div>
          <p className="cert-no-title">No problem! When do you expect to receive it?</p>
          <p className="cert-no-subtitle">
            Please provide the expected month and year you will receive your{' '}
            <strong>{doc.label}</strong>. You can upload the document later once you have it.
          </p>
          <div className="cert-date-input-group cert-monthyear-row">
            <div className="cert-select-wrap">
              <label className="cert-date-label" htmlFor={`${field}_month`}>Month</label>
              <select
                id={`${field}_month`}
                className="cert-date-select"
                value={month}
                onChange={(e) => handleExpectedMonthChange(field, e.target.value)}
              >
                <option value="">-- Month --</option>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="cert-select-wrap">
              <label className="cert-date-label" htmlFor={`${field}_year`}>Year</label>
              <select
                id={`${field}_year`}
                className="cert-date-select"
                value={year}
                onChange={(e) => handleExpectedYearChange(field, e.target.value)}
              >
                <option value="">-- Year --</option>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          {expectedDate ? (
            <div className="cert-date-confirmed">
              <span className="cert-date-confirmed-icon">✅</span>
              <span>
                Expected by:{' '}
                <strong>
                  {MONTHS.find(m => m.value === month)?.label} {year}
                </strong>
              </span>
            </div>
          ) : (
            <p className="cert-date-hint">
              ⚠️ Please select both a month and a year to continue
            </p>
          )}
        </div>
      );
    }

    return null;
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
          "Study programme","Applicant Details","Address",
          "Entrance qualification","Higher Education",
          "Application Documents","Special Needs","Declaration","Review"
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
                      {category.documents.filter(doc => {
                        if (localFormData[doc.field]) return true;
                        if (CERT_FIELDS.includes(doc.field) && getCertExpectedDate(doc.field)) return true;
                        return false;
                      }).length}/{category.documents.length}
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
                        const cvViewUrl = getViewUrl(localFormData.cv); // ✅ resolved S3 URL
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
                                      {/* ✅ Use resolved S3 URL */}
                                      {cvViewUrl && (
                                        <a href={cvViewUrl} target="_blank" rel="noopener noreferrer" className="view-link">
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

                      /* ── CERTIFICATE CARDS (9th–12th) ── */
                      if (CERT_FIELDS.includes(doc.field)) {
                        const hasFile = localFormData[doc.field]?.fileName;
                        const hasDate = certAvailability[doc.field] === 'no' && getCertExpectedDate(doc.field);
                        return (
                          <div
                            key={doc.id}
                            className={`document-card cert-card
                              ${hasFile ? 'uploaded' : ''}
                              ${hasDate ? 'cert-card--pending' : ''}
                              ${dragActive === doc.field ? 'drag-active' : ''}
                            `}
                          >
                            <div className="document-header">
                              <div className="document-icon">{doc.icon}</div>
                              <div className="document-title-wrapper">
                                <h4 className="document-title">
                                  {doc.label}
                                  {doc.required && <span className="required-badge">*</span>}
                                  {hasFile && <span className="cert-status-pill cert-status-pill--done">✅ Uploaded</span>}
                                  {hasDate && <span className="cert-status-pill cert-status-pill--pending">🕐 Pending</span>}
                                </h4>
                                <p className="document-description">{doc.description}</p>
                              </div>
                            </div>
                            <div className="document-upload-area">
                              <CertUploadArea doc={doc} />
                            </div>
                          </div>
                        );
                      }

                      /* ── ALL OTHER DOCUMENT CARDS ── */
                      const docViewUrl = getViewUrl(localFormData[doc.field]); // ✅ resolved S3 URL
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
                                {!doc.required && <span className="optional-badge">Optional</span>}
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
                                      {/* ✅ Use resolved S3 URL */}
                                      {docViewUrl && (
                                        <a href={docViewUrl} target="_blank" rel="noopener noreferrer" className="view-link">
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
                <span className="stat-value">
                  {documentTypes.filter(doc =>
                    localFormData[doc.field] ||
                    (CERT_FIELDS.includes(doc.field) && getCertExpectedDate(doc.field))
                  ).length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Remaining:</span>
                <span className="stat-value">
                  {documentTypes.filter(doc => {
                    if (localFormData[doc.field]) return false;
                    if (CERT_FIELDS.includes(doc.field) && getCertExpectedDate(doc.field)) return false;
                    return doc.required;
                  }).length}
                </span>
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

      {/* Upload Modal */}
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

      {/* CV Generator Modal */}
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