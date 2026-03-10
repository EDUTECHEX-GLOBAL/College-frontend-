// ProcessAdminDashboard.js — EduTechEx Brand Edition
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./processAdminDashboard.css";
import Applications from "./Applications";
import Documents from "./documents";
import GusUniversity from "./gusuniversity";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/* ── Helpers ── */
const getProcessAdminToken = () => {
  const token = localStorage.getItem('processAdminToken');
  if (token) { console.log('✅ Using processAdminToken'); return token; }
  console.error('❌ No process-admin token found');
  return null;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const getStatusBadgeClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('completed') || s === 'validated') return 'status-badge completed';
  if (s.includes('incomplete'))                      return 'status-badge incomplete';
  if (s.includes('in progress') || s.includes('pending')) return 'status-badge in-progress';
  if (s.includes('not started'))                     return 'status-badge not-started';
  return 'status-badge';
};

const getStatusText = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('completed') || s === 'validated') return 'COMPLETED';
  if (s.includes('incomplete'))   return 'INCOMPLETE';
  if (s.includes('in progress'))  return 'IN PROGRESS';
  if (s.includes('pending'))      return 'PENDING';
  if (s.includes('not started'))  return 'NOT STARTED';
  return status?.toUpperCase() || 'PENDING';
};

/* ══════════════════════════════════════
   COMPONENT
══════════════════════════════════════ */
const ProcessAdminDashboard = () => {
  const navigate = useNavigate();

  const [sidebarOpen,         setSidebarOpen]         = useState(true);
  const [activeTab,           setActiveTab]           = useState("dashboard");
  const [processAdminData,    setProcessAdminData]    = useState(null);
  const [loading,             setLoading]             = useState(true);
  const [searchQuery,         setSearchQuery]         = useState("");
  const [kansasExpanded,      setKansasExpanded]      = useState(false);
  const [gusExpanded,         setGusExpanded]         = useState(false);
  const [applications,        setApplications]        = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  /* ── Auth check ── */
  useEffect(() => {
    const token     = getProcessAdminToken();
    const adminData = localStorage.getItem('processAdminData');

    if (!token) { navigate("/process-admin-login"); return; }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    try { if (adminData) setProcessAdminData(JSON.parse(adminData)); }
    catch (e) { console.error("Error parsing admin data:", e); }

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "applications") fetchApplications();
  }, [activeTab]);

  /* ── Auth / logout ── */
  const handleLogout = () => {
    localStorage.removeItem('processAdminToken');
    localStorage.removeItem('processAdminData');
    localStorage.removeItem('processAdminEmail');
    delete axios.defaults.headers.common['Authorization'];
    navigate("/process-admin-login");
  };

  /* ── Applications API ── */
  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const token = getProcessAdminToken();
      if (!token) { navigate('/process-admin-login'); return; }

      const response = await axios.get(`${API_BASE_URL}/process-admin/documents/all`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.data?.success && response.data?.data?.applications) {
        setApplications(response.data.data.applications);
      } else { setApplications([]); }

    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('processAdminToken');
        localStorage.removeItem('processAdminData');
        navigate('/process-admin-login');
      }
      setApplications([]);
    } finally { setApplicationsLoading(false); }
  };

  const viewApplicationDetails = async (applicationId) => {
    try {
      const token    = getProcessAdminToken();
      const response = await axios.get(
        `${API_BASE_URL}/process-admin/applications/${applicationId}/details`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedApplication(response.data.data || response.data);
    } catch (e) { alert('Failed to load application details'); }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const token = getProcessAdminToken();
      await axios.put(
        `${API_BASE_URL}/process-admin/applications/${applicationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchApplications();
      setSelectedApplication(null);
    } catch (e) { console.error("Error updating status:", e); }
  };

  /* ── Dashboard render ── */
  const renderDashboard = () => (
    <div className="dashboard-content-area">

      {/* Welcome Banner */}
      <div className="welcome-section">
        <h2>👋 Dashboard Overview</h2>
        <p>Welcome back, <strong>{processAdminData?.email || 'Process Admin'}</strong>! Here's your activity summary.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: '📊', label: 'Processes Today',     value: 0,                   sub: '0% from yesterday' },
          { icon: '📅', label: 'Processes This Week', value: 0,                   sub: '0% from last week' },
          { icon: '📋', label: 'Total Applications',  value: applications.length, sub: 'From all universities' },
          { icon: '📁', label: 'Documents',            value: 0,                   sub: 'Pending review' },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-content">
              <h3>{s.label}</h3>
              <div className="stat-value">{s.value}</div>
              <div className="stat-subvalue">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="chart-placeholder">
        <p>📈 Process analytics will appear here</p>
      </div>
    </div>
  );

  /* ── Content router ── */
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":        return renderDashboard();
      case "applications":     return (
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
      case "documents":        return <Documents />;
      case "gus-applications": return <GusUniversity />;
      default:                 return null;
    }
  };

  /* ── Loading screen ── */
  if (loading) return (
    <div className="process-admin-dashboard">
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading dashboard…</p>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div className="process-admin-dashboard">

      {/* ══ SIDEBAR ══ */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>

        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {/* EduTechEx-style chevron icon */}
            <div className="sidebar-logo-icon">▶</div>
            {sidebarOpen && <h2>Process <span>Panel</span></h2>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <ul className="sidebar-menu">

          {/* Dashboard */}
          <li
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="menu-icon">📊</span>
            {sidebarOpen && <span>Dashboard</span>}
          </li>

          {/* ── Kansas University ── */}
          <li
            className={`kansas-parent ${kansasExpanded ? 'expanded' : ''}`}
            onClick={() => setKansasExpanded(!kansasExpanded)}
          >
            <span className="menu-icon">🏛️</span>
            {sidebarOpen && (
              <>
                <span>Kansas University</span>
                <span className="dropdown-arrow">{kansasExpanded ? '▼' : '▶'}</span>
              </>
            )}
          </li>

          {kansasExpanded && sidebarOpen && (
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

          {/* ── GUS University ── */}
          <li
            className={`kansas-parent ${gusExpanded ? 'expanded' : ''}`}
            onClick={() => setGusExpanded(!gusExpanded)}
          >
            <span className="menu-icon">🎓</span>
            {sidebarOpen && (
              <>
                <span>GUS University</span>
                <span className="dropdown-arrow">{gusExpanded ? '▼' : '▶'}</span>
              </>
            )}
          </li>

          {gusExpanded && sidebarOpen && (
            <ul className="sub-menu">
              <li
                className={activeTab === "gus-applications" ? "active" : ""}
                onClick={() => setActiveTab("gus-applications")}
              >
                <span className="menu-icon sub-icon">📋</span>
                <span>Applications</span>
              </li>
            </ul>
          )}
        </ul>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="logout-btn-sidebar" onClick={handleLogout}>
            <span className="menu-icon">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div className="main-content">

        {/* Navbar */}
        <nav className="navbar">
          <div className="navbar-left">
            <h1>Process Admin <span>Dashboard</span></h1>
          </div>

          <div className="navbar-center">
            <div className="search-container">
              <span className="search-icon-left">🔍</span>
              <input
                type="text"
                placeholder="Search applications, documents…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="navbar-right">
            {/* Notification bell */}
            <button className="notif-btn" title="Notifications">
              🔔
              <span className="notif-dot" />
            </button>

            {/* Profile chip */}
            <div className="admin-profile">
              <div className="profile-icon">👨‍💼</div>
              <span className="profile-name">{processAdminData?.email || "Process Admin"}</span>
            </div>

            {/* Refresh */}
            <button
              className="refresh-btn"
              onClick={() => activeTab === "applications" && fetchApplications()}
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </nav>

        {/* Page content */}
        <div className="content-area">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="dashboard-footer">
          © 2026 Process Admin Dashboard — EduTechEx. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default ProcessAdminDashboard;