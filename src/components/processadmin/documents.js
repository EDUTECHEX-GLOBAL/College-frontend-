// Documents.js — Navy Blue Design System (matches Applications page)
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./documents.css";

const API_BASE_URL = process.env.REACT_APP_API_URL ;

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
  const [activeTab, setActiveTab] = useState('documents');

  const getToken = () => {
    const token = localStorage.getItem('processAdminToken');
    if (!token) console.error('❌ No process-admin token found');
    else console.log('✅ Using processAdminToken:', token.substring(0, 20) + '...');
    return token;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' Bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentTypeDisplay = (type) => {
    const typeMap = {
      'transcript': 'Transcript', 'diploma': 'Diploma/Certificate',
      'test_scores': 'Test Scores', 'language_proficiency': 'Language Proficiency',
      'recommendation_letter': 'Recommendation Letter', 'resume': 'Resume/CV',
      'marksheet_9th': '9th Marksheet', 'marksheet_10th': '10th Marksheet',
      'marksheet_12th': '12th Marksheet', 'id_proof': 'ID Proof',
      'passport': 'Passport', 'other': 'Other'
    };
    if (typeof type === 'string' && type.includes('MARKSHEET')) return type;
    return typeMap[type] || type?.replace(/_/g, ' ')?.toUpperCase() || 'Unknown';
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed') || s === 'validated' || s === 'approved') return 'doc-badge doc-badge-completed';
    if (s.includes('rejected') || s.includes('incomplete')) return 'doc-badge doc-badge-incomplete';
    if (s.includes('in progress') || s.includes('pending')) return 'doc-badge doc-badge-progress';
    if (s.includes('not started')) return 'doc-badge doc-badge-notstarted';
    return 'doc-badge';
  };

  const getStatusText = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed') || s === 'validated' || s === 'approved') return 'Completed';
    if (s.includes('rejected')) return 'Rejected';
    if (s.includes('incomplete')) return 'Incomplete';
    if (s.includes('in progress')) return 'In Progress';
    if (s.includes('pending')) return 'Pending';
    if (s.includes('not started')) return 'Not Started';
    return status || 'Pending';
  };

  const getAvatarColor = (name = '') => {
    const colors = ['av-blue', 'av-purple', 'av-teal', 'av-amber', 'av-coral'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const getProgressBarClass = (pct) => {
    if (pct >= 90) return 'doc-pf-blue';
    if (pct >= 70) return 'doc-pf-indigo';
    if (pct >= 40) return 'doc-pf-amber';
    return 'doc-pf-red';
  };

  const groupDocumentsByStudent = (docs) => {
    const groups = {};
    let totalApplications = 0;
    let incomplete = 0;

    docs.forEach(doc => {
      const studentId = doc.studentId || doc.userId;
      if (!studentId) return;
      if (!groups[studentId]) {
        groups[studentId] = {
          studentId, collegeId: doc.collegeId || 'N/A',
          studentName: doc.studentName || doc.userName || 'Unknown Student',
          studentEmail: doc.studentEmail || doc.userEmail || 'No email',
          applicationId: doc.applicationId || doc._id,
          documents: [], totalDocuments: 0,
          completedCount: 0, incompleteCount: 0, rejectedCount: 0,
          progressPercentage: 0, latestSubmission: null, status: 'NOT STARTED',
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
        ? Math.round((group.completedCount / group.totalDocuments) * 100) : 0;
      if (group.progressPercentage === 100 && group.rejectedCount === 0) {
        group.status = 'COMPLETED';
      } else if (group.rejectedCount > 0 || group.incompleteCount > 0) {
        group.status = 'INCOMPLETE'; incomplete++;
      } else if (group.progressPercentage > 0) {
        group.status = 'IN PROGRESS';
      } else {
        group.status = 'NOT STARTED';
      }
    });

    setStats({ totalApplications, incomplete });
    return Object.values(groups);
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true); setError('');
      const token = getToken();
      if (!token) { setError('No authentication token found. Please login again.'); setLoading(false); return; }
      const response = await axios.get(`${API_BASE_URL}/api/process-admin/documents/all`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        params: { limit: 1000 }
      });
      let documentsList = [];
      if (Array.isArray(response.data)) documentsList = response.data;
      else if (response.data.documents && Array.isArray(response.data.documents)) documentsList = response.data.documents;
      else if (response.data.data && Array.isArray(response.data.data)) documentsList = response.data.data;
      setDocuments(documentsList);
      if (documentsList.length > 0) {
        setGroupedApplications(groupDocumentsByStudent(documentsList));
      } else {
        setGroupedApplications([]);
      }
    } catch (err) {
      if (err.response?.status === 401) setError('Session expired. Please login again.');
      else if (err.response?.status === 403) setError("Access forbidden. You don't have permission.");
      else if (err.response?.status === 404) setError('Documents endpoint not found.');
      else setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc) => {
    const fileUrl = doc.downloadUrl || doc.fileUrl || doc.url;
    if (!fileUrl) { alert('Document URL not available'); return; }
    window.open(fileUrl, '_blank');
  };

  const handleDownloadDocument = async (documentItem) => {
    try {
      const fileUrl = documentItem.downloadUrl || documentItem.fileUrl || documentItem.url;
      if (!fileUrl) { alert('Document URL not available'); return; }
      const token = getToken();
      if (fileUrl.includes('/uploads/')) {
        const response = await fetch(fileUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const blob = await response.blob();
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = documentItem.documentName || documentItem.fileName || 'document';
          if (contentDisposition && contentDisposition.includes('filename=')) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) filename = match[1].replace(/['"]/g, '');
          }
          if (!filename.includes('.')) filename += '.' + (blob.type.split('/')[1] || 'pdf');
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(link.href), 100);
        } else { alert('Failed to download document.'); }
      } else { window.open(fileUrl, '_blank'); }
    } catch (error) { alert('Unable to download document. Please try again.'); }
  };

  const sendDocumentEmail = async (doc, student, event) => {
    try {
      const token = getToken();
      if (!token) { alert('Authentication required. Please login.'); return; }
      const emailBtn = event?.target;
      if (emailBtn) {
        const originalText = emailBtn.innerHTML;
        emailBtn.innerHTML = 'Sending…'; emailBtn.disabled = true;
        let reason = 'incorrect_format', expectedType = '';
        if (doc.documentType === 'marksheet_10th') { reason = 'wrong_document'; expectedType = '10th Marksheet'; }
        else if (doc.reviewStatus === 'rejected') { reason = doc.rejectionReason || 'incorrect_format'; }
        const fileName = doc.documentName || doc.fileName || '';
        if (fileName.toLowerCase().includes('10th')) expectedType = '10th Marksheet';
        else if (fileName.toLowerCase().includes('9th')) expectedType = '9th Marksheet';
        else if (fileName.toLowerCase().includes('12th')) expectedType = '12th Marksheet';
        const response = await axios.post(
          `${API_BASE_URL}/api/process-admin/documents/${doc._id || doc.id}/send-correction`,
          { reason, adminNotes: `The document you uploaded ("${fileName}") was labeled as a "${getDocumentTypeDisplay(doc.documentType)}", which is incorrect or inconsistent.`, uploadedType: doc.documentType, expectedType },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (response.data.success) { alert(`✓ Correction email sent to ${student.studentEmail}`); fetchDocuments(); }
        else alert('Failed to send email: ' + (response.data.message || 'Please try again.'));
        setTimeout(() => { emailBtn.innerHTML = originalText; emailBtn.disabled = false; }, 1000);
      }
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message || 'Failed to send email.'}`);
      const emailBtn = event?.target;
      if (emailBtn) { emailBtn.innerHTML = 'Email'; emailBtn.disabled = false; }
    }
  };

  const handleDownloadAllPDF = async (student) => {
    try {
      const token = getToken();
      if (!token) { alert('Authentication required.'); return; }
      const downloadBtn = document.querySelector('.doc-dl-pdf-btn');
      const originalText = downloadBtn?.innerHTML;
      if (downloadBtn) { downloadBtn.innerHTML = 'Generating PDF…'; downloadBtn.disabled = true; }
      const response = await axios.get(
        `${API_BASE_URL}/api/process-admin/documents/generate-pdf/${student.studentId}`,
        { headers: { 'Authorization': `Bearer ${token}` }, responseType: 'blob', timeout: 120000 }
      );
      if (response.data) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().split('T')[0];
        link.href = fileURL;
        link.download = `${student.studentName.replace(/\s+/g, '_')}_Complete_Application_${timestamp}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(fileURL), 100);
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') alert('PDF generation timeout. Please try again.');
      else if (error.response?.status === 404) alert('No documents found for this student.');
      else alert('Failed to generate PDF. Please try again.');
    } finally {
      const downloadBtn = document.querySelector('.doc-dl-pdf-btn');
      if (downloadBtn) { downloadBtn.innerHTML = 'Download Complete PDF'; downloadBtn.disabled = false; }
    }
  };

  const handleViewStudent = (student) => { setSelectedStudent(student); setShowStudentModal(true); };

  useEffect(() => { fetchDocuments(); }, []);

  const filteredApplications = groupedApplications.filter(app => {
    const matchesSearch = searchQuery === '' ||
      app.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.collegeId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  /* ── Icons ── */
  const IcoRefresh = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
  const IcoSearch = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  const IcoEye = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const IcoDl = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
  const IcoMail = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
  const IcoDoc = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
  const IcoApps = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
  const IcoWarn = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
  const IcoCheck = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
  const IcoFolder = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  );

  const completedCount = stats.totalApplications - stats.incomplete;

  return (
    <div className="doc-container">

      {/* ── Hero header — University Directory style ── */}
      <div className="doc-hero">
        <div className="doc-hero-accent"/>
        <div className="doc-hero-left">
          <div className="doc-hero-title">Documents<br/>Management</div>
          <div className="doc-hero-sub">Manage and track all student documents</div>
        </div>
        <div className="doc-hero-right">
          <div className="doc-hero-badge">
            <div className="doc-hero-badge-num">{stats.totalApplications}</div>
            <div className="doc-hero-badge-lbl">Documents</div>
          </div>
          <button className="doc-refresh-btn" onClick={fetchDocuments}><IcoRefresh /> Refresh</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="doc-tabs">
        {[
          { key: 'applications', label: 'Applications', Icon: IcoApps },
          { key: 'documents',    label: 'Documents',    Icon: IcoDoc },
          { key: 'requests',     label: 'Requests',     Icon: IcoFolder },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`doc-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      {/* ── Stat cards — University Directory style ── */}
      <div className="doc-stats-grid">
        <div className="doc-sc">
          <div className="doc-sc-icon doc-ic-blue"><IcoApps /></div>
          <div>
            <div className="doc-sc-lbl">Total Applications</div>
            <div className="doc-sc-val">{stats.totalApplications}</div>
            <div className="doc-sc-sub">{completedCount} Completed · {stats.incomplete} Incomplete</div>
          </div>
        </div>
        <div className="doc-sc">
          <div className="doc-sc-icon doc-ic-coral"><IcoWarn /></div>
          <div>
            <div className="doc-sc-lbl">Incomplete</div>
            <div className="doc-sc-val">{stats.incomplete}</div>
            <div className="doc-sc-sub">Needs attention</div>
          </div>
        </div>
        <div className="doc-sc">
          <div className="doc-sc-icon doc-ic-green"><IcoCheck /></div>
          <div>
            <div className="doc-sc-lbl">Completed</div>
            <div className="doc-sc-val">{completedCount}</div>
            <div className="doc-sc-sub">All docs uploaded</div>
          </div>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="doc-table-card">

        {/* Toolbar */}
        <div className="doc-toolbar">
          <div className="doc-search-wrap">
            <span className="doc-search-ico"><IcoSearch /></span>
            <input
              type="text"
              className="doc-search-input"
              placeholder="Search by name, email, or college ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="doc-clear-search" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
          <select className="doc-filter-sel" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in progress">In Progress</option>
            <option value="incomplete">Incomplete</option>
            <option value="not started">Not Started</option>
          </select>
          <button className="doc-reset-btn" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
            ↺ Reset
          </button>
          <button className="doc-refresh-btn" onClick={fetchDocuments}><IcoRefresh /> Refresh</button>
        </div>

        {/* Error */}
        {error && (
          <div className="doc-error">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
            {error.includes('login') && (
              <button onClick={() => window.location.href = '/process-admin-login'} className="doc-error-login">Go to Login</button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="doc-loading">
            <div className="doc-spinner"/>
            <p>Loading documents…</p>
          </div>
        )}

        {/* Desktop table */}
        {!loading && !error && (
          <div className="doc-desktop-table">
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>College ID</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Progress</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="doc-no-results">
                        <div className="doc-empty-table">
                          <p>No applications found</p>
                          <button onClick={fetchDocuments} className="doc-retry-btn">Refresh</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app.studentId}>
                        <td><span className="doc-cid-badge">{app.collegeId}</span></td>
                        <td>
                          <div className="doc-student-cell">
                            <div className={`doc-avatar ${getAvatarColor(app.studentName)}`}>
                              {app.profilePic}
                            </div>
                            <div className="doc-student-info">
                              <strong>{app.studentName}</strong>
                              <small>{app.studentEmail}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(app.status)}>
                            {getStatusText(app.status)}
                          </span>
                        </td>
                        <td className="doc-date">
                          {app.latestSubmission ? formatDate(app.latestSubmission) : 'Not submitted'}
                        </td>
                        <td>
                          <div className="doc-prog-wrap">
                            <div className="doc-prog-bar">
                              <div
                                className={`doc-prog-fill ${getProgressBarClass(app.progressPercentage)}`}
                                style={{ width: `${app.progressPercentage}%` }}
                              />
                            </div>
                            <span className="doc-prog-pct">{app.progressPercentage}%</span>
                          </div>
                        </td>
                        <td>
                          <button className="doc-view-btn" onClick={() => handleViewStudent(app)}>
                            <IcoEye /> View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredApplications.length > 0 && (
              <div className="doc-table-footer">
                <span className="doc-footer-count">
                  Showing {filteredApplications.length} of {groupedApplications.length} applications
                </span>
                <button className="doc-refresh-btn" onClick={fetchDocuments}><IcoRefresh /> Refresh</button>
              </div>
            )}
          </div>
        )}

        {/* Mobile card list */}
        {!loading && !error && (
          <div className="doc-mobile-list">
            {filteredApplications.length === 0 ? (
              <div className="doc-empty-table" style={{padding:'2rem'}}>
                <p>No applications found</p>
              </div>
            ) : (
              <>
                {filteredApplications.map((app) => (
                  <div className="doc-mob-card" key={app.studentId}>
                    <div className="doc-mob-card-top">
                      <span className="doc-cid-badge">{app.collegeId}</span>
                      <span className={getStatusBadgeClass(app.status)}>{getStatusText(app.status)}</span>
                    </div>
                    <div className="doc-mob-card-body">
                      <div className="doc-mob-student">
                        <div className={`doc-avatar ${getAvatarColor(app.studentName)}`}>{app.profilePic}</div>
                        <div>
                          <div className="doc-mob-name">{app.studentName}</div>
                          <div className="doc-mob-email">{app.studentEmail}</div>
                        </div>
                      </div>
                      <div className="doc-mob-details">
                        <div className="doc-mob-detail-item">
                          <span className="doc-mob-detail-lbl">Submitted</span>
                          <span className="doc-mob-detail-val">{app.latestSubmission ? formatDate(app.latestSubmission) : 'N/A'}</span>
                        </div>
                        <div className="doc-mob-detail-item">
                          <span className="doc-mob-detail-lbl">Docs</span>
                          <span className="doc-mob-detail-val">{app.completedCount}/{app.totalDocuments}</span>
                        </div>
                        <div className="doc-mob-detail-item doc-mob-full">
                          <span className="doc-mob-detail-lbl">Progress</span>
                          <div className="doc-prog-wrap">
                            <div className="doc-prog-bar">
                              <div className={`doc-prog-fill ${getProgressBarClass(app.progressPercentage)}`} style={{width:`${app.progressPercentage}%`}}/>
                            </div>
                            <span className="doc-prog-pct">{app.progressPercentage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="doc-mob-card-footer">
                      <button className="doc-view-btn" style={{flex:1,justifyContent:'center'}} onClick={() => handleViewStudent(app)}>
                        <IcoEye /> View Details
                      </button>
                    </div>
                  </div>
                ))}
                <div className="doc-mob-list-footer">
                  <span>Showing {filteredApplications.length} of {groupedApplications.length} applications</span>
                  <button className="doc-refresh-btn" onClick={fetchDocuments}><IcoRefresh /> Refresh</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Student Details Modal ── */}
      {showStudentModal && selectedStudent && (
        <div className="doc-modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="doc-modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="doc-modal-header">
              <div className="doc-modal-title-wrap">
                <h2>Application Details</h2>
                <div className="doc-modal-subtitle">
                  <span className="doc-modal-student-name">{selectedStudent.studentName}</span>
                  <span className="doc-modal-cid">{selectedStudent.collegeId}</span>
                </div>
              </div>
              <button className="doc-modal-close" onClick={() => setShowStudentModal(false)}>×</button>
            </div>

            <div className="doc-modal-content">

              {/* Student info */}
              <div className="doc-info-section">
                <div className="doc-student-info-header">
                  <div className={`doc-avatar-lg ${getAvatarColor(selectedStudent.studentName)}`}>
                    {selectedStudent.profilePic}
                  </div>
                  <div className="doc-student-header-details">
                    <h3>{selectedStudent.studentName}</h3>
                    <span className="doc-cid-badge">{selectedStudent.collegeId}</span>
                    <div className="doc-email-lg">{selectedStudent.studentEmail}</div>
                    <div className="doc-meta-row">
                      <span className="doc-meta-item"><span className="doc-meta-lbl">App ID:</span><span className="doc-meta-val">{selectedStudent.applicationId}</span></span>
                      <span className="doc-meta-item"><span className="doc-meta-lbl">Submitted:</span><span className="doc-meta-val">{selectedStudent.latestSubmission ? formatDate(selectedStudent.latestSubmission) : 'Not submitted'}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status + progress */}
              <div className="doc-info-section">
                <h3>Overall Status</h3>
                <div className="doc-status-card">
                  <div className="doc-status-card-hdr">
                    <span className="doc-status-card-lbl">Status</span>
                    <span className={getStatusBadgeClass(selectedStudent.status)}>{getStatusText(selectedStudent.status)}</span>
                  </div>
                  <div className="doc-progress-summary-txt">
                    <strong>{selectedStudent.completedCount}</strong> of {selectedStudent.totalDocuments} documents uploaded
                  </div>
                  <div className="doc-prog-bar doc-prog-bar-lg">
                    <div className={`doc-prog-fill ${getProgressBarClass(selectedStudent.progressPercentage)}`} style={{width:`${selectedStudent.progressPercentage}%`}}/>
                  </div>
                </div>
              </div>

              {/* Documents list */}
              <div className="doc-info-section">
                <h3>Uploaded Documents</h3>
                {selectedStudent.documents.length === 0 ? (
                  <div className="doc-no-docs"><p>No documents uploaded yet</p></div>
                ) : (
                  <div className="doc-doc-list">
                    {selectedStudent.documents.map((doc, index) => (
                      <div key={index} className="doc-doc-item">
                        <div className="doc-doc-file-icon">
                          <IcoDoc />
                        </div>
                        <div className="doc-doc-info">
                          <div className="doc-doc-name">{doc.documentName || doc.fileName || 'Document'}</div>
                          <div className="doc-doc-meta">
                            <span className="doc-doc-type">{getDocumentTypeDisplay(doc.documentType)}</span>
                            <span className="doc-doc-size">{formatFileSize(doc.fileSizeBytes || doc.fileSize)}</span>
                            <span className="doc-doc-date">{formatDate(doc.uploadDate || doc.createdAt)}</span>
                          </div>
                          <div className="doc-doc-status">
                            <span className={getStatusBadgeClass(doc.reviewStatus || doc.status)}>
                              {getStatusText(doc.reviewStatus || doc.status)}
                            </span>
                          </div>
                        </div>
                        <div className="doc-doc-actions">
                          <button className="doc-act-btn doc-act-view" onClick={() => handleViewDocument(doc)}>
                            <IcoEye /> View
                          </button>
                          <button className="doc-act-btn doc-act-dl" onClick={() => handleDownloadDocument(doc)}>
                            <IcoDl /> Download
                          </button>
                          <button className="doc-act-btn doc-act-email" onClick={(e) => sendDocumentEmail(doc, selectedStudent, e)}>
                            <IcoMail /> Email
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal actions */}
              <div className="doc-modal-actions">
                <button className="doc-btn-secondary" onClick={() => setShowStudentModal(false)}>Close</button>
                <button className="doc-dl-pdf-btn doc-btn-primary" onClick={() => handleDownloadAllPDF(selectedStudent)}>
                  <IcoDl /> Download Complete PDF
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