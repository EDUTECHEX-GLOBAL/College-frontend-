import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminUserManagement from "./adminuser";
import "./admindashboard.css";
import Notifications from "./Notifications";
import University from "./University";
import Bachelors from "./Bachelors";
import Masters from "./Masters";
import PhD from "./PhD";
import StudentAnalytics from "./StudentAnalytics";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // default CLOSED on mobile
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // mobile bottom nav state

  const [dashboardData, setDashboardData] = useState({
    todayRegistrations: 0,
    todayPercentChange: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    weekRegistrations: 0,
    weekPercentChange: 0,
    paidVsUnpaid: { paid: 12, unpaid: -1, percentage: 10 },
    upcomingTests: 2,
    nextTest: "Tomorrow",
    registrationTrend: {
      labels: ["Nov 1", "Nov 3", "Nov 4", "Nov 5"],
      data: [5, 7, 8, 6, 9, 12],
    },
    paymentFunnel: {
      registrations: 11,
      startedPayment: 0,
      completedPayment: 12,
      confirmed: 12,
    },
  });

  // On mount: open sidebar if desktop, close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
    const adminEmail = localStorage.getItem("adminEmail");
    if (!isLoggedIn || !adminEmail) {
      navigate("/admin-login");
      return;
    }
    if (activeTab === "dashboard") loadDashboardData();
  }, [navigate, activeTab]);

  const loadDashboardData = () => {
    setLoading(true);
    setTimeout(() => {
      setDashboardData({
        todayRegistrations: 0,
        todayPercentChange: 0,
        totalRevenue: 130050,
        todayRevenue: 0,
        weekRegistrations: 0,
        weekPercentChange: 0,
        paidVsUnpaid: { paid: 12, unpaid: -1, percentage: 10 },
        upcomingTests: 2,
        nextTest: "Tomorrow",
        registrationTrend: {
          labels: ["Nov 1", "Nov 3", "Nov 4", "Nov 5"],
          data: [5, 7, 8, 6, 9, 12],
        },
        paymentFunnel: {
          registrations: 11,
          startedPayment: 0,
          completedPayment: 12,
          confirmed: 12,
        },
      });
      setLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminEmail");
    navigate("/admin-login");
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleSearch = (e) => setSearchQuery(e.target.value);

  const refreshDashboard = () => loadDashboardData();

  // Navigate via tab and close mobile overlay
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    // On mobile, close sidebar after selecting
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  // ── Stats cards ──────────────────────────────────────────────────────────
  const renderStatsCards = () => {
    const stats = [
      {
        title: "REGISTRATIONS TODAY",
        value: dashboardData.todayRegistrations,
        subValue: `${dashboardData.todayPercentChange}% from yesterday`,
        icon: "📊",
        color: "stat-blue",
      },
      {
        title: "REGISTRATIONS THIS WEEK",
        value: dashboardData.weekRegistrations,
        subValue: `${dashboardData.weekPercentChange}% from last week`,
        icon: "📅",
        color: "stat-purple",
      },
    ];
    return (
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div className={`stat-card ${stat.color}`} key={index}>
            <div className="stat-icon"><span>{stat.icon}</span></div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-subvalue">{stat.subValue}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Registration chart ────────────────────────────────────────────────────
  const renderRegistrationChart = () => {
    const maxValue = Math.max(...dashboardData.registrationTrend.data);
    return (
      <div className="chart-section">
        <div className="chart-header"><h3>Registrations Over Time</h3></div>
        <div className="chart-container">
          <div className="chart-bars">
            {dashboardData.registrationTrend.data.map((value, index) => {
              const percentage = (value / maxValue) * 100;
              return (
                <div className="chart-bar-container" key={index}>
                  <div className="chart-bar" style={{ height: `${percentage}%` }}>
                    <div className="bar-value">{value}</div>
                  </div>
                  <div className="chart-label">
                    {dashboardData.registrationTrend.labels[index]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Payment funnel ────────────────────────────────────────────────────────
  const renderPaymentFunnel = () => {
    const stages = [
      { label: "Registrations", value: dashboardData.paymentFunnel.registrations, percentage: 100 },
    ];
    return (
      <div className="funnel-section">
        <div className="funnel-header"><h3>Payment Conversion Funnel</h3></div>
        <div className="funnel-container">
          {stages.map((stage, index) => (
            <div className="funnel-stage" key={index}>
              <div className="stage-label">{stage.label}</div>
              <div className="stage-value">{stage.value} ({stage.percentage}%)</div>
              <div className="stage-bar" style={{ width: `${stage.percentage}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Dashboard main content ────────────────────────────────────────────────
  const renderDashboardContent = () => (
    <div className="dashboard-content">
      <div className="welcome-section">
        <h2>Dashboard Overview</h2>
        <p>Here's an overview of your platform performance</p>
      </div>

      {renderStatsCards()}

      <div className="charts-grid">
        <div className="chart-card">{renderRegistrationChart()}</div>
        <div className="chart-card">{renderPaymentFunnel()}</div>
      </div>

      <div className="quick-access-section">
        <h3>Quick Actions</h3>
        <div className="quick-action-cards">
          <div className="quick-action-card" onClick={() => handleTabChange("university")}>
            <div className="quick-action-icon">🏛️</div>
            <div className="quick-action-content">
              <h4>Import University Data</h4>
              <p>Import and manage university &amp; college data</p>
            </div>
            <div className="quick-action-arrow">→</div>
          </div>
          <div className="quick-action-card" onClick={() => handleTabChange("student-analytics")}>
            <div className="quick-action-icon">📈</div>
            <div className="quick-action-content">
              <h4>Student Analytics</h4>
              <p>View university &amp; course selections by students</p>
            </div>
            <div className="quick-action-arrow">→</div>
          </div>
        </div>
      </div>

      <div className="action-section">
        <button className="refresh-btn" onClick={refreshDashboard}>
          Refresh Dashboard
        </button>
      </div>
    </div>
  );

  // ── Settings content ──────────────────────────────────────────────────────
  const renderSettingsContent = () => (
    <div className="settings-content">
      <div className="welcome-section">
        <h2>Settings</h2>
        <p>Configure your dashboard settings</p>
      </div>
      <div className="settings-grid">
        <div className="settings-card">
          <h3>General Settings</h3>
          <div className="settings-item">
            <label>Site Name</label>
            <input type="text" defaultValue="Admin Dashboard" />
          </div>
          <div className="settings-item">
            <label>Timezone</label>
            <select defaultValue="UTC">
              <option value="UTC">UTC</option>
              <option value="IST">IST</option>
              <option value="EST">EST</option>
            </select>
          </div>
        </div>
        <div className="settings-card">
          <h3>Notification Settings</h3>
          <div className="settings-item">
            <label><input type="checkbox" defaultChecked /> Email Notifications</label>
          </div>
          <div className="settings-item">
            <label><input type="checkbox" defaultChecked /> User Registration Alerts</label>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Render content switch ─────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":         return renderDashboardContent();
      case "users":             return <AdminUserManagement />;
      case "university":        return <University />;
      case "bachelors":         return <Bachelors />;
      case "masters":           return <Masters />;
      case "phd":               return <PhD />;
      case "student-analytics": return <StudentAnalytics />;
      case "settings":          return renderSettingsContent();
      default:                  return renderDashboardContent();
    }
  };

  // ── Navbar title ──────────────────────────────────────────────────────────
  const getNavbarTitle = () => {
    const titles = {
      "dashboard":         "Dashboard",
      "users":             "Users",
      "university":        "University Data",
      "bachelors":         "Bachelors",
      "masters":           "Masters",
      "phd":               "PhD",
      "notifications":     "Notifications",
      "student-analytics": "Student Analytics",
      "settings":          "Settings",
    };
    return titles[activeTab] || "Dashboard";
  };

  if (loading && activeTab === "dashboard") {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // ── Sidebar menu item helper ──────────────────────────────────────────────
  const MenuItem = ({ tab, icon, label, badge }) => (
    <li
      className={activeTab === tab ? "active" : ""}
      onClick={() => handleTabChange(tab)}
    >
      <span className="menu-icon">
        {icon}
        {badge > 0 && <span className="notification-badge-sidebar">{badge}</span>}
      </span>
      {sidebarOpen && (
        <>
          <span className="menu-label">{label}</span>
          {badge > 0 && <span className="notification-count-sidebar">{badge}</span>}
        </>
      )}
    </li>
  );

  // ── Mobile bottom nav items (most important 5) ────────────────────────────
  const mobileNavItems = [
    { tab: "dashboard", icon: "📊", label: "Home" },
    { tab: "users", icon: "👥", label: "Users" },
    { tab: "university", icon: "🏛️", label: "Uni" },
    { tab: "student-analytics", icon: "📈", label: "Analytics" },
    { tab: "notifications", icon: "🔔", label: "Alerts", badge: unreadCount },
  ];

  return (
    <div className="admin-dashboard">

      {/* ── Mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          {sidebarOpen && <h2>Admin Panel</h2>}
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <ul className="sidebar-menu">
          <MenuItem tab="dashboard"         icon="📊" label="Dashboard"        />
          <MenuItem tab="users"             icon="👥" label="Users"             />
          <MenuItem tab="university"        icon="🏛️" label="University Data"   />
          <MenuItem tab="bachelors"         icon="🎓" label="Bachelors"         />
          <MenuItem tab="masters"           icon="📚" label="Masters"           />
          <MenuItem tab="phd"              icon="🔬" label="PhD"               />
          <MenuItem tab="student-analytics" icon="📈" label="Student Analytics" />
          <MenuItem
            tab="notifications"
            icon="🔔"
            label="Notifications"
            badge={unreadCount}
          />
          <MenuItem tab="settings"          icon="⚙️" label="Settings"          />
        </ul>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="menu-icon">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="main-content">

        {/* Top Navbar */}
        <nav className="navbar">
          <div className="navbar-left">
            {/* Hamburger for mobile */}
            <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Open menu">
              ☰
            </button>
            <h1>{getNavbarTitle()}</h1>
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
            <Notifications
              adminId={localStorage.getItem("adminEmail")}
              onUnreadCountChange={setUnreadCount}
            />
            <div className="admin-profile">
              <span className="profile-icon">👨‍💼</span>
              <span className="profile-name">
                {localStorage.getItem("adminEmail")?.split("@")[0] || "Admin"}
              </span>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="content-area">
          {activeTab === "notifications" ? (
            <div className="notifications-page">
              <div className="notifications-header">
                <h2>Notifications</h2>
                <p>Manage and view all your notifications here</p>
              </div>
              <Notifications
                adminId={localStorage.getItem("adminEmail")}
                fullView={true}
                onUnreadCountChange={setUnreadCount}
              />
            </div>
          ) : (
            renderContent()
          )}
        </div>

        {/* Footer — hidden on mobile to give room to bottom nav */}
        <footer className="dashboard-footer">
          <p>© {new Date().getFullYear()} Admin Dashboard. All rights reserved.</p>
        </footer>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mobile-bottom-nav">
        {mobileNavItems.map(({ tab, icon, label, badge }) => (
          <button
            key={tab}
            className={`mobile-nav-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => handleTabChange(tab)}
          >
            <span className="mobile-nav-icon">
              {icon}
              {badge > 0 && <span className="mobile-nav-badge">{badge > 99 ? "99+" : badge}</span>}
            </span>
            <span className="mobile-nav-label">{label}</span>
          </button>
        ))}
        {/* More button opens full sidebar */}
        <button
          className="mobile-nav-btn"
          onClick={toggleSidebar}
        >
          <span className="mobile-nav-icon">☰</span>
          <span className="mobile-nav-label">More</span>
        </button>
      </nav>

    </div>
  );
};

export default AdminDashboard;