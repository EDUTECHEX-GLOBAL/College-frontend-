import React, { useRef, useState } from "react";
import axios from "axios";
import "./DocumentsUpload.css";

const API_URL = process.env.REACT_APP_API_URL ;

const DocumentsUploadSection = ({ educationData, handleInputChange }) => {
  const { documents } = educationData;

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: "", text: "" });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(null);

  const fileInputRefs = {
    passport: useRef(null),
    tenthMarksheet: useRef(null),
    twelfthMarksheet: useRef(null),
  };

  // Upload file to backend with validation
  const uploadFileToServer = async (documentType, file) => {
    try {
      setUploading(true);
      setUploadMessage({ type: "", text: "" });
      setUploadProgress(0);

      const token = localStorage.getItem("token");

      console.log("🔑 Token check:", {
        exists: !!token,
        length: token?.length,
        preview: token ? token.substring(0, 20) + "..." : "null",
      });

      if (!token) {
        throw new Error("Authentication required. Please login to upload documents.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      // Log FormData contents for debugging
      console.log(`📤 Uploading ${documentType}...`);
      console.log("📦 FormData contents:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`   ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      }

      const response = await axios.post(
        `${API_URL}/api/education-transfer/documents/upload`, 
        formData, 
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
              console.log(`📊 Upload progress: ${percentCompleted}%`);
            }
          },
        }
      );

      console.log("✅ Upload response:", response.data);

      if (response.data.success) {
        const confidence = response.data.validation?.confidence || 100;
        const keywords = response.data.validation?.matchedKeywords || [];

        setUploadMessage({
          type: "success",
          text: `✓ ${documentType} uploaded successfully!\n${confidence}% validation confidence\nMatched: ${keywords.slice(0, 3).join(", ")}${keywords.length > 3 ? "..." : ""}`,
        });

        const fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          filename: response.data.file.filename,
          originalname: response.data.file.originalname,
          url: response.data.file.url,
          uploadedAt: response.data.file.uploadedAt,
          validated: true,
          confidence,
        };

        // Update the parent component with the new file info
        handleInputChange("documents", documentType, fileInfo);

        setTimeout(() => setUploadMessage({ type: "", text: "" }), 5000);
        return true;
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
      });

      // Enhanced error handling with specific messages
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.details) {
          setUploadMessage({ 
            type: "error", 
            text: `❌ ${errorData.message}\n\n${errorData.details}` 
          });
        } else if (errorData.message) {
          setUploadMessage({ 
            type: "error", 
            text: `❌ ${errorData.message}` 
          });
        } else {
          setUploadMessage({ 
            type: "error", 
            text: `❌ Upload failed: ${error.status || 'Unknown error'}` 
          });
        }
      } else if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        setUploadMessage({
          type: "error",
          text: "⏱️ Upload timeout. Please check your internet connection and try again.",
        });
      } else if (error.code === "ERR_NETWORK" || !error.response) {
        setUploadMessage({
          type: "error",
          text: "🌐 Network error. Please check if the server is running and try again.",
        });
      } else {
        setUploadMessage({ 
          type: "error", 
          text: "❌ Upload failed. Please try again." 
        });
      }

      return false;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Client-side file validation and start upload
  const handleFileUpload = async (documentType, file, inputElement) => {
    if (!file) {
      console.log("❌ No file selected");
      return;
    }

    console.log("📁 File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
      documentType: documentType
    });

    // Validate file type
    const allowedTypes = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadMessage({
        type: "error",
        text: "❌ Unsupported file type. Allowed: PDF, JPG, PNG, DOC, DOCX",
      });
      if (inputElement) inputElement.value = "";
      return;
    }

    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadMessage({
        type: "error",
        text: `❌ File too large! Maximum: 10MB\nYour file: ${getFileSize(file.size)}`,
      });
      if (inputElement) inputElement.value = "";
      return;
    }

    if (file.size === 0) {
      setUploadMessage({
        type: "error",
        text: "❌ File is empty. Please select a valid file.",
      });
      if (inputElement) inputElement.value = "";
      return;
    }

    // Start upload
    const success = await uploadFileToServer(documentType, file);
    
    // Clear input only if upload was successful
    if (inputElement && success) {
      inputElement.value = "";
    }
  };

  const handleDragOver = (e, documentType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(documentType);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const handleDrop = (e, documentType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);

    const files = e.dataTransfer.files;
    if (files.length > 0 && !uploading) {
      const file = files[0];
      handleFileUpload(documentType, file, null);
    }
  };

  const removeFile = (documentType) => {
    handleInputChange("documents", documentType, null);
    if (fileInputRefs[documentType]?.current) {
      fileInputRefs[documentType].current.value = "";
    }
    setUploadMessage({ type: "", text: "" });
  };

  const getFileSize = (size) => {
    if (size < 1024) return size + " bytes";
    else if (size < 1048576) return (size / 1024).toFixed(1) + " KB";
    else return (size / 1048576).toFixed(1) + " MB";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const uploadedCount = [documents.passport, documents.tenthMarksheet, documents.twelfthMarksheet].filter(Boolean).length;
  const requiredUploaded = documents.passport && documents.tenthMarksheet;

  const DocumentUploadArea = ({ title, description, documentType, isRequired }) => (
    <div className={`documents-upload-item ${dragOver === documentType ? "drag-over" : ""}`}>
      <div className="documents-upload-icon">📄</div>
      <h3 className="documents-upload-text">
        {title} {isRequired && <span className="required">*</span>}
      </h3>
      <p className="documents-upload-subtext">{description}</p>

      {documents[documentType] ? (
        <div className="documents-uploaded-file">
          <div className="documents-file-info">
            <div className="documents-file-icon">{documents[documentType].validated ? "✅" : "📄"}</div>
            <div className="documents-file-details">
              <h4>{documents[documentType].name}</h4>
              <span>{getFileSize(documents[documentType].size)}</span>
              {documents[documentType].confidence && (
                <span className="confidence-badge">
                  ✓ Verified ({documents[documentType].confidence}% match)
                </span>
              )}
              {documents[documentType].uploadedAt && (
                <span className="upload-date">
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
            {uploading ? "..." : "Remove"}
          </button>
        </div>
      ) : (
        <div
          className={`documents-upload-area ${uploading ? "uploading" : ""}`}
          onDragOver={(e) => handleDragOver(e, documentType)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, documentType)}
          onClick={() => !uploading && fileInputRefs[documentType].current?.click()}
        >
          <input
            type="file"
            ref={fileInputRefs[documentType]}
            className="documents-upload-file-input"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleFileUpload(documentType, file, e.target);
              }
            }}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            disabled={uploading}
          />
          {uploading ? (
            <div className="upload-progress">
              <div className="spinner"></div>
              <p>Uploading... {uploadProgress}%</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          ) : (
            <>
              <p>📁 Drag and drop your file here or click to browse</p>
              <p>📝 Supported formats: PDF, JPG, PNG, DOC, DOCX (Max: 10MB)</p>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="documents-upload-section">
      <div className="documents-upload-header">
        <h2 className="documents-upload-title">Document Upload</h2>
        <div className={`documents-upload-status ${requiredUploaded ? "complete" : "incomplete"}`}>
          {uploadedCount}/3 uploaded {requiredUploaded ? "✓" : ""}
        </div>
      </div>

      <div className="documents-upload-description">
        Please upload the required documents for your education verification. All documents are validated and stored securely.
      </div>

      {uploadMessage.text && (
        <div className={`upload-message ${uploadMessage.type}`}>
          <div style={{ whiteSpace: "pre-line" }}>{uploadMessage.text}</div>
        </div>
      )}

      <div className="documents-upload-grid">
        <DocumentUploadArea 
          title="Passport" 
          description="Upload a clear scan of your passport" 
          documentType="passport" 
          isRequired={true} 
        />
        <DocumentUploadArea 
          title="10th Grade Marksheet/Certificate" 
          description="Upload your 10th standard marksheet or certificate" 
          documentType="tenthMarksheet" 
          isRequired={true} 
        />
        <DocumentUploadArea 
          title="12th Grade Marksheet/Certificate" 
          description="Upload your 12th standard marksheet or certificate (if available)" 
          documentType="twelfthMarksheet" 
          isRequired={false} 
        />
      </div>

      <div className="documents-requirements">
        <h4>Upload Requirements:</h4>
        <ul>
          <li>All documents must be clear and legible</li>
          <li>Maximum file size: 10MB per document</li>
          <li>Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX</li>
          <li>Passport and 10th Marksheet are mandatory</li>
          <li>Ensure all personal information is visible</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentsUploadSection;