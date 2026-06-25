import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { normalizeFileKey, resolveFileUrl } from '../../../../utils/fileUrl';
import Resume from './Resume';
import './ApplicationDocuments.css';



// Helper component for document type icons - removed
const DocIcon = ({ type, className = "" }) => {
  return <span className={className}></span>;
};

// Helper for category icons - removed


const PERSONAL_DOCUMENT_FIELD_MAP = {
  passport: 'passport',
  photo: 'photograph',
};

const hasUploadedDocument = (fileData) =>
  Boolean(fileData?.fileName || fileData?.originalName || fileData?.fileKey || fileData?.fileUrl);

const buildDocumentFromPersonalInfo = (personalInfo, documentField) => {
  const personalPrefix = PERSONAL_DOCUMENT_FIELD_MAP[documentField];
  if (!personalInfo || !personalPrefix) return null;

  const fileName = personalInfo[`${personalPrefix}FileName`] || '';
  const originalName = personalInfo[`${personalPrefix}OriginalName`] || '';
  const storedFileUrl = personalInfo[`${personalPrefix}FileUrl`] || '';
  const fileKey = normalizeFileKey(
    personalInfo[`${personalPrefix}FileKey`] || storedFileUrl
  );
  const fileUrl = resolveFileUrl(fileKey);

  if (!fileName && !originalName && !fileKey) return null;

  return {
    fileName,
    fileKey,
    fileUrl,
    originalName: originalName || fileName || 'Uploaded file',
    fileType: personalInfo[`${personalPrefix}FileType`] || '',
    fileSize: personalInfo[`${personalPrefix}FileSize`] || 0,
    size: personalInfo[`${personalPrefix}FileSize`] || 0,
    uploadedAt: personalInfo[`${personalPrefix}UploadedAt`] || null,
    documentStatus:
      personalInfo[`${personalPrefix}ValidationStatus`] === 'approved'
        ? 'approved'
        : 'pending',
    source: 'personal',
  };
};

const mergePersonalDocuments = (documents = {}, personalInfo = {}) => {
  const merged = { ...documents };

  const gradeToCertField = {
    grade9: 'cert9th',
    grade10: 'cert10th',
    grade11: 'cert11th',
    grade12: 'cert12th',
  };

  (documents.documents || [])
    .filter((doc) => doc.documentType === 'marksheet' && gradeToCertField[doc.grade])
    .forEach((doc) => {
      const certField = gradeToCertField[doc.grade];
      if (hasUploadedDocument(merged[certField])) return;
      merged[certField] = {
        ...doc,
        documentStatus: doc.status === 'uploaded' ? 'pending' : doc.status,
        fileSize: doc.fileSize || doc.size || 0,
        source: 'scores',
      };
    });

  Object.keys(PERSONAL_DOCUMENT_FIELD_MAP).forEach((documentField) => {
    if (hasUploadedDocument(merged[documentField])) return;

    const personalDocument = buildDocumentFromPersonalInfo(personalInfo, documentField);
    if (personalDocument) merged[documentField] = personalDocument;
  });

  return merged;
};

