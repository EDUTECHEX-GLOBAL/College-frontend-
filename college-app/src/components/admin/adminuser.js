import React, { useState, useEffect, useCallback } from "react";
import "./adminuser.css";

const AdminUserManagement = () => {
  // ── Existing state ──
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    inactiveUsers: 0,
  });

  // ── Process Admin state ──
  const [activeTab, setActiveTab] = useState("users");
  const [processAdmins, setProcessAdmins] = useState([]);
  const [processAdminFilter, setProcessAdminFilter] = useState("pending_approval");
  const [paLoading, setPaLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const API_BASE_URL = "http://localhost:5000/api/admin/users";
  const PA_API       = "http://localhost:5000/api/process-admin";

  const getAdminHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
  });

  // ── Date formatters ──
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
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } catch { return raw; }
  };

  // ── On mount ──
  useEffect(() => {
    loadUsersData();
    loadProcessAdmins();
  }, []);

  useEffect(() => { filterUsers(); }, [searchQuery, roleFilter, statusFilter, users]);

  // ─────────────────────────────────────────────
  // Load Students/Users
  // ─────────────────────────────────────────────
  const loadUsersData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append("search", searchQuery);
      if (roleFilter !== "all") queryParams.append("role", roleFilter);
      if (statusFilter !== "all") queryParams.append("status", statusFilter);

      const response = await fetch(
        `${API_BASE_URL}?${queryParams.toString()}`,
        { headers: getAdminHeaders() }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data.success) {
        setUsers([]);
        setFilteredUsers([]);
        setUserStats({ totalUsers: 0, activeUsers: 0, adminUsers: 0, inactiveUsers: 0 });
        return;
      }

      const transformedUsers = (data.users || data.data || []).map((user) => {
        const name = (
          user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown"
        ).trim();
        const role   = (user.role || "User").trim();
        const status = user.status || "inactive";
        const rawLastLogin = user.lastLogin || user.formattedLastLogin || null;
        const rawJoinDate  = user.joinDate || user.formattedJoinDate || user.createdAt || null;
        return {
          id: user._id || user.id,
          name,
          email: user.email || "unknown@example.com",
          role: role.charAt(0).toUpperCase() + role.slice(1),
          status,
          lastLogin: rawLastLogin ? formatDateTime(rawLastLogin) : "Never",
          joinDate:  rawJoinDate  ? formatDate(rawJoinDate)      : "N/A",
          avatar: user.avatar || (name[0] ? name[0].toUpperCase() : "?"),
          otpVerified: user.otpVerified || user.isVerified || false,
          signupDate: user.createdAt || new Date().toISOString(),
        };
      });

      setUsers(transformedUsers);

      if (data.stats) {
        setUserStats({
          totalUsers:    data.stats.totalUsers   || transformedUsers.length,
          activeUsers:   data.stats.activeUsers  || transformedUsers.filter((u) => u.status === "active").length,
          adminUsers:    data.stats.adminUsers   || transformedUsers.filter((u) => u.role.toLowerCase() === "admin").length,
          inactiveUsers: transformedUsers.filter((u) => u.status === "inactive").length,
        });
      } else {
        setUserStats({
          totalUsers:    transformedUsers.length,
          activeUsers:   transformedUsers.filter((u) => u.status === "active").length,
          adminUsers:    transformedUsers.filter((u) => u.role.toLowerCase() === "admin").length,
          inactiveUsers: transformedUsers.filter((u) => u.status === "inactive").length,
        });
      }
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to fetch users. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Load Process Admins
  // ─────────────────────────────────────────────
  const loadProcessAdmins = async () => {
    setPaLoading(true);
    try {
      const response = await fetch(`${PA_API}/all`, { headers: getAdminHeaders() });
      const data = await response.json();
      if (data.success) setProcessAdmins(data.data || []);
      else setProcessAdmins([]);
    } catch (error) {
      console.error("Error loading process admins:", error);
    } finally {
      setPaLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Filter users
  // ─────────────────────────────────────────────
  const filterUsers = useCallback(() => {
    let filtered = [...users];
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          (user.name  || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.email || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (roleFilter !== "all") {
      filtered = filtered.filter(
        (user) => (user.role || "").toLowerCase() === roleFilter.toLowerCase()
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (user) => (user.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }
    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter, statusFilter]);

  // ─────────────────────────────────────────────
  // Student/User handlers
  // ─────────────────────────────────────────────
  const handleApproveUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/approve`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          approvedBy: localStorage.getItem("adminEmail") || "Admin",
          approvedAt: new Date().toISOString(),
        }),
      });
      const data = await response.json();
      if (data?.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u)));
        if (data.stats) setUserStats(data.stats);
        alert("User approved successfully!");
      } else {
        alert(data.message || "Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user.");
    }
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm("Reject this user? Their status will be set to 'suspended'.")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/status`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          status: "suspended",
          rejectedBy: localStorage.getItem("adminEmail") || "Admin",
          rejectedAt: new Date().toISOString(),
        }),
      });
      const data = await response.json();
      if (data?.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "suspended" } : u)));
        if (data.stats) setUserStats(data.stats);
        alert("User rejected successfully!");
      } else {
        alert(data.message || "Failed to reject user");
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("Failed to reject user.");
    }
  };

  const handleUpdateUser = async (userId, field, value) => {
    try {
      let endpoint = `${API_BASE_URL}/${userId}`;
      let method   = "PUT";
      let bodyData = {};
      if (field === "status") {
        endpoint = `${API_BASE_URL}/${userId}/status`;
        method   = "PATCH";
        bodyData = { status: value };
      } else if (field === "role") {
        endpoint = `${API_BASE_URL}/${userId}/role`;
        method   = "PATCH";
        bodyData = { role: value.toLowerCase() };
      } else {
        bodyData = { [field]: value };
      }
      const response = await fetch(endpoint, {
        method, headers: getAdminHeaders(), body: JSON.stringify(bodyData),
      });
      const data = await response.json();
      if (data?.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u)));
        if (data.stats) setUserStats(data.stats);
        alert(`User ${field} updated successfully!`);
      } else {
        alert(data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}`, {
        method: "DELETE", headers: getAdminHeaders(),
      });
      const data = await response.json();
      if (data?.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        if (data.stats) setUserStats(data.stats);
        alert("User deleted successfully!");
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const handleAddUser = async () => {
    const newUser = {
      firstName: "New", lastName: "User",
      email: `newuser${users.length + 1}@example.com`,
      password: "password123", role: "user", status: "active",
    };
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST", headers: getAdminHeaders(), body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (data?.success) {
        const transformedUser = {
          id: data.user?._id || data.user?.id || `temp-${Date.now()}`,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email, role: "User", status: "active",
          lastLogin: "Never", joinDate: formatDate(new Date().toISOString()), avatar: "N",
        };
        setUsers((prev) => [...prev, transformedUser]);
        if (data.stats) setUserStats(data.stats);
        alert("User added successfully!");
      } else {
        alert(data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user.");
    }
  };

  const handleSeedUsers = async () => {
    if (!window.confirm("This will create sample users. Continue?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/seed`, {
        method: "POST", headers: getAdminHeaders(),
      });
      const data = await response.json();
      if (data?.success) {
        alert(`${data.count || "Sample"} users created successfully!`);
        loadUsersData();
      } else {
        alert(data.message || "Failed to seed users");
      }
    } catch (error) {
      console.error("Error seeding users:", error);
      alert("Failed to seed users.");
    }
  };

  // ─────────────────────────────────────────────
  // Process Admin handlers
  // ─────────────────────────────────────────────
  const handleApproveProcessAdmin = async (id) => {
    try {
      const response = await fetch(`${PA_API}/approve/${id}`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          approvedBy: localStorage.getItem("adminEmail") || "SuperAdmin",
        }),
      });
      const data = await response.json();
      if (data?.success) {
        setProcessAdmins((prev) =>
          prev.map((pa) => pa._id === id ? { ...pa, status: "active", isApproved: true } : pa)
        );
        alert("Process admin approved! Approval email sent.");
      } else {
        alert(data.message || "Failed to approve.");
      }
    } catch (error) {
      console.error("Error approving process admin:", error);
      alert("Failed to approve process admin.");
    }
  };

  const openRejectModal = (id) => {
    setRejectTarget(id);
    setRejectReason("");
  };

  const handleRejectProcessAdmin = async () => {
    if (!rejectTarget) return;
    try {
      const response = await fetch(`${PA_API}/reject/${rejectTarget}`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason: rejectReason || "Not specified" }),
      });
      const data = await response.json();
      if (data?.success) {
        setProcessAdmins((prev) =>
          prev.map((pa) =>
            pa._id === rejectTarget ? { ...pa, status: "rejected" } : pa
          )
        );
        setRejectTarget(null);
        setRejectReason("");
        alert("Process admin rejected. Rejection email sent.");
      } else {
        alert(data.message || "Failed to reject.");
      }
    } catch (error) {
      console.error("Error rejecting process admin:", error);
      alert("Failed to reject process admin.");
    }
  };

  const handleDeactivateProcessAdmin = async (id, currentStatus) => {
    const action = currentStatus === "active" ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} this process admin?`)) return;
    try {
      const response = await fetch(`${PA_API}/deactivate/${id}`, {
        method: "PATCH",
        headers: getAdminHeaders(),
      });
      const data = await response.json();
      if (data?.success) {
        setProcessAdmins((prev) =>
          prev.map((pa) =>
            pa._id === id
              ? { ...pa, status: data.data.status, isActive: data.data.isActive }
              : pa
          )
        );
        alert(`Process admin ${action}d successfully.`);
      } else {
        alert(data.message || `Failed to ${action}.`);
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      alert(`Failed to ${action} process admin.`);
    }
  };

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const getStatusBadgeClass = (status) => {
    const map = {
      active: "status-active", inactive: "status-inactive",
      pending: "status-pending", suspended: "status-suspended", rejected: "status-rejected",
    };
    return map[(status || "").toLowerCase()] || "status-inactive";
  };

  const getStatusDisplay = (status) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";

  const needsApproval = (user) =>
    user.status === "inactive" || user.status === "pending";

  const toggleRow = (id) =>
    setExpandedRow((prev) => (prev === id ? null : id));

  // ─────────────────────────────────────────────
  // Derived values for Process Admin tab
  // ─────────────────────────────────────────────
  const filteredProcessAdmins = processAdminFilter === "all"
    ? processAdmins
    : processAdmins.filter((pa) => pa.status === processAdminFilter);

  const pendingPaCount = processAdmins.filter((pa) => pa.status === "pending_approval").length;

  // ─────────────────────────────────────────────
  // Loading guard
  // ─────────────────────────────────────────────
  if (loading && activeTab === "users") {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading users…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="admin-users-container">

      {/* ── Header ── */}
      <div className="users-header">
        <div className="header-left">
          <h1>Users &amp; Roles</h1>
          <p>Manage accounts and permissions</p>
        </div>
        <div className="header-buttons">
          {activeTab === "users" ? (
            <>
              
              <button className="seed-users-btn" onClick={handleSeedUsers}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/></svg>
                Seed
              </button>
            </>
          ) : (
            <button className="refresh-btn" onClick={loadProcessAdmins} disabled={paLoading}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/></svg>
              {paLoading ? "Loading…" : "Refresh"}
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="users-stats-grid">
        <div className="user-stat-card total-users">
          <div className="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-value">{userStats.totalUsers}</div>
          </div>
        </div>
        <div className="user-stat-card active-users">
          <div className="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-content">
            <h3>Active</h3>
            <div className="stat-value">{userStats.activeUsers}</div>
          </div>
        </div>
        <div className="user-stat-card admin-users">
          <div className="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className="stat-content">
            <h3>Admins</h3>
            <div className="stat-value">{userStats.adminUsers}</div>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* ── Tab switcher ── */}
      <div className="section-header" style={{ marginBottom: 0, paddingBottom: 0 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={activeTab === "users" ? "refresh-btn" : "seed-users-btn"}
            onClick={() => setActiveTab("users")}
          >
            Students &amp; Users
          </button>
          <button
            className={activeTab === "processAdmins" ? "refresh-btn" : "seed-users-btn"}
            onClick={() => { setActiveTab("processAdmins"); loadProcessAdmins(); }}
            style={{ position: "relative" }}
          >
            Process Admins
            {pendingPaCount > 0 && (
              <span style={{
                marginLeft: 6,
                background: "#fef9c3",
                color: "#854d0e",
                fontSize: 11,
                padding: "1px 7px",
                borderRadius: 20,
                fontWeight: 600,
              }}>
                {pendingPaCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          TAB: Students & Users
      ══════════════════════════════════════════ */}
      {activeTab === "users" && (
        <div className="user-management-section">
          <div className="section-header">
            <h2>User Management</h2>
            <button className="refresh-btn" onClick={loadUsersData}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/></svg>
              Refresh
            </button>
          </div>

          <div className="controls-container">
            <div className="controls-row">
              <div className="search-box">
                <svg className="search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
                  filteredUsers.map((user) => (
                    <tr key={user.id} className={user.status === "inactive" ? "user-inactive" : ""}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">{user.avatar}</div>
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
                          onChange={(e) => handleUpdateUser(user.id, "role", e.target.value)}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="moderator">Moderator</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                          {getStatusDisplay(user.status)}
                        </span>
                      </td>
                      <td className="last-login">{user.lastLogin}</td>
                      <td className="join-date">{user.joinDate}</td>
                      <td>
                        <div className="action-buttons">
                          {needsApproval(user) ? (
                            <>
                              <button className="btn-approve" onClick={() => handleApproveUser(user.id)} title="Approve">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Approve
                              </button>
                              <button className="btn-reject" onClick={() => handleRejectUser(user.id)} title="Reject">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              className={user.status === "active" ? "btn-deactivate" : "btn-activate"}
                              onClick={() => handleUpdateUser(user.id, "status", user.status === "active" ? "inactive" : "active")}
                            >
                              {user.status === "active" ? (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                  Activate
                                </>
                              )}
                            </button>
                          )}
                          <button className="btn-delete" onClick={() => handleDeleteUser(user.id)} title="Delete">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-users">No users found matching your criteria</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-user-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`mobile-user-card ${user.status === "inactive" ? "user-inactive" : ""} ${expandedRow === user.id ? "expanded" : ""}`}
                >
                  <div className="mobile-card-top" onClick={() => toggleRow(user.id)}>
                    <div className="user-info">
                      <div className="user-avatar">{user.avatar}</div>
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="mobile-card-right">
                      <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                        {getStatusDisplay(user.status)}
                      </span>
                      <span className="mobile-expand-icon">{expandedRow === user.id ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {expandedRow === user.id && (
                    <div className="mobile-card-body">
                      {user.status === "inactive" && !user.otpVerified && (
                        <div className="user-note mobile-note">⚠ OTP not verified</div>
                      )}
                      <div className="mobile-meta-row">
                        <div className="mobile-meta-item">
                          <span className="mobile-meta-label">Role</span>
                          <select
                            className="role-select"
                            value={user.role.toLowerCase()}
                            onChange={(e) => handleUpdateUser(user.id, "role", e.target.value)}
                          >
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
                            <button className="btn-approve" onClick={() => handleApproveUser(user.id)}>✓ Approve</button>
                            <button className="btn-reject"  onClick={() => handleRejectUser(user.id)}>✗ Reject</button>
                            <button className="btn-delete"  onClick={() => handleDeleteUser(user.id)}>Delete</button>
                          </>
                        ) : (
                          <>
                            <button
                              className={user.status === "active" ? "btn-deactivate" : "btn-activate"}
                              onClick={() => handleUpdateUser(user.id, "status", user.status === "active" ? "inactive" : "active")}
                            >
                              {user.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                            <button className="btn-delete" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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

      {/* ══════════════════════════════════════════
          TAB: Process Admins
      ══════════════════════════════════════════ */}
      {activeTab === "processAdmins" && (
        <div className="user-management-section">
          <div className="section-header">
            <h2>Process Admin Approvals</h2>
          </div>

          <div className="controls-container">
            <div className="controls-row">
              <div className="filter-pills">
                {[
                  { key: "pending_approval", label: "Pending"  },
                  { key: "active",           label: "Approved" },
                  { key: "rejected",         label: "Rejected" },
                  { key: "all",              label: "All"      },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={processAdminFilter === key ? "refresh-btn" : "seed-users-btn"}
                    onClick={() => setProcessAdminFilter(key)}
                    style={{ fontSize: 13 }}
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

          {/* Desktop Table */}
          <div className="users-table-container desktop-table">
            {paLoading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading…</p>
              </div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th style={{ width: "28%" }}>Name</th>
                    <th style={{ width: "30%" }}>Email</th>
                    <th style={{ width: "14%" }}>Registered</th>
                    <th style={{ width: "12%" }}>Status</th>
                    <th style={{ width: "16%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcessAdmins.length > 0 ? (
                    filteredProcessAdmins.map((pa) => (
                      <tr key={pa._id}>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              {(pa.firstName?.[0] || "P").toUpperCase()}
                            </div>
                            <div className="user-details">
                              <div className="user-name">{pa.firstName} {pa.lastName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="last-login">{pa.email}</td>
                        <td className="join-date">{formatDate(pa.createdAt)}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(
                            pa.status === "pending_approval" ? "pending" : pa.status
                          )}`}>
                            {pa.status === "pending_approval" ? "Pending" : getStatusDisplay(pa.status)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {pa.status === "pending_approval" && (
                              <>
                                <button
                                  className="btn-approve"
                                  onClick={() => handleApproveProcessAdmin(pa._id)}
                                  title="Approve"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                  Approve
                                </button>
                                <button
                                  className="btn-reject"
                                  onClick={() => openRejectModal(pa._id)}
                                  title="Reject"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                  Reject
                                </button>
                              </>
                            )}

                            {(pa.status === "active" || pa.status === "suspended") && (
                              <button
                                className={pa.status === "active" ? "btn-deactivate" : "btn-activate"}
                                onClick={() => handleDeactivateProcessAdmin(pa._id, pa.status)}
                                title={pa.status === "active" ? "Deactivate" : "Reactivate"}
                              >
                                {pa.status === "active" ? (
                                  <>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"/>
                                      <line x1="8" y1="12" x2="16" y2="12"/>
                                    </svg>
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"/>
                                      <line x1="12" y1="8" x2="12" y2="16"/>
                                      <line x1="8" y1="12" x2="16" y2="12"/>
                                    </svg>
                                    Reactivate
                                  </>
                                )}
                              </button>
                            )}

                            {pa.status === "rejected" && (
                              <span style={{ fontSize: 12, color: "#dc2626" }} title={pa.rejectionReason || ""}>
                                ✗ Rejected
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-users">
                        No {processAdminFilter === "all" ? "" : processAdminFilter.replace("_", " ")} process admins found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="mobile-user-list">
            {filteredProcessAdmins.length > 0 ? (
              filteredProcessAdmins.map((pa) => (
                <div
                  key={pa._id}
                  className={`mobile-user-card ${expandedRow === pa._id ? "expanded" : ""}`}
                >
                  <div className="mobile-card-top" onClick={() => toggleRow(pa._id)}>
                    <div className="user-info">
                      <div className="user-avatar">{(pa.firstName?.[0] || "P").toUpperCase()}</div>
                      <div className="user-details">
                        <div className="user-name">{pa.firstName} {pa.lastName}</div>
                        <div className="user-email">{pa.email}</div>
                      </div>
                    </div>
                    <div className="mobile-card-right">
                      <span className={`status-badge ${getStatusBadgeClass(
                        pa.status === "pending_approval" ? "pending" : pa.status
                      )}`}>
                        {pa.status === "pending_approval" ? "Pending" : getStatusDisplay(pa.status)}
                      </span>
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
                            <button className="btn-reject" onClick={() => openRejectModal(pa._id)}>✗ Reject</button>
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

      {/* ── Reject reason modal ── */}
      {rejectTarget && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", borderRadius: 12,
            padding: "28px 32px", width: 400, maxWidth: "90vw",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>
              Reject application
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b" }}>
              This reason will be included in the rejection email sent to the applicant.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Incomplete information provided…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                fontSize: 13, padding: "8px 10px",
                borderRadius: 6, border: "1px solid #e2e8f0",
                resize: "vertical", fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button
                className="seed-users-btn"
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
              >
                Cancel
              </button>
              <button className="btn-reject" onClick={handleRejectProcessAdmin}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUserManagement;