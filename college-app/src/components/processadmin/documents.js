// Documents.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./documents.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [groupedApplications, setGroupedApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [stats, setStats] = useState({ totalApplications: 0, incomplete: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get token - ONLY process-admin token
  const getToken = () => {
    const token = localStorage.getItem('processAdminToken');
    if (!token) {
      console.error('❌ No process-admin token found');
    } else {
      console.log('✅ Using processAdminToken:', token.substring(0, 20) + '...');
    }
    return token;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' Bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get document type display name
// Get document type display name - FIXED to handle marksheet types correctly
const getDocumentTypeDisplay = (type) => {
  const typeMap = {
    'transcript': 'Transcript',
    'diploma': 'Diploma/Certificate',
    'test_scores': 'Test Scores',
    'language_proficiency': 'Language Proficiency',
    'recommendation_letter': 'Recommendation Letter',
    'resume': 'Resume/CV',
    'marksheet_9th': '9th Marksheet',
    'marksheet_10th': '10th Marksheet',
    'marksheet_12th': '12th Marksheet',
    'id_proof': 'ID Proof',
    'passport': 'Passport',
    'other': 'Other'
  };
  
  // If type is already formatted (like "9TH MARKSHEET"), return as is
  if (typeof type === 'string' && type.includes('MARKSHEET')) {
    return type;
  }
  
  return typeMap[type] || type?.replace(/_/g, ' ')?.toUpperCase() || 'Unknown';
};

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('completed') || statusLower === 'validated' || statusLower === 'approved') {
      return 'status-badge completed';
    } else if (statusLower.includes('rejected') || statusLower.includes('incomplete')) {
      return 'status-badge incomplete';
    } else if (statusLower.includes('in progress') || statusLower.includes('pending')) {
      return 'status-badge in-progress';
    } else if (statusLower.includes('not started')) {
      return 'status-badge not-started';
    }
    return 'status-badge';
  };

  // Get status text
  const getStatusText = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('completed') || statusLower === 'validated' || statusLower === 'approved') return 'COMPLETED';
    if (statusLower.includes('rejected')) return 'REJECTED';
    if (statusLower.includes('incomplete')) return 'INCOMPLETE';
    if (statusLower.includes('in progress')) return 'IN PROGRESS';
    if (statusLower.includes('pending')) return 'PENDING';
    if (statusLower.includes('not started')) return 'NOT STARTED';
    return status?.toUpperCase() || 'PENDING';
  };

  // Group documents by student
  const groupDocumentsByStudent = (docs) => {
    const groups = {};
    let totalApplications = 0;
    let incomplete = 0;

    docs.forEach(doc => {
      const studentId = doc.studentId || doc.userId;
      if (!studentId) return;

      if (!groups[studentId]) {
        groups[studentId] = {
          studentId,
          collegeId: doc.collegeId || 'N/A',
          studentName: doc.studentName || doc.userName || 'Unknown Student',
          studentEmail: doc.studentEmail || doc.userEmail || 'No email',
          applicationId: doc.applicationId || doc._id,
          documents: [],
          totalDocuments: 0,
          completedCount: 0,
          incompleteCount: 0,
          rejectedCount: 0,
          progressPercentage: 0,
          latestSubmission: null,
          status: 'NOT STARTED',
          profilePic: (doc.studentName || 'U').charAt(0).toUpperCase()
        };
        totalApplications++;
      }

      groups[studentId].documents.push(doc);
      groups[studentId].totalDocuments++;

      const docStatus = (doc.reviewStatus || doc.status || '').toLowerCase();
      if (docStatus.includes('approved') || docStatus === 'validated' || docStatus === 'completed') {
        groups[studentId].completedCount++;
      } else if (docStatus.includes('rejected')) {
        groups[studentId].rejectedCount = (groups[studentId].rejectedCount || 0) + 1;
        groups[studentId].incompleteCount++;
      } else if (docStatus.includes('incomplete')) {
        groups[studentId].incompleteCount++;
      }

      const docDate = new Date(doc.createdAt || doc.uploadDate || doc.submittedAt || Date.now());
      if (!groups[studentId].latestSubmission || docDate > new Date(groups[studentId].latestSubmission)) {
        groups[studentId].latestSubmission = doc.createdAt || doc.uploadDate || doc.submittedAt;
      }
    });

    Object.values(groups).forEach(group => {
      group.progressPercentage = group.totalDocuments > 0 
        ? Math.round((group.completedCount / group.totalDocuments) * 100) 
        : 0;
      
      if (group.progressPercentage === 100 && group.rejectedCount === 0) {
        group.status = 'COMPLETED';
      } else if (group.rejectedCount > 0 || group.incompleteCount > 0) {
        group.status = 'INCOMPLETE';
        incomplete++;
      } else if (group.progressPercentage > 0) {
        group.status = 'IN PROGRESS';
      } else {
        group.status = 'NOT STARTED';
      }
    });

    setStats({ totalApplications, incomplete });
    return Object.values(groups);
  };

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('📄 Fetching documents with process-admin token...');
      
      const response = await axios.get(`${API_BASE_URL}/process-admin/documents/all`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { limit: 1000 }
      });

      console.log('📊 Documents response:', response.data);

      let documentsList = [];
      if (Array.isArray(response.data)) {
        documentsList = response.data;
      } else if (response.data.documents && Array.isArray(response.data.documents)) {
        documentsList = response.data.documents;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        documentsList = response.data.data;
      }

      console.log(`📦 Found ${documentsList.length} documents`);
      setDocuments(documentsList);
      
      if (documentsList.length > 0) {
        const grouped = groupDocumentsByStudent(documentsList);
        console.log(`👥 Grouped into ${grouped.length} applications`);
        setGroupedApplications(grouped);
      } else {
        setGroupedApplications([]);
      }
      
    } catch (err) {
      console.error('❌ Error fetching documents:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (err.response?.status === 403) {
        setError('Access forbidden. You don\'t have permission.');
      } else if (err.response?.status === 404) {
        setError('Documents endpoint not found.');
      } else {
        setError('Failed to load documents. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle view document
  const handleViewDocument = async (document) => {
    try {
      const fileUrl = document.downloadUrl || document.fileUrl || document.url;
      if (!fileUrl) {
        alert('Document URL not available');
        return;
      }
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Unable to open document.');
    }
  };

  // Handle download document
  const handleDownloadDocument = async (documentItem) => {
    try {
      const fileUrl = documentItem.downloadUrl || documentItem.fileUrl || documentItem.url;
      if (!fileUrl) {
        alert('Document URL not available');
        return;
      }

      const token = getToken();
      
      // If it's a local file, fetch it with authentication
      if (fileUrl.includes('/uploads/')) {
        try {
          const response = await fetch(fileUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const blob = await response.blob();
            
            // Get filename from Content-Disposition header or use the document name
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = documentItem.documentName || documentItem.fileName || 'document';
            
            if (contentDisposition && contentDisposition.includes('filename=')) {
              const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
              if (match && match[1]) {
                filename = match[1].replace(/['"]/g, '');
              }
            }
            
            // Add extension if missing
            if (!filename.includes('.')) {
              const ext = blob.type.split('/')[1] || 'pdf';
              filename += '.' + ext;
            }

            // Create download link
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => {
              window.URL.revokeObjectURL(link.href);
            }, 100);
          } else {
            alert('Failed to download document. Please try again.');
          }
        } catch (error) {
          console.error('Error downloading document:', error);
          alert('Failed to download document. Please try again.');
        }
      } else {
        // For external URLs, open in new tab
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Unable to download document. Please try again.');
    }
  };

  // Handle send document email for correction
  const sendDocumentEmail = async (document, student, event) => {
    try {
      const token = getToken();
      if (!token) {
        alert('Authentication required. Please login.');
        return;
      }

      // Show sending indicator
      const emailBtn = event?.target;
      if (emailBtn) {
        const originalText = emailBtn.innerHTML;
        emailBtn.innerHTML = '⏳ Sending...';
        emailBtn.disabled = true;

        // Determine the reason based on document status
        let reason = 'incorrect_format';
        let expectedType = '';
        
        // If document is wrong type (like 10th marksheet labeled as 9th)
        if (document.documentType === 'marksheet_10th') {
          reason = 'wrong_document';
          expectedType = '10th Marksheet';
        } else if (document.reviewStatus === 'rejected') {
          // If document is already rejected, use the rejection reason
          reason = document.rejectionReason || 'incorrect_format';
        }
        
        // Get the correct expected type based on the file name
        const fileName = document.documentName || document.fileName || '';
        if (fileName.toLowerCase().includes('10th')) {
          expectedType = '10th Marksheet';
        } else if (fileName.toLowerCase().includes('9th')) {
          expectedType = '9th Marksheet';
        } else if (fileName.toLowerCase().includes('12th')) {
          expectedType = '12th Marksheet';
        }

        // Call the correction request endpoint
        const response = await axios.post(
          `${API_BASE_URL}/process-admin/documents/${document._id || document.id}/send-correction`,
          {
            reason: reason,
            adminNotes: `The document you uploaded ("${fileName}") was labeled as a "${getDocumentTypeDisplay(document.documentType)}", which is incorrect or inconsistent. This may be due to an incorrect file, mislabeling, or a suspicious/fake document.`,
            uploadedType: document.documentType,
            expectedType: expectedType
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          alert(`✓ Correction email sent successfully to ${student.studentEmail}\n\nSubject: Action Required: Document Correction Needed for Your Application`);
          
          // Refresh the documents list to show updated status
          fetchDocuments();
        } else {
          alert('Failed to send email: ' + (response.data.message || 'Please try again.'));
        }

        // Restore button
        setTimeout(() => {
          emailBtn.innerHTML = originalText;
          emailBtn.disabled = false;
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to send email. Please check the backend connection.';
      alert(`Error: ${errorMessage}`);
      
      // Restore button
      const emailBtn = event?.target;
      if (emailBtn) {
        emailBtn.innerHTML = '📧 Email';
        emailBtn.disabled = false;
      }
    }
  };

  // Handle download all documents as single PDF
  const handleDownloadAllPDF = async (student) => {
    try {
      const token = getToken();
      if (!token) {
        alert('Authentication required. Please login.');
        return;
      }

      // Show loading indicator on the button
      const downloadBtn = document.querySelector('.download-pdf-btn');
      const originalText = downloadBtn?.innerHTML;
      if (downloadBtn) {
        downloadBtn.innerHTML = '⏳ Generating PDF...';
        downloadBtn.disabled = true;
      }

      console.log('📑 Generating combined PDF for student:', student.studentName);

      // Call the PDF generation endpoint
      const response = await axios.get(
        `${API_BASE_URL}/process-admin/documents/generate-pdf/${student.studentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob',
          timeout: 120000 // 2 minutes timeout
        }
      );

      if (response.data) {
        // Create blob from response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `${student.studentName.replace(/\s+/g, '_')}_Complete_Application_${timestamp}.pdf`;
        
        link.href = fileURL;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        setTimeout(() => {
          window.URL.revokeObjectURL(fileURL);
        }, 100);

        // Show success message
        setTimeout(() => {
          alert(`✓ Combined PDF downloaded successfully!\n\nStudent: ${student.studentName}\nFile: ${fileName}\n\nAll ${student.documents.length} documents have been compiled into a single PDF file.`);
        }, 300);
      }

    } catch (error) {
      console.error('Error downloading PDF:', error);
      
      // Handle specific error cases
      if (error.code === 'ECONNABORTED') {
        alert('PDF generation timeout. The document may be large. Please try again.');
      } else if (error.response?.status === 404) {
        alert('No documents found for this student.');
      } else if (error.response?.status === 403) {
        alert('Access denied. Please check your admin permissions.');
      } else if (error.response?.status === 400) {
        alert('Invalid student ID or request.');
      } else if (error.message?.includes('Network Error')) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('Failed to generate PDF. Please try again or contact support.');
      }
    } finally {
      // Restore button state
      const downloadBtn = document.querySelector('.download-pdf-btn');
      if (downloadBtn) {
        downloadBtn.innerHTML = '📄 Download Complete PDF';
        downloadBtn.disabled = false;
      }
    }
  };

  // Handle view student details
  const handleViewStudent = (student) => {
    console.log('Viewing student:', student);
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    fetchDocuments();
  };

  // Load on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter applications
  const filteredApplications = groupedApplications.filter(app => {
    const matchesSearch = searchQuery === '' || 
      app.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.collegeId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      app.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Render
  return (
    <div className="documents-container">
      {/* Header */}
      <div className="documents-header">
        <div className="header-left">
          <h2>Documents Management</h2>
          <p className="header-subtitle">Manage and track all student documents</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchDocuments} className="refresh-btn" title="Refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>TOTAL APPLICATIONS</h3>
            <div className="stat-value">{stats.totalApplications}</div>
          </div>
        </div>
        
        <div className="stat-card incomplete">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>INCOMPLETE</h3>
            <div className="stat-value">{stats.incomplete}</div>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>COMPLETED</h3>
            <div className="stat-value">{stats.totalApplications - stats.incomplete}</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or college ID..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>
        
        <div className="filter-controls">
          <select 
            value={statusFilter} 
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in progress">In Progress</option>
            <option value="incomplete">Incomplete</option>
            <option value="not started">Not Started</option>
          </select>
          
          <button 
            onClick={handleResetFilters}
            className="reset-btn"
            title="Reset Filters"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          {error.includes('login') && (
            <button onClick={() => window.location.href = '/process-admin-login'} className="login-redirect">
              Go to Login
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading documents...</p>
        </div>
      )}

      {/* Applications Table */}
      {!loading && !error && (
        <div className="table-container">
          <table className="applications-table">
            <thead>
              <tr>
                <th>COLLEGE ID</th>
                <th>STUDENT</th>
                <th>STATUS</th>
                <th>SUBMITTED</th>
                <th>PROGRESS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div className="empty-state">
                      <span className="empty-icon">📭</span>
                      <p>No applications found</p>
                      <button onClick={fetchDocuments} className="retry-btn">
                        Refresh
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.studentId}>
                    <td>
                      <span className="college-id">{app.collegeId}</span>
                    </td>
                    <td>
                      <div className="student-info">
                        <div className="student-avatar">
                          {app.profilePic}
                        </div>
                        <div className="student-details">
                          <div className="student-name">{app.studentName}</div>
                          <div className="student-email">{app.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(app.status)}>
                        {getStatusText(app.status)}
                      </span>
                    </td>
                    <td>
                      <span className="submission-date">
                        {app.latestSubmission ? formatDate(app.latestSubmission) : 'Not submitted'}
                      </span>
                    </td>
                    <td>
                      <div className="progress-container">
                        <div className="progress-percentage">{app.progressPercentage}%</div>
                        <div className="progress-bar-bg">
                          <div 
                            className={`progress-bar ${app.status.toLowerCase().replace(' ', '-')}`}
                            style={{ width: `${app.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button 
                        className="view-btn"
                        onClick={() => handleViewStudent(app)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer */}
      {!loading && !error && (
        <div className="table-footer">
          <div className="footer-info">
            <span>Showing {filteredApplications.length} of {groupedApplications.length} applications</span>
          </div>
          <div className="footer-actions">
            <button onClick={fetchDocuments} className="refresh-small">
              ↻ Refresh
            </button>
          </div>
        </div>
      )}

      {/* STUDENT DETAILS MODAL */}
      {showStudentModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="student-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <h3>Application Details</h3>
                <p className="modal-subtitle">{selectedStudent.studentName}</p>
              </div>
              <button className="modal-close" onClick={() => setShowStudentModal(false)}>×</button>
            </div>
            
            <div className="modal-content">
              {/* Student Info Header */}
              <div className="student-info-header">
                <div className="student-profile-large">
                  {selectedStudent.profilePic}
                </div>
                <div className="student-header-details">
                  <h2>{selectedStudent.studentName}</h2>
                  <div className="college-id-badge">{selectedStudent.collegeId}</div>
                  <div className="email-large">{selectedStudent.studentEmail}</div>
                  <div className="meta-info">
                    <span className="meta-item">
                      <span className="meta-label">Application ID:</span>
                      <span className="meta-value">{selectedStudent.applicationId}</span>
                    </span>
                    <span className="meta-item">
                      <span className="meta-label">Submitted:</span>
                      <span className="meta-value">
                        {selectedStudent.latestSubmission ? formatDate(selectedStudent.latestSubmission) : 'Not submitted'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Status */}
              <div className="application-status-section">
                <div className="status-card">
                  <div className="status-header">
                    <span className="status-label">Overall Status</span>
                    <span className={`status-value ${selectedStudent.status.toLowerCase()}`}>
                      {getStatusText(selectedStudent.status)}
                    </span>
                  </div>
                  <div className="progress-summary">
                    <div className="progress-summary-text">
                      <span className="completed-count">{selectedStudent.completedCount}</span>
                      <span className="total-count"> of {selectedStudent.totalDocuments} documents uploaded</span>
                    </div>
                    <div className="progress-bar-summary">
                      <div 
                        className="progress-fill-summary"
                        style={{ width: `${selectedStudent.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="documents-section">
                <h4>Uploaded Documents</h4>
                <div className="documents-list">
                  {selectedStudent.documents.length === 0 ? (
                    <div className="no-documents">
                      <span className="empty-icon">📭</span>
                      <p>No documents uploaded yet</p>
                    </div>
                  ) : (
                    selectedStudent.documents.map((doc, index) => (
                      <div key={index} className="document-item">
                        <div className="document-icon">
                          📄
                        </div>
                        <div className="document-info">
                          <div className="document-name">{doc.documentName || doc.fileName || 'Document'}</div>
                          <div className="document-meta">
                            <span className="document-type">{getDocumentTypeDisplay(doc.documentType)}</span>
                            <span className="document-size">{formatFileSize(doc.fileSizeBytes || doc.fileSize)}</span>
                            <span className="document-date">{formatDate(doc.uploadDate || doc.createdAt)}</span>
                          </div>
                          <div className="document-status">
                            <span className={getStatusBadgeClass(doc.reviewStatus || doc.status)}>
                              {getStatusText(doc.reviewStatus || doc.status)}
                            </span>
                          </div>
                        </div>
                        <div className="document-actions">
                          <button 
                            className="action-btn view"
                            onClick={() => handleViewDocument(doc)}
                            title="View Document"
                          >
                            👁️ View
                          </button>
                          <button 
                            className="action-btn download"
                            onClick={() => handleDownloadDocument(doc)}
                            title="Download Document"
                          >
                            📥 Download
                          </button>
                          <button 
                            className="action-btn email"
                            onClick={(e) => sendDocumentEmail(doc, selectedStudent, e)}
                            title="Send correction email"
                          >
                            📧 Email
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modal-actions">
                <button 
                  className="download-pdf-btn"
                  onClick={() => handleDownloadAllPDF(selectedStudent)}
                  title="Download all documents as a single PDF file"
                >
                  <span className="btn-icon">📄</span>
                  Download Complete PDF
                </button>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowStudentModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;