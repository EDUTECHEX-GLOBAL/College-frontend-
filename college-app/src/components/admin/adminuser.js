import React, { useState, useEffect, useCallback } from "react";
import "./adminuser.css";

const AdminUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    inactiveUsers: 0,
  });

  const API_BASE_URL = "http://localhost:5000/api/admin/users";

  const getAdminHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
  });

  useEffect(() => {
    loadUsersData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, statusFilter, users]);

  // ── Load Users ──
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
          user.name ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Unknown"
        ).trim();
        const role = (user.role || "User").trim();
        const status = user.status || "inactive";

        return {
          id: user._id || user.id,
          name,
          email: user.email || "unknown@example.com",
          role: role.charAt(0).toUpperCase() + role.slice(1),
          status,
          lastLogin: user.lastLogin || user.formattedLastLogin || "Never",
          joinDate:
            user.joinDate ||
            user.formattedJoinDate ||
            (user.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "N/A"),
          avatar: user.avatar || (name[0] ? name[0].toUpperCase() : "?"),
          otpVerified: user.otpVerified || user.isVerified || false,
          signupDate: user.createdAt || new Date().toISOString(),
        };
      });

      setUsers(transformedUsers);

      if (data.stats) {
        setUserStats({
          totalUsers: data.stats.totalUsers || transformedUsers.length,
          activeUsers:
            data.stats.activeUsers ||
            transformedUsers.filter((u) => u.status === "active").length,
          adminUsers:
            data.stats.adminUsers ||
            transformedUsers.filter((u) => u.role.toLowerCase() === "admin").length,
          inactiveUsers: transformedUsers.filter((u) => u.status === "inactive").length,
        });
      } else {
        setUserStats({
          totalUsers: transformedUsers.length,
          activeUsers: transformedUsers.filter((u) => u.status === "active").length,
          adminUsers: transformedUsers.filter((u) => u.role.toLowerCase() === "admin").length,
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

  // ── Filter Users ──
  const filterUsers = useCallback(() => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  // ── Approve ──
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
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u))
        );
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

  // ── Reject ──
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
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "suspended" } : u))
        );
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

  // ── Update (status / role) ──
  const handleUpdateUser = async (userId, field, value) => {
    try {
      let endpoint = `${API_BASE_URL}/${userId}`;
      let method = "PUT";
      let bodyData = {};

      if (field === "status") {
        endpoint = `${API_BASE_URL}/${userId}/status`;
        method = "PATCH";
        bodyData = { status: value };
      } else if (field === "role") {
        endpoint = `${API_BASE_URL}/${userId}/role`;
        method = "PATCH";
        bodyData = { role: value.toLowerCase() };
      } else {
        bodyData = { [field]: value };
      }

      const response = await fetch(endpoint, {
        method,
        headers: getAdminHeaders(),
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (data?.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u))
        );
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

  // ── Delete ──
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user permanently?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${userId}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
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

  // ── Add ──
  const handleAddUser = async () => {
    const newUser = {
      firstName: "New",
      lastName: "User",
      email: `newuser${users.length + 1}@example.com`,
      password: "password123",
      role: "user",
      status: "active",
    };

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (data?.success) {
        const transformedUser = {
          id: data.user?._id || data.user?.id || `temp-${Date.now()}`,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          role: "User",
          status: "active",
          lastLogin: "Never",
          joinDate: new Date().toLocaleDateString(),
          avatar: "N",
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

  // ── Seed ──
  const handleSeedUsers = async () => {
    if (!window.confirm("This will create sample users. Continue?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/seed`, {
        method: "POST",
        headers: getAdminHeaders(),
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

  // ── Helpers ──
  const getStatusBadgeClass = (status) => {
    const map = {
      active: "status-active",
      inactive: "status-inactive",
      pending: "status-pending",
      suspended: "status-suspended",
      rejected: "status-rejected",
    };
    return map[(status || "").toLowerCase()] || "status-inactive";
  };

  const getStatusDisplay = (status) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const needsApproval = (user) =>
    user.status === "inactive" || user.status === "pending";

  // ── Loading State ──
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading users…</p>
      </div>
    );
  }

  return (
    <div className="admin-users-container">

      {/* ── Header ── */}
      <div className="users-header">
        <div className="header-left">
          <h1>Users &amp; Roles</h1>
          <p>Manage accounts and permissions</p>
        </div>
        <div className="header-buttons">
          <button className="add-user-btn" onClick={handleAddUser}>
            + Add User
          </button>
          <button className="seed-users-btn" onClick={handleSeedUsers}>
            🔄 Seed
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="users-stats-grid">
        <div className="user-stat-card total-users">
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-value">{userStats.totalUsers}</div>
          </div>
        </div>
        <div className="user-stat-card active-users">
          <div className="stat-content">
            <h3>Active</h3>
            <div className="stat-value">{userStats.activeUsers}</div>
          </div>
        </div>
        <div className="user-stat-card admin-users">
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
          <button className="refresh-btn" onClick={loadUsersData}>
            🔄 Refresh
          </button>
        </div>

        {/* Controls */}
        <div className="controls-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-container">
            <div className="filter-group">
              <span className="filter-label">Role</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="results-count">
              {filteredUsers.length} / {users.length} users
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={user.status === "inactive" ? "user-inactive" : ""}
                  >
                    {/* User */}
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">{user.avatar}</div>
                        <div className="user-details">
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                          {user.status === "inactive" && !user.otpVerified && (
                            <div className="user-note">⚠ Needs OTP verification</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <select
                        className="role-select"
                        value={user.role.toLowerCase()}
                        onChange={(e) =>
                          handleUpdateUser(user.id, "role", e.target.value)
                        }
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                      </select>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                        {getStatusDisplay(user.status)}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="last-login">{user.lastLogin}</td>

                    {/* Join Date */}
                    <td className="join-date">{user.joinDate}</td>

                    {/* Actions */}
                    <td>
                      <div className="action-buttons">
                        {needsApproval(user) ? (
                          <>
                            <button
                              className="btn-approve"
                              onClick={() => handleApproveUser(user.id)}
                              title="Approve user"
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleRejectUser(user.id)}
                              title="Reject user"
                            >
                              ✗ Reject
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-activate"
                              onClick={() =>
                                handleUpdateUser(
                                  user.id,
                                  "status",
                                  user.status === "active" ? "inactive" : "active"
                                )
                              }
                            >
                              {user.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-users">
                    No users found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            Page 1 of 1 &nbsp;·&nbsp; {filteredUsers.length} result
            {filteredUsers.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;