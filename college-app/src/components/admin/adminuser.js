import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import "./adminuser.css";

// ── Constants outside component (never recreated) ─────────────────────────
const API_BASE_URL = "http://localhost:5000/api/admin/users";
const PA_API       = "http://localhost:5000/api/process-admin";

const STATUS_MAP = {
  active:    "status-active",
  inactive:  "status-inactive",
  pending:   "status-pending",
  suspended: "status-suspended",
  rejected:  "status-rejected",
};

const PA_FILTERS = [
  { key: "pending_approval", label: "Pending"  },
  { key: "active",           label: "Approved" },
  { key: "rejected",         label: "Rejected" },
  { key: "all",              label: "All"       },
];

// ── SVG Icons as constants (never recreated on render) ────────────────────
const IconRefresh = memo(() => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/>
  </svg>
));
const IconCheck = memo(() => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
));
const IconX = memo(() => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
));
const IconMinus = memo(() => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
));
const IconPlus = memo(() => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
));
const IconTrash = memo(() => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
));
const IconSearch = memo(() => (
  <svg className="search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
));

// ── Utility functions outside component ───────────────────────────────────
const formatDate = (raw) => {
  if (!raw || raw === "Never") return "Never";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return raw; }
};

const formatDateTime = (raw) => {
  if (!raw || raw === "Never") return "Never";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return formatDate(raw) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch { return raw; }
};

const getStatusBadgeClass = (status) =>
  STATUS_MAP[(status || "").toLowerCase()] || "status-inactive";

const getStatusDisplay = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";

const needsApproval = (user) =>
  user.status === "inactive" || user.status === "pending";

const transformUser = (user) => {
  const name = (user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown").trim();
  const role  = (user.role || "User").trim();
  return {
    id:          user._id || user.id,
    name,
    email:       user.email || "unknown@example.com",
    role:        role.charAt(0).toUpperCase() + role.slice(1),
    status:      user.status || "inactive",
    lastLogin:   user.lastLogin || user.formattedLastLogin ? formatDateTime(user.lastLogin || user.formattedLastLogin) : "Never",
    joinDate:    user.joinDate  || user.formattedJoinDate  || user.createdAt ? formatDate(user.joinDate || user.formattedJoinDate || user.createdAt) : "N/A",
    avatar:      user.avatar || (name[0] ? name[0].toUpperCase() : "?"),
    otpVerified: user.otpVerified || user.isVerified || false,
    signupDate:  user.createdAt || new Date().toISOString(),
  };
};

// ── Memoized sub-components ───────────────────────────────────────────────
const StatusBadge = memo(({ status, label }) => (
  <span className={`status-badge ${getStatusBadgeClass(status)}`}>
    {label || getStatusDisplay(status)}
  </span>
));

const UserAvatar = memo(({ char }) => (
  <div className="user-avatar">{char}</div>
));

const RejectModal = memo(({ onConfirm, onCancel, reason, setReason }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
    <div style={{ background:"#fff", borderRadius:12, padding:"28px 32px", width:400, maxWidth:"90vw", boxShadow:"0 8px 32px rgba(0,0,0,0.15)" }}>
      <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:600 }}>Reject application</h3>
      <p style={{ margin:"0 0 14px", fontSize:13, color:"#64748b" }}>
        This reason will be included in the rejection email sent to the applicant.
      </p>
      <textarea
        rows={3}
        placeholder="e.g. Incomplete information provided…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{ width:"100%", boxSizing:"border-box", fontSize:13, padding:"8px 10px", borderRadius:6, border:"1px solid #e2e8f0", resize:"vertical", fontFamily:"inherit" }}
      />
      <div style={{ display:"flex", gap:10, marginTop:16, justifyContent:"flex-end" }}>
        <button className="seed-users-btn" onClick={onCancel}>Cancel</button>
        <button className="btn-reject" onClick={onConfirm}>Confirm Reject</button>
      </div>
    </div>
  </div>
));

const LoadingSpinner = memo(() => (
  <div className="loading-container">
    <div className="loading-spinner" />
    <p>Loading…</p>
  </div>
));

