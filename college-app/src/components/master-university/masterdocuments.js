import React, { useState, useEffect, useRef, useCallback } from 'react';
import './masterdocuments.css';

const API_URL = process.env.REACT_APP_API_BASE_URL
  ? `${process.env.REACT_APP_API_BASE_URL}/api/master-documents`
  : 'http://localhost:5000/api/master-documents';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const resolveFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('https://') || fileUrl.startsWith('http://')) return fileUrl;
  if (fileUrl.startsWith('/uploads/')) return `${BASE_URL}${fileUrl}`;
  return fileUrl;
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ─── Document definitions ──────────────────────────────────────────────────────
const DOCUMENT_TYPES = [
  // Personal
  {
    id: 'passport', field: 'passport', label: 'Passport / ID Proof',
    description: 'Upload your valid passport or government-issued photo ID.',
    required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 10, category: 'personal',
  },
  {
    id: 'photo', field: 'photo', label: 'Passport-Size Photo',
    description: 'Recent passport-size photograph with white background.',
    required: true, accept: '.jpg,.jpeg,.png', maxSize: 5, category: 'personal',
  },
  // School Certificates
  {
    id: 'cert10th', field: 'cert10th', label: '10th Grade Certificate',
    description: 'Official marksheet / certificate from your 10th grade (Secondary School).',
    required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'school',
  },
  {
    id: 'cert12th', field: 'cert12th', label: '12th Grade Certificate / Higher Secondary',
    description: 'Official marksheet / certificate from your 12th grade (A-Level / Higher Secondary).',
    required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'school',
  },
  // Bachelor / Degree Documents
  {
    id: 'bachelorTranscript', field: 'bachelorTranscript', label: "Bachelor's Degree Transcript",
    description: "Official semester-wise transcript from your bachelor's program.",
    required: true, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'bachelor',
  },
  {
    id: 'bachelorDegree', field: 'bachelorDegree', label: "Bachelor's Degree Certificate",
    description: "Your bachelor's degree completion certificate / provisional certificate.",
    required: true, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'bachelor',
  },
  {
    id: 'provisionalCertificate', field: 'provisionalCertificate', label: 'Provisional Certificate',
    description: 'Provisional certificate issued by your university while awaiting the original degree.',
    required: false, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'bachelor',
  },
  {
    id: 'consolidatedMarksheet', field: 'consolidatedMarksheet', label: 'Consolidated Marksheet',
    description: 'Consolidated / cumulative marksheet covering all semesters of your degree.',
    required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 10, category: 'bachelor',
  },
  // Professional Documents
  {
    id: 'resumeCv', field: 'resumeCv', label: 'Resume / CV',
    description: 'Updated CV covering your academic history, projects, and professional experience.',
    required: true, accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png', maxSize: 5, category: 'professional',
  },
  {
    id: 'statementOfPurpose', field: 'statementOfPurpose', label: 'Statement of Purpose (SOP)',
    description: 'A personal essay explaining your academic goals, motivation, and fit for the program.',
    required: true, accept: '.pdf,.doc,.docx', maxSize: 5, category: 'professional',
  },
  {
    id: 'lettersOfRecommendation', field: 'lettersOfRecommendation', label: 'Letters of Recommendation',
    description: 'Upload one or more recommendation letters from professors or employers (2-3 required).',
    required: true, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'professional',
  },
  // Test Scores
  {
    id: 'englishCertificate', field: 'englishCertificate', label: 'English Language Proficiency',
    description: 'Upload TOEFL, IELTS, PTE, or Duolingo score report.',
    required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'optional',
  },
  {
    id: 'testScores', field: 'testScores', label: 'Standardized Test Scores (GRE / GMAT)',
    description: 'Upload GRE or GMAT score report if required by your program.',
    required: false, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'optional',
  },
  {
    id: 'workExperience', field: 'workExperience', label: 'Work Experience / Experience Letter',
    description: 'Experience letter or employment certificate if you have relevant work experience.',
    required: false, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'optional',
  },
];

