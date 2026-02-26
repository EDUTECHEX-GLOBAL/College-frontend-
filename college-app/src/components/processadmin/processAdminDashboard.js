import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./processAdminDashboard.css";
import Applications from "./Applications"; // Import the Applications component

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get process admin token - ONLY look for processAdminToken
const getProcessAdminToken = () => {
  // 1️⃣ Prefer admin token (required for /documents/admin/* APIs)
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    console.log('✅ Using adminToken');
    return adminToken;
  }

  // 2️⃣ Fallback to process-admin token (older / legacy support)
  const processAdminToken = localStorage.getItem('processAdminToken');
  if (processAdminToken) {
    console.log('✅ Using processAdminToken');
    return processAdminToken;
  }

  // 3️⃣ No token found
  console.error('❌ No admin or process-admin token found');
  return null;
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get status badge class
const getStatusBadgeClass = (status) => {
  const statusLower = (status || '').toLowerCase();
  if (statusLower.includes('completed') || statusLower === 'validated') {
    return 'status-badge completed';
  } else if (statusLower.includes('incomplete')) {
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
  if (statusLower.includes('completed') || statusLower === 'validated') return 'COMPLETED';
  if (statusLower.includes('incomplete')) return 'INCOMPLETE';
  if (statusLower.includes('in progress')) return 'IN PROGRESS';
  if (statusLower.includes('pending')) return 'PENDING';
  if (statusLower.includes('not started')) return 'NOT STARTED';
  return status?.toUpperCase() || 'PENDING';
};

const ProcessAdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [processAdminData, setProcessAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [kansusExpanded, setKansusExpanded] = useState(false);

  // Applications state
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Documents state
  const [allDocuments, setAllDocuments] = useState([]);
  const [groupedApplications, setGroupedApplications] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalApplications: 0,
    incomplete: 0
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Document types for display
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
    return typeMap[type] || type?.replace(/_/g, ' ')?.toUpperCase() || 'Unknown';
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' Bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Check authentication on component mount
  useEffect(() => {
    const token = getProcessAdminToken();
    const adminData = localStorage.getItem('processAdminData');
    
    console.log('========== AUTH CHECK ==========');
    console.log('Process Admin Token exists:', !!token);
    
    if (!token) {
      console.log('No process admin token found, redirecting to login');
      navigate("/process-admin-login");
      return;
    }

    // Set axios default authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Parse and set admin data
    try {
      if (adminData) {
        const parsed = JSON.parse(adminData);
        setProcessAdminData(parsed);
        console.log('Process Admin Data:', parsed);
      }
    } catch (error) {
      console.error("Error parsing admin data:", error);
    }
    
    setLoading(false);
  }, [navigate]);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    } else if (activeTab === "documents") {
      fetchAllDocuments();
    }
  }, [activeTab]);

  const handleLogout = () => {
    // Clear process admin tokens only
    localStorage.removeItem('processAdminToken');
    localStorage.removeItem('processAdminData');
    localStorage.removeItem('processAdminEmail');
    
    delete axios.defaults.headers.common['Authorization'];
    navigate("/process-admin-login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const refreshDashboard = () => {
    if (activeTab === "documents") {
      fetchAllDocuments();
    } else if (activeTab === "applications") {
      fetchApplications();
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleKansusMenu = () => {
    setKansusExpanded(!kansusExpanded);
  };

  // ============ APPLICATIONS APIs ============
  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const token = localStorage.getItem('processAdminToken');
      console.log('Fetching applications with token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('No token found');
        navigate('/process-admin-login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/process-admin/documents/all`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Applications response:', response.data);
      
      if (response.data?.success && response.data?.data?.applications) {
        setApplications(response.data.data.applications);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('processAdminToken');
        localStorage.removeItem('processAdminData');
        navigate('/process-admin-login');
      }
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const viewApplicationDetails = async (applicationId) => {
    try {
      const token = getProcessAdminToken();
      const response = await axios.get(`${API_BASE_URL}/process-admin/applications/${applicationId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle response
      let appDetails = response.data;
      if (response.data.data) {
        appDetails = response.data.data;
      }
      
      setSelectedApplication(appDetails);
    } catch (error) {
      console.error("Error fetching application details:", error);
      alert('Failed to load application details');
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const token = getProcessAdminToken();
      await axios.put(`${API_BASE_URL}/process-admin/applications/${applicationId}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchApplications();
      setSelectedApplication(null);
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  };

  // ============ DOCUMENTS APIs ============

  // Handle send document email for correction
  const sendDocumentEmail = async (document, student, event) => {
    try {
      const token = getProcessAdminToken();
      if (!token) {
        alert('Authentication required. Please login.');
        return;
      }

      // Show sending indicator
      const emailBtn = event?.target;
      if (emailBtn) {
        const originalText = emailBtn.innerHTML;
        emailBtn.innerHTML = 'Sending...';
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
          fetchAllDocuments();
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
      const token = getProcessAdminToken();
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

      console.log('Generating combined PDF for student:', student.studentId);

      // Call the PDF generation endpoint (same as admin dashboard)
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

  // Group documents by student and calculate progress
  const groupDocumentsByStudent = (documents) => {
    const groups = {};
    let totalApplications = 0;
    let incomplete = 0;

    documents.forEach(doc => {
      const studentId = doc.studentId || doc.userId || doc._id || 'N/A';
      
      if (!studentId || studentId === 'N/A' || studentId === 'undefined') {
        return;
      }
      
      const studentName = doc.studentName || doc.userName || 'Unknown Student';
      const studentEmail = doc.studentEmail || doc.userEmail || 'No email';
      const collegeId = doc.collegeId || 'N/A';
      const applicationId = doc.applicationId || doc._id || 'N/A';
        
      if (!groups[studentId]) {
        groups[studentId] = {
          studentId,
          collegeId,
          studentName,
          studentEmail,
          applicationId,
          documents: [],
          totalDocuments: 0,
          completedCount: 0,
          incompleteCount: 0,
          progressPercentage: 0,
          latestSubmission: null,
          status: 'NOT STARTED',
          profilePic: studentName.charAt(0).toUpperCase()
        };
        totalApplications++;
      }

      groups[studentId].documents.push(doc);
      groups[studentId].totalDocuments++;

      const docStatus = (doc.reviewStatus || doc.status || '').toLowerCase();
      if (docStatus.includes('approved') || docStatus === 'validated' || docStatus === 'completed') {
        groups[studentId].completedCount++;
      } else if (docStatus.includes('rejected') || docStatus.includes('incomplete')) {
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
      
      if (group.progressPercentage === 100) {
        group.status = 'COMPLETED';
      } else if (group.incompleteCount > 0) {
        group.status = 'INCOMPLETE';
        incomplete++;
      } else if (group.progressPercentage > 0) {
        group.status = 'IN PROGRESS';
      } else {
        group.status = 'NOT STARTED';
      }
    });

    setStats({
      totalApplications,
      incomplete
    });

    return Object.values(groups);
  };

  // Fetch all documents from API
  const fetchAllDocuments = async () => {
    try {
      setDocumentsLoading(true);
      setDocumentsError('');
      
      const token = getProcessAdminToken();
      console.log('========== FETCHING DOCUMENTS ==========');
      console.log('Token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      if (!token) {
        setDocumentsError('No authentication token found. Please login again.');
        setDocumentsLoading(false);
        return;
      }

      // ✅ CHANGE THIS: Use the new process admin endpoint
      const endpoint = `${API_BASE_URL}/process-admin/documents/all`;
      
      console.log('Fetching from:', endpoint);
      
      const response = await axios.get(endpoint, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 1000
        }
      });

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (response.data) {
        let documents = [];
        
        if (Array.isArray(response.data)) {
          documents = response.data;
        } else if (response.data.documents && Array.isArray(response.data.documents)) {
          documents = response.data.documents;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          documents = response.data.data;
        }

        console.log(`Found ${documents.length} documents`);
        setAllDocuments(documents);
        
        if (documents.length > 0) {
          const grouped = groupDocumentsByStudent(documents);
          console.log(`Grouped into ${grouped.length} applications`);
          setGroupedApplications(grouped);
        } else {
          setGroupedApplications([]);
          setStats({ totalApplications: 0, incomplete: 0 });
        }
        
        setDocumentsError('');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      
      if (err.response?.status === 401) {
        setDocumentsError('Invalid token. Please login again.');
      } else if (err.response?.status === 403) {
        setDocumentsError('Access forbidden. You don\'t have permission.');
      } else if (err.response?.status === 404) {
        setDocumentsError('Documents endpoint not found.');
      } else {
        setDocumentsError('Failed to load documents. Please try again.');
      }
      
      setAllDocuments([]);
      setGroupedApplications([]);
      setStats({ totalApplications: 0, incomplete: 0 });
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Handle view student details
  const handleViewStudent = (student) => {
    console.log('Viewing student:', student);
    setSelectedStudent(student);
    setShowStudentModal(true);
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

      const token = getProcessAdminToken();
      
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
        // For external URLs, use a trick to force download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = documentItem.documentName || documentItem.fileName || 'document.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Unable to download document. Please try again.');
    }
  };

  // Handle search for documents
  const handleDocSearch = (e) => {
    e.preventDefault();
    fetchAllDocuments();
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Reset filters
  const handleResetFilters = () => {
    setDocSearchQuery('');
    setStatusFilter('all');
    fetchAllDocuments();
  };

  // ============ RENDER FUNCTIONS ============

  // Dashboard View
  const renderDashboard = () => {
    return (
      <div className="dashboard-content-area">
        <div className="welcome-section">
          <h2>Dashboard Overview</h2>
          <p>Welcome, {processAdminData?.email || 'Process Admin'}!</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>PROCESSES TODAY</h3>
              <div className="stat-value">0</div>
              <div className="stat-subvalue">0% from yesterday</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>PROCESSES THIS WEEK</h3>
              <div className="stat-value">0</div>
              <div className="stat-subvalue">0% from last week</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>TOTAL APPLICATIONS</h3>
              <div className="stat-value">{applications.length}</div>
              <div className="stat-subvalue">From all universities</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <h3>TOTAL DOCUMENTS</h3>
              <div className="stat-value">{groupedApplications.length}</div>
              <div className="stat-subvalue">Student applications</div>
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="chart-placeholder">
          <p>Process analytics will appear here</p>
        </div>
      </div>
    );
  };

  // Applications View - UPDATED to use the imported Applications component
  const renderApplications = () => {
    return (
      <Applications 
        applications={applications}
        applicationsLoading={applicationsLoading}
        searchQuery={searchQuery}
        onViewDetails={viewApplicationDetails}
        onRefresh={fetchApplications}
        selectedApplication={selectedApplication}
        onCloseModal={() => setSelectedApplication(null)}
        onUpdateStatus={updateApplicationStatus}
        formatDate={formatDate}
      />
    );
  };

  // Documents View
  const renderDocuments = () => {
    return (
      <div className="documents-content">
        <div className="welcome-section">
          <h2>Documents Management</h2>
          <p>Manage and track all application documents</p>
        </div>

        {/* Stats Cards */}
        <div className="summary-cards">
          <div className="summary-card total-applications">
            <div className="summary-icon">
              <span>📋</span>
            </div>
            <div className="summary-content">
              <h3>TOTAL APPLICATIONS</h3>
              <div className="summary-value">{stats.totalApplications}</div>
            </div>
          </div>
          
          <div className="summary-card incomplete-applications">
            <div className="summary-icon">
              <span>⚠️</span>
            </div>
            <div className="summary-content">
              <h3>INCOMPLETE</h3>
              <div className="summary-value">{stats.incomplete}</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="documents-filters">
          <form onSubmit={handleDocSearch} className="search-container">
            <input
              type="text"
              placeholder="Search by student name, email, or college ID..."
              value={docSearchQuery}
              onChange={(e) => setDocSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              Search
            </button>
          </form>
          
          <div className="filter-container">
            <select 
              value={statusFilter} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="incomplete">Incomplete</option>
              <option value="in progress">In Progress</option>
              <option value="not started">Not Started</option>
            </select>
            
            <button 
              onClick={handleResetFilters}
              className="filter-reset-btn"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {documentsError && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {documentsError}
            {documentsError.includes('login') && (
              <button onClick={handleLogout} className="login-redirect-btn">
                Go to Login
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {documentsLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading documents...</p>
          </div>
        )}

        {/* Applications Table */}
        {!documentsLoading && (
          <div className="applications-table-container">
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
                {groupedApplications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  groupedApplications.map((app) => (
                    <tr key={app.studentId}>
                      <td>{app.collegeId}</td>
                      <td>
                        <div className="student-info">
                          <div className="student-profile-pic">
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
                      <td>{app.latestSubmission ? formatDate(app.latestSubmission) : 'Not submitted'}</td>
                      <td>
                        <div className="progress-container">
                          <div className="progress-text">{app.progressPercentage}%</div>
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
                          title="View Application Details"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Documents Footer */}
        <div className="documents-footer">
          <div className="table-info">
            <p>Showing {groupedApplications.length} of {groupedApplications.length} applications</p>
            <button className="refresh-btn-small" onClick={refreshDashboard}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ===== STUDENT DETAILS MODAL WITH EMAIL BUTTON AND DOWNLOAD PDF ===== */}
        {showStudentModal && selectedStudent && (
          <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
            <div className="student-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Application Details</h3>
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
                    <div className="student-college-id">{selectedStudent.collegeId}</div>
                    <div className="student-email-large">{selectedStudent.studentEmail}</div>
                    <div className="application-id">APPLICATION ID: {selectedStudent.applicationId}</div>
                    <div className="submission-date">SUBMITTED: {selectedStudent.latestSubmission ? formatDate(selectedStudent.latestSubmission) : 'Not submitted'}</div>
                  </div>
                </div>

                {/* Application Status */}
                <div className="application-status-section">
                  <div className="status-card">
                    <div className="status-label">Overall Status</div>
                    <div className={`status-value ${selectedStudent.status.toLowerCase()}`}>
                      {getStatusText(selectedStudent.status)}
                    </div>
                    <div className="progress-summary">
                      <div className="progress-summary-text">
                        {selectedStudent.completedCount} of {selectedStudent.totalDocuments} documents uploaded
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
                      <div className="no-documents">No documents uploaded yet</div>
                    ) : (
                      selectedStudent.documents.map((doc, index) => (
                        <div key={index} className="document-item">
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
                              className="view-doc-btn"
                              onClick={() => handleViewDocument(doc)}
                            >
                              👁️ View
                            </button>
                            <button 
                              className="download-doc-btn"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              📥 Download
                            </button>
                            <button 
                              className="email-doc-btn"
                              onClick={(e) => sendDocumentEmail(doc, selectedStudent, e)}
                              title="Send document correction email"
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
                    📄 Download Complete PDF
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

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "applications":
        return renderApplications();
      case "documents":
        return renderDocuments();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="process-admin-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Process Panel</h2>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <ul className="sidebar-menu">
          <li 
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="menu-icon">📊</span>
            {sidebarOpen && <span>Dashboard</span>}
          </li>
          
          {/* Kansus University with dropdown arrow */}
          <li 
            className={`kansus-parent ${kansusExpanded ? 'expanded' : ''}`}
            onClick={toggleKansusMenu}
          >
            <span className="menu-icon">🏛️</span>
            {sidebarOpen && (
              <>
                <span>Kansus University</span>
                <span className="dropdown-arrow">{kansusExpanded ? '▼' : '▶'}</span>
              </>
            )}
          </li>
          
          {/* Sub-menu items - Applications and Documents */}
          {kansusExpanded && sidebarOpen && (
            <ul className="sub-menu">
              <li 
                className={activeTab === "applications" ? "active" : ""}
                onClick={() => setActiveTab("applications")}
              >
                <span className="menu-icon sub-icon">📋</span>
                <span>Applications</span>
              </li>
              <li 
                className={activeTab === "documents" ? "active" : ""}
                onClick={() => setActiveTab("documents")}
              >
                <span className="menu-icon sub-icon">📁</span>
                <span>Documents</span>
              </li>
            </ul>
          )}
        </ul>
        
        <div className="sidebar-footer">
          <button className="logout-btn-sidebar" onClick={handleLogout}>
            <span className="menu-icon">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navbar */}
        <nav className="navbar">
          <div className="navbar-left">
            <h1>Process Admin Dashboard</h1>
          </div>
          
          <div className="navbar-center">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
              <button className="search-btn">🔍</button>
            </div>
          </div>
          
          <div className="navbar-right">
            <div className="admin-profile">
              <span className="profile-icon">👨‍💼</span>
              <span className="profile-name">
                {processAdminData?.email || "Process Admin"}
              </span>
            </div>
            <button className="refresh-btn" onClick={refreshDashboard} title="Refresh">
              🔄
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <div className="content-area">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="dashboard-footer">
          <p>© 2026 Process Admin Dashboard. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default ProcessAdminDashboard;