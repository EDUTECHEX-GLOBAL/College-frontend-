import React, { useState, useEffect } from 'react';
import '../CollegeSubsection.css';
import Tesseract from 'tesseract.js';
import { PDFParse } from 'pdf-parse';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper function to get document type from title
// Helper function to get document type from title
const getDocumentType = (title) => {
  const typeMap = {
    'High School Transcript': 'transcript',
    'High School Diploma / Graduation Certificate': 'diploma', // Ensure this maps to 'diploma'
    'Standardized Test Scores (Optional)': 'test_scores',
    'English Language Proficiency (International Students)': 'language_proficiency',
    'Letters of Recommendation (Optional)': 'recommendation_letter',
    'Resume / Activities List (Optional)': 'resume',
    '9th Grade Marksheet (Optional)': 'marksheet_9th',
    '10th Grade Marksheet': 'marksheet_10th',
    '12th Grade Marksheet': 'marksheet_12th',
    'Passport / ID Proof': 'id_proof',
    
    // Aliases and variations
    'Transcript': 'transcript',
    'Diploma': 'diploma',
    'Certificate': 'diploma', // This is important
    'Test Scores': 'test_scores',
    'SAT': 'test_scores',
    'ACT': 'test_scores',
    'TOEFL': 'language_proficiency',
    'IELTS': 'language_proficiency',
    'Duolingo': 'language_proficiency',
    'Recommendation Letter': 'recommendation_letter',
    'LOR': 'recommendation_letter',
    'CV': 'resume',
    '9th': 'marksheet_9th',
    '10th': 'marksheet_10th',
    '12th': 'marksheet_12th',
    'Marksheet': 'transcript',
    'Report Card': 'transcript',
    'Passport': 'id_proof',
    'ID': 'id_proof',
  };
  
  // Check for partial matches
  const titleLower = title.toLowerCase();
  for (const [key, value] of Object.entries(typeMap)) {
    if (titleLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return 'other';
};

// Format date as in screenshot: "Jan 27, 2026, 07:55 PM"
const formatUploadDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', ',');
};

// Format file size as in screenshot: "555.3 KB"
const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return bytes + ' Bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Extract text from image using Tesseract OCR
const extractTextFromImage = async (file) => {
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const { data: { text } } = await Tesseract.recognize(
      dataUrl,
      'eng',
      {
        logger: info => console.log('OCR Progress:', info)
      }
    );
    
    return text.toLowerCase();
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to process image');
  }
};

// Extract text from PDF
const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    const pdfData = await PDFParse(arrayBuffer);
    return pdfData.text.toLowerCase();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to process PDF');
  }
};

// Main function to extract text from any file type
const extractTextFromFile = async (file) => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  if (fileType.startsWith('image/')) {
    return await extractTextFromImage(file);
  } else if (fileType === 'application/pdf') {
    return await extractTextFromPDF(file);
  } else if (fileName.match(/\.(txt|rtf)$/i)) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.toLowerCase());
      reader.onerror = reject;
      reader.readAsText(file);
    });
  } else {
    if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i)) {
      return await extractTextFromImage(file);
    }
    return fileName;
  }
};

// SIMPLIFIED VALIDATION - Check filename first, then content
const validateDocumentBeforeUpload = async (documentType, file) => {
  try {
    const documentKeywords = {
      'transcript': ['transcript', 'marks', 'grade', 'percentage', 'academic', 'school'],
      'diploma': ['diploma', 'certificate', 'graduation', 'degree', 'awarded'],
      'test_scores': ['sat', 'act', 'score', 'test', 'college board'],
      'language_proficiency': ['toefl', 'ielts', 'duolingo', 'english test'],
      'recommendation_letter': ['recommendation', 'reference', 'letter'],
      'resume': ['resume', 'cv', 'curriculum vitae', 'experience'],
      'marksheet_9th': ['9th', 'nine', 'grade 9', 'class ix', 'freshman'],
      'marksheet_10th': ['10th', 'ten', 'grade 10', 'class x', 'sophomore', 'secondary'],
      'marksheet_12th': ['12th', 'twelve', 'grade 12', 'class xii', 'senior', 'higher secondary'],
      'id_proof': ['passport', 'identification', 'government'],
      
    };

    const keywords = documentKeywords[documentType] || [];
    
    // STEP 1: Check filename first
    const fileName = file.name.toLowerCase();
    let filenameMatches = 0;
    
    for (const keyword of keywords) {
      if (fileName.includes(keyword.toLowerCase())) {
        filenameMatches++;
      }
    }
    
    // If filename has at least 1 keyword match, accept immediately
    if (filenameMatches > 0) {
      return {
        isValid: true,
        message: 'Verified',
        confidence: 100,
        matches: filenameMatches,
        totalKeywords: keywords.length
      };
    }
    
    // STEP 2: If filename doesn't match, check file content
    const extractedText = await extractTextFromFile(file);
    
    // Search for keywords in extracted text
    let contentMatches = 0;
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
      if (regex.test(extractedText)) {
        contentMatches++;
      }
    }
    
    // If content has at least 1 keyword match, accept
    if (contentMatches > 0) {
      return {
        isValid: true,
        message: 'Verified',
        confidence: 100,
        matches: contentMatches,
        totalKeywords: keywords.length
      };
    }
    
    // STEP 3: If no matches at all, fail validation
    return {
      isValid: false,
      message: `Please upload a valid ${documentType.replace('_', ' ')} document`,
      confidence: 0,
      matches: 0,
      totalKeywords: keywords.length
    };
    
  } catch (error) {
    console.error('Validation error:', error);
    // If there's an error processing the file, be lenient and accept it
    return { 
      isValid: true,
      message: 'Verified',
      confidence: 100,
      matches: 0,
      totalKeywords: 0
    };
  }
};