const ApplicationDocuments = ({ formData, onFileUpload }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
 

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
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'personal', iconType: 'cv'
    },
    {
      id: 'photo', field: 'photo',
      label: 'Photo',
      description: 'Recent passport-size photograph',
      required: true, accept: '.jpg,.jpeg,.png', maxSize: 5, category: 'personal', iconType: 'photo'
    },
    {
      id: 'passport', field: 'passport',
      label: 'Passport / ID Proof',
      description: 'Upload your passport or government-issued ID.',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 10, category: 'personal', iconType: 'passport'
    },
    {
      id: 'transcript', field: 'transcript',
      label: 'High School Transcript',
      description: 'Upload your official high school transcript. Must be translated if not in English.',
      required: true, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'academic', iconType: 'transcript'
    },
    {
      id: 'diploma', field: 'diploma',
      label: 'High School Diploma / Graduation Certificate',
      description: 'Upload your Diploma/Graduation Certificate.',
      required: true, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'academic', iconType: 'diploma'
    },
    {
      id: 'cert9th', field: 'cert9th',
      label: '9th Grade Certificate',
      description: 'Official certificate / marksheet from your 9th grade',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'certificates', iconType: 'cert9th'
    },
    {
      id: 'cert10th', field: 'cert10th',
      label: '10th Grade Certificate',
      description: 'Official certificate / marksheet from your 10th grade (Secondary School)',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'certificates', iconType: 'cert10th'
    },
    {
      id: 'cert11th', field: 'cert11th',
      label: '11th Grade Certificate',
      description: 'Official certificate / marksheet from your 11th grade',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'certificates', iconType: 'cert11th'
    },
    {
      id: 'cert12th', field: 'cert12th',
      label: '12th Grade Certificate',
      description: 'Official certificate / marksheet from your 12th grade (Higher Secondary / A-Level)',
      required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, category: 'certificates', iconType: 'cert12th'
    },
    {
      id: 'testScores', field: 'testScores',
      label: 'Standardized Test Scores (Optional)',
      description: 'Upload SAT or ACT score report if required.',
      required: false, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'optional', iconType: 'testScores'
    },
    {
      id: 'languageProficiency', field: 'languageProficiency',
      label: 'English Language Proficiency (International Students)',
      description: 'Upload TOEFL, IELTS, or Duolingo scores.',
      required: false, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'optional', iconType: 'languageProficiency'
    },
    {
      id: 'recommendationLetter', field: 'recommendationLetter',
      label: 'Letters of Recommendation (Optional)',
      description: 'Upload your letters of recommendation & personal statement about academic goals and motivations.',
      required: false, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSize: 10, category: 'optional', iconType: 'recommendationLetter'
    },
  ];

  const documentCategories = {
    personal: {
      title: 'Personal Documents', icon: 'personal', color: '#0891b2',
      documents: documentTypes.filter(doc => doc.category === 'personal')
    },
    academic: {
      title: 'Academic Documents', icon: 'academic', color: '#f59e0b',
      documents: documentTypes.filter(doc => doc.category === 'academic')
    },
    certificates: {
      title: 'School Certificates', icon: 'certificate', color: '#10b981',
      documents: documentTypes.filter(doc => doc.category === 'certificates')
    },
    optional: {
      title: 'Optional Documents', icon: 'optional', color: '#8b5cf6',
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

  // Fetch documents
useEffect(() => {
  const token = localStorage.getItem("token");
  let isMounted = true;
  if (token) fetchDocuments(isMounted);
  else { setError("No authentication token found"); setIsLoading(false); }
  return () => { isMounted = false; };
}, []);

  const fetchDocuments = async (isMounted) => {
    try {
      setIsLoading(true);
     const [res, personalRes] = await Promise.all([
       axiosInstance.get('/api/application/documents'),
       axiosInstance.get('/api/application/personal').catch(() => null),
     ]);
      if (isMounted && res.data.success) {
        if (res.data.documents) {
          const mergedDocuments = mergePersonalDocuments(
            res.data.documents,
            personalRes?.data?.personalInfo
          );
          setLocalFormData(mergedDocuments);
          if (mergedDocuments.cv?.fileName) {
            setCvMode(mergedDocuments.cv.generated ? 'generate' : 'upload');
          }
          const avail  = {};
          const months = {};
          const years  = {};
          CERT_FIELDS.forEach(field => {
            if (mergedDocuments[field]?.fileName) {
              avail[field] = 'yes';
            } else if (mergedDocuments[`${field}_expectedDate`]) {
              avail[field] = 'no';
              const saved = mergedDocuments[`${field}_expectedDate`];
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
          const mergedDocuments = mergePersonalDocuments(
            res.data.documents || {},
            personalRes?.data?.personalInfo
          );
          const requiredDocs = documentTypes.filter(doc => doc.required);
          const uploadedRequired = requiredDocs.filter(doc => {
            if (hasUploadedDocument(mergedDocuments[doc.field])) return true;
            if (CERT_FIELDS.includes(doc.field)) return Boolean(mergedDocuments[`${doc.field}_expectedDate`]);
            return false;
          }).length;
          setCompletionPercentage(Math.round((uploadedRequired / requiredDocs.length) * 100));
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

  // Cert availability handlers
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
       await axiosInstance.post('/api/application/documents/cert-expected-date', { field, expectedDate: combined });
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
        await axiosInstance.post('/api/application/documents/cert-expected-date', { field, expectedDate: combined });
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
      await axiosInstance.delete(`/api/application/documents/cert-expected-date/${field}`);
    } catch (err) {
      console.error('Failed to clear cert expected date:', err.response?.data || err.message);
    }
  };

  const getCertExpectedDate = (field) => {
    const m = certExpectedMonth[field];
    const y = certExpectedYear[field];
    return m && y ? `${y}-${m}` : '';
  };

  // Drag and drop
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

  // File upload
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
     const res = await axiosInstance.post(`/api/application/documents/upload/${field}`, uploadData, {
  headers: { "Content-Type": "multipart/form-data" },
});
      if (res.data.success) {
        console.log('[ApplicationDocuments] Upload response', res.data);
        const responseFileData = res.data.fileData || {};
        const generatedFileKey = normalizeFileKey(responseFileData.fileKey || responseFileData.fileUrl || res.data.fileUrl || '');
        const rawUrl = responseFileData.fileKey || responseFileData.fileUrl || res.data.fileUrl || null;
        const generatedFileUrl = resolveFileUrl(rawUrl);
        console.log('[ApplicationDocuments] Generated document URLs', {
          documentType: field,
          fileName: responseFileData.fileName || res.data.fileName,
          fileKey: generatedFileKey,
          fileUrl: generatedFileUrl,
          originalName: responseFileData.originalName || file.name,
        });
        const updatedFile = {
          name:         file.name,
          size:         file.size,
          type:         file.type,
          ...responseFileData,
          fileName:     responseFileData.fileName || res.data.fileName || file.name,
          fileKey:      generatedFileKey || null,
          fileUrl:      generatedFileUrl,
          originalName: responseFileData.originalName || file.name,
          uploadedAt:   responseFileData.uploadedAt || new Date().toISOString(),
          documentStatus: responseFileData.documentStatus || 'pending',
          source:       responseFileData.source || 'documents',
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

  // Remove file
  const handleRemoveFile = async (field) => {
    if (!window.confirm('Are you sure you want to remove this file?')) return;
    try {
      if (!localFormData[field] || !localFormData[field].fileName) {
        setLocalFormData(prev => ({ ...prev, [field]: null, [`${field}Preview`]: null }));
        if (onFileUpload) onFileUpload(field, null);
        const requiredDocs     = documentTypes.filter(doc => doc.required);
        const uploadedRequired = requiredDocs.filter(doc => hasUploadedDocument(localFormData[doc.field])).length;
        setCompletionPercentage(Math.round((uploadedRequired / requiredDocs.length) * 100));
        if (field === 'cv') setCvMode('choose');
        alert("File removed from local storage");
        return;
      }
      try {
       const res = await axiosInstance.delete(`/api/application/documents/files/${field}`);
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
        const uploaded     = requiredDocs.filter(doc => hasUploadedDocument(updatedData[doc.field])).length;
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

  const handleCVGenerated = (cvData) => {
    if (cvData?._uploadedFile) {
      const f = cvData._uploadedFile;
      const uploadedCV = {
        name:         f.originalName || f.name || `CV_Generated.pdf`,
        size:         f.size         || 0,
        type:         'application/pdf',
        fileName:     f.fileName     || '',
        fileKey:      f.fileKey      || null,
        fileUrl:      f.fileUrl      || null,
        originalName: f.originalName || f.name || `CV_Generated.pdf`,
        generated:    true,
        uploadedAt:   f.uploadedAt   || new Date().toISOString(),
      };
      setLocalFormData(prev => ({ ...prev, cv: uploadedCV }));
      if (onFileUpload) onFileUpload('cv', uploadedCV);
      if (f.completionPercentage !== undefined) {
        setCompletionPercentage(f.completionPercentage);
      }
      setShowCVModal(false);
      setCvMode('generate');
      return;
    }
    const generatedCV = {
      name:       `CV_${cvData.firstName || 'Student'}_${cvData.lastName || ''}.pdf`,
      size:       0,
      type:       'application/pdf',
      fileName:   `generated_cv_${Date.now()}`,
      fileUrl:    null,
      generated:  true,
      uploadedAt: new Date().toISOString(),
    };
    setLocalFormData(prev => ({ ...prev, cv: generatedCV }));
    if (onFileUpload) onFileUpload('cv', generatedCV);
    setShowCVModal(false);
    setCvMode('generate');
  };

  // Completion calculation
  const calculateCompletion = useCallback(() => {
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const uploadedOrDeclared = requiredDocs.filter(doc => {
      if (hasUploadedDocument(localFormData[doc.field])) return true;
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

  // Navigation
  const handleNext = async () => {
    const missingRequired = documentTypes.filter(doc => {
      if (!doc.required) return false;
      if (hasUploadedDocument(localFormData[doc.field])) return false;
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
       await axiosInstance.post('/api/application/documents/status', { documents: localFormData, completed: true });
      } catch (statusError) {
        if (process.env.NODE_ENV === 'development') {
          console.log("Status endpoint not available, continuing anyway");
        }
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

  // Helpers
  const getFileIconName = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':  return 'file-pdf';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'file-image';
      case 'doc': case 'docx': return 'file';
      default: return 'file';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getViewUrl = (fileData) => {
    if (!fileData) return null;
    if (fileData.source === 'scores' && fileData._id) return null;
    const sourceValue = fileData.fileKey || fileData.fileUrl;
    const viewUrl = resolveFileUrl(sourceValue) || null;
    console.log('[Document Debug]', {
      fileName: fileData.fileName,
      fileKey: normalizeFileKey(sourceValue || ''),
      fileUrl: fileData.fileUrl,
      generatedUrl: viewUrl,
    });
    return viewUrl;
  };

  const handleViewDocument = async (fileData) => {
    try {
      if (fileData?.source === 'scores' && fileData?._id) {
        const res = await axiosInstance.get(`/api/students/documents/${fileData._id}/view-url`);
        if (res.data?.signedUrl) {
          window.open(res.data.signedUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      const viewUrl = getViewUrl(fileData);
      console.log('[ApplicationDocuments] View URL', {
        fileName: fileData?.fileName,
        fileKey: fileData?.fileKey,
        fileUrl: fileData?.fileUrl,
        viewUrl,
      });
      if (viewUrl) window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to open document');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Certificate Upload Area Component
  const CertUploadArea = ({ doc }) => {
    const field        = doc.field;
    const availability = certAvailability[field];
    const month        = certExpectedMonth[field];
    const year         = certExpectedYear[field];
    const fileData     = localFormData[field];
    const expectedDate = getCertExpectedDate(field);
    const viewUrl      = getViewUrl(fileData);

    if (fileData?.fileName) {
      return (
        <div className="applicationdocuments-file-preview">
          <input
            type="file"
            id={`${field}ChangeUpload`}
            accept={doc.accept}
            className="applicationdocuments-file-input-hidden"
            onChange={(e) => handleFileChange(e, field, doc)}
            disabled={uploading[field] || isSubmitting}
          />
          {localFormData[`${field}Preview`] ? (
            <div className="applicationdocuments-image-preview-container">
              <img src={localFormData[`${field}Preview`]} alt={doc.label} className="applicationdocuments-image-preview" />
              <div className="applicationdocuments-image-preview-overlay">
                <button type="button" className="applicationdocuments-view-image-btn"
                  onClick={() => handleViewDocument(fileData)}>
                  View
                </button>
                <button type="button" className="applicationdocuments-remove-image-btn"
                  onClick={() => document.getElementById(`${field}ChangeUpload`)?.click()}
                  disabled={uploading[field] || isSubmitting}>
                  Change file
                </button>
              </div>
            </div>
          ) : (
            <div className="applicationdocuments-file-info">
              <div className="applicationdocuments-file-details">
                <span className="applicationdocuments-file-name" title={fileData.originalName || fileData.name || fileData.fileName}>
                  {fileData.originalName || fileData.name || fileData.fileName || 'Uploaded file'}
                </span>
                {(fileData.size > 0 || fileData.fileSize > 0) && (
                  <span className="applicationdocuments-file-size">
                    {formatFileSize(fileData.size || fileData.fileSize)}
                  </span>
                )}
              </div>
              <div className="applicationdocuments-file-actions">
                {(viewUrl || fileData?._id) && (
                  <button type="button" onClick={() => handleViewDocument(fileData)} className="applicationdocuments-view-link">
                    View
                  </button>
                )}
                <button type="button" className="applicationdocuments-remove-btn"
                  onClick={() => document.getElementById(`${field}ChangeUpload`)?.click()}
                  disabled={uploading[field] || isSubmitting}>
                  Change file
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (availability === null) {
      return (
        <div className="applicationdocuments-cert-availability-question">
          <p className="applicationdocuments-cert-question-text">
            Do you currently have your <strong>{doc.label}</strong>?
          </p>
          <div className="applicationdocuments-cert-yn-buttons">
            <button type="button" className="applicationdocuments-cert-yn-btn cert-yn-yes"
              onClick={() => handleCertAvailability(field, 'yes')}>
              Yes, I have it
            </button>
            <button type="button" className="applicationdocuments-cert-yn-btn cert-yn-no"
              onClick={() => handleCertAvailability(field, 'no')}>
              No, not yet
            </button>
          </div>
        </div>
      );
    }

    if (availability === 'yes') {
      return (
        <div className="applicationdocuments-upload-placeholder">
          <button type="button" className="applicationdocuments-cert-change-answer"
            onClick={() => handleCertAvailReset(field)}>
            Change answer
          </button>
          <div
            className={`applicationdocuments-upload-prompt ${dragActive === field ? 'drag-active' : ''}`}
            onDragEnter={(e) => handleDrag(e, field)}
            onDragLeave={(e) => handleDrag(e, field)}
            onDragOver={(e) => handleDrag(e, field)}
            onDrop={(e) => handleDrop(e, field, doc)}
          >
            <p>Drag and drop or click to upload</p>
            <p className="applicationdocuments-upload-hint">
              {doc.accept.replace(/\./g, '').toUpperCase()} • Max {doc.maxSize}MB
            </p>
          </div>
          <input
            type="file"
            id={`${field}Upload`}
            accept={doc.accept}
            className="applicationdocuments-file-input-hidden"
            onChange={(e) => handleFileChange(e, field, doc)}
            disabled={uploading[field] || isSubmitting}
          />
          <button type="button" className="applicationdocuments-upload-button"
            onClick={() => document.getElementById(`${field}Upload`).click()}
            disabled={uploading[field] || isSubmitting}>
            {uploading[field]
              ? <> Uploading...</>
              : <> Browse Files</>
            }
          </button>
        </div>
      );
    }

    if (availability === 'no') {
      return (
        <div className="applicationdocuments-cert-expected-date-wrapper">
          <button type="button" className="applicationdocuments-cert-change-answer"
            onClick={() => handleCertAvailReset(field)}>
            Change answer
          </button>
          <p className="applicationdocuments-cert-no-title">No problem! When do you expect to receive it?</p>
          <p className="applicationdocuments-cert-no-subtitle">
            Please provide the expected month and year you will receive your{' '}
            <strong>{doc.label}</strong>. You can upload the document later once you have it.
          </p>
          <div className="applicationdocuments-cert-date-input-group cert-monthyear-row">
            <div className="applicationdocuments-cert-select-wrap">
              <label className="applicationdocuments-cert-date-label" htmlFor={`${field}_month`}>Month</label>
              <select
                id={`${field}_month`}
                className="applicationdocuments-cert-date-select"
                value={month}
                onChange={(e) => handleExpectedMonthChange(field, e.target.value)}
              >
                <option value="">-- Month --</option>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="applicationdocuments-cert-select-wrap">
              <label className="applicationdocuments-cert-date-label" htmlFor={`${field}_year`}>Year</label>
              <select
                id={`${field}_year`}
                className="applicationdocuments-cert-date-select"
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
            <div className="applicationdocuments-cert-date-confirmed">
              <span>
                Expected by:{' '}
                <strong>
                  {MONTHS.find(m => m.value === month)?.label} {year}
                </strong>
              </span>
            </div>
          ) : (
            <p className="applicationdocuments-cert-date-hint">
              Please select both a month and a year to continue
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="applicationdocuments">
        <div className="applicationdocuments-loading-state">
          <div className="applicationdocuments-loading-spinner"></div>
          <p>Loading your documents...</p>
        </div>
      </div>
    );
  }

  // MAIN UI RENDER
  return (
    <div className="applicationdocuments">

      {/* Header */}
      <div className="applicationdocuments-header">
        <div className="applicationdocuments-header-left">
          <h1>BA Communication Design</h1>
          <div className="applicationdocuments-application-id">
            <span className="applicationdocuments-id-label">APPLICATION ID</span>
            <span className="applicationdocuments-id-value">UEG0000104849</span>
          </div>
        </div>
        <div className="applicationdocuments-progress-container">
          <div className="applicationdocuments-progress-badge">
            <div className="applicationdocuments-progress-circle">
              <svg viewBox="0 0 36 36" className="applicationdocuments-circular-chart">
                <path className="applicationdocuments-circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="applicationdocuments-circle"
                  strokeDasharray={`${completionPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="applicationdocuments-percentage">{completionPercentage}%</text>
              </svg>
            </div>
            <span className="applicationdocuments-progress-text">Completed</span>
          </div>
        </div>
      </div>

      {/* Navigation Steps */}
      <div className="applicationdocuments-steps">
        {[
          "Study programme","Applicant Details","Address",
          "Entrance qualification","Higher Education",
          "Application Documents","Special Needs","Declaration","Review"
        ].map((step, index) => {
          let stepClass = "applicationdocuments-step";
          if (index < 5) stepClass += " completed";
          if (index === 5) stepClass += " active";
          return (
            <div key={step} className={stepClass}>
              <span className="applicationdocuments-step-number">{index < 5 ? "✓" : index + 1}</span>
              <span className="applicationdocuments-step-name">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="applicationdocuments-error-banner">
          <span className="applicationdocuments-error-icon">!</span>
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="applicationdocuments-error-close-btn">×</button>
        </div>
      )}

      {/* Main Form */}
      <div className="applicationdocuments-form-container">
        <div className="applicationdocuments-form-header">
          <h2>Application Documents</h2>
          <div className="applicationdocuments-info-message">
            <span>Upload all required documents marked with <span className="required-star">*</span></span>
          </div>
          <div className="applicationdocuments-search-container">
            <div className="applicationdocuments-search-icon"></div>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="applicationdocuments-search-input"
            />
            {searchTerm && (
              <button className="applicationdocuments-clear-search" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>

          {Object.entries(filteredCategories).map(([key, category]) => (
            category.documents.length > 0 && (
              <div key={key} className="applicationdocuments-document-category">
                <div
                  className="applicationdocuments-category-header"
                  onClick={() => toggleCategory(key)}
                  style={{ borderLeftColor: category.color }}
                >
                  <div className="applicationdocuments-category-title-wrapper">
                    <div className="applicationdocuments-category-icon"></div>
                    <h3 className="applicationdocuments-category-title">{category.title}</h3>
                    <span className="applicationdocuments-category-count">
                      {category.documents.filter(doc => {
                        if (hasUploadedDocument(localFormData[doc.field])) return true;
                        if (CERT_FIELDS.includes(doc.field) && getCertExpectedDate(doc.field)) return true;
                        return false;
                      }).length}/{category.documents.length}
                    </span>
                  </div>
                  <div className="applicationdocuments-category-actions">
                    <span className="applicationdocuments-expand-icon">
                      {expandedCategories[key] ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {expandedCategories[key] && (
                  <div className="applicationdocuments-documents-grid">
                    {category.documents.map((doc) => {

                      // CV CARD
                      if (doc.id === 'cv') {
                        const cvViewUrl = getViewUrl(localFormData.cv);
                        return (
                          <div key={doc.id} className="applicationdocuments-document-card cv-document-card">
                            <div className="applicationdocuments-document-header">
                              <div className="applicationdocuments-document-icon">
                                <DocIcon type={doc.iconType} />
                              </div>
                              <div className="applicationdocuments-document-title-wrapper">
                                <h4 className="applicationdocuments-document-title">
                                  {doc.label}
                                  {doc.required && <span className="required-badge">*</span>}
                                </h4>
                                <p className="applicationdocuments-document-description">{doc.description}</p>
                              </div>
                            </div>

                            <div className="applicationdocuments-document-upload-area">
                              {localFormData.cv?.fileName ? (
                                localFormData.cv.generated ? (
                                  <div className="applicationdocuments-cv-generated-badge">
                                    <div className="applicationdocuments-cv-gen-info">
                                      <span className="applicationdocuments-cv-gen-name">{localFormData.cv.name}</span>
                                      <span className="applicationdocuments-cv-gen-tag">Generated CV</span>
                                    </div>
                                    <div className="applicationdocuments-cv-gen-actions">
                                      <button type="button" className="applicationdocuments-cv-action-btn cv-action-edit"
                                        onClick={() => { setCvMode('generate'); setShowCVModal(true); }}>
                                        Edit
                                      </button>
                                      <button type="button" className="applicationdocuments-cv-action-btn cv-action-remove"
                                        onClick={() => handleRemoveFile('cv')}>
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="applicationdocuments-file-info">
                                    <div className="applicationdocuments-file-details">
                                      <span className="applicationdocuments-file-name">
                                        {localFormData.cv.originalName || localFormData.cv.name || localFormData.cv.fileName || 'Uploaded file'}
                                      </span>
                                      {localFormData.cv.size > 0 && (
                                        <span className="applicationdocuments-file-size">{formatFileSize(localFormData.cv.size)}</span>
                                      )}
                                    </div>
                                    <div className="applicationdocuments-file-actions">
                                      {cvViewUrl && (
                                        <a href={cvViewUrl} target="_blank" rel="noopener noreferrer" className="applicationdocuments-view-link">
                                          View
                                        </a>
                                      )}
                                      <button type="button" className="applicationdocuments-remove-btn" onClick={() => handleRemoveFile('cv')}>
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <>
                                  {cvMode === 'choose' && (
                                    <div className="applicationdocuments-cv-choice-wrapper">
                                      <p className="applicationdocuments-cv-choice-prompt">How would you like to provide your CV?</p>
                                      <div className="applicationdocuments-cv-choice-row">
                                        <button type="button" className="applicationdocuments-cv-choice-card"
                                          onClick={() => setCvMode('upload')}>
                                          <div className="applicationdocuments-cv-choice-emoji"></div>
                                          <span className="applicationdocuments-cv-choice-title">Upload CV</span>
                                          <span className="applicationdocuments-cv-choice-desc">Upload your existing CV as PDF or image</span>
                                        </button>
                                        <div className="applicationdocuments-cv-choice-or">OR</div>
                                        <button type="button" className="applicationdocuments-cv-choice-card cv-choice-card--generate"
                                          onClick={() => { setCvMode('generate'); setShowCVModal(true); }}>
                                          <div className="applicationdocuments-cv-choice-emoji"></div>
                                          <span className="applicationdocuments-cv-choice-title">Generate CV</span>
                                          <span className="applicationdocuments-cv-choice-desc">Auto-fill from your form data, edit & download as PDF</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  {cvMode === 'upload' && (
                                    <div className="applicationdocuments-upload-placeholder">
                                      <button type="button" className="applicationdocuments-cv-back-link"
                                        onClick={() => setCvMode('choose')}>
                                        Choose differently
                                      </button>
                                      <div
                                        className={`applicationdocuments-upload-prompt ${dragActive === doc.field ? 'drag-active' : ''}`}
                                        onDragEnter={(e) => handleDrag(e, doc.field)}
                                        onDragLeave={(e) => handleDrag(e, doc.field)}
                                        onDragOver={(e) => handleDrag(e, doc.field)}
                                        onDrop={(e) => handleDrop(e, doc.field, doc)}
                                      >
                                        <p>Drag and drop or click to upload</p>
                                        <p className="applicationdocuments-upload-hint">
                                          {doc.accept.replace(/\./g, '').toUpperCase()} • Max {doc.maxSize}MB
                                        </p>
                                      </div>
                                      <input
                                        type="file"
                                        id="cvFileInput"
                                        accept={doc.accept}
                                        className="applicationdocuments-file-input-hidden"
                                        onChange={(e) => handleFileChange(e, doc.field, doc)}
                                        disabled={uploading[doc.field] || isSubmitting}
                                      />
                                      <button type="button" className="applicationdocuments-upload-button"
                                        onClick={() => document.getElementById('cvFileInput').click()}
                                        disabled={uploading[doc.field] || isSubmitting}>
                                        {uploading[doc.field]
                                          ? <> Uploading...</>
                                          : <> Browse Files</>
                                        }
                                      </button>
                                    </div>
                                  )}
                                  {cvMode === 'generate' && (
                                    <div className="applicationdocuments-cv-choice-wrapper">
                                      <p className="applicationdocuments-cv-choice-prompt">CV Generator is ready</p>
                                      <button type="button" className="applicationdocuments-cv-choice-card cv-choice-card--generate"
                                        onClick={() => setShowCVModal(true)}>
                                        <div className="applicationdocuments-cv-choice-emoji"></div>
                                        <span className="applicationdocuments-cv-choice-title">Open CV Generator</span>
                                        <span className="applicationdocuments-cv-choice-desc">Click to edit and download your CV as PDF</span>
                                      </button>
                                      <button type="button" className="applicationdocuments-cv-back-link"
                                        style={{ marginTop: '8px' }}
                                        onClick={() => setCvMode('choose')}>
                                        Choose differently
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // CERTIFICATE CARDS
                      if (CERT_FIELDS.includes(doc.field)) {
                        const hasFile = hasUploadedDocument(localFormData[doc.field]);
                        const hasDate = certAvailability[doc.field] === 'no' && getCertExpectedDate(doc.field);
                        return (
                          <div
                            key={doc.id}
                            className={`applicationdocuments-document-card cert-card
                              ${hasFile ? 'uploaded' : ''}
                              ${hasDate ? 'cert-card--pending' : ''}
                              ${dragActive === doc.field ? 'drag-active' : ''}
                            `}
                          >
                            <div className="applicationdocuments-document-header">
                              <div className="applicationdocuments-document-icon">
                                <DocIcon type={doc.iconType} />
                              </div>
                              <div className="applicationdocuments-document-title-wrapper">
                                <h4 className="applicationdocuments-document-title">
                                  {doc.label}
                                  {doc.required && <span className="required-badge">*</span>}
                                  {hasFile && <span className="cert-status-pill cert-status-pill--done">Uploaded</span>}
                                  {hasDate && <span className="cert-status-pill cert-status-pill--pending">Pending</span>}
                                </h4>
                                <p className="applicationdocuments-document-description">{doc.description}</p>
                              </div>
                            </div>
                            <div className="applicationdocuments-document-upload-area">
                              <CertUploadArea doc={doc} />
                            </div>
                          </div>
                        );
                      }

                      // OTHER DOCUMENT CARDS
                      const docViewUrl = getViewUrl(localFormData[doc.field]);
                      return (
                        <div
                          key={doc.id}
                          className={`applicationdocuments-document-card ${hasUploadedDocument(localFormData[doc.field]) ? 'uploaded' : ''} ${dragActive === doc.field ? 'drag-active' : ''}`}
                          onDragEnter={(e) => handleDrag(e, doc.field)}
                          onDragLeave={(e) => handleDrag(e, doc.field)}
                          onDragOver={(e) => handleDrag(e, doc.field)}
                          onDrop={(e) => handleDrop(e, doc.field, doc)}
                        >
                          <div className="applicationdocuments-document-header">
                            <div className="applicationdocuments-document-icon">
                              <DocIcon type={doc.iconType} />
                            </div>
                            <div className="applicationdocuments-document-title-wrapper">
                              <h4 className="applicationdocuments-document-title">
                                {doc.label}
                                {doc.required && <span className="required-badge">*</span>}
                                {!doc.required && <span className="optional-badge">Optional</span>}
                              </h4>
                              <p className="applicationdocuments-document-description">{doc.description}</p>
                            </div>
                          </div>
                          <div className="applicationdocuments-document-upload-area">
                            {hasUploadedDocument(localFormData[doc.field]) ? (
                              <div className="applicationdocuments-file-preview">
                                {PERSONAL_DOCUMENT_FIELD_MAP[doc.field] && (
                                  <input
                                    type="file"
                                    id={`${doc.field}ChangeUpload`}
                                    accept={doc.accept}
                                    className="applicationdocuments-file-input-hidden"
                                    onChange={(e) => handleFileChange(e, doc.field, doc)}
                                    disabled={uploading[doc.field] || isSubmitting}
                                  />
                                )}
                                {localFormData[`${doc.field}Preview`] ? (
                                  <div className="applicationdocuments-image-preview-container">
                                    <img src={localFormData[`${doc.field}Preview`]} alt={doc.label} className="applicationdocuments-image-preview" />
                                    <div className="applicationdocuments-image-preview-overlay">
                                      <button type="button" className="applicationdocuments-view-image-btn"
                                        onClick={() => handleViewDocument(localFormData[doc.field])}>
                                        View
                                      </button>
                                      {!PERSONAL_DOCUMENT_FIELD_MAP[doc.field] && (
                                        <button type="button" className="applicationdocuments-remove-image-btn"
                                          onClick={() => handleRemoveFile(doc.field)} disabled={isSubmitting}>
                                          Remove
                                        </button>
                                      )}
                                      {PERSONAL_DOCUMENT_FIELD_MAP[doc.field] && (
                                        <button type="button" className="applicationdocuments-remove-image-btn"
                                          onClick={() => document.getElementById(`${doc.field}ChangeUpload`)?.click()}
                                          disabled={uploading[doc.field] || isSubmitting}>
                                          {doc.field === 'photo' ? 'Change Photo' : 'Change File'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="applicationdocuments-file-info">
                                    <div className="applicationdocuments-file-details">
                                      <span className="applicationdocuments-file-name" title={localFormData[doc.field].originalName || localFormData[doc.field].name || localFormData[doc.field].fileName}>
                                        {localFormData[doc.field].originalName || localFormData[doc.field].name || localFormData[doc.field].fileName || 'Uploaded file'}
                                      </span>
                                      {(localFormData[doc.field].size || localFormData[doc.field].fileSize) && (
                                        <span className="applicationdocuments-file-size">
                                          {formatFileSize(localFormData[doc.field].size || localFormData[doc.field].fileSize)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="applicationdocuments-file-actions">
                                      {(docViewUrl || localFormData[doc.field]?._id) && (
                                        <button
                                          type="button"
                                          onClick={() => handleViewDocument(localFormData[doc.field])}
                                          className="applicationdocuments-view-link"
                                        >
                                          View
                                        </button>
                                      )}
                                      {!PERSONAL_DOCUMENT_FIELD_MAP[doc.field] && localFormData[doc.field].source !== 'personal' && (
                                        <button type="button" className="applicationdocuments-remove-btn"
                                          onClick={() => handleRemoveFile(doc.field)} disabled={isSubmitting}>
                                          Remove
                                        </button>
                                      )}
                                      {PERSONAL_DOCUMENT_FIELD_MAP[doc.field] && (
                                        <>
                                          <button type="button" className="applicationdocuments-remove-btn"
                                            onClick={() => document.getElementById(`${doc.field}ChangeUpload`).click()}
                                            disabled={uploading[doc.field] || isSubmitting}>
                                            {doc.field === 'photo' ? 'Change Photo' : 'Change File'}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="applicationdocuments-upload-placeholder">
                                <div className="applicationdocuments-upload-prompt">
                                  <p>Drag and drop or click to upload</p>
                                  <p className="applicationdocuments-upload-hint">
                                    {doc.accept.replace(/\./g, '').toUpperCase()} • Max {doc.maxSize}MB
                                  </p>
                                </div>
                                <input
                                  type="file"
                                  id={`${doc.field}Upload`}
                                  accept={doc.accept}
                                  className="applicationdocuments-file-input-hidden"
                                  onChange={(e) => handleFileChange(e, doc.field, doc)}
                                  disabled={uploading[doc.field] || isSubmitting}
                                />
                                <button type="button" className="applicationdocuments-upload-button"
                                  onClick={() => document.getElementById(`${doc.field}Upload`).click()}
                                  disabled={uploading[doc.field] || isSubmitting}>
                                  {uploading[doc.field]
                                    ? <> Uploading...</>
                                    : <> Browse</>
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
          <div className="applicationdocuments-summary">
            <div className="applicationdocuments-summary-header">
              <h3>Upload Summary</h3>
            </div>
            <div className="applicationdocuments-summary-stats">
              <div className="applicationdocuments-stat-item">
                <span className="applicationdocuments-stat-label">Required Documents:</span>
                <span className="applicationdocuments-stat-value">{documentTypes.filter(doc => doc.required).length}</span>
              </div>
              <div className="applicationdocuments-stat-item">
                <span className="applicationdocuments-stat-label">Uploaded:</span>
                <span className="applicationdocuments-stat-value">
                  {documentTypes.filter(doc =>
                    hasUploadedDocument(localFormData[doc.field]) ||
                    (CERT_FIELDS.includes(doc.field) && getCertExpectedDate(doc.field))
                  ).length}
                </span>
              </div>
              <div className="applicationdocuments-stat-item">
                <span className="applicationdocuments-stat-label">Remaining:</span>
                <span className="applicationdocuments-stat-value">
                  {documentTypes.filter(doc => {
                    if (hasUploadedDocument(localFormData[doc.field])) return false;
                    if (CERT_FIELDS.includes(doc.field) && getCertExpectedDate(doc.field)) return false;
                    return doc.required;
                  }).length}
                </span>
              </div>
            </div>
            <div className="applicationdocuments-summary-progress">
              <div className="applicationdocuments-summary-progress-bar" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="applicationdocuments-form-actions">
            <button type="button" className="applicationdocuments-btn-secondary" onClick={handleBack} disabled={isSubmitting}>
              Back
            </button>
            <button type="submit" className="applicationdocuments-btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <> Saving...</>
                : <>Next</>
              }
            </button>
          </div>

        
        </form>
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedDoc && (
        <div className="applicationdocuments-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="applicationdocuments-upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="applicationdocuments-modal-header">
              <h3>Upload {selectedDoc.label}</h3>
              <button className="applicationdocuments-modal-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="applicationdocuments-modal-body">
              <div className="applicationdocuments-modal-icon"></div>
              <p className="applicationdocuments-modal-description">{selectedDoc.description}</p>
              <div className="applicationdocuments-modal-requirements">
                <p>Accepted formats: {selectedDoc.accept.replace(/\./g, '').toUpperCase()}</p>
                <p>Maximum size: {selectedDoc.maxSize}MB</p>
              </div>
              <input
                type="file"
                id="modalFileInput"
                accept={selectedDoc.accept}
                className="applicationdocuments-file-input-hidden"
                onChange={(e) => { handleFileChange(e, selectedDoc.field, selectedDoc); setShowUploadModal(false); }}
              />
              <button className="applicationdocuments-modal-upload-btn" onClick={() => document.getElementById('modalFileInput').click()}>
                Select File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV Generator Modal */}
      {showCVModal && (
        <div className="applicationdocuments-resume-modal-backdrop" onClick={handleCloseCV}>
          <div className="applicationdocuments-resume-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="applicationdocuments-resume-modal-close"
              onClick={handleCloseCV}
              aria-label="Close CV Generator"
            >
              ×
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
