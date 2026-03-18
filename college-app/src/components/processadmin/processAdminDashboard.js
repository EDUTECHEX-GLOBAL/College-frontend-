// ProcessAdminDashboard.js — Purple/Amber Theme (matched to SocialEco design)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./processAdminDashboard.css";
import Applications from "./Applications";
import Documents from "./documents";
import GusUniversity from "./gusuniversity";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/* ─── Helpers ─── */
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
  if (s.includes('completed') || s === 'validated')        return 'status-badge completed';
  if (s.includes('incomplete'))                            return 'status-badge incomplete';
  if (s.includes('in progress') || s.includes('pending')) return 'status-badge in-progress';
  if (s.includes('not started'))                          return 'status-badge not-started';
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

/* ─── SVG Icon Components ─── */
const IcoPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#7B61FF">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IcoGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IcoBuilding = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
  </svg>
);
const IcoFileText = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcoFolder = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>
);
const IcoGradCap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IcoChevDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IcoChevRight = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoChevLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IcoBell = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const IcoSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IcoLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoLines = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="15" y2="18"/>
  </svg>
);

/* ─── Stat icon wrapper ─── */
const StatIcon = ({ bg, stroke, children }) => (
  <div className="pad-stat-ico" style={{ background: bg }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  </div>
);

/* ════════════════════════════════════════
   COMPONENT
════════════════════════════════════════ */
const ProcessAdminDashboard = () => {
  const navigate = useNavigate();

  const [sidebarOpen,         setSidebarOpen]         = useState(true);
  const [activeTab,           setActiveTab]           = useState("dashboard");
  const [processAdminData,    setProcessAdminData]    = useState(null);
  const [loading,             setLoading]             = useState(true);
  const [searchQuery,         setSearchQuery]         = useState("");
  const [kansasExpanded,      setKansasExpanded]      = useState(true);
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

  const handleLogout = () => {
    localStorage.removeItem('processAdminToken');
    localStorage.removeItem('processAdminData');
    localStorage.removeItem('processAdminEmail');
    delete axios.defaults.headers.common['Authorization'];
    navigate("/process-admin-login");
  };

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
    <div className="pad-dash">

      {/* ── 5 Stat Cards ── */}
      <div className="pad-stats-row">

        <div className="pad-stat-card">
          <StatIcon bg="#EDE9FF" stroke="#7B61FF">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </StatIcon>
          <div>
            <div className="pad-sv">{applications.length || 120}</div>
            <div className="pad-sl">Applications</div>
          </div>
        </div>

        <div className="pad-stat-card">
          <StatIcon bg="#EDFAF6" stroke="#3EBDA0">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </StatIcon>
          <div>
            <div className="pad-sv">55</div>
            <div className="pad-sl">Documents</div>
          </div>
        </div>

        <div className="pad-stat-card">
          <StatIcon bg="#EDE9FF" stroke="#7B61FF">
            <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
          </StatIcon>
          <div>
            <div className="pad-sv">6</div>
            <div className="pad-sl">Universities</div>
          </div>
        </div>

        <div className="pad-stat-card">
          <StatIcon bg="#F0EEFF" stroke="#A78BFA">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </StatIcon>
          <div>
            <div className="pad-sv">6</div>
            <div className="pad-sl">Universities</div>
          </div>
        </div>

        <div className="pad-stat-card">
          <StatIcon bg="#FFF8EE" stroke="#F4A623">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </StatIcon>
          <div>
            <div className="pad-sv">12</div>
            <div className="pad-sl">Pending Reviews</div>
          </div>
        </div>

      </div>

      {/* ── Charts Row ── */}
      <div className="pad-charts-row">

        {/* Applications Per Day — Line Chart */}
        <div className="pad-chart-card">
          <div className="pad-chart-hdr">
            <span className="pad-chart-title"><strong>Applications</strong> Per Day</span>
            <div className="pad-pills">
              <span className="pad-pill pad-pill-blue">2.41</span>
              <span className="pad-pill">PITT</span>
              <span className="pad-pill">VIM</span>
              <span className="pad-pill pad-pill-amber">5%</span>
            </div>
          </div>
          <div className="pad-chart-body">
            <svg viewBox="0 0 500 120" preserveAspectRatio="none" width="100%" height="120">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B61FF" stopOpacity="0.22"/>
                  <stop offset="100%" stopColor="#7B61FF" stopOpacity="0.01"/>
                </linearGradient>
              </defs>
              {[10,35,60,85].map((y, i) => (
                <line key={i} x1="22" y1={y} x2="498" y2={y} stroke="#ECEAF8" strokeWidth="1"/>
              ))}
              {['30','25','20','5'].map((t, i) => (
                <text key={i} x="2" y={[13,38,63,88][i]} fontSize="8" fill="#C0BCDC">{t}</text>
              ))}
              <path
                d="M28,105 L98,80 L170,65 L244,63 L318,38 L393,50 L468,34 L468,112 L28,112Z"
                fill="url(#lineGrad)"
              />
              <path
                d="M28,105 L98,80 L170,65 L244,63 L318,38 L393,50 L468,34"
                stroke="#7B61FF" strokeWidth="2.2" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
              />
              {[[28,105],[98,80],[170,65],[244,63],[318,38],[393,50],[468,34]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy}
                  r={i === 4 ? 5 : 3.5}
                  fill={i === 4 ? "#7B61FF" : "white"}
                  stroke="#7B61FF" strokeWidth="2"
                />
              ))}
            </svg>
          </div>
          <div className="pad-chart-xlbls">
            {['Apr 9','Apr 10','Apr 11','Apr 12','Apr 13','Apr 14','Apr 15'].map(l => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <div className="pad-chart-footer">
            <span className="pad-cfi"><span className="pad-cfd" style={{background:'#7B61FF'}}></span><strong>120</strong> Total</span>
            <span className="pad-cfi"><span className="pad-cfd" style={{background:'#3EBDA0'}}></span><strong>38</strong> this week</span>
            <span className="pad-cfi"><span className="pad-cfd" style={{background:'#F4A623'}}></span><strong>12</strong> feedetts</span>
            <span className="pad-lines-ico"><IcoLines /></span>
          </div>
        </div>

        {/* Documents Uploaded — Bar Chart */}
        <div className="pad-chart-card">
          <div className="pad-chart-hdr">
            <span className="pad-chart-title"><strong>Documents</strong> Uploaded</span>
            <div className="pad-pills">
              <span className="pad-pill pad-pill-blue">5.35</span>
              <span className="pad-pill">TOTAL</span>
              <span className="pad-pill pad-pill-amber">5S</span>
              <span className="pad-pill">2.4</span>
              <span className="pad-pill">MOOM</span>
              <span className="pad-pill">MAW</span>
            </div>
          </div>
          <div className="pad-chart-body">
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" width="100%" height="120">
              {[10,35,60,85].map((y, i) => (
                <line key={i} x1="22" y1={y} x2="398" y2={y} stroke="#ECEAF8" strokeWidth="1"/>
              ))}
              {['50','40','30','20'].map((t, i) => (
                <text key={i} x="0" y={[13,38,63,88][i]} fontSize="8" fill="#C0BCDC">{t}</text>
              ))}
              <rect x="32"  y="10"  width="48" height="95" rx="5" fill="#7B61FF" opacity="0.80"/>
              <rect x="100" y="34"  width="48" height="71" rx="5" fill="#A78BFA" opacity="0.78"/>
              <rect x="168" y="50"  width="48" height="55" rx="5" fill="#F4A623" opacity="0.78"/>
              <rect x="236" y="60"  width="48" height="45" rx="5" fill="#3EBDA0" opacity="0.78"/>
              <rect x="304" y="70"  width="48" height="35" rx="5" fill="#FCD34D" opacity="0.88"/>
            </svg>
          </div>
          <div className="pad-bar-xlbls">
            {['Kansas University','Stanford Uni','MIT','GUS University','GUS University'].map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
          <div className="pad-chart-footer">
            <span className="pad-cfi"><span className="pad-cfd" style={{background:'#7B61FF'}}></span><strong>55</strong> Total</span>
            <span className="pad-cfi"><span className="pad-cfd" style={{background:'#F4A623'}}></span><strong>12</strong> Pending</span>
            <span className="pad-view-all-link">View All</span>
          </div>
        </div>

      </div>

      {/* ── Bottom Row ── */}
      <div className="pad-bottom-row">

        {/* Recent Applications Table */}
        <div className="pad-table-card">
          <div className="pad-table-hdr">
            <span className="pad-section-title">Recent Applications</span>
            <span className="pad-view-all-link">View All &rsaquo;</span>
          </div>
          <table className="pad-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>University</th>
                <th>Course</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Aravind</td>
                <td>Kansas University</td>
                <td>BSc</td>
                <td><span className="pad-badge pad-pending">● Pending</span></td>
                <td>Apr 11</td>
                <td className="pad-chev">∨</td>
              </tr>
              <tr>
                <td>Rahul</td>
                <td>GUS University</td>
                <td>MBA</td>
                <td><span className="pad-badge pad-approved">✓ Approved</span></td>
                <td>Apr 10</td>
                <td className="pad-chev">∨</td>
              </tr>
              <tr>
                <td>Krishna</td>
                <td>Stanford University</td>
                <td>MSc</td>
                <td><span className="pad-badge pad-review">● Review</span></td>
                <td>Apr 9</td>
                <td className="pad-chev">∨</td>
              </tr>
            </tbody>
          </table>
          <div className="pad-table-footer">
            <button className="pad-view-all-btn">View All &rsaquo;</button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="pad-activity-card">
          <div className="pad-activity-hdr">
            <span className="pad-section-title">Recent Activity</span>
            <span className="pad-activity-arrow">‹</span>
          </div>
          <div className="pad-activity-list">

            <div className="pad-act-day">Today</div>
            <div className="pad-act-item">
              <span className="pad-act-dot pad-dot-teal"><IcoCheck /></span>
              <span className="pad-act-txt"><strong>Rahul:</strong> Document approved for GUS</span>
            </div>
            <div className="pad-act-item">
              <span className="pad-act-dot pad-dot-teal"><IcoCheck /></span>
              <span className="pad-act-txt"><strong>Aravind:</strong> Submitted application to Kansas University</span>
            </div>

            <div className="pad-act-day" style={{ marginTop: 10 }}>Yesterday</div>
            <div className="pad-act-item">
              <span className="pad-act-dot pad-dot-blue"><IcoCheck /></span>
              <span className="pad-act-txt"><strong>Admin</strong> reviewed Krishna's application</span>
            </div>
            <div className="pad-act-item">
              <span className="pad-act-dot pad-dot-indigo"><IcoCheck /></span>
              <span className="pad-act-txt"><strong>New university</strong> MIT added to the system</span>
            </div>

          </div>
        </div>

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

  if (loading) return (
    <div className="process-admin-dashboard">
      <div className="loading-container">
        <div className="loading-spinner"/>
        <p>Loading dashboard…</p>
      </div>
    </div>
  );

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div className="process-admin-dashboard">

      {/* ══ SIDEBAR ══ */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>

        {/* Brand */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><IcoPlay /></div>
            {sidebarOpen && <h2>Process <span>Panel</span></h2>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(p => !p)}>
            {sidebarOpen ? <IcoChevLeft /> : <IcoChevRight />}
          </button>
        </div>

        {/* Nav */}
        <ul className="sidebar-menu">

          {/* Dashboard */}
          <li
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="sb-ico sb-blue"><IcoGrid /></span>
            {sidebarOpen && <span>Dashboard</span>}
          </li>

          {/* Kansas University */}
          <li
            className={`kansas-parent ${kansasExpanded ? 'expanded' : ''}`}
            onClick={() => setKansasExpanded(p => !p)}
          >
            <span className="sb-ico sb-blue"><IcoBuilding /></span>
            {sidebarOpen && (
              <>
                <span>Kansas University</span>
                <span className="dropdown-arrow">
                  {kansasExpanded ? <IcoChevDown /> : <IcoChevRight />}
                </span>
              </>
            )}
          </li>

          {kansasExpanded && sidebarOpen && (
            <ul className="sub-menu">
              <li
                className={activeTab === "applications" ? "active" : ""}
                onClick={() => setActiveTab("applications")}
              >
                <span className="sb-ico sb-ico-sm sb-blue"><IcoFileText /></span>
                <span>Applications</span>
              </li>
              <li
                className={activeTab === "documents" ? "active" : ""}
                onClick={() => setActiveTab("documents")}
              >
                <span className="sb-ico sb-ico-sm sb-amber"><IcoFolder /></span>
                <span>Documents</span>
              </li>
            </ul>
          )}

          {/* GUS University */}
          <li
            className={`kansas-parent ${gusExpanded ? 'expanded' : ''}`}
            onClick={() => setGusExpanded(p => !p)}
          >
            <span className="sb-ico sb-teal"><IcoGradCap /></span>
            {sidebarOpen && (
              <>
                <span>GUS University</span>
                <span className="dropdown-arrow">
                  {gusExpanded ? <IcoChevDown /> : <IcoChevRight />}
                </span>
              </>
            )}
          </li>

          {gusExpanded && sidebarOpen && (
            <ul className="sub-menu">
              <li
                className={activeTab === "gus-applications" ? "active" : ""}
                onClick={() => setActiveTab("gus-applications")}
              >
                <span className="sb-ico sb-ico-sm sb-blue"><IcoFileText /></span>
                <span>Applications</span>
              </li>
            </ul>
          )}
        </ul>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="logout-btn-sidebar" onClick={handleLogout}>
            <span className="logout-circle"><IcoLogout /></span>
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
              <span className="search-icon-left"><IcoSearch /></span>
              <input
                type="text"
                placeholder="Search applications, documents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="navbar-right">
            <button className="notif-btn" title="Notifications">
              <IcoBell />
              <span className="notif-dot"/>
            </button>

            <div className="admin-profile">
              <div className="profile-icon"><IcoUser /></div>
              <span className="profile-name">{processAdminData?.email || "process-admin@..."}</span>
            </div>

            <button className="mail-btn" title="Mail">
              <IcoMail />
            </button>
          </div>
        </nav>

        {/* Content */}
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