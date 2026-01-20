// Applications.js - PRODUCTION READY VERSION
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import './Applications.css';

const Applications = () => {
    // State
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(10);
    const [sortField, setSortField] = useState('submittedAt');
    const [sortDirection, setSortDirection] = useState('desc');
    
    // Filters
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        major: 'all',
        dateFrom: '',
        dateTo: ''
    });

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        'under-review': 0,
        accepted: 0,
        rejected: 0,
        incomplete: 0,
        withdrawn: 0
    });

    // Modal State
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);

    // API Configuration
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const KANSAS_APPLICATIONS_API = `${API_BASE_URL}/admin/kansas/applications`;
    const VIEW_APPLICATION_API = (id) => `${API_BASE_URL}/admin/applications/${id}/view-details`;
    const DOWNLOAD_PDF_API = (id) => `${API_BASE_URL}/admin/applications/${id}/download-pdf`;
    const UPDATE_STATUS_API = (id) => `${API_BASE_URL}/admin/applications/${id}/status`;
    const DELETE_API = (id) => `${API_BASE_URL}/admin/applications/${id}`;

    // Get authentication headers
    const getHeaders = () => {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    // Load Kansas University applications from backend
    const loadApplications = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query parameters
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                sortBy: sortField,
                sortOrder: sortDirection,
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.major !== 'all' && { major: filters.major }),
                ...(filters.search && { search: filters.search }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo })
            };

            console.log('Fetching Kansas applications from:', KANSAS_APPLICATIONS_API);
            console.log('With params:', params);

            const response = await axios.get(KANSAS_APPLICATIONS_API, {
                params,
                ...getHeaders()
            });

            if (response.data.success) {
                const data = response.data.data;
                setApplications(data.applications || []);
                setStats(data.stats || {});
                setTotalPages(data.pagination?.pages || 1);
                setTotalItems(data.pagination?.total || 0);
            } else {
                throw new Error(response.data.message || 'Failed to load applications');
            }

        } catch (err) {
            console.error('API Error:', err.response || err.message);
            
            let errorMessage = 'Failed to load applications';
            
            if (err.response) {
                // Server responded with error status
                errorMessage = err.response.data?.message || 
                             `Server error: ${err.response.status}`;
                
                // Handle authentication errors
                if (err.response.status === 401 || err.response.status === 403) {
                    errorMessage = 'Authentication failed. Please log in again.';
                    // Optionally redirect to login
                    // window.location.href = '/admin/login';
                }
            } else if (err.request) {
                // Request made but no response
                errorMessage = 'Cannot connect to server. Please check your network connection.';
            }
            
            setError(errorMessage);
            
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters, sortField, sortDirection, itemsPerPage]);

    // Initial load and when filters/sort change
    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    // Handle View Application (opens modal with details)
    const handleViewApplication = async (applicationId) => {
        try {
            setModalLoading(true);
            setModalError(null);
            
            const response = await axios.get(
                VIEW_APPLICATION_API(applicationId),
                getHeaders()
            );

            if (response.data.success) {
                setSelectedApplication(response.data.data);
                setShowModal(true);
            } else {
                throw new Error(response.data.message || 'Failed to load application details');
            }
        } catch (err) {
            console.error('Error viewing application:', err);
            setModalError(err.response?.data?.message || err.message || 'Failed to load details');
        } finally {
            setModalLoading(false);
        }
    };

    // Handle Download PDF
    const handleDownloadApplication = async (applicationId) => {
        try {
            // Create a temporary link to trigger download
            const downloadUrl = DOWNLOAD_PDF_API(applicationId);
            const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            
            // Open in new tab with authorization
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `application-${applicationId}.pdf`);
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Alternatively, you can use axios with blob response
            /*
            const response = await axios.get(downloadUrl, {
                ...getHeaders(),
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `application-${applicationId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            */
            
        } catch (err) {
            console.error('Error downloading PDF:', err);
            alert('Failed to download application PDF. Please try again.');
        }
    };

    // Handle Delete Application
    const handleDeleteApplication = async (appId, appName) => {
        if (window.confirm(`Are you sure you want to delete application ${appId} (${appName})? This action cannot be undone.`)) {
            try {
                await axios.delete(DELETE_API(appId), getHeaders());
                
                // Refresh applications list
                loadApplications();
                
                // Show success message
                alert(`Application ${appId} deleted successfully.`);
                
            } catch (err) {
                console.error('Error deleting application:', err);
                alert(err.response?.data?.message || 'Failed to delete application');
            }
        }
    };

    // Handle Update Status
    const handleUpdateStatus = async (appId, newStatus, reason = '') => {
        try {
            const response = await axios.put(
                UPDATE_STATUS_API(appId),
                { status: newStatus, reason },
                getHeaders()
            );

            if (response.data.success) {
                // Refresh applications list
                loadApplications();
                
                // If modal is open, refresh that data too
                if (selectedApplication && selectedApplication.applicationId === appId) {
                    handleViewApplication(appId);
                }
                
                alert(`Status updated to ${newStatus}`);
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    // Handlers
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        // Reset to page 1 when filters change
        setCurrentPage(1);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleResetFilters = () => {
        setFilters({
            status: 'all',
            search: '',
            major: 'all',
            dateFrom: '',
            dateTo: ''
        });
        setCurrentPage(1);
    };

    const handleExportAll = async () => {
        try {
            // Build export query parameters
            const params = {
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.major !== 'all' && { major: filters.major }),
                ...(filters.search && { search: filters.search }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo })
            };

            const exportUrl = `${API_BASE_URL}/admin/applications/export`;
            
            // Trigger download
            const link = document.createElement('a');
            const queryString = new URLSearchParams(params).toString();
            link.href = `${exportUrl}?${queryString}`;
            link.setAttribute('download', `kansas-applications-export.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (err) {
            console.error('Error exporting:', err);
            alert('Failed to export applications. Please try again.');
        }
    };

    const handleRefresh = () => {
        loadApplications();
    };

    const handleAddApplication = () => {
        alert('Add new application feature would open a form here.');
        // In a real app: navigate to create application page
        // window.location.href = '/admin/applications/new';
    };

    // Format helpers
    const formatStatus = (status) => {
        const statusMap = {
            'draft': 'Draft',
            'pending': 'Pending Review',
            'submitted': 'Submitted',
            'under-review': 'Under Review',
            'accepted': 'Accepted',
            'rejected': 'Rejected',
            'incomplete': 'Incomplete',
            'withdrawn': 'Withdrawn'
        };
        return statusMap[status] || status;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not submitted';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getProgressClass = (progress) => {
        if (progress >= 90) return 'complete';
        if (progress >= 70) return 'high';
        if (progress >= 40) return 'medium';
        return 'low';
    };

    const getSortIcon = (field) => {
        if (sortField !== field) return '↕️';
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': '#f59e0b',
            'submitted': '#3b82f6',
            'under-review': '#8b5cf6',
            'accepted': '#10b981',
            'rejected': '#ef4444',
            'incomplete': '#6b7280',
            'withdrawn': '#6b7280',
            'draft': '#9ca3af'
        };
        return colors[status] || '#6b7280';
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedApplication(null);
        setModalError(null);
    };

    // Render loading state
    if (loading && applications.length === 0) {
        return (
            <div className="applications-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading Kansas University applications...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error && applications.length === 0) {
        return (
            <div className="applications-container">
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <h3>Error loading applications</h3>
                    <p>{error}</p>
                    <button onClick={handleRefresh} className="quick-action-btn">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Main render
    return (
        <div className="applications-container">
            {/* Header */}
            <div className="applications-header">
                <h1>Kansas University Applications</h1>
                <div className="header-actions">
                    <div className="quick-actions">
                        <button className="quick-action-btn" onClick={handleExportAll}>
                            Export CSV
                        </button>
                        <button className="quick-action-btn" onClick={handleRefresh}>
                            Refresh
                        </button>
                        <button className="quick-action-btn primary" onClick={handleAddApplication}>
                            Add Application
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="applications-overview">
                <div className="stat-card total">
                    <h3>Total Applications</h3>
                    <span className="stat-number">{stats.total}</span>
                </div>
                <div className="stat-card pending">
                    <h3>Pending</h3>
                    <span className="stat-number">{stats.pending}</span>
                </div>
                <div className="stat-card review">
                    <h3>Under Review</h3>
                    <span className="stat-number">{stats['under-review']}</span>
                </div>
                <div className="stat-card accepted">
                    <h3>Accepted</h3>
                    <span className="stat-number">{stats.accepted}</span>
                </div>
                <div className="stat-card rejected">
                    <h3>Rejected</h3>
                    <span className="stat-number">{stats.rejected}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="applications-filters">
                <div className="filter-row">
                    <div className="filter-group">
                        <label htmlFor="searchApplications">Search</label>
                        <input
                            type="text"
                            id="searchApplications"
                            name="search"
                            className="filter-input"
                            placeholder="Search by name, email, or ID..."
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="filterStatus">Status</label>
                        <select
                            id="filterStatus"
                            name="status"
                            className="filter-select"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="submitted">Submitted</option>
                            <option value="under-review">Under Review</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="incomplete">Incomplete</option>
                            <option value="withdrawn">Withdrawn</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="filterMajor">Major</label>
                        <select
                            id="filterMajor"
                            name="major"
                            className="filter-select"
                            value={filters.major}
                            onChange={handleFilterChange}
                        >
                            <option value="all">All Majors</option>
                            <option value="Business">Business</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Biology">Biology</option>
                            <option value="Psychology">Psychology</option>
                            <option value="Arts">Arts</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <button className="quick-action-btn" onClick={handleResetFilters}>
                            Reset Filters
                        </button>
                    </div>
                </div>
                <div className="filter-row">
                    <div className="filter-group">
                        <label htmlFor="dateFrom">From Date</label>
                        <input
                            type="date"
                            id="dateFrom"
                            name="dateFrom"
                            className="filter-input"
                            value={filters.dateFrom}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="dateTo">To Date</label>
                        <input
                            type="date"
                            id="dateTo"
                            name="dateTo"
                            className="filter-input"
                            value={filters.dateTo}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
                <div className="filter-info">
                    Showing <span>{Math.min(itemsPerPage, applications.length)}</span> of <span>{totalItems}</span> total applications
                    {filters.search && <span> matching "{filters.search}"</span>}
                </div>
            </div>

            {/* Applications Table */}
            <div className="applications-table-container">
                {loading && applications.length > 0 && (
                    <div className="table-loading">
                        <div className="small-spinner"></div>
                        <span>Refreshing data...</span>
                    </div>
                )}
                <table className="applications-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('applicationId')}>
                                ID <span>{getSortIcon('applicationId')}</span>
                            </th>
                            <th onClick={() => handleSort('name')}>
                                Student <span>{getSortIcon('name')}</span>
                            </th>
                            <th onClick={() => handleSort('status')}>
                                Status <span>{getSortIcon('status')}</span>
                            </th>
                            <th onClick={() => handleSort('major')}>
                                Major <span>{getSortIcon('major')}</span>
                            </th>
                            <th onClick={() => handleSort('gpa')}>
                                GPA <span>{getSortIcon('gpa')}</span>
                            </th>
                            <th onClick={() => handleSort('submittedAt')}>
                                Submitted <span>{getSortIcon('submittedAt')}</span>
                            </th>
                            <th>Progress</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-state">
                                    <div className="empty-state-icon">📭</div>
                                    <h3>No applications found</h3>
                                    <p>Try adjusting your filters or check back later</p>
                                </td>
                            </tr>
                        ) : (
                            applications.map(app => (
                                <tr key={app._id || app.applicationId} className={app.isNew ? 'new-application' : ''}>
                                    <td>
                                        <div className="app-id-cell">
                                            {app.applicationId}
                                            {app.isNew && <span className="new-badge">NEW</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="student-info">
                                            <strong>{app.name}</strong>
                                            <small>{app.email}</small>
                                            {app.phone && <small>{app.phone}</small>}
                                        </div>
                                    </td>
                                    <td>
                                        <span 
                                            className="status-badge" 
                                            style={{ 
                                                backgroundColor: getStatusColor(app.status),
                                                color: 'white'
                                            }}
                                        >
                                            {formatStatus(app.status)}
                                        </span>
                                    </td>
                                    <td>{app.major}</td>
                                    <td>
                                        {app.gpa ? (
                                            <div className="gpa-display">
                                                <span className="gpa-value">{app.gpa.toFixed(2)}</span>
                                                <span className="gpa-scale">/4.0</span>
                                            </div>
                                        ) : (
                                            'N/A'
                                        )}
                                    </td>
                                    <td>{formatDate(app.submittedAt)}</td>
                                    <td>
                                        <div className="progress-container">
                                            <div 
                                                className={`progress-bar progress-${getProgressClass(app.progress)}`}
                                                style={{ width: `${app.progress}%` }}
                                            ></div>
                                        </div>
                                        <small>{app.progress}%</small>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn-icon btn-view" 
                                                onClick={() => handleViewApplication(app._id)}
                                                title="View Details"
                                            >
                                                👁️
                                            </button>
                                            <button 
                                                className="btn-icon btn-download" 
                                                onClick={() => handleDownloadApplication(app._id)}
                                                title="Download PDF"
                                            >
                                                ⬇️
                                            </button>
                                            <button 
                                                className="btn-icon btn-delete" 
                                                onClick={() => handleDeleteApplication(app._id, app.name)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <div className="pagination-info">
                        Page {currentPage} of {totalPages} • {totalItems} total applications
                    </div>
                    <div className="pagination-controls">
                        <button 
                            className="page-nav" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            ← Previous
                        </button>
                        <div className="page-numbers">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 2 + i;
                                }
                                if (pageNum > totalPages) return null;
                                
                                return (
                                    <button
                                        key={pageNum}
                                        className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                                        onClick={() => handlePageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button 
                            className="page-nav" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {/* Application Details Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Application Details</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        
                        {modalLoading ? (
                            <div className="modal-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading application details...</p>
                            </div>
                        ) : modalError ? (
                            <div className="modal-error">
                                <p>Error: {modalError}</p>
                            </div>
                        ) : selectedApplication ? (
                            <div className="modal-body">
                                <div className="application-details">
                                    <div className="detail-section">
                                        <h3>Application Information</h3>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <label>Application ID:</label>
                                                <span>{selectedApplication.applicationId}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Status:</label>
                                                <span className="status-badge">
                                                    {formatStatus(selectedApplication.status)}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <label>University:</label>
                                                <span>{selectedApplication.university || 'Kansas University'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Submitted:</label>
                                                <span>{formatDate(selectedApplication.submittedAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Student Information</h3>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <label>Name:</label>
                                                <span>{selectedApplication.personalDetails?.name}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Email:</label>
                                                <span>{selectedApplication.personalDetails?.email}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Phone:</label>
                                                <span>{selectedApplication.personalDetails?.phone || 'N/A'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Address:</label>
                                                <span>{selectedApplication.personalDetails?.address || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Academic Information</h3>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <label>Major:</label>
                                                <span>{selectedApplication.academicDetails?.major}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>GPA:</label>
                                                <span>{selectedApplication.academicDetails?.gpa || 'N/A'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>SAT Score:</label>
                                                <span>{selectedApplication.academicDetails?.satScore || 'N/A'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>High School:</label>
                                                <span>{selectedApplication.academicDetails?.highSchool || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional sections would be displayed here */}
                                    
                                    <div className="modal-actions">
                                        <button 
                                            className="btn-primary"
                                            onClick={() => handleDownloadApplication(selectedApplication._id)}
                                        >
                                            Download PDF
                                        </button>
                                        <button 
                                            className="btn-secondary"
                                            onClick={() => handleUpdateStatus(selectedApplication._id, 'under-review')}
                                        >
                                            Mark as Under Review
                                        </button>
                                        <button className="btn-secondary" onClick={closeModal}>
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Applications;