const DOCUMENT_CATEGORIES = {
  personal: {
    title: 'Personal Documents', color: '#0891b2',
    docs: DOCUMENT_TYPES.filter(d => d.category === 'personal'),
  },
  school: {
    title: 'School / Academic Documents', color: '#f59e0b',
    docs: DOCUMENT_TYPES.filter(d => d.category === 'school'),
  },
  bachelor: {
    title: "Bachelor's / Degree Documents", color: '#10b981',
    docs: DOCUMENT_TYPES.filter(d => d.category === 'bachelor'),
  },
  professional: {
    title: 'Professional Documents', color: '#6366f1',
    docs: DOCUMENT_TYPES.filter(d => d.category === 'professional'),
  },
  optional: {
    title: 'Optional Documents', color: '#8b5cf6',
    docs: DOCUMENT_TYPES.filter(d => d.category === 'optional'),
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────
const MasterDocuments = ({ data, updateData }) => {
  const token = localStorage.getItem('token');

  const [localDocs, setLocalDocs]         = useState({});
  const [uploading, setUploading]         = useState({});
  const [dragActive, setDragActive]       = useState(null);
  const [error, setError]                 = useState('');
  const [searchTerm, setSearchTerm]       = useState('');
  const [completionPct, setCompletionPct] = useState(0);
  const [expandedCats, setExpandedCats]   = useState({
    personal: true, school: true, bachelor: true, professional: true, optional: false,
  });

  const isInitialMount = useRef(true);
  const hasFetched     = useRef(false);

  // ─── Fetch on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current || !token) return;
    hasFetched.current = true;

    const fetchDocs = async () => {
      try {
        const res = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const result = await res.json();
        // Controller returns: { success: true, documents: <MasterDocument mongoose doc> }
        // Each field is a FileSchema: { fileName, fileUrl, fileKey, originalName, uploadedAt }
        if (result?.success && result?.documents) {
          const doc = result.documents;
          const mapped = {};
          DOCUMENT_TYPES.forEach(({ field }) => {
            if (doc[field]?.fileName) {
              mapped[field] = {
                fileName:     doc[field].fileName,
                fileKey:      doc[field].fileKey,
                fileUrl:      resolveFileUrl(doc[field].fileUrl),
                originalName: doc[field].originalName,
                size:         0,
                uploadedAt:   doc[field].uploadedAt,
              };
            }
          });
          setLocalDocs(mapped);
        }
      } catch (err) {
        console.error('MasterDocuments fetch error:', err);
      }
    };

    fetchDocs();
  }, [token]);

  // ─── Sync to parent ────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    updateData({ ...localDocs, _isValid: true });
  }, [localDocs, updateData]);

  // ─── Completion ────────────────────────────────────────────────────
  const calcCompletion = useCallback(() => {
    const required = DOCUMENT_TYPES.filter(d => d.required);
    const done = required.filter(d => localDocs[d.field]?.fileName).length;
    return Math.round((done / required.length) * 100);
  }, [localDocs]);

  useEffect(() => {
    setCompletionPct(calcCompletion());
  }, [calcCompletion]);

  // ─── Drag & Drop ───────────────────────────────────────────────────
  const handleDrag = (e, field) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(field);
    else if (e.type === 'dragleave') setDragActive(null);
  };

  const handleDrop = async (e, field, doc) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(null);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file, field, doc);
  };

  // ─── Upload ────────────────────────────────────────────────────────
  const uploadFile = async (file, field, doc) => {
    if (!file) return;

    if (file.size > doc.maxSize * 1024 * 1024) {
      setError(`File too large. Max ${doc.maxSize}MB allowed.`);
      setTimeout(() => setError(''), 4000);
      return;
    }

    const allowed = doc.accept.split(',').map(s => s.trim());
    const ext     = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Invalid file type. Allowed: ${doc.accept}`);
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setLocalDocs(prev => ({ ...prev, [`${field}Preview`]: reader.result }));
      reader.readAsDataURL(file);
    }

    setUploading(prev => ({ ...prev, [field]: true }));

    try {
      const form = new FormData();
      form.append('file', file);

      // Route: POST /api/master-documents/upload/:field
      const res = await fetch(`${API_URL}/upload/${field}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      });
      const result = await res.json();

      // Controller returns: { success: true, fileData: { fileName, fileKey, fileUrl, originalName } }
      if (result.success && result.fileData) {
        const uploaded = {
          fileName:     result.fileData.fileName,
          fileKey:      result.fileData.fileKey,
          fileUrl:      resolveFileUrl(result.fileData.fileUrl),
          originalName: result.fileData.originalName,
          name:         file.name,
          size:         file.size,
          type:         file.type,
          uploadedAt:   new Date().toISOString(),
        };
        setLocalDocs(prev => ({ ...prev, [field]: uploaded }));
        setError('');
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback: store file info locally so UI reflects the attempt
      setLocalDocs(prev => ({
        ...prev,
        [field]: {
          name: file.name, size: file.size, type: file.type,
          fileName: file.name, fileUrl: null, fileKey: null,
          originalName: file.name, uploadedAt: new Date().toISOString(),
        },
      }));
      setError('Server unavailable. File stored locally for now.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleFileChange = async (e, field, doc) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file, field, doc);
    e.target.value = '';
  };

  // ─── Remove file ───────────────────────────────────────────────────
  const handleRemoveFile = async (field) => {
    if (!window.confirm('Remove this file?')) return;
    try {
      // Route: DELETE /api/master-documents/files/:field
      // Controller: deletes from S3 via fileKey, sets doc[field] = null, saves
      if (localDocs[field]?.fileName) {
        await fetch(`${API_URL}/files/${field}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.warn('Server delete failed, removing locally:', err);
    }
    setLocalDocs(prev => ({ ...prev, [field]: null, [`${field}Preview`]: null }));
  };

  // ─── Search filter ─────────────────────────────────────────────────
  const filteredCategories = searchTerm
    ? Object.entries(DOCUMENT_CATEGORIES).reduce((acc, [key, cat]) => {
        const docs = cat.docs.filter(d =>
          d.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (docs.length) acc[key] = { ...cat, docs };
        return acc;
      }, {})
    : DOCUMENT_CATEGORIES;

  // ─── Sub-components ────────────────────────────────────────────────
  const UploadArea = ({ doc }) => {
    const { field } = doc;
    const fileData  = localDocs[field];
    const viewUrl   = resolveFileUrl(fileData?.fileUrl);

    if (fileData?.fileName) {
      return (
        <div className="masterdocs-file-preview">
          {localDocs[`${field}Preview`] ? (
            <div className="masterdocs-image-preview-wrap">
              <img src={localDocs[`${field}Preview`]} alt={doc.label} className="masterdocs-image-preview" />
              <div className="masterdocs-image-overlay">
                <button type="button" onClick={() => window.open(localDocs[`${field}Preview`], '_blank')} className="masterdocs-overlay-btn">View</button>
                <button type="button" onClick={() => handleRemoveFile(field)} className="masterdocs-overlay-btn masterdocs-overlay-remove">Remove</button>
              </div>
            </div>
          ) : (
            <div className="masterdocs-file-info">
              <div className="masterdocs-file-details">
                <span className="masterdocs-file-name" title={fileData.originalName || fileData.name || fileData.fileName}>
                  {fileData.originalName || fileData.name || fileData.fileName}
                </span>
                {fileData.size > 0 && <span className="masterdocs-file-size">{formatFileSize(fileData.size)}</span>}
              </div>
              <div className="masterdocs-file-actions">
                {viewUrl && <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="masterdocs-action-link">View</a>}
                <button type="button" onClick={() => handleRemoveFile(field)} className="masterdocs-action-remove">Remove</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="masterdocs-upload-placeholder">
        <div
          className={`masterdocs-drop-zone ${dragActive === field ? 'masterdocs-drop-zone--active' : ''}`}
          onDragEnter={e => handleDrag(e, field)}
          onDragLeave={e => handleDrag(e, field)}
          onDragOver={e => handleDrag(e, field)}
          onDrop={e => handleDrop(e, field, doc)}
        >
          <p className="masterdocs-drop-text">Drag and drop or click to browse</p>
          <p className="masterdocs-drop-hint">{doc.accept.replace(/\./g, '').toUpperCase()} &bull; Max {doc.maxSize}MB</p>
        </div>
        <input
          type="file"
          id={`${field}Input`}
          accept={doc.accept}
          className="masterdocs-file-input-hidden"
          onChange={e => handleFileChange(e, field, doc)}
          disabled={uploading[field]}
        />
        <button
          type="button"
          className="masterdocs-browse-btn"
          onClick={() => document.getElementById(`${field}Input`).click()}
          disabled={uploading[field]}
        >
          {uploading[field] ? 'Uploading...' : 'Browse Files'}
        </button>
      </div>
    );
  };

  // ─── Stats ─────────────────────────────────────────────────────────
  const requiredDocs   = DOCUMENT_TYPES.filter(d => d.required);
  const uploadedCount  = DOCUMENT_TYPES.filter(d => localDocs[d.field]?.fileName).length;
  const remainingCount = requiredDocs.filter(d => !localDocs[d.field]?.fileName).length;

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="masterdocs-form">

      {/* Header */}
      <div className="masterdocs-header">
        <div className="masterdocs-header-top">
          <div>
            <h2 className="masterdocs-title">Application Documents</h2>
            <p className="masterdocs-subtitle">
              Upload all required documents <span className="masterdocs-required-star">*</span>. Accepted formats: PDF, JPG, PNG, DOC, DOCX. Max size per file: 10MB.
            </p>
          </div>
          {/* Progress Ring */}
          <div className="masterdocs-progress-ring-wrap">
            <svg viewBox="0 0 36 36" className="masterdocs-ring-svg">
              <path className="masterdocs-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="masterdocs-ring-fill" strokeDasharray={`${completionPct}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="20.35" className="masterdocs-ring-text">{completionPct}%</text>
            </svg>
            <span className="masterdocs-ring-label">Done</span>
          </div>
        </div>

        {/* Search */}
        <div className="masterdocs-search-wrap">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="masterdocs-search-input"
          />
          {searchTerm && (
            <button type="button" className="masterdocs-search-clear" onClick={() => setSearchTerm('')}>x</button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="masterdocs-error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="masterdocs-error-close">x</button>
        </div>
      )}

      {/* Categories */}
      {Object.entries(filteredCategories).map(([catKey, cat]) => {
        const catUploaded = cat.docs.filter(d => localDocs[d.field]?.fileName).length;

        return (
          <div key={catKey} className="masterdocs-category">
            <div
              className="masterdocs-category-header"
              style={{ borderLeftColor: cat.color }}
              onClick={() => setExpandedCats(prev => ({ ...prev, [catKey]: !prev[catKey] }))}
            >
              <div className="masterdocs-category-title-wrap">
                <h3 className="masterdocs-category-title">{cat.title}</h3>
                <span className="masterdocs-category-count">{catUploaded}/{cat.docs.length}</span>
              </div>
              <span className="masterdocs-category-chevron">{expandedCats[catKey] ? '▲' : '▼'}</span>
            </div>

            {expandedCats[catKey] && (
              <div className="masterdocs-docs-grid">
                {cat.docs.map(doc => {
                  const hasFile = localDocs[doc.field]?.fileName;

                  return (
                    <div
                      key={doc.id}
                      className={[
                        'masterdocs-doc-card',
                        hasFile ? 'masterdocs-doc-card--uploaded' : '',
                        dragActive === doc.field ? 'masterdocs-doc-card--drag' : '',
                      ].join(' ')}
                    >
                      <div className="masterdocs-doc-card-header">
                        <div className="masterdocs-doc-title-row">
                          <h4 className="masterdocs-doc-title">
                            {doc.label}
                            {doc.required  && <span className="masterdocs-badge masterdocs-badge--required">Required</span>}
                            {!doc.required && <span className="masterdocs-badge masterdocs-badge--optional">Optional</span>}
                            {hasFile       && <span className="masterdocs-badge masterdocs-badge--done">Uploaded</span>}
                          </h4>
                          <p className="masterdocs-doc-description">{doc.description}</p>
                        </div>
                      </div>

                      <div className="masterdocs-doc-upload-area">
                        <UploadArea doc={doc} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="masterdocs-summary">
        <h3 className="masterdocs-summary-title">Upload Summary</h3>
        <div className="masterdocs-summary-stats">
          <div className="masterdocs-stat">
            <span className="masterdocs-stat-label">Required</span>
            <span className="masterdocs-stat-value">{requiredDocs.length}</span>
          </div>
          <div className="masterdocs-stat">
            <span className="masterdocs-stat-label">Uploaded / Declared</span>
            <span className="masterdocs-stat-value masterdocs-stat-value--done">{uploadedCount}</span>
          </div>
          <div className="masterdocs-stat">
            <span className="masterdocs-stat-label">Remaining</span>
            <span className="masterdocs-stat-value masterdocs-stat-value--warn">{remainingCount}</span>
          </div>
        </div>
        <div className="masterdocs-summary-bar-wrap">
          <div className="masterdocs-summary-bar" style={{ width: `${completionPct}%` }} />
        </div>
        <p className="masterdocs-summary-pct">{completionPct}% complete</p>
      </div>

      {/* Info note */}
      <div className="masterdocs-note">
        <span>All uploaded documents are encrypted and securely stored. Maximum file size: 10MB per document.</span>
      </div>
    </div>
  );
};

export default MasterDocuments;