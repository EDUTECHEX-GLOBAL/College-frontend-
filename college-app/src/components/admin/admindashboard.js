import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  lazy,
  Suspense,
  memo,
} from "react";
import { useNavigate } from "react-router-dom";
import EdutechLogo from "../../assets/Edutech-logo.svg";
import "./admindashboard.css";

// ── Lazy-load heavy tab components (code-split = faster initial load) ──────
const AdminUserManagement = lazy(() => import("./adminuser"));
const Notifications       = lazy(() => import("./Notifications"));
const University          = lazy(() => import("./University"));
const Bachelors           = lazy(() => import("./Bachelors"));
const Masters             = lazy(() => import("./Masters"));
const PhD                 = lazy(() => import("./PhD"));
const StudentAnalytics    = lazy(() => import("./StudentAnalytics"));

const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

// ── Icons defined OUTSIDE component so they're never recreated ────────────
const ICONS = {
  dashboard: (color = "#64748b") => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  users: (color = "#64748b") => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  ),
  university: (color = "#64748b") => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/>
    </svg>
  ),
  bachelors: (color = "#64748b") => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  masters: (color = "#64748b") => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>
    </svg>
  ),
  phd: (color = "#64748b") => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  analytics: (color = "#64748b") => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  notifications: (color = "#64748b") => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  settings: (color = "#64748b") => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  collapse: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  expand: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  search: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  hamburger: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  refresh: (color = "#fff") => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
};

// ── Cache duration: 60 seconds ────────────────────────────────────────────
const CACHE_TTL = 60_000;
let dashCache = { data: null, ts: 0 };

