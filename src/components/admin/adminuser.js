import React, { useState, useEffect, useCallback } from "react";
import "./adminuser.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const AdminUserManagement = () => {
  const [loading, setLoading]             = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [roleFilter, setRoleFilter]       = useState("all");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [users, setUsers]                 = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [expandedRow, setExpandedRow]     = useState(null);

  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    inactiveUsers: 0,
  });

  // ── Auth helpers ──────────────────────────────────────────
  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  });

  // ── Date formatters ───────────────────────────────────────
  const formatDate = (raw) => {
    if (!raw || raw === "Never") return "Never";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch {
      return raw;
    }
  };

  const formatDateTime = (raw) => {
    if (!raw || raw === "Never") return "Never";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return (
        d.toLocaleDateString("en-US", {
          year: "numeric", month: "short", day: "numeric",
        }) +
        " " +
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return raw;
    }
  };

  useEffect(() => { loadUsersData(); }, []);
  useEffect(() => { filterUsers();   }, [searchQuery, roleFilter, statusFilter, users]);

  // ── Load Users ────────────────────────────────────────────
  const loadUsersData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const params = {};
      if (searchQuery)            params.search = searchQuery;
      if (roleFilter   !== "all") params.role   = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: authHeaders(),
        params,
      });

      if (!response.data.success) {
        setUsers([]);
        setFilteredUsers([]);
        setUserStats({ totalUsers: 0, activeUsers: 0, adminUsers: 0, inactiveUsers: 0 });
        return;
      }

      const data = response.data;
      const transformedUsers = (data.users || data.data || []).map((user) => {
        const name = (
          user.name ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Unknown"
        ).trim();
        const role   = (user.role   || "User").trim();
        const status =  user.status || "inactive";

        const rawLastLogin = user.lastLogin || user.formattedLastLogin || null;
        const rawJoinDate  = user.joinDate  || user.formattedJoinDate  || user.createdAt || null;

        return {
          id:          user._id || user.id,
          name,
          email:       user.email  || "unknown@example.com",
          role:        role.charAt(0).toUpperCase() + role.slice(1),
          status,
          lastLogin:   rawLastLogin ? formatDateTime(rawLastLogin) : "Never",
          joinDate:    rawJoinDate  ? formatDate(rawJoinDate)       : "N/A",
          avatar:      user.avatar  || (name[0] ? name[0].toUpperCase() : "?"),
          otpVerified: user.otpVerified || user.isVerified || false,
          signupDate:  user.createdAt   || new Date().toISOString(),
        };
      });

      setUsers(transformedUsers);

      if (data.stats) {
        setUserStats({
          totalUsers:    data.stats.totalUsers  || transformedUsers.length,
          activeUsers:   data.stats.activeUsers || transformedUsers.filter((u) => u.status === "active").length,
          adminUsers:    data.stats.adminUsers  || transformedUsers.filter((u) => u.role.toLowerCase() === "admin").length,
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
    } catch (err) {
      console.error("Error loading users:", err);
      alert("Failed to fetch users. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // ── Filter Users ──────────────────────────────────────────
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

  // ── Approve ───────────────────────────────────────────────
  const handleApproveUser = async (userId) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.patch(
        `${API_URL}/api/admin/users/${userId}/approve`,
        {
          approvedBy: localStorage.getItem("adminEmail") || "Admin",
          approvedAt: new Date().toISOString(),
        },
        { headers: authHeaders() }
      );

      if (response.data?.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u))
        );
        if (response.data.stats) setUserStats(response.data.stats);
        alert("User approved successfully!");
      } else {
        alert(response.data.message || "Failed to approve user");
      }
    } catch (err) {
      console.error("Error approving user:", err);
      alert("Failed to approve user.");
    }
  };

  // ── Reject ────────────────────────────────────────────────
  const handleRejectUser = async (userId) => {
    if (!window.confirm("Reject this user? Their status will be set to 'suspended'.")) return;
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.patch(
        `${API_URL}/api/admin/users/${userId}/status`,
        {
          status: "suspended",
          rejectedBy: localStorage.getItem("adminEmail") || "Admin",
          rejectedAt: new Date().toISOString(),
        },
        { headers: authHeaders() }
      );

      if (response.data?.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "suspended" } : u))
        );
        if (response.data.stats) setUserStats(response.data.stats);
        alert("User rejected successfully!");
      } else {
        alert(response.data.message || "Failed to reject user");
      }
    } catch (err) {
      console.error("Error rejecting user:", err);
      alert("Failed to reject user.");
    }
  };

  // ── Update ────────────────────────────────────────────────
  const handleUpdateUser = async (userId, field, value) => {
    try {
      const token = getToken();
      if (!token) return;

      let endpoint = `${API_URL}/api/admin/users/${userId}`;
      let method   = "put";
      let bodyData = {};

      if (field === "status") {
        endpoint = `${API_URL}/api/admin/users/${userId}/status`;
        method   = "patch";
        bodyData = { status: value };
      } else if (field === "role") {
        endpoint = `${API_URL}/api/admin/users/${userId}/role`;
        method   = "patch";
        bodyData = { role: value.toLowerCase() };
      } else {
        bodyData = { [field]: value };
      }

      const response = await axios[method](endpoint, bodyData, { headers: authHeaders() });

      if (response.data?.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u))
        );
        if (response.data.stats) setUserStats(response.data.stats);
        alert(`User ${field} updated successfully!`);
      } else {
        alert(response.data.message || "Failed to update user");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user.");
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.delete(
        `${API_URL}/api/admin/users/${userId}`,
        { headers: authHeaders() }
      );

      if (response.data?.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        if (response.data.stats) setUserStats(response.data.stats);
        alert("User deleted successfully!");
      } else {
        alert(response.data.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  // ── Add ───────────────────────────────────────────────────
  const handleAddUser = async () => {
    const newUser = {
      firstName: "New",
      lastName:  "User",
      email:     `newuser${users.length + 1}@example.com`,
      password:  "password123",
      role:      "user",
      status:    "active",
    };
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.post(
        `${API_URL}/api/admin/users`,
        newUser,
        { headers: authHeaders() }
      );

      if (response.data?.success) {
        const transformedUser = {
          id:        response.data.user?._id || response.data.user?.id || `temp-${Date.now()}`,
          name:      `${newUser.firstName} ${newUser.lastName}`,
          email:     newUser.email,
          role:      "User",
          status:    "active",
          lastLogin: "Never",
          joinDate:  formatDate(new Date().toISOString()),
          avatar:    "N",
        };
        setUsers((prev) => [...prev, transformedUser]);
        if (response.data.stats) setUserStats(response.data.stats);
        alert("User added successfully!");
      } else {
        alert(response.data.message || "Failed to add user");
      }
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Failed to add user.");
    }
  };

  // ── Seed ──────────────────────────────────────────────────
  const handleSeedUsers = async () => {
    if (!window.confirm("This will create sample users. Continue?")) return;
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.post(
        `${API_URL}/api/admin/users/seed`,
        {},
        { headers: authHeaders() }
      );

      if (response.data?.success) {
        alert(`${response.data.count || "Sample"} users created successfully!`);
        loadUsersData();
      } else {
        alert(response.data.message || "Failed to seed users");
      }
    } catch (err) {
      console.error("Error seeding users:", err);
      alert("Failed to seed users.");
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const getStatusBadgeClass = (status) => {
    const map = {
      active:    "status-active",
      inactive:  "status-inactive",
      pending:   "status-pending",
      suspended: "status-suspended",
      rejected:  "status-rejected",
    };
    return map[(status || "").toLowerCase()] || "status-inactive";
  };

  const getStatusDisplay = (status) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";

  const needsApproval = (user) =>
    user.status === "inactive" || user.status === "pending";

  const toggleRow = (userId) =>
    setExpandedRow((prev) => (prev === userId ? null : userId));

  // ── Loading screen ────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading users…</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="admin-users-container">

      {/* ── Header ── */}
      <div className="users-header">
        <div className="header-left">
          <h1>Users &amp; Roles</h1>
          <p>Manage accounts and permissions</p>
        </div>
        <div className="header-buttons">
          <button className="add-user-btn" onClick={handleAddUser} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add User
          </button>
          <button className="seed-users-btn" onClick={handleSeedUsers} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/>
            </svg>
            Seed
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="users-stats-grid">
        <div className="user-stat-card total-users">
          <div className="stat-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
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

      {/* ── Table Section ── */}
      <div className="user-management-section">
        <div className="section-header">
          <h2>User Management</h2>
          <button className="refresh-btn" onClick={loadUsersData} disabled={loading}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Controls */}
        <div className="controls-container">
          <div className="controls-row">
            <div className="search-box">
              <svg className="search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
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

        {/* ── Desktop Table ── */}
        <div className="users-table-container desktop-table">
          <table className="users-table">
            <thead>
              <tr>
                <th style={{ width: "32%" }}>User</th>
                <th style={{ width: "11%" }}>Role</th>
                <th style={{ width: "11%" }}>Status</th>
                <th style={{ width: "18%" }}>Last Login</th>
                <th style={{ width: "14%" }}>Joined</th>
                <th style={{ width: "14%" }}>Actions</th>
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
                        disabled={loading}
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
                            <button className="btn-approve" onClick={() => handleApproveUser(user.id)} title="Approve" disabled={loading}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Approve
                            </button>
                            <button className="btn-reject" onClick={() => handleRejectUser(user.id)} title="Reject" disabled={loading}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            className={user.status === "active" ? "btn-deactivate" : "btn-activate"}
                            onClick={() => handleUpdateUser(user.id, "status", user.status === "active" ? "inactive" : "active")}
                            disabled={loading}
                          >
                            {user.status === "active" ? (
                              <>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
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
                                Activate
                              </>
                            )}
                          </button>
                        )}
                        <button className="btn-delete" onClick={() => handleDeleteUser(user.id)} title="Delete" disabled={loading}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                          </svg>
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

        {/* ── Mobile Cards ── */}
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
                          disabled={loading}
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
                          <button className="btn-approve" onClick={() => handleApproveUser(user.id)} disabled={loading}>✓ Approve</button>
                          <button className="btn-reject"  onClick={() => handleRejectUser(user.id)}  disabled={loading}>✗ Reject</button>
                          <button className="btn-delete"  onClick={() => handleDeleteUser(user.id)}  disabled={loading}>Delete</button>
                        </>
                      ) : (
                        <>
                          <button
                            className={user.status === "active" ? "btn-deactivate" : "btn-activate"}
                            onClick={() => handleUpdateUser(user.id, "status", user.status === "active" ? "inactive" : "active")}
                            disabled={loading}
                          >
                            {user.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                          <button className="btn-delete" onClick={() => handleDeleteUser(user.id)} disabled={loading}>Delete</button>
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

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            Page 1 of 1 &nbsp;·&nbsp; {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
