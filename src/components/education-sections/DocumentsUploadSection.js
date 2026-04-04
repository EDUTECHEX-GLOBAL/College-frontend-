// src/components/education-sections/DocumentsUploadSection.js
import React, { useRef, useState } from 'react';
import axios from 'axios';
import './DocumentsUploadSection.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const DocumentsUploadSection = ({ educationData, handleInputChange }) => {
  const { documents } = educationData;
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  const [dragOver, setDragOver] = useState(null);
  
  const fileInputRefs = {
    passport: useRef(null),
    tenthMarksheet: useRef(null),
    twelfthMarksheet: useRef(null),
  };

  // Upload file to backend
  const uploadFileToServer = async (documentType, file) => {
    try {
      setUploading(true);
      setUploadMessage({ type: '', text: '' });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/api/education/documents/upload?field=${documentType}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setUploadMessage({ type: 'success', text: 'File uploaded successfully' });
        
        // Update local state with file info from server
        const fileInfo = {
          filename: response.data.file.filename,
          originalname: response.data.file.originalname,
          size: response.data.file.size,
          url: response.data.file.url,
          uploadedAt: new Date()
        };
        
        handleInputChange('documents', documentType, fileInfo);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload file' 
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Remove file from server
  const removeFileFromServer = async (documentType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.delete(
        `${API_URL}/api/education/documents?field=${documentType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setUploadMessage({ type: 'success', text: 'File removed successfully' });
        handleInputChange('documents', documentType, null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error removing file:', error);
      setUploadMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to remove file' 
      });
      return false;
    }
  };

  const handleFileUpload = async (documentType, file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadMessage({ type: 'error', text: 'Unsupported file type. Please upload PDF, JPG, PNG, or DOC files.' });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadMessage({ type: 'error', text: 'File size must be less than 10MB' });
      return;
    }

    const success = await uploadFileToServer(documentType, file);
    if (success) {
      // File uploaded successfully, state updated in uploadFileToServer
    }
  };

  const handleDragOver = (e, documentType) => {
    e.preventDefault();
    setDragOver(documentType);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e, documentType) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(documentType, file);
  };

  const removeFile = async (documentType) => {
    await removeFileFromServer(documentType);
  };

  const getFileSize = (size) => {
    if (size < 1024) return size + ' bytes';
    else if (size < 1048576) return (size / 1024).toFixed(1) + ' KB';
    else return (size / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const DocumentUploadArea = ({ title, description, documentType, isRequired }) => (
    <div className={`documents-upload-item ${dragOver === documentType ? 'drag-over' : ''}`}>
      <div className="documents-upload-icon">📄</div>
      <h3 className="documents-upload-text">
        {title} {isRequired && <span className="required">*</span>}
      </h3>
      <p className="documents-upload-subtext">{description}</p>

      {uploadMessage.text && documentType === 'passport' && (
        <div className={`upload-message ${uploadMessage.type}`}>
          {uploadMessage.text}
        </div>
      )}

      {documents[documentType] ? (
        <div className="documents-uploaded-file">
          <div className="documents-file-info">
            <div className="documents-file-icon">✅</div>
            <div className="documents-file-details">
              <h4>{documents[documentType].originalname}</h4>
              <span>{getFileSize(documents[documentType].size)}</span>
              {documents[documentType].uploadedAt && (
                <span style={{display: 'block', fontSize: '11px', color: '#9ca3af', fontStyle: 'italic'}}>
                  Uploaded: {formatDate(documents[documentType].uploadedAt)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="documents-remove-file-btn"
            onClick={() => removeFile(documentType)}
            disabled={uploading}
          >
            {uploading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      ) : (
        <div
          className="documents-upload-area"
          onDragOver={(e) => handleDragOver(e, documentType)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, documentType)}
          onClick={() => !uploading && fileInputRefs[documentType].current?.click()}
          style={{ 
            position: 'relative',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1
          }}
        >
          <input
            type="file"
            ref={fileInputRefs[documentType]}
            className="documents-upload-file-input"
            onChange={(e) => handleFileUpload(documentType, e.target.files[0])}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            disabled={uploading}
          />
          {uploading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #2C5AA0',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Uploading file...</p>
            </div>
          ) : (
            <>
              <p>Drag and drop your file here or click to browse</p>
              <p>Supported formats: PDF, JPG, PNG, DOC (Max: 10MB)</p>
            </>
          )}
        </div>
      )}
    </div>
  );

  // Calculate upload status
  const uploadedCount = [documents.passport, documents.tenthMarksheet, documents.twelfthMarksheet].filter(Boolean).length;
  const requiredUploaded = documents.passport && documents.tenthMarksheet;

  return (
    <div className="documents-upload-section">
      {/* Header */}
      <div className="documents-upload-header">
        <h2 className="documents-upload-title">Document Upload</h2>
        <div className="documents-upload-status">
          {uploadedCount}/3 documents uploaded {requiredUploaded ? '✓' : ''}
        </div>
      </div>

      <div className="documents-upload-description">
        Please upload the required documents for your education verification. 
        All documents are stored securely and will be used for application processing.
      </div>

      {uploadMessage.text && (
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500',
          backgroundColor: uploadMessage.type === 'success' ? '#f0fff4' : '#fed7d7',
          color: uploadMessage.type === 'success' ? '#2f855a' : '#c53030',
          border: `1px solid ${uploadMessage.type === 'success' ? '#9ae6b4' : '#feb2b2'}`
        }}>
          {uploadMessage.text}
        </div>
      )}

      <div className="documents-upload-grid">
        {/* Passport Upload */}
        <DocumentUploadArea
          title="Passport"
          description="Upload a clear scan of your passport"
          documentType="passport"
          isRequired={true}
        />

        {/* 10th Marksheet Upload */}
        <DocumentUploadArea
          title="10th Grade Marksheet/Certificate"
          description="Upload your 10th standard marksheet or certificate"
          documentType="tenthMarksheet"
          isRequired={true}
        />

        {/* 12th Marksheet Upload */}
        <DocumentUploadArea
          title="12th Grade Marksheet/Certificate"
          description="Upload your 12th standard marksheet or certificate (if available)"
          documentType="twelfthMarksheet"
          isRequired={false}
        />
      </div>

      {/* Upload Status Summary */}
      <div style={{
        display: 'flex',
        gap: '24px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px 24px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#718096', fontWeight: '500' }}>Passport:</span>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '600',
            color: documents.passport ? '#38a169' : '#e53e3e'
          }}>
            {documents.passport ? 'Uploaded ✓' : 'Required'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#718096', fontWeight: '500' }}>10th Marksheet:</span>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '600',
            color: documents.tenthMarksheet ? '#38a169' : '#e53e3e'
          }}>
            {documents.tenthMarksheet ? 'Uploaded ✓' : 'Required'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#718096', fontWeight: '500' }}>12th Marksheet:</span>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '600',
            color: documents.twelfthMarksheet ? '#38a169' : '#6b7280'
          }}>
            {documents.twelfthMarksheet ? 'Uploaded ✓' : 'Optional'}
          </span>
        </div>
      </div>

      {/* Upload Requirements */}
      <div className="documents-requirements">
        <h4>Upload Requirements:</h4>
        <ul>
          <li>All documents must be clear and legible</li>
          <li>Maximum file size: 10MB per document</li>
          <li>Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX</li>
          <li>Passport and 10th Marksheet are mandatory</li>
          <li>Ensure all personal information is visible</li>
          <li>Files are stored securely and encrypted</li>
        </ul>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DocumentsUploadSection;