// ProcessAdminDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./processAdminDashboard.css";
import Applications from "./Applications";
import Documents from "./documents";
import GusUniversity from "./gusuniversity"; // ✅ Import GUS University component

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get process admin token - ONLY look for processAdminToken
const getProcessAdminToken = () => {
  const token = localStorage.getItem('processAdminToken');
  if (token) {
    console.log('✅ Using processAdminToken');
    return token;
  }
  console.error('❌ No process-admin token found');
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

  // ✅ Separate expanded state for each university menu
  const [kansusExpanded, setKansusExpanded] = useState(false);
  const [gusExpanded, setGusExpanded] = useState(false);

  // Applications state
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    totalApplications: 0,
    incomplete: 0
  });

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

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

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

  // Fetch applications when tab changes to applications
  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    }
  }, [activeTab]);

  const handleLogout = () => {
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
    if (activeTab === "applications") {
      fetchApplications();
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleKansusMenu = () => {
    setKansusExpanded(!kansusExpanded);
  };

  // ✅ Toggle GUS University sub-menu
  const toggleGusMenu = () => {
    setGusExpanded(!gusExpanded);
  };

  // ============ APPLICATIONS APIs ============
  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const token = getProcessAdminToken();
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

  // ============ RENDER FUNCTIONS ============

  const renderDashboard = () => {
    return (
      <div className="dashboard-content-area">
        <div className="welcome-section">
          <h2>Dashboard Overview</h2>
          <p>Welcome, {processAdminData?.email || 'Process Admin'}!</p>
        </div>

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
              <h3>DOCUMENTS</h3>
              <div className="stat-value">0</div>
              <div className="stat-subvalue">Pending review</div>
            </div>
          </div>
        </div>

        <div className="chart-placeholder">
          <p>Process analytics will appear here</p>
        </div>
      </div>
    );
  };

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

  const renderDocuments = () => {
    return <Documents />;
  };

  // ✅ Render GUS University component
  const renderGusUniversity = () => {
    return <GusUniversity />;
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "applications":
        return renderApplications();
      case "documents":
        return renderDocuments();
      case "gus-applications": // ✅ GUS University - Applications tab
        return renderGusUniversity();
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
          {/* Dashboard */}
          <li
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="menu-icon">📊</span>
            {sidebarOpen && <span>Dashboard</span>}
          </li>

          {/* ── Kansus University ── */}
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

          {/* ✅ ── GUS University ── */}
          <li
            className={`kansus-parent ${gusExpanded ? 'expanded' : ''}`}
            onClick={toggleGusMenu}
          >
            <span className="menu-icon">🎓</span>
            {sidebarOpen && (
              <>
                <span>GUS University</span>
                <span className="dropdown-arrow">{gusExpanded ? '▼' : '▶'}</span>
              </>
            )}
          </li>

          {/* ✅ GUS University Sub-menu */}
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