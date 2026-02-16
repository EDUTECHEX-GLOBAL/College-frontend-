import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ApplicationDocuments.css';

const API_URL = process.env.REACT_APP_API_BASE_URL 
  ? `${process.env.REACT_APP_API_BASE_URL}/api/application/documents`
  : "http://localhost:5000/api/application/documents";

const ApplicationDocuments = ({ formData, onFileUpload }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [localFormData, setLocalFormData] = useState(formData || {});

  // Document types based on GUS portal screenshots
  const documentTypes = [
    {
      id: 'cv',
      field: 'cv',
      label: 'Curriculum vitae (Signed and dated)',
      description: 'Your updated CV/resume with your educational and professional background',
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'personal'
    },
    {
      id: 'photo',
      field: 'photo',
      label: 'Photo',
      description: 'Recent passport-size photograph',
      required: true,
      accept: '.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'personal'
    },
    {
      id: 'eqhe',
      field: 'eqhe',
      label: 'Higher Education Entrance Qualification',
      description: 'Your secondary school certificate/university entrance qualification',
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'education'
    },
    {
      id: 'finalEqhe',
      field: 'finalEqhe',
      label: 'Final Higher Education Entrance Qualification',
      description: 'If you have not received your EQHE yet, please upload your highest qualifying school certificate',
      required: false,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'education',
      note: 'If you have not received your entrance qualification of higher education (EQHE) yet, please upload your highest qualifying school certificate (with German or English translation)'
    },
    {
      id: 'germanCertificate',
      field: 'germanCertificate',
      label: 'Language certificate (German)',
      description: 'German language proficiency certificate (if available)',
      required: false,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'language',
      note: 'Please upload, if already available'
    },
    {
      id: 'englishCertificate',
      field: 'englishCertificate',
      label: 'Language certificate (English)',
      description: 'English language proficiency certificate (TOEFL, IELTS, etc.)',
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'language',
      note: 'Please upload, if already available'
    },
    {
      id: 'portfolio',
      field: 'portfolio',
      label: 'Portfolio',
      description: 'Creative portfolio for design/arts programs',
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'program',
      link: '#',
      linkText: 'Click Here to understand the Portfolio requirements for your selected program'
    },
    {
      id: 'noObjection',
      field: 'noObjection',
      label: 'No objection certificate',
      description: 'Certificate from your last university stating that you are still eligible to take final exams',
      required: false,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'university',
      note: 'This is a certificate from your last university stating that you are still eligible to take final exams.'
    },
    {
      id: 'deRegistration',
      field: 'deRegistration',
      label: 'De-registration certificate',
      description: 'Proof from your previous university that you are no longer officially listed as a student',
      required: false,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'university',
      note: 'A de-registration certificate is proof from your previous university that you are no longer officially listed as a student (only applies if you already have a completed German degree).'
    },
    {
      id: 'other',
      field: 'other',
      label: 'Other (e.g. clearance certificate, additional supporting documents)',
      description: 'Any additional documents that support your application',
      required: false,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'additional'
    },
    {
      id: 'bachelorTranscript',
      field: 'bachelorTranscript',
      label: 'Bachelor transcript',
      description: 'Official transcripts from your bachelor degree (if applicable)',
      required: false,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'education'
    },
    {
      id: 'bachelorCertificate',
      field: 'bachelorCertificate',
      label: 'Bachelor certificate',
      description: 'Official bachelor degree certificate (if applicable)',
      required: false,
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 5,
      category: 'education'
    }
  ];

  // Group documents by category
  const documentCategories = {
    personal: {
      title: 'Personal Documents',
      documents: documentTypes.filter(doc => doc.category === 'personal')
    },
    education: {
      title: 'Education Documents',
      documents: documentTypes.filter(doc => doc.category === 'education')
    },
    language: {
      title: 'Language Certificates',
      documents: documentTypes.filter(doc => doc.category === 'language')
    },
    program: {
      title: 'Program Specific Documents',
      documents: documentTypes.filter(doc => doc.category === 'program')
    },
    university: {
      title: 'University Documents',
      documents: documentTypes.filter(doc => doc.category === 'university')
    },
    additional: {
      title: 'Additional Documents',
      documents: documentTypes.filter(doc => doc.category === 'additional')
    }
  };

  // =====================================================
  // FETCH DOCUMENTS DATA ON LOAD
  // =====================================================
  useEffect(() => {
    let isMounted = true;
    
    if (token) {
      fetchDocuments(isMounted);
    } else {
      setError("No authentication token found");
      setIsLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [token]);

  const fetchDocuments = async (isMounted) => {
    try {
      setIsLoading(true);
      console.log("Fetching documents from:", API_URL);
      
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (isMounted && res.data.success) {
        if (res.data.documents) {
          setLocalFormData(res.data.documents);
        }
        if (res.data.completionPercentage !== undefined) {
          setCompletionPercentage(res.data.completionPercentage);
        }
      }
    } catch (error) {
      console.error("Fetch documents error:", error.response?.data || error.message);
      if (isMounted) {
        if (error.response?.status === 404) {
          console.log("No existing documents found, starting fresh");
          // Initialize with empty document structure
          const emptyDocs = {};
          documentTypes.forEach(doc => {
            emptyDocs[doc.field] = null;
          });
          setLocalFormData(emptyDocs);
        } else {
          setError("Failed to load documents data");
        }
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  // =====================================================
  // HANDLE FILE CHANGE
  // =====================================================
  const handleFileChange = async (e, field, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    // File validation
    if (file.size > docType.maxSize * 1024 * 1024) {
      alert(`File size must be less than ${docType.maxSize}MB`);
      return;
    }

    // Check file type based on accept attribute
    const allowedTypes = docType.accept.split(',');
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      alert(`Invalid file type. Allowed: ${docType.accept}`);
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalFormData(prev => ({
          ...prev,
          [`${field}Preview`]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }

    setUploading(prev => ({ ...prev, [field]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log(`Uploading ${field} to:`, `${API_URL}/upload/${field}`);

      const res = await axios.post(
        `${API_URL}/upload/${field}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data.success) {
        const updatedFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          fileName: res.data.fileData?.fileName || res.data.fileName,
          fileUrl: res.data.fileData?.fileUrl || res.data.fileUrl,
          uploadedAt: new Date().toISOString()
        };

        setLocalFormData(prev => ({
          ...prev,
          [field]: updatedFile,
          [`${field}Preview`]: prev[`${field}Preview`] // Keep preview if exists
        }));

        if (res.data.completionPercentage !== undefined) {
          setCompletionPercentage(res.data.completionPercentage);
        }

        if (onFileUpload) {
          onFileUpload(field, updatedFile);
        }

        alert(`${docType.label} uploaded successfully!`);
      }
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      
      let errorMessage = "Upload failed. ";
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      
      // Clear preview on error
      setLocalFormData(prev => ({
        ...prev,
        [`${field}Preview`]: null
      }));
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
      e.target.value = '';
    }
  };

  // =====================================================
  // REMOVE FILE - FIXED VERSION
  // =====================================================
  const handleRemoveFile = async (field) => {
    try {
      // First check if we have a file to remove
      if (!localFormData[field] || !localFormData[field].fileName) {
        // No file in local state, just clear it
        setLocalFormData(prev => ({
          ...prev,
          [field]: null,
          [`${field}Preview`]: null
        }));
        
        if (onFileUpload) {
          onFileUpload(field, null);
        }
        
        // Update completion percentage
        const requiredDocs = documentTypes.filter(doc => doc.required);
        const uploadedRequired = requiredDocs.filter(doc => localFormData[doc.field]).length;
        const newPercentage = Math.round((uploadedRequired / requiredDocs.length) * 100);
        setCompletionPercentage(newPercentage);
        
        alert("File removed from local storage");
        return;
      }

      console.log(`Removing file: ${field} from`, `${API_URL}/files/${field}`);
      
      try {
        const res = await axios.delete(`${API_URL}/files/${field}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setLocalFormData(prev => ({
            ...prev,
            [field]: null,
            [`${field}Preview`]: null
          }));

          if (res.data.completionPercentage !== undefined) {
            setCompletionPercentage(res.data.completionPercentage);
          }

          if (onFileUpload) {
            onFileUpload(field, null);
          }

          alert("File removed successfully!");
        }
      } catch (apiError) {
        console.log("API error, but clearing locally:", apiError.response?.data);
        
        // Even if API fails, clear locally
        setLocalFormData(prev => ({
          ...prev,
          [field]: null,
          [`${field}Preview`]: null
        }));

        // Update completion percentage locally
        const requiredDocs = documentTypes.filter(doc => doc.required);
        const updatedFormData = { ...localFormData, [field]: null };
        const uploadedRequired = requiredDocs.filter(doc => updatedFormData[doc.field]).length;
        const newPercentage = Math.round((uploadedRequired / requiredDocs.length) * 100);
        setCompletionPercentage(newPercentage);

        if (onFileUpload) {
          onFileUpload(field, null);
        }

        alert("File removed from local storage (server record not found)");
      }
    } catch (error) {
      console.error("Remove error:", error);
      alert("Failed to remove file. Please try again.");
    }
  };

  // =====================================================
  // CALCULATE COMPLETION
  // =====================================================
  const calculateCompletion = useCallback(() => {
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const uploadedRequired = requiredDocs.filter(doc => localFormData[doc.field]).length;
    return Math.round((uploadedRequired / requiredDocs.length) * 100);
  }, [localFormData, documentTypes]);

  // =====================================================
  // UPDATE COMPLETION WHEN localFormData CHANGES
  // =====================================================
  useEffect(() => {
    const newPercentage = calculateCompletion();
    setCompletionPercentage(newPercentage);
  }, [localFormData, calculateCompletion]);

  // =====================================================
  // HANDLE NEXT
  // =====================================================
  const handleNext = async () => {
    // Check required documents
    const missingRequired = documentTypes
      .filter(doc => doc.required && !localFormData[doc.field])
      .map(doc => doc.label);

    if (missingRequired.length > 0) {
      alert(`Please upload all required documents:\n\n• ${missingRequired.join('\n• ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Try to save documents status
      try {
        await axios.post(
          `${API_URL}/status`,
          {
            documents: localFormData,
            completed: true
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        console.log("Documents status saved successfully");
      } catch (statusError) {
        console.log("Status endpoint not available, continuing anyway");
      }

      // Navigate to Special Needs page
      let targetPath;
      if (location.pathname.includes('/documents')) {
        targetPath = location.pathname.replace('/documents', '/special-needs');
      } else {
        targetPath = '/firstyear/dashboard/application/special-needs';
      }
      
      console.log("Navigating to:", targetPath);
      navigate(targetPath);
      
    } catch (error) {
      console.error("Error in handleNext:", error);
      // Still navigate even if there's an error
      let targetPath;
      if (location.pathname.includes('/documents')) {
        targetPath = location.pathname.replace('/documents', '/special-needs');
      } else {
        targetPath = '/firstyear/dashboard/application/special-needs';
      }
      navigate(targetPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // HANDLE BACK
  // =====================================================
  const handleBack = () => {
    let backPath;
    if (location.pathname.includes('/documents')) {
      backPath = location.pathname.replace('/documents', '/firsteducation');
    } else {
      backPath = '/firstyear/dashboard/application/firsteducation';
    }
    navigate(backPath);
  };

  // =====================================================
  // LOADING STATE
  // =====================================================
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

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <div className="application-documents">
      {/* Header with Application ID */}
      <div className="documents-header">
        <div className="header-left">
          <h1>BA Communication Design</h1>
          <div className="application-id">APPLICATION ID - UEG0000104849</div>
        </div>
        <div className="progress-badge">{completionPercentage}% Completed</div>
      </div>

      {/* Navigation Steps */}
      <div className="application-steps">
        {[
          "Study programme",
          "Applicant Details",
          "Address",
          "Entrance qualification",
          "Higher Education",
          "Application Documents",
          "Special Needs",
          "Declaration",
          "Review"
        ].map((step, index) => {
          const stepNumber = index + 1;
          let stepClass = "step";
          if (index < 5) stepClass += " completed";
          if (index === 5) stepClass += " active";
          
          return (
            <div key={step} className={stepClass}>
              <span className="step-number">
                {index < 5 ? "✓" : stepNumber}
              </span>
              <span className="step-name">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close-btn">×</button>
        </div>
      )}

      {/* Main Form Container */}
      <div className="documents-form-container">
        <div className="form-header">
          <h2>Application Documents</h2>
          <div className="info-message">
            <p>
              Please upload all available documents as this will speed up the application process, 
              if possible in PDF or JPEG format.
            </p>
            <p className="important-note">
              <strong>Please note:</strong> All documents which are not originally issued in either 
              English or German language, must be professionally translated. The certified translation 
              has to be submitted along with a copy of the original document.
            </p>
            <p>
              If you have a portfolio on a website, you can also create a document which contains 
              the link to your website, instead of uploading the portfolio.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
          {/* Documents by Category */}
          {Object.entries(documentCategories).map(([key, category]) => (
            category.documents.length > 0 && (
              <div key={key} className="document-category">
                <h3 className="category-title">{category.title}</h3>
                
                <div className="documents-grid">
                  {category.documents.map((doc) => (
                    <div key={doc.id} className="document-card">
                      <div className="document-header">
                        <h4 className="document-title">
                          {doc.label}
                          {doc.required && <span className="required-badge">*</span>}
                        </h4>
                        <p className="document-description">{doc.description}</p>
                        {doc.note && (
                          <p className="document-note">{doc.note}</p>
                        )}
                      </div>

                      <div className="document-upload-area">
                        {doc.link && (
                          <p className="document-link">
                            <a href={doc.link} target="_blank" rel="noopener noreferrer">
                              {doc.linkText}
                            </a>
                          </p>
                        )}

                        <div className="upload-prompt">
                          <i className="fas fa-cloud-upload-alt upload-icon"></i>
                          <p>Drop file to attach, or browse</p>
                          <p className="upload-hint">
                            {doc.accept.replace(/\./g, '').toUpperCase()}. 
                            Please upload a file that is less than {doc.maxSize} MB.
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

                        {localFormData[doc.field] && localFormData[doc.field].fileName ? (
                          <div className="file-preview">
                            {localFormData[`${doc.field}Preview`] ? (
                              <div className="image-preview">
                                <img 
                                  src={localFormData[`${doc.field}Preview`]} 
                                  alt={doc.label}
                                />
                                <button
                                  type="button"
                                  className="remove-image-btn"
                                  onClick={() => handleRemoveFile(doc.field)}
                                  disabled={isSubmitting}
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div className="file-info">
                                <i className="fas fa-file-pdf file-icon-large"></i>
                                <div className="file-details">
                                  <span className="file-name">
                                    {localFormData[doc.field].originalName || 
                                     localFormData[doc.field].name || 
                                     localFormData[doc.field].fileName || 
                                     'Uploaded file'}
                                  </span>
                                  {localFormData[doc.field].size && (
                                    <span className="file-size">
                                      {(localFormData[doc.field].size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  )}
                                </div>
                                <div className="file-actions">
                                  {localFormData[doc.field].fileUrl && (
                                    <a
                                      href={localFormData[doc.field].fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="view-link"
                                    >
                                      <i className="fas fa-eye"></i> View
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() => handleRemoveFile(doc.field)}
                                    disabled={isSubmitting}
                                  >
                                    <i className="fas fa-times"></i> Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="upload-button"
                            onClick={() => document.getElementById(`${doc.field}Upload`).click()}
                            disabled={uploading[doc.field] || isSubmitting}
                          >
                            {uploading[doc.field] ? 'Uploading...' : 'Browse'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}

          {/* Navigation Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              ← Back
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Next →'}
            </button>
          </div>

          <div className="language-selector">
            <span>English ▼</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationDocuments;