import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import './AdminVerifyDocuments.css';

const statusLabels = {
  pending_admin_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes Requested',
};
const statusClasses = {
  pending_admin_review: 'avd-status-pending',
  approved: 'avd-status-approved',
  rejected: 'avd-status-rejected',
  changes_requested: 'avd-status-changes',
};
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending_admin_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'changes_requested', label: 'Changes Requested' },
];
const formatDate = value => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const resolveDocumentUrl = value => !value ? '' : (value.startsWith('http://') || value.startsWith('https://') ? value : API_BASE_URL + (value.startsWith('/') ? '' : '/') + value);
const getInitials = name => String(name || 'Unknown').split(' ').filter(Boolean).map(word => word[0]).slice(0, 2).join('').toUpperCase();
const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const RefreshIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;

const StatusBadge = ({ status }) => (
  <span className={`avd-status ${statusClasses[status] || 'avd-status-pending'}`}>
    <span className="avd-status-dot" />{statusLabels[status] || 'Pending Review'}
  </span>
);

const StatCard = ({ label, value, accent }) => <div className={`avd-stat-card ${accent}`}><div className="avd-stat-label">{label}</div><div className="avd-stat-value">{value}</div></div>;

const AdminVerifyDocuments = () => {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [reason, setReason] = useState('');
  const [decisionAction, setDecisionAction] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
  const api = useCallback(config => axios({ baseURL: API_BASE_URL, ...config, headers: { Authorization: `Bearer ${token}`, ...(config.headers || {}) } }), [token]);

  const loadQueue = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await api({ method: 'get', url: '/api/admin/verification/verify-documents' });
      setApplications(response.data.data || []);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load verification queue.'); }
    finally { setLoading(false); }
  }, [api]);
  useEffect(() => { loadQueue(); }, [loadQueue]);
  useEffect(() => {
    const handleClickOutside = event => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };
    const handleEscape = event => {
      if (event.key === 'Escape') setStatusDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications.filter(app => {
      const matchesStatus = !statusFilter || app.verificationStatus === statusFilter;
      const matchesSearch = !query || [app.applicationId, app.studentName, app.email, app.university, app.programme].some(value => String(value || '').toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [applications, search, statusFilter]);

  const selectedStatusLabel = STATUS_OPTIONS.find(option => option.value === statusFilter)?.label || 'All Status';

  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter(app => app.verificationStatus === 'pending_admin_review').length,
    approved: applications.filter(app => app.verificationStatus === 'approved').length,
    changes: applications.filter(app => app.verificationStatus === 'changes_requested').length,
  }), [applications]);

  const openDetail = async applicationId => {
    setDetailLoading(true); setError(''); setReason('');
    try { const response = await api({ method: 'get', url: `/api/admin/verification/verify-documents/${encodeURIComponent(applicationId)}` }); setSelected(response.data.data); }
    catch (err) { setError(err.response?.data?.message || 'Failed to load application details.'); }
    finally { setDetailLoading(false); }
  };

  const openPdf = async (applicationId, download = false) => {
    try {
      const response = await api({ method: 'get', url: `/api/admin/verification/verify-documents/${encodeURIComponent(applicationId)}/pdf`, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      if (download) { const link = document.createElement('a'); link.href = url; link.download = `Application_${applicationId}.pdf`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      else { window.open(url, '_blank', 'noopener,noreferrer'); setTimeout(() => URL.revokeObjectURL(url), 60000); }
    } catch (err) { setError(err.response?.data?.message || 'Failed to open application PDF.'); }
  };

  const openDecisionModal = action => {
    setReason('');
    setDecisionError('');
    setDecisionAction(action);
  };

  const closeDecisionModal = () => {
    if (actionLoading) return;
    setDecisionAction('');
    setDecisionError('');
    setReason('');
  };

  const submitDecision = async action => {
    if (!selected) return;
    if (action !== 'approve' && !reason.trim()) {
      setDecisionError('Please enter a reason before submitting.');
      return;
    }
    const endpoints = { approve: 'approve-application', reject: 'reject-application', changes: 'request-changes' };
    const applicationId = selected.applicationId;
    setActionLoading(action);
    setError('');
    setDecisionError('');
    try {
      await api({ method: 'post', url: `/api/admin/verification/${endpoints[action]}`, data: { applicationId, reason: reason.trim() } });
      setDecisionAction('');
      setReason('');
      await loadQueue();
      await openDetail(applicationId);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update application status.';
      if (action === 'approve') setError(message);
      else setDecisionError(message);
    } finally { setActionLoading(''); }
  };

  const RowActions = ({ app, mobile = false }) => <div className={`avd-actions ${mobile ? 'avd-mobile-actions' : ''}`}><button className="avd-view-btn" type="button" onClick={() => openDetail(app.applicationId)} disabled={detailLoading}>View</button><button className="avd-pdf-btn" type="button" onClick={() => openPdf(app.applicationId)}>PDF</button></div>;

  return (
    <div className="avd-page-root">
      <div className="avd-wrapper">
        <div className="avd-page-header">
          <div><h1 className="avd-page-title">Verify Documents</h1><p className="avd-page-sub">Review application summaries and uploaded documents sent by Process Admin.</p></div>
          <button className="avd-refresh-btn" type="button" onClick={loadQueue} disabled={loading}><RefreshIcon />{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
        {error && <div className="avd-error"><span>{error}</span><button type="button" onClick={() => setError('')}>&times;</button></div>}
        <div className="avd-stats-grid">
          <StatCard label="Total Verified" value={stats.total} accent="accent-blue" />
          <StatCard label="Pending Review" value={stats.pending} accent="accent-amber" />
          <StatCard label="Approved" value={stats.approved} accent="accent-green" />
          <StatCard label="Changes Requested" value={stats.changes} accent="accent-purple" />
        </div>

        <div className="avd-table-card">
          <div className="avd-table-header">
            <div className="avd-table-title-row"><div className="avd-table-title">Verification Queue <span className="avd-count-badge">{filteredApplications.length}</span></div></div>
            <div className="avd-controls">
              <div className="avd-search-wrap"><span className="avd-search-icon"><SearchIcon /></span><input className="avd-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search application ID, student, university, programme..." />{search && <button className="avd-clear-search" type="button" onClick={() => setSearch('')}>&times;</button>}</div>
              <div className={`avd-custom-select ${statusDropdownOpen ? 'open' : ''}`} ref={statusDropdownRef}><button type="button" className="avd-custom-select-trigger" aria-haspopup="listbox" aria-expanded={statusDropdownOpen} onClick={() => setStatusDropdownOpen(previous => !previous)}><span>{selectedStatusLabel}</span><span className="avd-custom-select-arrow" aria-hidden="true" /></button>{statusDropdownOpen && <div className="avd-custom-select-menu" role="listbox" aria-label="Filter by status">{STATUS_OPTIONS.map(option => <button type="button" role="option" aria-selected={statusFilter === option.value} key={option.value || 'all'} className={`avd-custom-select-option ${statusFilter === option.value ? 'active' : ''}`} onClick={() => { setStatusFilter(option.value); setStatusDropdownOpen(false); }}>{option.label}</button>)}</div>}</div>
            </div>
          </div>

          {loading ? <div className="avd-state"><div className="avd-spinner" />Loading verification queue...</div> : filteredApplications.length === 0 ? <div className="avd-state"><SearchIcon /><span>No verification applications found.</span></div> : <>
            <div className="avd-table-wrap avd-desktop-table"><table className="avd-table"><thead><tr><th>Application ID</th><th>Student</th><th>University</th><th>Programme</th><th>Verified Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredApplications.map(app => <tr className="avd-tr" key={app.applicationId}><td><strong className="avd-app-id">{app.applicationId}</strong></td><td><div className="avd-student-cell"><span className="avd-avatar">{getInitials(app.studentName)}</span><div><div className="avd-student-name">{app.studentName}</div><div className="avd-student-email">{app.email}</div></div></div></td><td><span className="avd-primary-text">{app.university || '-'}</span></td><td><span className="avd-programme">{app.programme || '-'}</span></td><td><span className="avd-date">{formatDate(app.verifiedAt)}</span></td><td><StatusBadge status={app.verificationStatus} /></td><td><RowActions app={app} /></td></tr>)}</tbody></table></div>
            <div className="avd-mobile-list">{filteredApplications.map(app => <article className="avd-mobile-card" key={app.applicationId}><div className="avd-mobile-top"><div className="avd-student-cell"><span className="avd-avatar">{getInitials(app.studentName)}</span><div><div className="avd-student-name">{app.studentName}</div><div className="avd-student-email">{app.email}</div></div></div><StatusBadge status={app.verificationStatus} /></div><div className="avd-mobile-grid avd-mobile-meta-grid"><div><span>Application ID</span><strong>{app.applicationId}</strong></div><div><span>Verified</span><strong>{formatDate(app.verifiedAt)}</strong></div><div className="avd-mobile-wide"><span>University</span><strong>{app.university || '-'}</strong></div><div className="avd-mobile-wide"><span>Programme</span><strong>{app.programme || '-'}</strong></div></div><RowActions app={app} mobile /></article>)}</div>
          </>}
        </div>
      </div>
      <div className="avd-footer">&copy; 2026 Admin Dashboard. All rights reserved.</div>

      {selected && <div className="avd-overlay" onClick={() => setSelected(null)}><div className="avd-modal" onClick={event => event.stopPropagation()}><div className="avd-modal-header"><div><h2>Application Verification</h2><span>{selected.applicationId}</span></div><button type="button" onClick={() => setSelected(null)}>&times;</button></div><div className="avd-modal-body">
        <section><h3>Application Information</h3><div className="avd-info-grid">{[['Application ID', selected.applicationId], ['Student Name', selected.studentName], ['Email', selected.email], ['Phone', selected.phone], ['University', selected.university], ['Programme', selected.programme], ['Submitted Date', formatDate(selected.submittedAt)], ['Verified Date', formatDate(selected.verifiedAt)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || '-'}</strong></div>)}</div></section>
        <section><h3>Application PDF</h3><div className="avd-file-actions"><button type="button" onClick={() => openPdf(selected.applicationId)}>View PDF</button><button type="button" onClick={() => openPdf(selected.applicationId, true)}>Download PDF</button></div></section>
        <section><h3>Uploaded Documents</h3><div className="avd-doc-list">{(selected.documents || []).map(doc => <div className={`avd-doc-row ${doc.uploaded ? 'avd-doc-uploaded' : doc.expected ? 'avd-doc-expected' : 'avd-doc-missing'}`} key={doc.key}><div className="avd-doc-copy"><strong>{doc.label}</strong>{doc.uploaded && <small>{doc.fileName}</small>}{doc.expected && <small>Expected {formatDate(doc.expectedDate)}</small>}</div><div className="avd-doc-status-actions">{doc.uploaded ? <><span className="avd-document-badge avd-document-uploaded">Uploaded</span><div className="avd-file-actions"><a href={resolveDocumentUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer">View</a><a href={resolveDocumentUrl(doc.fileUrl)} download>Download</a></div></> : doc.expected ? <span className="avd-document-badge avd-document-expected">Expected {formatDate(doc.expectedDate)}</span> : <span className="avd-document-badge avd-document-missing">Not Uploaded</span>}</div></div>)}</div></section>
        <section><h3>Admin Decision</h3><div className="avd-decision-actions"><button className="avd-approve" onClick={() => submitDecision('approve')} disabled={!!actionLoading}>{actionLoading === 'approve' ? 'Approving...' : 'Approve'}</button><button className="avd-reject" onClick={() => openDecisionModal('reject')} disabled={!!actionLoading}>Reject</button><button className="avd-changes" onClick={() => openDecisionModal('changes')} disabled={!!actionLoading}>Request Changes</button></div></section>
      </div></div></div>}

      {decisionAction && selected && <div className="avd-overlay avd-decision-overlay" onClick={closeDecisionModal}><div className="avd-decision-modal" role="dialog" aria-modal="true" aria-labelledby="avd-decision-title" onClick={event => event.stopPropagation()}><div className="avd-decision-modal-header"><div><h2 id="avd-decision-title">{decisionAction === 'reject' ? 'Reject Application' : 'Request Changes'}</h2><p>Provide a clear reason for the student.</p></div><button type="button" aria-label="Close decision modal" onClick={closeDecisionModal} disabled={!!actionLoading}>&times;</button></div><div className="avd-decision-modal-body"><div className="avd-decision-summary">{[['Application ID', selected.applicationId], ['Student name', selected.studentName], ['University', selected.university], ['Programme', selected.programme]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || '-'}</strong></div>)}</div><div className="avd-reason-field"><label htmlFor="avd-decision-reason">Reason / Comment</label><textarea id="avd-decision-reason" value={reason} onChange={event => { setReason(event.target.value); if (decisionError) setDecisionError(''); }} placeholder="Enter the reason that will be sent to the student..." rows="5" autoFocus className={decisionError ? 'avd-input-error' : ''} />{decisionError && <div className="avd-inline-error">{decisionError}</div>}</div></div><div className="avd-decision-modal-footer"><button className="avd-cancel-btn" type="button" onClick={closeDecisionModal} disabled={!!actionLoading}>Cancel</button><button className={`avd-submit-decision ${decisionAction === 'reject' ? 'avd-submit-reject' : 'avd-submit-changes'}`} type="button" onClick={() => submitDecision(decisionAction)} disabled={!!actionLoading}>{actionLoading ? 'Submitting...' : 'Submit'}</button></div></div></div>}
    </div>
  );
};
export default AdminVerifyDocuments;