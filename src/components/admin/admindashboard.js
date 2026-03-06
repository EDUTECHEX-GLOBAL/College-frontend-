import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminUserManagement from "./adminuser";
import "./admindashboard.css";
import Notifications from "./Notifications";
import University from "./University"; // Import the University component

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  // Add unreadCount state
  const [unreadCount, setUnreadCount] = useState(0);

  // Dashboard stats - updated to match reference
  const [dashboardData, setDashboardData] = useState({
    todayRegistrations: 0,
    todayPercentChange: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    weekRegistrations: 0,
    weekPercentChange: 0,
    paidVsUnpaid: {
      paid: 12,
      unpaid: -1,
      percentage: 10
    },
    upcomingTests: 2,
    nextTest: "Tomorrow",
    registrationTrend: {
      labels: ["Nov 1", "Nov 3", "Nov 4", "Nov 5"],
      data: [5, 7, 8, 6, 9, 12]
    },
    paymentFunnel: {
      registrations: 11,
      startedPayment: 0,
      completedPayment: 12,
      confirmed: 12
    }
  });

  // Check authentication on component mount
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
    const adminEmail = localStorage.getItem("adminEmail");
    
    if (!isLoggedIn || !adminEmail) {
      navigate("/admin-login");
      return;
    }

    // Load dashboard data only when on dashboard tab
    if (activeTab === "dashboard") {
      loadDashboardData();
    }
  }, [navigate, activeTab]);

  const loadDashboardData = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Updated mock data to match reference
      setDashboardData({
        todayRegistrations: 0,
        todayPercentChange: 0,
        totalRevenue: 130050,
        todayRevenue: 0,
        weekRegistrations: 0,
        weekPercentChange: 0,
        paidVsUnpaid: {
          paid: 12,
          unpaid: -1,
          percentage: 10
        },
        upcomingTests: 2,
        nextTest: "Tomorrow",
        registrationTrend: {
          labels: ["Nov 1", "Nov 3", "Nov 4", "Nov 5"],
          data: [5, 7, 8, 6, 9, 12]
        },
        paymentFunnel: {
          registrations: 11,
          startedPayment: 0,
          completedPayment: 12,
          confirmed: 12
        }
      });
      
      setLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminEmail");
    navigate("/admin-login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const refreshDashboard = () => {
    loadDashboardData();
  };

  // REMOVED: Applications component lazy loading

  // Format number with Indian Rupee symbol
  const formatIndianRupee = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Render the stats cards
  const renderStatsCards = () => {
    const stats = [
      {
        title: "REGISTRATIONS TODAY",
        value: dashboardData.todayRegistrations,
        subValue: `${dashboardData.todayPercentChange}% from yesterday`,
        icon: "📊",
        color: "stat-blue"
      },
      {
        title: "REGISTRATIONS THIS WEEK",
        value: dashboardData.weekRegistrations,
        subValue: `${dashboardData.weekPercentChange}% from last week`,
        icon: "📅",
        color: "stat-purple"
      },
    ];

    return (
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div className={`stat-card ${stat.color}`} key={index}>
            <div className="stat-icon">
              <span>{stat.icon}</span>
            </div>
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

  // Render registration over time chart
  const renderRegistrationChart = () => {
    const maxValue = Math.max(...dashboardData.registrationTrend.data);
    
    return (
      <div className="chart-section">
        <div className="chart-header">
          <h3>Registrations Over Time</h3>
        </div>
        <div className="chart-container">
          <div className="chart-bars">
            {dashboardData.registrationTrend.data.map((value, index) => {
              const percentage = (value / maxValue) * 100;
              return (
                <div className="chart-bar-container" key={index}>
                  <div className="chart-bar" style={{ height: `${percentage}%` }}>
                    <div className="bar-value">{value}</div>
                  </div>
                  <div className="chart-label">{dashboardData.registrationTrend.labels[index]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render payment conversion funnel
  const renderPaymentFunnel = () => {
    const stages = [
      { label: "Registrations", value: dashboardData.paymentFunnel.registrations, percentage: 100 },
      
    ];

    return (
      <div className="funnel-section">
        <div className="funnel-header">
          <h3>Payment Conversion Funnel</h3>
        </div>
        <div className="funnel-container">
          {stages.map((stage, index) => (
            <div className="funnel-stage" key={index}>
              <div className="stage-label">{stage.label}</div>
              <div className="stage-value">
                {stage.value} ({stage.percentage}%)
              </div>
              <div className="stage-bar" style={{ width: `${stage.percentage}%` }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render dashboard content
  const renderDashboardContent = () => {
    return (
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Dashboard Overview</h2>
          <p>Here's an overview of your platform performance</p>
        </div>

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-card">
            {renderRegistrationChart()}
          </div>
          <div className="chart-card">
            {renderPaymentFunnel()}
          </div>
        </div>

        {/* Quick Access to University Import */}
        <div className="quick-access-section">
          <h3>Quick Actions</h3>
          <div className="quick-action-cards">
            <div className="quick-action-card" onClick={() => setActiveTab("university")}>
              <div className="quick-action-icon">🏛️</div>
              <div className="quick-action-content">
                <h4>Import University Data</h4>
                <p>Import and manage university & college data</p>
              </div>
              <div className="quick-action-arrow">→</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          <button className="refresh-btn" onClick={refreshDashboard}>
            Refresh Dashboard
          </button>
        </div>
      </div>
    );
  };

  // REMOVED: renderApplicationsContent function

  // Render users content using the imported component
  const renderUsersContent = () => {
    return <AdminUserManagement />;
  };

  // Render university content
  const renderUniversityContent = () => {
    return <University />;
  };

  // Render settings content
  const renderSettingsContent = () => {
    return (
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
              <label>
                <input type="checkbox" defaultChecked />
                Email Notifications
              </label>
            </div>
            <div className="settings-item">
              <label>
                <input type="checkbox" defaultChecked />
                User Registration Alerts
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render content based on active tab - REMOVED applications case
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboardContent();
      case "users":
        return renderUsersContent();
      case "university":
        return renderUniversityContent();
      case "settings":
        return renderSettingsContent();
      default:
        return renderDashboardContent();
    }
  };

  // Update navbar title based on active tab - REMOVED applications case
  const getNavbarTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Admin Dashboard";
      case "users":
        return "User Management";
      case "university":
        return "University Data Import";
      case "notifications":
        return "Notification Management";
      case "settings":
        return "Settings";
      default:
        return "Admin Dashboard";
    }
  };

  if (loading && activeTab === "dashboard") {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
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
          
          {/* REMOVED: Applications menu item */}
          
          <li 
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            <span className="menu-icon">👥</span>
            {sidebarOpen && <span>Users</span>}
          </li>
          
          {/* University Menu Item */}
          <li 
            className={activeTab === "university" ? "active" : ""}
            onClick={() => setActiveTab("university")}
          >
            <span className="menu-icon">🏛️</span>
            {sidebarOpen && <span>University Data</span>}
          </li>
          
          {/* Notification Menu Item */}
          <li 
            className={activeTab === "notifications" ? "active" : ""}
            onClick={() => setActiveTab("notifications")}
          >
            <span className="menu-icon">
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge-sidebar">{unreadCount}</span>
              )}
            </span>
            {sidebarOpen && (
              <>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="notification-count-sidebar">{unreadCount}</span>
                )}
              </>
            )}
          </li>
          
          <li 
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            <span className="menu-icon">⚙️</span>
            {sidebarOpen && <span>Settings</span>}
          </li>
        </ul>
        
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
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
            {/* Pass setUnreadCount to the Notifications component */}
            <Notifications 
              adminId={localStorage.getItem("adminEmail")} 
              onUnreadCountChange={setUnreadCount}
            />
            <div className="admin-profile">
              <span className="profile-icon">👨‍💼</span>
              <span className="profile-name">
                {localStorage.getItem("adminEmail") || "Admin"}
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
              {/* Your Notifications component will render here */}
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

        {/* Footer */}
        <footer className="dashboard-footer">
          <p>© {new Date().getFullYear()} Admin Dashboard. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;