// ── User row (desktop) ────────────────────────────────────────────────────
const UserRow = memo(({ user, onApprove, onReject, onUpdate, onDelete }) => (
  <tr className={user.status === "inactive" ? "user-inactive" : ""}>
    <td>
      <div className="user-info">
        <UserAvatar char={user.avatar} />
        <div className="user-details">
          <div className="user-name">{user.name}</div>
          <div className="user-email">{user.email}</div>
          {user.status === "inactive" && !user.otpVerified && (
            <div className="user-note">⚠ OTP not verified</div>
          )}
        </div>
      </div>
    </td>
    <td>
      <select
        className="role-select"
        value={user.role.toLowerCase()}
        onChange={(e) => onUpdate(user.id, "role", e.target.value)}
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="moderator">Moderator</option>
      </select>
    </td>
    <td><StatusBadge status={user.status} /></td>
    <td className="last-login">{user.lastLogin}</td>
    <td className="join-date">{user.joinDate}</td>
    <td>
      <div className="action-buttons">
        {needsApproval(user) ? (
          <>
            <button className="btn-approve" onClick={() => onApprove(user.id)} title="Approve">
              <IconCheck /> Approve
            </button>
            <button className="btn-reject" onClick={() => onReject(user.id)} title="Reject">
              <IconX /> Reject
            </button>
          </>
        ) : (
          <button
            className={user.status === "active" ? "btn-deactivate" : "btn-activate"}
            onClick={() => onUpdate(user.id, "status", user.status === "active" ? "inactive" : "active")}
          >
            {user.status === "active" ? <><IconMinus /> Deactivate</> : <><IconPlus /> Activate</>}
          </button>
        )}
        <button className="btn-delete" onClick={() => onDelete(user.id)} title="Delete">
          <IconTrash />
        </button>
      </div>
    </td>
  </tr>
));