// ── Memoized sub-components ───────────────────────────────────────────────
const StatCard = memo(({ title, value, accent, icon, loading }) => (
  <div className={`stat-card stat-${accent}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3>{title}</h3>
      <div className="stat-value">
        {loading ? <span className="stat-skeleton" /> : (value ?? "—")}
      </div>
    </div>
  </div>
));

const SectionLabel = memo(({ label }) => (
  <div className="dash-section-label">{label}</div>
));

const TabFallback = () => (
  <div className="tab-loading">
    <div className="loading-spinner" style={{ width: 32, height: 32, margin: "60px auto 12px" }} />
    <p style={{ textAlign: "center", color: "#64748b", fontSize: 13 }}>Loading…</p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab,   setActiveTab]   = useState("dashboard");
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [apiError,    setApiError]    = useState(null);
  const [dashData,    setDashData]    = useState(null);
  const abortRef = useRef(null);

  // ── Stable auth headers ───────────────────────────────────────────────
  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("adminToken");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  // ── Sidebar + auth guards ─────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const ok    = localStorage.getItem("adminLoggedIn") === "true";
    const email = localStorage.getItem("adminEmail");
    if (!ok || !email) navigate("/admin-login");
  }, [navigate]);

  // ── Data fetcher with cache + abort ──────────────────────────────────
  const loadDashboardData = useCallback(async (silent = false) => {
    // Serve from cache if fresh
    if (!silent && dashCache.data && Date.now() - dashCache.ts < CACHE_TTL) {
      setDashData(dashCache.data);
      setLoading(false);
      return;
    }

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    if (!silent) setLoading(true);
    else setRefreshing(true);
    setApiError(null);

    try {
      const headers = authHeaders();
      const [dashRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/dashboard/overview`, { headers, signal }),
        fetch(`${API_BASE}/api/admin/users`,              { headers, signal }),
      ]);

      if (!dashRes.ok) throw new Error(`HTTP ${dashRes.status}: ${dashRes.statusText}`);
      const dashJson = await dashRes.json();
      if (!dashJson.success) throw new Error(dashJson.message || "API error");

      let merged = { ...dashJson.data };

      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        if (usersJson.success && usersJson.stats) {
          merged.userStats = {
            totalUsers:    usersJson.stats.totalUsers    ?? merged.userStats?.totalUsers    ?? 0,
            activeUsers:   usersJson.stats.activeUsers   ?? merged.userStats?.activeUsers   ?? 0,
            adminUsers:    usersJson.stats.adminUsers    ?? merged.userStats?.adminUsers    ?? 0,
            inactiveUsers: usersJson.stats.inactiveUsers ?? merged.userStats?.inactiveUsers ?? 0,
          };
        }
      }

      // Store in cache
      dashCache = { data: merged, ts: Date.now() };
      setDashData(merged);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Dashboard load error:", err);
      setApiError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (activeTab === "dashboard") loadDashboardData();
  }, [activeTab, loadDashboardData]);

  // ── Logout ────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    ["adminLoggedIn", "adminEmail", "adminToken"].forEach(k => localStorage.removeItem(k));
    navigate("/admin-login");
  }, [navigate]);

  const toggleSidebar   = useCallback(() => setSidebarOpen(p => !p), []);
  const handleSearch    = useCallback((e) => setSearchQuery(e.target.value), []);
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }, []);

  // ── Destructure data ──────────────────────────────────────────────────
  const d            = dashData || {};
  const userStats    = d.userStats          || {};
  const uniStats     = d.universityStats    || {};
  const studentStats = d.studentAnalytics   || {};
  const trend        = d.registrationTrend  || { labels: [], data: [] };
  const funnel       = d.profileFunnel      || {};

  // ── Sections (memoized) ───────────────────────────────────────────────
  const UsersSection = memo(() => (
    <div className="dash-section">
      <SectionLabel label="USERS" />
      <div className="stats-grid stats-grid-4">
        <StatCard title="Total Users"    value={userStats.totalUsers?.toLocaleString()}    accent="blue"   icon={ICONS.users("#0891b2")} loading={loading} />
        <StatCard title="Active Users"   value={userStats.activeUsers?.toLocaleString()}   accent="green"  icon={ICONS.users("#10b981")} loading={loading} />
        <StatCard title="Admins"         value={userStats.adminUsers?.toLocaleString()}    accent="purple" icon={ICONS.users("#8b5cf6")} loading={loading} />
        <StatCard title="Inactive Users" value={userStats.inactiveUsers?.toLocaleString()} accent={userStats.inactiveUsers > 0 ? "red" : "green"} icon={ICONS.users(userStats.inactiveUsers > 0 ? "#ef4444" : "#10b981")} loading={loading} />
      </div>
    </div>
  ));

  const UniversitySection = memo(() => (
    <div className="dash-section">
      <SectionLabel label="UNIVERSITY" />
      <div className="stats-grid stats-grid-4">
        <StatCard title="Imported Universities"  value={uniStats.importedUnis?.toLocaleString()}     accent="blue"   icon={ICONS.university("#0891b2")} loading={loading} />
        <StatCard title="Colleges"               value={uniStats.importedColleges?.toLocaleString()}  accent="teal"   icon={ICONS.university("#0d9488")} loading={loading} />
        <StatCard title="Bachelor's Universities" value={uniStats.bachelorsUnis?.toLocaleString()}   accent="purple" icon={ICONS.bachelors("#8b5cf6")}  loading={loading} />
        <StatCard title="Master's Universities"   value={uniStats.mastersUnis?.toLocaleString()}     accent="amber"  icon={ICONS.masters("#f59e0b")}    loading={loading} />
      </div>
    </div>
  ));

  const ProgramsSection = memo(() => (
    <div className="dash-section">
      <SectionLabel label="BACHELOR'S & MASTER'S PROGRAMS" />
      <div className="stats-grid stats-grid-4">
        <StatCard title="Bachelor's Programs" value={uniStats.bachelorsUnis?.toLocaleString()}         accent="blue"   icon={ICONS.bachelors("#0891b2")} loading={loading} />
        <StatCard title="Avg Programs / Uni"  value={uniStats.bachAvgPrograms}                         accent="green"  icon={ICONS.bachelors("#10b981")} loading={loading} />
        <StatCard title="Master's Programs"   value={uniStats.mastersTotalPrograms?.toLocaleString()}  accent="purple" icon={ICONS.masters("#8b5cf6")}   loading={loading} />
        <StatCard title="Master's Active"     value={uniStats.mastersActive?.toLocaleString()}         accent="amber"  icon={ICONS.masters("#f59e0b")}   loading={loading} />
      </div>
    </div>
  ));

  const StudentSection = memo(() => (
    <div className="dash-section">
      <SectionLabel label="STUDENT ANALYTICS" />
      <div className="stats-grid stats-grid-4">
        <StatCard title="Total Students"          value={studentStats.totalStudents?.toLocaleString()}               accent="blue"   icon={ICONS.analytics("#0891b2")}  loading={loading} />
        <StatCard title="Universities Selected"   value={studentStats.uniqueUniversitiesSelected?.toLocaleString()}  accent="teal"   icon={ICONS.university("#0d9488")} loading={loading} />
        <StatCard title="Courses Chosen"          value={studentStats.totalCoursesChosen?.toLocaleString()}          accent="purple" icon={ICONS.bachelors("#8b5cf6")}  loading={loading} />
        <StatCard title="Profiles Complete"       value={studentStats.completedPct != null ? `${studentStats.completedPct}%` : "—"} accent="amber" icon={ICONS.analytics("#f59e0b")} loading={loading} />
      </div>
    </div>
  ));

  // ── Registration chart ────────────────────────────────────────────────
  const RegistrationChart = memo(() => {
    const data   = trend.data   || [];
    const labels = trend.labels || [];
    const maxVal = Math.max(...data, 1);
    const barH   = (v) => (v === 0 ? 3 : Math.max(3, Math.round((v / maxVal) * 100)));

    return (
      <div className="chart-section">
        <div className="chart-header">
          <h3>Registrations over time <span className="chart-sub">last 7 days</span></h3>
        </div>
        <div className="chart-container">
          <div className="chart-bars">
            {data.length === 0 ? (
              <div className="chart-empty">No registration data yet</div>
            ) : data.map((value, i) => (
              <div className="chart-bar-container" key={i}>
                <div className={`chart-bar${value === 0 ? " bar-zero" : ""}`} style={{ height: `${barH(value)}%` }}>
                  <div className={`bar-value${value === 0 ? " bar-value-zero" : ""}`}>{value}</div>
                </div>
                <div className="chart-label">{labels[i] || i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  });

  // ── Profile funnel ────────────────────────────────────────────────────
  const ProfileFunnel = memo(() => {
    const total  = funnel.totalRegistered || 1;
    const COLORS = ["#0891b2","#0d9488","#8b5cf6","#f59e0b","#10b981","#3b82f6"];
    const stages = [
      { label: "Registered",          value: funnel.totalRegistered },
      { label: "Basic info filled",    value: funnel.hasBasicInfo },
      { label: "Education added",      value: funnel.hasEducation },
      { label: "University selected",  value: funnel.hasSelectedUniversity },
      { label: "Courses chosen",       value: funnel.hasSelectedCourses },
      { label: "Profile complete",     value: funnel.profileCompleted },
    ];

    return (
      <div className="funnel-section">
        <div className="funnel-header"><h3>Student profile funnel</h3></div>
        <div className="funnel-container">
          {loading
            ? <div className="funnel-loading">Loading…</div>
            : stages.map((s, i) => {
              const pct = total > 0 ? Math.round(((s.value || 0) / total) * 100) : 0;
              return (
                <div className="funnel-stage" key={i} style={{ borderLeftColor: COLORS[i] }}>
                  <div className="stage-label">{s.label}</div>
                  <div className="stage-value" style={{ color: COLORS[i] }}>
                    {(s.value || 0).toLocaleString()} ({pct}%)
                  </div>
                  <div className="stage-bar" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${COLORS[i]}cc,${COLORS[i]})` }} />
                </div>
              );
            })}
        </div>
      </div>
    );
  });

  // ── Dashboard overview ────────────────────────────────────────────────
  const DashboardContent = memo(() => (
    <div className="dashboard-content">
      <div className="welcome-section">
        <div className="welcome-text">
          <h2>Dashboard Overview</h2>
          <p>Here's an overview of your platform performance</p>
        </div>
        <div className="welcome-actions">
          {apiError && <div className="api-error-badge" title={apiError}>⚠ API Error</div>}
          <button
            className={`refresh-btn-sm ${refreshing ? "spinning" : ""}`}
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
          >
            {ICONS.refresh()}
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <UsersSection />
      <UniversitySection />
      <ProgramsSection />
      <StudentSection />

      <div className="charts-grid">
        <div className="chart-card"><RegistrationChart /></div>
        <div className="chart-card"><ProfileFunnel /></div>
      </div>

      <div className="quick-access-section">
        <h3>Quick Actions</h3>
        <div className="quick-action-cards">
          {[
            { tab: "university",        icon: ICONS.university("#0891b2"), title: "Import University Data",  desc: "Import and manage university & college data" },
            { tab: "student-analytics", icon: ICONS.analytics("#8b5cf6"),  title: "Student Analytics",       desc: "View university & course selections" },
            { tab: "bachelors",         icon: ICONS.bachelors("#10b981"),  title: "Bachelors Programs",      desc: "Manage bachelor's university listings" },
            { tab: "masters",           icon: ICONS.masters("#f59e0b"),   title: "Masters Programs",        desc: "Manage master's university listings" },
          ].map(({ tab, icon, title, desc }) => (
            <div className="quick-action-card" key={tab} onClick={() => handleTabChange(tab)}>
              <div className="quick-action-icon">{icon}</div>
              <div className="quick-action-content">
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
              <div className="quick-action-arrow">→</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ));

  // ── Settings ──────────────────────────────────────────────────────────
  const SettingsContent = () => (
    <div className="settings-content">
      <div className="welcome-section">
        <div className="welcome-text"><h2>Settings</h2><p>Configure your dashboard settings</p></div>
      </div>
      <div className="settings-grid">
        <div className="settings-card">
          <h3>General Settings</h3>
          <div className="settings-item"><label>Site Name</label><input type="text" defaultValue="Admin Dashboard" /></div>
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
          <div className="settings-item"><label><input type="checkbox" defaultChecked /> Email Notifications</label></div>
          <div className="settings-item"><label><input type="checkbox" defaultChecked /> User Registration Alerts</label></div>
        </div>
      </div>
    </div>
  );

  // ── Content router ────────────────────────────────────────────────────
  const adminEmail = localStorage.getItem("adminEmail");

  const renderContent = () => {
    if (activeTab === "notifications") {
      return (
        <div className="notifications-page">
          <div className="notifications-header">
            <h2>Notifications</h2>
            <p>Manage and view all your notifications here</p>
          </div>
          <Suspense fallback={<TabFallback />}>
            <Notifications adminId={adminEmail} fullView onUnreadCountChange={setUnreadCount} />
          </Suspense>
        </div>
      );
    }
    switch (activeTab) {
      case "dashboard":         return <DashboardContent />;
      case "users":             return <Suspense fallback={<TabFallback />}><AdminUserManagement /></Suspense>;
      case "university":        return <Suspense fallback={<TabFallback />}><University /></Suspense>;
      case "bachelors":         return <Suspense fallback={<TabFallback />}><Bachelors /></Suspense>;
      case "masters":           return <Suspense fallback={<TabFallback />}><Masters /></Suspense>;
      case "phd":               return <Suspense fallback={<TabFallback />}><PhD /></Suspense>;
      case "student-analytics": return <Suspense fallback={<TabFallback />}><StudentAnalytics /></Suspense>;
      case "settings":          return <SettingsContent />;
      default:                  return <DashboardContent />;
    }
  };

  const NAV_TITLE = {
    dashboard: "Dashboard", users: "Users", university: "University Data",
    bachelors: "Bachelors", masters: "Masters", phd: "PhD",
    notifications: "Notifications", "student-analytics": "Student Analytics", settings: "Settings",
  };

  // ── MenuItem (stable, no re-render unless activeTab/sidebarOpen change) ─
  const MenuItem = useCallback(({ tab, iconKey, label, badge }) => {
    const isActive  = activeTab === tab;
    const iconColor = isActive ? "#1e40af" : "#64748b";
    return (
      <li className={isActive ? "active" : ""} onClick={() => handleTabChange(tab)}>
        <span className="menu-icon">
          {ICONS[iconKey](iconColor)}
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
  }, [activeTab, sidebarOpen, handleTabChange]);

  const MOBILE_NAV = [
    { tab: "dashboard",         iconKey: "dashboard",     label: "Home" },
    { tab: "users",             iconKey: "users",         label: "Users" },
    { tab: "university",        iconKey: "university",    label: "Uni" },
    { tab: "student-analytics", iconKey: "analytics",     label: "Analytics" },
    { tab: "notifications",     iconKey: "notifications", label: "Alerts", badge: unreadCount },
  ];

  if (loading && activeTab === "dashboard" && !dashData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-logo-strip">
          {sidebarOpen
            ? <img src={EdutechLogo} alt="EduTech" className="sidebar-logo" loading="lazy" />
            : <div className="sidebar-logo-icon">{ICONS.dashboard("#1e40af")}</div>}
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {sidebarOpen ? ICONS.collapse : ICONS.expand}
          </button>
        </div>

        {sidebarOpen && <div className="nav-section-label">Main Menu</div>}

        <ul className="sidebar-menu">
          <MenuItem tab="dashboard"         iconKey="dashboard"     label="Dashboard"         />
          <MenuItem tab="users"             iconKey="users"         label="Users"             />
          <MenuItem tab="university"        iconKey="university"    label="University Data"   />
          {sidebarOpen && <li className="menu-divider" />}
          <MenuItem tab="bachelors"         iconKey="bachelors"     label="Bachelors"         />
          <MenuItem tab="masters"           iconKey="masters"       label="Masters"           />
          <MenuItem tab="phd"              iconKey="phd"           label="PhD"               />
          {sidebarOpen && <li className="menu-divider" />}
          <MenuItem tab="student-analytics" iconKey="analytics"     label="Student Analytics" />
          <MenuItem tab="notifications"     iconKey="notifications" label="Notifications" badge={unreadCount} />
          <MenuItem tab="settings"         iconKey="settings"      label="Settings"          />
        </ul>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="menu-icon">{ICONS.logout}</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <nav className="navbar">
          <div className="navbar-left">
            <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Open menu">{ICONS.hamburger}</button>
            <h1>{NAV_TITLE[activeTab] || "Dashboard"}</h1>
          </div>
          <div className="navbar-center">
            <div className="search-container">
              <input type="text" placeholder="Search..." value={searchQuery} onChange={handleSearch} className="search-input" />
              <button className="search-btn">{ICONS.search}</button>
            </div>
          </div>
          <div className="navbar-right">
            <Suspense fallback={null}>
              <Notifications adminId={adminEmail} onUnreadCountChange={setUnreadCount} />
            </Suspense>
            <div className="admin-profile">
              <span className="profile-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <span className="profile-name">{adminEmail?.split("@")[0] || "Admin"}</span>
            </div>
          </div>
        </nav>

        <div className="content-area">{renderContent()}</div>

        <footer className="dashboard-footer">
          <p>© {new Date().getFullYear()} Admin Dashboard. All rights reserved.</p>
        </footer>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        {MOBILE_NAV.map(({ tab, iconKey, label, badge }) => (
          <button key={tab} className={`mobile-nav-btn ${activeTab === tab ? "active" : ""}`} onClick={() => handleTabChange(tab)}>
            <span className="mobile-nav-icon">
              {ICONS[iconKey](activeTab === tab ? "#4a90e2" : "#94a3b8")}
              {badge > 0 && <span className="mobile-nav-badge">{badge > 99 ? "99+" : badge}</span>}
            </span>
            <span className="mobile-nav-label">{label}</span>
          </button>
        ))}
        <button className="mobile-nav-btn" onClick={toggleSidebar}>
          <span className="mobile-nav-icon">{ICONS.hamburger}</span>
          <span className="mobile-nav-label">More</span>
        </button>
      </nav>
    </div>
  );
};

export default AdminDashboard;