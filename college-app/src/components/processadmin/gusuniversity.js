import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GusUniversity.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const GusUniversity = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedApp, setSelectedApp] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        incomplete: 0,
        underReview: 0
    });

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/application/admin/gus-university/applications`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                const apps = response.data.data || [];
                setApplications(apps);
                calculateStats(apps);
            }
        } catch (err) {
            console.error('API not ready, using mock data:', err);
            const mock = getMockData();
            setApplications(mock);
            calculateStats(mock);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (apps) => {
        setStats({
            total: apps.length,
            completed: apps.filter(a => getStatusLabel(a) === 'COMPLETED').length,
            incomplete: apps.filter(a => getStatusLabel(a) === 'INCOMPLETE').length,
            underReview: apps.filter(a => getStatusLabel(a) === 'IN PROGRESS').length
        });
    };

    const getMockData = () => [
        {
            _id: '1',
            studentId: '155317',
            studentName: 'Tirumala Mounika',
            email: 'mounikatirumala1901@gmail.com',
            phone: '+917075285653',
            eqheOriginalTitle: 'senior_secondary_india',
            eqheCountry: 'india',
            eqheDate: '2003-09-09',
            eqheCity: 'Eluru',
            hasAnotherEQHE: false,
            completionPercentage: 100,
            applicationId: 'EQHE-000001',
            createdAt: '2026-02-27T07:25:01.423Z',
            updatedAt: '2026-02-27T07:25:35.423Z'
        },
        {
            _id: '2',
            studentId: '100001',
            studentName: 'Praneeth Sunkara',
            email: 'praneethsunkara143@gmail.com',
            phone: '',
            eqheOriginalTitle: '',
            eqheCountry: '',
            eqheDate: '',
            eqheCity: '',
            hasAnotherEQHE: false,
            completionPercentage: 0,
            applicationId: 'EQHE-000002',
            createdAt: '2026-02-26T10:00:00.000Z',
            updatedAt: '2026-02-26T10:00:00.000Z'
        },
        {
            _id: '3',
            studentId: '155317',
            studentName: 'Tirumala Mounika Tirumala Mounika',
            email: 'tirumalamounika25@gmail.com',
            phone: '',
            eqheOriginalTitle: '',
            eqheCountry: '',
            eqheDate: '',
            eqheCity: '',
            hasAnotherEQHE: false,
            completionPercentage: 0,
            applicationId: 'EQHE-000003',
            createdAt: '2026-01-29T10:00:00.000Z',
            updatedAt: '2026-01-29T10:00:00.000Z'
        },
        {
            _id: '4',
            studentId: '155317',
            studentName: 'Aravind Bonda',
            email: 'aravindb@edutechex.com',
            phone: '+919876543210',
            eqheOriginalTitle: 'high_school_diploma_usa',
            eqheCountry: 'india',
            eqheDate: '2026-02-21',
            eqheCity: 'Eluru',
            hasAnotherEQHE: true,
            anotherEqheOriginalTitle: 'bachiller_colombia',
            anotherEqheCountry: 'uk',
            anotherEqheDate: '2026-02-13',
            anotherEqheCity: 'Eluru',
            completionPercentage: 100,
            applicationId: 'EQHE-000004',
            createdAt: '2026-01-24T10:00:00.000Z',
            updatedAt: '2026-01-24T10:00:00.000Z'
        },
        {
            _id: '5',
            studentId: '155317',
            studentName: 'Aravind Bonda',
            email: 'aravind@edutechex.com',
            phone: '+919876543211',
            eqheOriginalTitle: 'senior_secondary_india',
            eqheCountry: 'india',
            eqheDate: '2026-01-15',
            eqheCity: 'Hyderabad',
            hasAnotherEQHE: false,
            completionPercentage: 60,
            applicationId: 'EQHE-000005',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z'
        },
        {
            _id: '6',
            studentId: '155318',
            studentName: 'Rahul Sharma',
            email: 'rahul.sharma@gmail.com',
            phone: '+919988776655',
            eqheOriginalTitle: 'high_school_china',
            eqheCountry: 'china',
            eqheDate: '2025-06-10',
            eqheCity: 'Beijing',
            hasAnotherEQHE: false,
            completionPercentage: 100,
            applicationId: 'EQHE-000006',
            createdAt: '2026-01-18T10:00:00.000Z',
            updatedAt: '2026-01-18T10:00:00.000Z'
        },
        {
            _id: '7',
            studentId: '155319',
            studentName: 'Ananya Reddy',
            email: 'ananya.reddy@outlook.com',
            phone: '+917788990011',
            eqheOriginalTitle: '',
            eqheCountry: '',
            eqheDate: '',
            eqheCity: '',
            hasAnotherEQHE: false,
            completionPercentage: 0,
            applicationId: 'EQHE-000007',
            createdAt: '2026-01-10T10:00:00.000Z',
            updatedAt: '2026-01-10T10:00:00.000Z'
        }
    ];

    // ─── Helpers ───────────────────────────────────────────────
    const formatDate = (d) => {
        if (!d) return '—';
        try {
            return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch { return '—'; }
    };

    const getStatusLabel = (app) => {
        if (app.completionPercentage === 100) return 'COMPLETED';
        if (app.completionPercentage > 0) return 'IN PROGRESS';
        return 'INCOMPLETE';
    };

    const getStatusClass = (app) => {
        const s = getStatusLabel(app);
        if (s === 'COMPLETED') return 'status-completed';
        if (s === 'IN PROGRESS') return 'status-inprogress';
        return 'status-incomplete';
    };

    const getInitials = (name) =>
        (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const avatarColors = ['#6C63FF', '#5B50E8', '#7B74FF', '#4A90D9', '#43B89C'];
    const getAvatarColor = (name) =>
        avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

    const eqheTitleMap = {
        'senior_secondary_india': 'Senior Secondary School Certificate (India)',
        'high_school_diploma_usa': 'American High School Diploma (USA)',
        'mathayom_thailand': 'Mathayom VI (Thailand)',
        'attestat_russia': 'Attestat (Russia)',
        'bachillerato_mexico': 'Bachillerato General (Mexico)',
        'west_african_nigeria': 'West African Senior School Certificate (Nigeria)',
        'diploma_italy': 'Diploma (Italy)',
        'high_school_china': 'Secondary School Certificate + Gaokao (China)',
        'bachiller_colombia': 'Titulo di Bachiller + Examen de Estado (Colombia)',
        'high_school_skorea': 'High School Certificate + CSAT (South Korea)'
    };

    const countryMap = {
        'india': 'India', 'usa': 'United States', 'uk': 'United Kingdom',
        'canada': 'Canada', 'australia': 'Australia', 'china': 'China',
        'germany': 'Germany', 'france': 'France', 'japan': 'Japan',
        'skorea': 'South Korea', 'russia': 'Russia', 'mexico': 'Mexico',
        'colombia': 'Colombia', 'italy': 'Italy', 'spain': 'Spain',
        'brazil': 'Brazil', 'nigeria': 'Nigeria', 'thailand': 'Thailand'
    };

    const fmt = (map, val) => map[val] || val || '—';

    // ─── Filter ────────────────────────────────────────────────
    const filtered = applications.filter(app => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
            app.studentName?.toLowerCase().includes(q) ||
            app.email?.toLowerCase().includes(q) ||
            String(app.studentId).includes(q) ||
            app.applicationId?.toLowerCase().includes(q);
        const s = getStatusLabel(app);
        const matchFilter =
            filterStatus === 'all' ||
            (filterStatus === 'completed' && s === 'COMPLETED') ||
            (filterStatus === 'incomplete' && s === 'INCOMPLETE') ||
            (filterStatus === 'inprogress' && s === 'IN PROGRESS');
        return matchSearch && matchFilter;
    });

    // ─── CSV Download ──────────────────────────────────────────
    const handleDownload = (app) => {
        const rows = [
            ['Field', 'Value'],
            ['Application ID', app.applicationId || ''],
            ['Student ID', app.studentId || ''],
            ['Student Name', app.studentName || ''],
            ['Email', app.email || ''],
            ['Phone', app.phone || ''],
            ['EQHE Title', fmt(eqheTitleMap, app.eqheOriginalTitle)],
            ['EQHE Country', fmt(countryMap, app.eqheCountry)],
            ['EQHE Date', formatDate(app.eqheDate)],
            ['EQHE City', app.eqheCity || ''],
            ['Has Another EQHE', app.hasAnotherEQHE ? 'Yes' : 'No'],
            ['2nd EQHE Title', fmt(eqheTitleMap, app.anotherEqheOriginalTitle)],
            ['2nd EQHE Country', fmt(countryMap, app.anotherEqheCountry)],
            ['2nd EQHE Date', formatDate(app.anotherEqheDate)],
            ['2nd EQHE City', app.anotherEqheCity || ''],
            ['Completion %', `${app.completionPercentage || 0}%`],
            ['Status', getStatusLabel(app)],
            ['Submitted', formatDate(app.updatedAt)]
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `${app.applicationId || 'application'}.csv`;
        a.click();
    };

    const openModal = (app) => { setSelectedApp(app); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setSelectedApp(null); };

    // ─── Loading ───────────────────────────────────────────────
    if (loading) {
        return (
            <div className="gus-loading">
                <div className="gus-spinner" />
                <p>Loading GUS University Applications...</p>
            </div>
        );
    }

    return (
        <div className="gus-wrap">

            {/* ══ PAGE HEADER ══════════════════════════════════════ */}
            <div className="gus-page-header">
                <div className="gus-page-header-left">
                    <h1 className="gus-page-title">GUS University</h1>
                    <p className="gus-page-sub">Application Management Dashboard</p>
                </div>
                <button className="gus-refresh-btn" onClick={fetchApplications}>
                    <span>↻</span> Refresh
                </button>
            </div>

            {/* ══ STAT CARDS ═══════════════════════════════════════ */}
            <div className="gus-stats-row">
                <div className="gus-stat-card gus-stat-total">
                    <div className="gus-stat-icon-wrap">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'/%3E%3C/svg%3E" alt="" className="gus-stat-svg" />
                    </div>
                    <div className="gus-stat-text">
                        <span className="gus-stat-label">TOTAL APPLICATIONS</span>
                        <span className="gus-stat-num">{stats.total}</span>
                    </div>
                </div>

                <div className="gus-stat-card gus-stat-incomplete">
                    <div className="gus-stat-icon-wrap">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E" alt="" className="gus-stat-svg" />
                    </div>
                    <div className="gus-stat-text">
                        <span className="gus-stat-label">INCOMPLETE</span>
                        <span className="gus-stat-num">{stats.incomplete}</span>
                    </div>
                </div>

                <div className="gus-stat-card gus-stat-completed">
                    <div className="gus-stat-icon-wrap">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E" alt="" className="gus-stat-svg" />
                    </div>
                    <div className="gus-stat-text">
                        <span className="gus-stat-label">COMPLETED</span>
                        <span className="gus-stat-num">{stats.completed}</span>
                    </div>
                </div>

                <div className="gus-stat-card gus-stat-review">
                    <div className="gus-stat-icon-wrap">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'/%3E%3Cpath d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'/%3E%3C/svg%3E" alt="" className="gus-stat-svg" />
                    </div>
                    <div className="gus-stat-text">
                        <span className="gus-stat-label">IN PROGRESS</span>
                        <span className="gus-stat-num">{stats.underReview}</span>
                    </div>
                </div>
            </div>

            {/* ══ CONTROLS ══════════════════════════════════════════ */}
            <div className="gus-controls">
                <div className="gus-search-box">
                    <svg className="gus-search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                        type="text"
                        className="gus-search-input"
                        placeholder="Search by name, email or student ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="gus-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                    )}
                </div>
                <div className="gus-filters">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'completed', label: 'Completed' },
                        { key: 'incomplete', label: 'Incomplete' },
                        { key: 'inprogress', label: 'In Progress' }
                    ].map(f => (
                        <button
                            key={f.key}
                            className={`gus-filter-btn ${filterStatus === f.key ? 'active' : ''}`}
                            onClick={() => setFilterStatus(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ TABLE ════════════════════════════════════════════ */}
            <div className="gus-table-card">
                <table className="gus-table">
                    <thead>
                        <tr className="gus-thead-row">
                            <th>COLLEGE ID</th>
                            <th>STUDENT</th>
                            <th>STATUS</th>
                            <th>SUBMITTED</th>
                            <th>PROGRESS</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="gus-empty-state">
                                        <div className="gus-empty-icon">📭</div>
                                        <p>No applications found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((app, idx) => (
                                <tr key={app._id} className="gus-tbody-row" style={{ animationDelay: `${idx * 0.04}s` }}>
                                    {/* College ID */}
                                    <td>
                                        <span className="gus-college-badge">{app.studentId}</span>
                                    </td>

                                    {/* Student */}
                                    <td>
                                        <div className="gus-student-cell">
                                            <div className="gus-avatar" style={{ background: getAvatarColor(app.studentName) }}>
                                                {getInitials(app.studentName)}
                                            </div>
                                            <div className="gus-student-details">
                                                <span className="gus-student-name">{app.studentName || 'Unknown'}</span>
                                                <span className="gus-student-email">{app.email || '—'}</span>
                                                {app.phone && <span className="gus-student-phone">{app.phone}</span>}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td>
                                        <span className={`gus-badge ${getStatusClass(app)}`}>
                                            {getStatusLabel(app)}
                                        </span>
                                    </td>

                                    {/* Submitted */}
                                    <td>
                                        <span className="gus-date-text">{formatDate(app.updatedAt || app.createdAt)}</span>
                                    </td>

                                    {/* Progress */}
                                    <td>
                                        <div className="gus-prog-cell">
                                            <div className="gus-prog-track">
                                                <div
                                                    className="gus-prog-fill"
                                                    style={{ width: `${app.completionPercentage || 0}%` }}
                                                />
                                            </div>
                                            <span className="gus-prog-pct">{app.completionPercentage || 0}%</span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td>
                                        <div className="gus-action-group">
                                            <button className="gus-btn-view" onClick={() => openModal(app)}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gus-btn-ico">
                                                    <circle cx="12" cy="12" r="3"/>
                                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                </svg>
                                                View
                                            </button>
                                            <button className="gus-btn-dl" onClick={() => handleDownload(app)} title="Download CSV">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="gus-btn-ico">
                                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="gus-table-footer">
                    Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong> applications
                </div>
            </div>

            {/* ══ DETAIL MODAL ════════════════════════════════════ */}
            {showModal && selectedApp && (
                <div className="gus-overlay" onClick={closeModal}>
                    <div className="gus-modal" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="gus-modal-hdr">
                            <div className="gus-modal-hdr-left">
                                <div className="gus-modal-avatar" style={{ background: getAvatarColor(selectedApp.studentName) }}>
                                    {getInitials(selectedApp.studentName)}
                                </div>
                                <div>
                                    <h2 className="gus-modal-title">{selectedApp.studentName}</h2>
                                    <p className="gus-modal-appid">Application ID: {selectedApp.applicationId}</p>
                                </div>
                            </div>
                            <div className="gus-modal-hdr-right">
                                <span className={`gus-badge ${getStatusClass(selectedApp)}`}>
                                    {getStatusLabel(selectedApp)}
                                </span>
                                <button className="gus-modal-x" onClick={closeModal}>✕</button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="gus-modal-body">

                            {/* Student Info */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title">
                                    <span className="gus-sec-dot gus-dot-blue" />
                                    Student Information
                                </div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field">
                                        <span className="gus-field-lbl">Student ID</span>
                                        <span className="gus-field-val">{selectedApp.studentId || '—'}</span>
                                    </div>
                                    <div className="gus-modal-field">
                                        <span className="gus-field-lbl">Email Address</span>
                                        <span className="gus-field-val">{selectedApp.email || '—'}</span>
                                    </div>
                                    <div className="gus-modal-field">
                                        <span className="gus-field-lbl">Phone</span>
                                        <span className="gus-field-val">{selectedApp.phone || '—'}</span>
                                    </div>
                                    <div className="gus-modal-field">
                                        <span className="gus-field-lbl">Last Updated</span>
                                        <span className="gus-field-val">{formatDate(selectedApp.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Primary EQHE */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title">
                                    <span className="gus-sec-dot gus-dot-purple" />
                                    Primary EQHE Details
                                </div>
                                <div className="gus-modal-grid">
                                    <div className="gus-modal-field gus-field-full">
                                        <span className="gus-field-lbl">Qualification Title</span>
                                        <span className="gus-field-val">{fmt(eqheTitleMap, selectedApp.eqheOriginalTitle)}</span>
                                    </div>
                                    <div className="gus-modal-field">
                                        <span className="gus-field-lbl">Country</span>
                                        <span className="gus-field-val">{fmt(countryMap, selectedApp.eqheCountry)}</span>
                                    </div>
                                    <div className="gus-modal-field">
                                        <span className="gus-field-lbl">City</span>
                                        <span className="gus-field-val">{selectedApp.eqheCity || '—'}</span>
                                    </div>
                                    <div className="gus-modal-field">
                                        <span className="gus-field-lbl">Date</span>
                                        <span className="gus-field-val">{formatDate(selectedApp.eqheDate)}</span>
                                    </div>
                                    <div className="gus-modal-field">
                                        <span className="gus-field-lbl">Has Additional EQHE</span>
                                        <span className="gus-field-val">{selectedApp.hasAnotherEQHE ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional EQHE */}
                            {selectedApp.hasAnotherEQHE && (
                                <div className="gus-modal-sec">
                                    <div className="gus-modal-sec-title">
                                        <span className="gus-sec-dot gus-dot-pink" />
                                        Additional EQHE Details
                                    </div>
                                    <div className="gus-modal-grid">
                                        <div className="gus-modal-field gus-field-full">
                                            <span className="gus-field-lbl">Qualification Title</span>
                                            <span className="gus-field-val">{fmt(eqheTitleMap, selectedApp.anotherEqheOriginalTitle)}</span>
                                        </div>
                                        <div className="gus-modal-field">
                                            <span className="gus-field-lbl">Country</span>
                                            <span className="gus-field-val">{fmt(countryMap, selectedApp.anotherEqheCountry)}</span>
                                        </div>
                                        <div className="gus-modal-field">
                                            <span className="gus-field-lbl">City</span>
                                            <span className="gus-field-val">{selectedApp.anotherEqheCity || '—'}</span>
                                        </div>
                                        <div className="gus-modal-field">
                                            <span className="gus-field-lbl">Date</span>
                                            <span className="gus-field-val">{formatDate(selectedApp.anotherEqheDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Progress */}
                            <div className="gus-modal-sec">
                                <div className="gus-modal-sec-title">
                                    <span className="gus-sec-dot gus-dot-green" />
                                    Application Progress
                                </div>
                                <div className="gus-modal-prog-wrap">
                                    <div className="gus-modal-prog-track">
                                        <div
                                            className="gus-modal-prog-fill"
                                            style={{ width: `${selectedApp.completionPercentage || 0}%` }}
                                        />
                                    </div>
                                    <span className="gus-modal-prog-lbl">{selectedApp.completionPercentage || 0}% Complete</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="gus-modal-ftr">
                            <button className="gus-modal-dl-btn" onClick={() => handleDownload(selectedApp)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16,marginRight:6}}>
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                </svg>
                                Download CSV
                            </button>
                            <button className="gus-modal-close-btn" onClick={closeModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GusUniversity;