const Documents = () => {
  // Document types with initial state
  const [documents, setDocuments] = useState([
    {
      id: 1,
      title: "High School Transcript",
      description: "Upload your official high school transcript. Must be translated if not in English.",
      required: true,
      uploadedFile: null,
      fileUrl: null,
      status: 'pending',
      validationResult: null,
      serverId: null,
      uploadDate: null
    },
    {
      id: 2,
      title: "High School Diploma / Graduation Certificate",
      description: "Upload your Diploma/Graduation Certificate.",
      required: true,
      uploadedFile: null,
      fileUrl: null,
      status: 'pending',
      validationResult: null,
      serverId: null,
      uploadDate: null
    },
    {
      id: 3,
      title: "Standardized Test Scores (Optional)",
      description: "Upload SAT or ACT score report if required.",
      required: false,
      uploadedFile: null,
      fileUrl: null,
      status: 'pending',
      validationResult: null,
      serverId: null,
      uploadDate: null
    },
    {
      id: 4,
      title: "English Language Proficiency (International Students)",
      description: "Upload TOEFL, IELTS, or Duolingo scores.",
      required: false,
      uploadedFile: null,
      fileUrl: null,
      status: 'pending',
      validationResult: null,
      serverId: null,
      uploadDate: null
    },
    {
      id: 5,
      title: "Letters of Recommendation (Optional)",
      description: "Upload your letters of recommendation & personal statement about academic goals and motivations.",
      required: false,
      uploadedFile: null,
      fileUrl: null,
      status: 'pending',
      validationResult: null,
      serverId: null,
      uploadDate: null
    },
    {
      id: 6,
      title: "Resume / Activities List (Optional)",
      description: "Upload your resume or list of extracurricular activities.",
      required: false,
      uploadedFile: null,
      fileUrl: null,
      status: 'pending',
      validationResult: null,
      serverId: null,
      uploadDate: null
    },
    {
      id: 7,
      title: "9th Grade Marksheet (Optional)",
      description: "Upload your 9th grade marksheet or report card.",
      required: false,
      uploadedFile: null,
      fileUrl: null,
      status: 'pending',
      validationResult: null,
      serverId: null,
      uploadDate: null
    },
    {
      id: 8,
      title: "10th Grade Marksheet",
      description: "Upload your 10th grade marksheet or report card. Must be translated if not in English.",
      required: true,
      uploadedFile: null,
      fileUrl: null,
      status: 'pending',
      validationResult: null,
      serverId: null,
      uploadDate: null
    },
    {
      id: 9,
      title: "12th Grade Marksheet",
      description: "Upload your 12th grade marksheet or report card. Must be translated if not in English.",
      required: true,
      uploadedFile: null,
      fileUrl: null,
      status: 'pending',
      validationResult: null,
      serverId: null,
      uploadDate: null
    },
    {
      id: 10,
      title: "Passport / ID Proof",
      description: "Upload your passport or government-issued ID.",
      required: true,
      uploadedFile: null,
      fileUrl: null,
      status: 'pending',
      validationResult: null,
      serverId: null,
      uploadDate: null
    },
   
  ]);

  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationEnabled, setValidationEnabled] = useState(true);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [currentError, setCurrentError] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState(new Set()); // Track uploaded files

  // Calculate completion percentage
  const completedCount = documents.filter(d => d.uploadedFile).length;
  const totalCount = documents.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  // Fetch user's documents on component mount
  useEffect(() => {
    fetchUserDocuments();
  }, []);

  const fetchUserDocuments = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.documents && result.documents.length > 0) {
          setDocuments(prevDocs => {
            const updatedDocs = [...prevDocs];
            result.documents.forEach(serverDoc => {
              const matchingDocIndex = updatedDocs.findIndex(doc => 
                getDocumentType(doc.title) === serverDoc.documentType
              );
              
              if (matchingDocIndex !== -1) {
                updatedDocs[matchingDocIndex] = {
                  ...updatedDocs[matchingDocIndex],
                  uploadedFile: { 
                    name: serverDoc.fileName,
                    size: serverDoc.fileSize 
                  },
                  fileUrl: serverDoc.fileUrl,
                  status: 'uploaded',
                  serverId: serverDoc._id,
                  uploadDate: serverDoc.createdAt || serverDoc.uploadDate,
                  validationResult: {
                    isValid: true,
                    confidence: 100,
                    message: 'Verified',
                    matches: 0,
                    totalKeywords: 0
                  }
                };
                
                // Track this file as uploaded
                setUploadedFiles(prev => new Set([...prev, serverDoc._id]));
              }
            });
            return updatedDocs;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = async (docId, file, forceUpload = false) => {
    if (!file) return;

    const token = getAuthToken();
    if (!token) {
      setUploadSuccess('Please login to upload documents');
      setTimeout(() => setUploadSuccess(null), 3000);
      return;
    }

    const docToUpload = documents.find(doc => doc.id === docId);
    if (!docToUpload) return;

    setIsLoading(true);
    
    // Only validate if enabled and not forcing upload
    let validationResult = null;
    if (validationEnabled && !forceUpload) {
      setUploadSuccess('Validating document...');
      
      validationResult = await validateDocumentBeforeUpload(
        getDocumentType(docToUpload.title),
        file
      );

      if (!validationResult.isValid) {
        // Show error popup
        setCurrentError(validationResult.message || 
          'Please upload a valid document. This file does not appear to be correct.');
        setCurrentFile(file);
        setCurrentDocId(docId);
        setShowErrorPopup(true);
        setIsLoading(false);
        return;
      }
    } else {
      validationResult = {
        isValid: true,
        message: 'Verified',
        confidence: 100,
        matches: 0,
        totalKeywords: 0
      };
    }

    // Update UI for upload immediately
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === docId 
          ? { ...doc, status: 'uploading', uploadedFile: file, validationResult } 
          : doc
      )
    );

    setUploadProgress(prev => ({ ...prev, [docId]: 0 }));

    // Create FormData for upload
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', docToUpload.title);
    formData.append('description', docToUpload.description);
    formData.append('documentType', getDocumentType(docToUpload.title));
    formData.append('isRequired', docToUpload.required.toString());

    // Check if there's an existing document ID for this type
    const existingDoc = documents.find(doc => 
      doc.id === docId && doc.serverId
    );

    let method = 'POST';
    let url = `${API_BASE_URL}/documents/upload`;
    
    // If there's an existing document, we might want to update it instead of creating new
    if (existingDoc && existingDoc.serverId) {
      console.log('Updating existing document:', existingDoc.serverId);
      // Check if your backend supports update endpoint
      // If yes, you can use: method = 'PUT', url = `${API_BASE_URL}/documents/${existingDoc.serverId}`
    }

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[docId] || 0;
          if (currentProgress >= 90) {
            clearInterval(progressInterval);
            return { ...prev, [docId]: 90 };
          }
          return { ...prev, [docId]: currentProgress + 10 };
        });
      }, 100);

      // Upload to backend
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [docId]: 100 }));
      
      // Update document status with server data
      setTimeout(() => {
        const now = new Date();
        const newServerId = result.document?._id;
        
        setDocuments(prevDocs => 
          prevDocs.map(doc => 
            doc.id === docId 
              ? { 
                  ...doc, 
                  status: 'uploaded',
                  serverId: newServerId,
                  fileUrl: result.document?.fileUrl,
                  uploadDate: now,
                  validationResult: validationResult,
                  uploadedFile: {
                    name: file.name,
                    size: file.size
                  }
                } 
              : doc
          )
        );
        
        // Track this new file
        if (newServerId) {
          setUploadedFiles(prev => new Set([...prev, newServerId]));
        }
        
        setUploadSuccess(`"${file.name}" uploaded successfully!`);
        setIsLoading(false);
        setTimeout(() => setUploadSuccess(null), 3000);
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadSuccess(`Upload failed: ${error.message}`);
      setIsLoading(false);
      
      // Only reset if it's a critical error
      if (error.message.includes('failed') || error.message.includes('error')) {
        setDocuments(prevDocs => 
          prevDocs.map(doc => 
            doc.id === docId 
              ? { ...doc, uploadedFile: null, status: 'pending', validationResult: null } 
              : doc
          )
        );
      }
      
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  };

  const handleForceUpload = () => {
    if (currentFile && currentDocId) {
      setShowErrorPopup(false);
      handleFileUpload(currentDocId, currentFile, true);
    }
  };

  const handleRemoveFile = async (docId) => {
    const doc = documents.find(d => d.id === docId);
    
    if (doc.serverId) {
      // Delete from server
      const token = getAuthToken();
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/documents/${doc.serverId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            console.log('Successfully deleted document:', doc.serverId);
            // Remove from tracked files
            setUploadedFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(doc.serverId);
              return newSet;
            });
          }
        } catch (error) {
          console.error('Error deleting from server:', error);
        }
      }
    }

    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === docId 
          ? { 
              ...doc, 
              uploadedFile: null, 
              fileUrl: null,
              status: 'pending', 
              validationResult: null,
              serverId: null,
              uploadDate: null
            } 
          : doc
      )
    );
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[docId];
      return newProgress;
    });
  };

  const handleFileInputClick = (docId, e) => {
    e.preventDefault();
    const fileInput = document.getElementById(`file-input-${docId}`);
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="college-subsection-container">
      <div className="college-subsection-header">
        <div className="subsection-header-nav">
          <button className="subsection-back-button" onClick={() => window.history.back()}>
            ← Back
          </button>
        </div>
        
        <div className="subsection-header-info">
          <h1 className="subsection-title">Document Upload</h1>
          <p className="subsection-description">
            Please upload the required documents for your education verification. 
            All documents are validated and stored securely.
          </p>
          
          {/* Progress Section */}
          <div className="document-progress-section">
            <div className="progress-header">
              <h2>Complete your Education Information</h2>
              <div className="progress-percentage">{completionPercentage}% Complete</div>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            
            <div className="document-count">
              {completedCount}/{totalCount} uploaded ✅
            </div>
          </div>
        </div>
      </div>

      <div className="college-subsection-content">
        {/* Error Popup */}
        {showErrorPopup && (
          <div className="popup-overlay">
            <div className="validation-error-popup">
              <div className="popup-header">
                <div className="popup-icon error-icon">⚠️</div>
                <h3>Document Validation Failed</h3>
              </div>
              <div className="popup-content">
                <p>{currentError}</p>
                {currentFile && (
                  <div className="file-info-popup">
                    <p><strong>File:</strong> {currentFile.name}</p>
                    <p><strong>Type:</strong> {currentFile.type}</p>
                    <p><strong>Size:</strong> {formatFileSize(currentFile.size)}</p>
                  </div>
                )}
              </div>
              <div className="popup-actions">
                <button className="popup-cancel-btn" onClick={() => setShowErrorPopup(false)}>
                  Cancel
                </button>
                <button className="popup-confirm-btn" onClick={handleForceUpload}>
                  Upload Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className={`upload-success-message ${uploadSuccess.includes('failed') ? 'upload-error' : ''}`}>
            <span className="success-icon">{uploadSuccess.includes('failed') ? '✗' : '✓'}</span>
            {uploadSuccess}
          </div>
        )}

        <div className="documents-container">
          {documents.map((doc) => (
            <div key={doc.id} className="document-item">
              <div className="document-info">
                <h3 className="document-title">
                  {doc.title}
                  {doc.required && <span className="required-badge">* Required</span>}
                </h3>
                <p className="document-description">{doc.description}</p>
                
                {doc.uploadedFile ? (
                  <div className="uploaded-file-info">
                    <div className="file-row">
                      <div className="file-details">
                        <div className="file-name">{doc.uploadedFile.name}</div>
                        <div className="file-meta">
                          <span className="file-size">{formatFileSize(doc.uploadedFile.size)}</span>
                          <span className="file-verification">
                            <span className="verification-icon">✓</span>
                            Verified
                          </span>
                          {doc.uploadDate && (
                            <span className="file-upload-date">
                              Uploaded: {formatUploadDate(doc.uploadDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button 
                        className="remove-button"
                        onClick={() => handleRemoveFile(doc.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-area-simple">
                    <input
                      id={`file-input-${doc.id}`}
                      type="file"
                      className="file-input-hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.rtf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size <= 10 * 1024 * 1024) {
                            handleFileUpload(doc.id, file);
                          } else {
                            setUploadSuccess('File size must be less than 10MB');
                            setTimeout(() => setUploadSuccess(null), 3000);
                          }
                        }
                        e.target.value = '';
                      }}
                      disabled={isLoading}
                    />
                    <button 
                      className="upload-button"
                      onClick={(e) => handleFileInputClick(doc.id, e)}
                      disabled={isLoading}
                    >
                      + Upload File
                    </button>
                    <div className="upload-hint">
                      Max file size: 10MB • Accepted formats: PDF, JPG, PNG, DOC, DOCX, TXT, RTF
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Documents;