// ── Mobile user card ──────────────────────────────────────────────────────
const MobileUserCard = memo(({ user, expanded, onToggle, onApprove, onReject, onUpdate, onDelete }) => (
  <div className={`mobile-user-card ${user.status === "inactive" ? "user-inactive" : ""} ${expanded ? "expanded" : ""}`}>
    <div className="mobile-card-top" onClick={() => onToggle(user.id)}>
      <div className="user-info">
        <UserAvatar char={user.avatar} />
        <div className="user-details">
          <div className="user-name">{user.name}</div>
          <div className="user-email">{user.email}</div>
        </div>
      </div>
      <div className="mobile-card-right">
        <StatusBadge status={user.status} />
        <span className="mobile-expand-icon">{expanded ? "▲" : "▼"}</span>
      </div>
    </div>
    {expanded && (
      <div className="mobile-card-body">
        {user.status === "inactive" && !user.otpVerified && (
          <div className="user-note mobile-note">⚠ OTP not verified</div>
        )}
        <div className="mobile-meta-row">
          <div className="mobile-meta-item">
            <span className="mobile-meta-label">Role</span>
            <select className="role-select" value={user.role.toLowerCase()} onChange={(e) => onUpdate(user.id, "role", e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
          <div className="mobile-meta-item">
            <span className="mobile-meta-label">Last Login</span>
            <span className="mobile-meta-value">{user.lastLogin}</span>
          </div>
          <div className="mobile-meta-item">
            <span className="mobile-meta-label">Joined</span>
            <span className="mobile-meta-value">{user.joinDate}</span>
          </div>
        </div>
        <div className="mobile-actions">
          {needsApproval(user) ? (
            <>
              <button className="btn-approve" onClick={() => onApprove(user.id)}>✓ Approve</button>
              <button className="btn-reject"  onClick={() => onReject(user.id)}>✗ Reject</button>
              <button className="btn-delete"  onClick={() => onDelete(user.id)}>Delete</button>
            </>
          ) : (
            <>
              <button
                className={user.status === "active" ? "btn-deactivate" : "btn-activate"}
                onClick={() => onUpdate(user.id, "status", user.status === "active" ? "inactive" : "active")}
              >
                {user.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <button className="btn-delete" onClick={() => onDelete(user.id)}>Delete</button>
            </>
          )}
        </div>
      </div>
    )}
  </div>
));

// ── Main component ────────────────────────────────────────────────────────
const AdminUserManagement = () => {
  const [loading,             setLoading]             = useState(false);
  const [searchQuery,         setSearchQuery]         = useState("");
  const [roleFilter,          setRoleFilter]          = useState("all");
  const [statusFilter,        setStatusFilter]        = useState("all");
  const [users,               setUsers]               = useState([]);
  const [expandedRow,         setExpandedRow]         = useState(null);
  const [userStats,           setUserStats]           = useState({ totalUsers:0, activeUsers:0, adminUsers:0, inactiveUsers:0 });
  const [activeTab,           setActiveTab]           = useState("users");
  const [processAdmins,       setProcessAdmins]       = useState([]);
  const [processAdminFilter,  setProcessAdminFilter]  = useState("pending_approval");
  const [paLoading,           setPaLoading]           = useState(false);
  const [rejectTarget,        setRejectTarget]        = useState(null);
  const [rejectReason,        setRejectReason]        = useState("");

  // ── Stable auth headers ───────────────────────────────────────────────
  const getAdminHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
  }), []);

  // ── Filtered users via useMemo (no extra useEffect needed) ───────────
  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all")   result = result.filter(u => u.role.toLowerCase() === roleFilter.toLowerCase());
    if (statusFilter !== "all") result = result.filter(u => u.status.toLowerCase() === statusFilter.toLowerCase());
    return result;
  }, [users, searchQuery, roleFilter, statusFilter]);

  // ── Filtered process admins via useMemo ───────────────────────────────
  const filteredProcessAdmins = useMemo(() =>
    processAdminFilter === "all"
      ? processAdmins
      : processAdmins.filter(pa => pa.status === processAdminFilter),
  [processAdmins, processAdminFilter]);

  const pendingPaCount = useMemo(() =>
    processAdmins.filter(pa => pa.status === "pending_approval").length,
  [processAdmins]);

  // ── Load users ────────────────────────────────────────────────────────
  const loadUsersData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL, { headers: getAdminHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (!data.success) {
        setUsers([]);
        setUserStats({ totalUsers:0, activeUsers:0, adminUsers:0, inactiveUsers:0 });
        return;
      }

      const transformed = (data.users || data.data || []).map(transformUser);
      setUsers(transformed);
      setUserStats(data.stats || {
        totalUsers:    transformed.length,
        activeUsers:   transformed.filter(u => u.status === "active").length,
        adminUsers:    transformed.filter(u => u.role.toLowerCase() === "admin").length,
        inactiveUsers: transformed.filter(u => u.status === "inactive").length,
      });
    } catch (err) {
      console.error("Error loading users:", err);
      alert("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  }, [getAdminHeaders]);

  // ── Load process admins ───────────────────────────────────────────────
  const loadProcessAdmins = useCallback(async () => {
    setPaLoading(true);
    try {
      const res  = await fetch(`${PA_API}/all`, { headers: getAdminHeaders() });
      const data = await res.json();
      setProcessAdmins(data.success ? (data.data || []) : []);
    } catch (err) {
      console.error("Error loading process admins:", err);
    } finally {
      setPaLoading(false);
    }
  }, [getAdminHeaders]);

  useEffect(() => {
    loadUsersData();
    loadProcessAdmins();
  }, [loadUsersData, loadProcessAdmins]);

  // ── User handlers ─────────────────────────────────────────────────────
  const handleApproveUser = useCallback(async (userId) => {
    try {
      const res  = await fetch(`${API_BASE_URL}/${userId}/approve`, {
        method: "PATCH", headers: getAdminHeaders(),
        body: JSON.stringify({ approvedBy: localStorage.getItem("adminEmail") || "Admin", approvedAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (data?.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: "active" } : u));
        if (data.stats) setUserStats(data.stats);
        alert("User approved successfully!");
      } else alert(data.message || "Failed to approve user");
    } catch (err) { console.error(err); alert("Failed to approve user."); }
  }, [getAdminHeaders]);

  const handleRejectUser = useCallback(async (userId) => {
    if (!window.confirm("Reject this user? Status will be set to 'suspended'.")) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/${userId}/status`, {
        method: "PATCH", headers: getAdminHeaders(),
        body: JSON.stringify({ status: "suspended", rejectedBy: localStorage.getItem("adminEmail") || "Admin", rejectedAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (data?.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: "suspended" } : u));
        if (data.stats) setUserStats(data.stats);
        alert("User rejected successfully!");
      } else alert(data.message || "Failed to reject user");
    } catch (err) { console.error(err); alert("Failed to reject user."); }
  }, [getAdminHeaders]);

  const handleUpdateUser = useCallback(async (userId, field, value) => {
    const isStatus = field === "status";
    const isRole   = field === "role";
    const endpoint = isStatus ? `${API_BASE_URL}/${userId}/status`
                   : isRole   ? `${API_BASE_URL}/${userId}/role`
                   :             `${API_BASE_URL}/${userId}`;
    const method   = isStatus || isRole ? "PATCH" : "PUT";
    const bodyData = isRole ? { role: value.toLowerCase() } : { [field]: value };
    try {
      const res  = await fetch(endpoint, { method, headers: getAdminHeaders(), body: JSON.stringify(bodyData) });
      const data = await res.json();
      if (data?.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
        if (data.stats) setUserStats(data.stats);
        alert(`User ${field} updated successfully!`);
      } else alert(data.message || "Failed to update user");
    } catch (err) { console.error(err); alert("Failed to update user."); }
  }, [getAdminHeaders]);

  const handleDeleteUser = useCallback(async (userId) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/${userId}`, { method: "DELETE", headers: getAdminHeaders() });
      const data = await res.json();
      if (data?.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        if (data.stats) setUserStats(data.stats);
        alert("User deleted successfully!");
      } else alert(data.message || "Failed to delete user");
    } catch (err) { console.error(err); alert("Failed to delete user."); }
  }, [getAdminHeaders]);

  const handleSeedUsers = useCallback(async () => {
    if (!window.confirm("This will create sample users. Continue?")) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/seed`, { method: "POST", headers: getAdminHeaders() });
      const data = await res.json();
      if (data?.success) { alert(`${data.count || "Sample"} users created!`); loadUsersData(); }
      else alert(data.message || "Failed to seed users");
    } catch (err) { console.error(err); alert("Failed to seed users."); }
  }, [getAdminHeaders, loadUsersData]);

  // ── Process Admin handlers ────────────────────────────────────────────
  const handleApproveProcessAdmin = useCallback(async (id) => {
    try {
      const res  = await fetch(`${PA_API}/approve/${id}`, {
        method: "POST", headers: getAdminHeaders(),
        body: JSON.stringify({ approvedBy: localStorage.getItem("adminEmail") || "SuperAdmin" }),
      });
      const data = await res.json();
      if (data?.success) {
        setProcessAdmins(prev => prev.map(pa => pa._id === id ? { ...pa, status: "active", isApproved: true } : pa));
        alert("Process admin approved! Approval email sent.");
      } else alert(data.message || "Failed to approve.");
    } catch (err) { console.error(err); alert("Failed to approve process admin."); }
  }, [getAdminHeaders]);

  const openRejectModal = useCallback((id) => {
    setRejectTarget(id);
    setRejectReason("");
  }, []);

  const handleRejectProcessAdmin = useCallback(async () => {
    if (!rejectTarget) return;
    try {
      const res  = await fetch(`${PA_API}/reject/${rejectTarget}`, {
        method: "POST", headers: getAdminHeaders(),
        body: JSON.stringify({ reason: rejectReason || "Not specified" }),
      });
      const data = await res.json();
      if (data?.success) {
        setProcessAdmins(prev => prev.map(pa => pa._id === rejectTarget ? { ...pa, status: "rejected" } : pa));
        setRejectTarget(null);
        setRejectReason("");
        alert("Process admin rejected. Rejection email sent.");
      } else alert(data.message || "Failed to reject.");
    } catch (err) { console.error(err); alert("Failed to reject process admin."); }
  }, [rejectTarget, rejectReason, getAdminHeaders]);

  const handleDeactivateProcessAdmin = useCallback(async (id, currentStatus) => {
    const action = currentStatus === "active" ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} this process admin?`)) return;
    try {
      const res  = await fetch(`${PA_API}/deactivate/${id}`, { method: "PATCH", headers: getAdminHeaders() });
      const data = await res.json();
      if (data?.success) {
        setProcessAdmins(prev => prev.map(pa => pa._id === id ? { ...pa, status: data.data.status, isActive: data.data.isActive } : pa));
        alert(`Process admin ${action}d successfully.`);
      } else alert(data.message || `Failed to ${action}.`);
    } catch (err) { console.error(err); alert(`Failed to ${action} process admin.`); }
  }, [getAdminHeaders]);

  const toggleRow = useCallback((id) =>
    setExpandedRow(prev => prev === id ? null : id), []);

  const handleTabSwitch = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === "processAdmins") loadProcessAdmins();
  }, [loadProcessAdmins]);

  // ── Loading guard ─────────────────────────────────────────────────────
  if (loading && activeTab === "users") return <LoadingSpinner />;

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="admin-users-container">

      {/* Header */}
      <div className="users-header">
        <div className="header-left">
          <h1>Users &amp; Roles</h1>
          <p>Manage accounts and permissions</p>
        </div>
        <div className="header-buttons">
          {activeTab === "users" ? (
            <button className="seed-users-btn" onClick={handleSeedUsers}>
              <IconRefresh /> Seed
            </button>
          ) : (
            <button className="refresh-btn" onClick={loadProcessAdmins} disabled={paLoading}>
              <IconRefresh /> {paLoading ? "Loading…" : "Refresh"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="users-stats-grid">
        <div className="user-stat-card total-users">
          <div className="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-value">{userStats.totalUsers}</div>
          </div>
        </div>
        <div className="user-stat-card active-users">
          <div className="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Active</h3>
            <div className="stat-value">{userStats.activeUsers}</div>
          </div>
        </div>
        <div className="user-stat-card admin-users">
          <div className="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Admins</h3>
            <div className="stat-value">{userStats.adminUsers}</div>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Tab switcher */}
      <div className="section-header" style={{ marginBottom:0, paddingBottom:0 }}>
        <div style={{ display:"flex", gap:8 }}>
          <button
            className={activeTab === "users" ? "refresh-btn" : "seed-users-btn"}
            onClick={() => handleTabSwitch("users")}
          >
            Students &amp; Users
          </button>
          <button
            className={activeTab === "processAdmins" ? "refresh-btn" : "seed-users-btn"}
            onClick={() => handleTabSwitch("processAdmins")}
            style={{ position:"relative" }}
          >
            Process Admins
            {pendingPaCount > 0 && (
              <span style={{ marginLeft:6, background:"#fef9c3", color:"#854d0e", fontSize:11, padding:"1px 7px", borderRadius:20, fontWeight:600 }}>
                {pendingPaCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── TAB: Students & Users ── */}
      {activeTab === "users" && (
        <div className="user-management-section">
          <div className="section-header">
            <h2>User Management</h2>
            <button className="refresh-btn" onClick={loadUsersData}>
              <IconRefresh /> Refresh
            </button>
          </div>

          <div className="controls-container">
            <div className="controls-row">
              <div className="search-box">
                <IconSearch />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery("")}>✕</button>
                )}
              </div>
              <div className="filter-pills">
                <div className="filter-group">
                  <span className="filter-label">Role</span>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div className="filter-group">
                  <span className="filter-label">Status</span>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="results-count">
                  <span className="rc-num">{filteredUsers.length}</span>
                  <span className="rc-sep">/</span>
                  <span>{users.length}</span>
                  <span className="rc-label">users</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="users-table-container desktop-table">
            <table className="users-table">
              <thead>
                <tr>
                  <th style={{width:"32%"}}>User</th>
                  <th style={{width:"11%"}}>Role</th>
                  <th style={{width:"11%"}}>Status</th>
                  <th style={{width:"18%"}}>Last Login</th>
                  <th style={{width:"14%"}}>Joined</th>
                  <th style={{width:"14%"}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onApprove={handleApproveUser}
                      onReject={handleRejectUser}
                      onUpdate={handleUpdateUser}
                      onDelete={handleDeleteUser}
                    />
                  ))
                ) : (
                  <tr><td colSpan="6" className="no-users">No users found matching your criteria</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-user-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <MobileUserCard
                  key={user.id}
                  user={user}
                  expanded={expandedRow === user.id}
                  onToggle={toggleRow}
                  onApprove={handleApproveUser}
                  onReject={handleRejectUser}
                  onUpdate={handleUpdateUser}
                  onDelete={handleDeleteUser}
                />
              ))
            ) : (
              <div className="no-users-mobile">No users found matching your criteria</div>
            )}
          </div>

          <div className="pagination-container">
            <div className="pagination-info">
              Page 1 of 1 &nbsp;·&nbsp; {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Process Admins ── */}
      {activeTab === "processAdmins" && (
        <div className="user-management-section">
          <div className="section-header">
            <h2>Process Admin Approvals</h2>
          </div>

          <div className="controls-container">
            <div className="controls-row">
              <div className="filter-pills">
                {PA_FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    className={processAdminFilter === key ? "refresh-btn" : "seed-users-btn"}
                    onClick={() => setProcessAdminFilter(key)}
                    style={{ fontSize:13 }}
                  >
                    {label}
                  </button>
                ))}
                <div className="results-count">
                  <span className="rc-num">{filteredProcessAdmins.length}</span>
                  <span className="rc-label">admins</span>
                </div>
              </div>
            </div>
          </div>

          <div className="users-table-container desktop-table">
            {paLoading ? <LoadingSpinner /> : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th style={{width:"28%"}}>Name</th>
                    <th style={{width:"30%"}}>Email</th>
                    <th style={{width:"14%"}}>Registered</th>
                    <th style={{width:"12%"}}>Status</th>
                    <th style={{width:"16%"}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcessAdmins.length > 0 ? (
                    filteredProcessAdmins.map(pa => (
                      <tr key={pa._id}>
                        <td>
                          <div className="user-info">
                            <UserAvatar char={(pa.firstName?.[0] || "P").toUpperCase()} />
                            <div className="user-details">
                              <div className="user-name">{pa.firstName} {pa.lastName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="last-login">{pa.email}</td>
                        <td className="join-date">{formatDate(pa.createdAt)}</td>
                        <td>
                          <StatusBadge
                            status={pa.status === "pending_approval" ? "pending" : pa.status}
                            label={pa.status === "pending_approval" ? "Pending" : undefined}
                          />
                        </td>
                        <td>
                          <div className="action-buttons">
                            {pa.status === "pending_approval" && (
                              <>
                                <button className="btn-approve" onClick={() => handleApproveProcessAdmin(pa._id)}>
                                  <IconCheck /> Approve
                                </button>
                                <button className="btn-reject" onClick={() => openRejectModal(pa._id)}>
                                  <IconX /> Reject
                                </button>
                              </>
                            )}
                            {(pa.status === "active" || pa.status === "suspended") && (
                              <button
                                className={pa.status === "active" ? "btn-deactivate" : "btn-activate"}
                                onClick={() => handleDeactivateProcessAdmin(pa._id, pa.status)}
                              >
                                {pa.status === "active" ? <><IconMinus /> Deactivate</> : <><IconPlus /> Reactivate</>}
                              </button>
                            )}
                            {pa.status === "rejected" && (
                              <span style={{ fontSize:12, color:"#dc2626" }} title={pa.rejectionReason || ""}>✗ Rejected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="no-users">No {processAdminFilter === "all" ? "" : processAdminFilter.replace("_"," ")} process admins found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="mobile-user-list">
            {filteredProcessAdmins.length > 0 ? (
              filteredProcessAdmins.map(pa => (
                <div key={pa._id} className={`mobile-user-card ${expandedRow === pa._id ? "expanded" : ""}`}>
                  <div className="mobile-card-top" onClick={() => toggleRow(pa._id)}>
                    <div className="user-info">
                      <UserAvatar char={(pa.firstName?.[0] || "P").toUpperCase()} />
                      <div className="user-details">
                        <div className="user-name">{pa.firstName} {pa.lastName}</div>
                        <div className="user-email">{pa.email}</div>
                      </div>
                    </div>
                    <div className="mobile-card-right">
                      <StatusBadge
                        status={pa.status === "pending_approval" ? "pending" : pa.status}
                        label={pa.status === "pending_approval" ? "Pending" : undefined}
                      />
                      <span className="mobile-expand-icon">{expandedRow === pa._id ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {expandedRow === pa._id && (
                    <div className="mobile-card-body">
                      <div className="mobile-meta-row">
                        <div className="mobile-meta-item">
                          <span className="mobile-meta-label">Registered</span>
                          <span className="mobile-meta-value">{formatDate(pa.createdAt)}</span>
                        </div>
                      </div>
                      <div className="mobile-actions">
                        {pa.status === "pending_approval" && (
                          <>
                            <button className="btn-approve" onClick={() => handleApproveProcessAdmin(pa._id)}>✓ Approve</button>
                            <button className="btn-reject"  onClick={() => openRejectModal(pa._id)}>✗ Reject</button>
                          </>
                        )}
                        {(pa.status === "active" || pa.status === "suspended") && (
                          <button
                            className={pa.status === "active" ? "btn-deactivate" : "btn-activate"}
                            onClick={() => handleDeactivateProcessAdmin(pa._id, pa.status)}
                          >
                            {pa.status === "active" ? "Deactivate" : "Reactivate"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-users-mobile">No process admins found</div>
            )}
          </div>

          <div className="pagination-container">
            <div className="pagination-info">
              {filteredProcessAdmins.length} result{filteredProcessAdmins.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          reason={rejectReason}
          setReason={setRejectReason}
          onConfirm={handleRejectProcessAdmin}
          onCancel={() => { setRejectTarget(null); setRejectReason(""); }}
        />
      )}

    </div>
  );
};

export default AdminUserManagement;