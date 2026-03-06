import React, { useState, useEffect } from "react";
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
    inactiveUsers: 0
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

  // ===== Load Users Data =====
  const loadUsersData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append("search", searchQuery);
      if (roleFilter !== "all") queryParams.append("role", roleFilter);
      if (statusFilter !== "all") queryParams.append("status", statusFilter);

      const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`, {
        headers: getAdminHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error("API Error:", data.message);
        setUsers([]);
        setFilteredUsers([]);
        setUserStats({ totalUsers: 0, activeUsers: 0, adminUsers: 0, inactiveUsers: 0 });
        return;
      }

      // Transform users from API response
      const transformedUsers = (data.users || data.data || []).map((user) => {
        const name = (user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Unknown").trim();
        const role = (user.role || "User").trim();
        const status = user.status || "inactive";
        
        return {
          id: user._id || user.id,
          name,
          email: user.email || "unknown@example.com",
          role: role.charAt(0).toUpperCase() + role.slice(1),
          status: status,
          lastLogin: user.lastLogin || user.formattedLastLogin || "Never",
          joinDate: user.joinDate || user.formattedJoinDate || 
                   (user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"),
          avatar: user.avatar || (name[0] ? name[0].toUpperCase() : "?"),
          otpVerified: user.otpVerified || user.isVerified || false,
          signupDate: user.createdAt || new Date().toISOString(),
        };
      });

      setUsers(transformedUsers);

      // Calculate stats - use data.stats if available, otherwise calculate locally
      if (data.stats) {
        setUserStats({
          totalUsers: data.stats.totalUsers || transformedUsers.length,
          activeUsers: data.stats.activeUsers || transformedUsers.filter((u) => u.status === "active").length,
          adminUsers: data.stats.adminUsers || transformedUsers.filter((u) => u.role.toLowerCase() === "admin").length,
          inactiveUsers: transformedUsers.filter((u) => u.status === "inactive").length,
        });
      } else {
        const totalUsers = transformedUsers.length;
        const activeUsers = transformedUsers.filter((u) => u.status === "active").length;
        const adminUsers = transformedUsers.filter((u) => u.role.toLowerCase() === "admin").length;
        const inactiveUsers = transformedUsers.filter((u) => u.status === "inactive").length;
        
        setUserStats({ totalUsers, activeUsers, adminUsers, inactiveUsers });
      }

    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to fetch users. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // ===== Filter Users =====
  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          (user.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (user.email || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(
        (user) => (user.role || "").toLowerCase() === roleFilter.toLowerCase()
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => (user.status || "").toLowerCase() === statusFilter.toLowerCase());
    }

    setFilteredUsers(filtered);
  };

  // ===== Event Handlers =====
  const handleSearch = (e) => setSearchQuery(e.target.value);
  const handleRoleFilterChange = (e) => setRoleFilter(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);

  // ===== Approve User Function =====
  const handleApproveUser = async (userId) => {
    try {
      // Use PATCH method instead of POST
      const response = await fetch(`${API_BASE_URL}/${userId}/approve`, {
        method: "PATCH", // CHANGED FROM POST TO PATCH
        headers: getAdminHeaders(),
        body: JSON.stringify({ 
          approvedBy: localStorage.getItem("adminEmail") || "Admin",
          approvedAt: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (data && data.success) {
        // Update user status locally
        setUsers(users.map((user) => 
          user.id === userId ? { ...user, status: "active" } : user
        ));
        
        // Update stats if provided
        if (data.stats) {
          setUserStats(data.stats);
        }
        
        // Show success message
        alert("admin approved successfully! They can now access the dashboard.");
      } else {
        alert(data.message || "Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user. Check console for details.");
    }
  };

  // ===== Reject User Function =====
  const handleRejectUser = async (userId) => {
    if (!window.confirm("Are you sure you want to reject this user? Their status will be set to 'suspended'.")) return;

    try {
      // Use the status endpoint instead of non-existent /reject endpoint
      const response = await fetch(`${API_BASE_URL}/${userId}/status`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ 
          status: "suspended",
          rejectedBy: localStorage.getItem("adminEmail") || "Admin",
          rejectedAt: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (data && data.success) {
        // Update user status locally
        setUsers(users.map((user) => 
          user.id === userId ? { ...user, status: "suspended" } : user
        ));
        
        // Update stats if provided
        if (data.stats) {
          setUserStats(data.stats);
        }
        
        alert("User rejected (suspended) successfully!");
      } else {
        alert(data.message || "Failed to reject user");
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("Failed to reject user. Check console for details.");
    }
  };

  // ===== Activate/Deactivate User =====
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

      if (data && data.success) {
        // Update local state
        setUsers(users.map((u) => (u.id === userId ? { ...u, [field]: value } : u)));
        
        // Update stats if provided
        if (data.stats) {
          setUserStats(data.stats);
        }
        
        // Show success message
        alert(`User ${field} updated successfully!`);
      } else {
        alert(data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Check console for details.");
    }
  };

  // ===== Delete User =====
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${userId}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });

      const data = await response.json();

      if (data && data.success) {
        // Remove user from local state
        setUsers(users.filter((u) => u.id !== userId));
        
        // Update stats if provided
        if (data.stats) {
          setUserStats(data.stats);
        }
        
        alert("User deleted successfully!");
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Check console for details.");
    }
  };

  // ===== Add User =====
  const handleAddUser = async () => {
    const newUser = {
      firstName: "New",
      lastName: "User",
      email: `newuser${users.length + 1}@example.com`,
      password: "password123",
      role: "user",
      status: "active"
    };

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (data && data.success) {
        // Transform and add new user to local state
        const transformedUser = {
          id: data.user?._id || data.user?.id || `temp-${Date.now()}`,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          role: (newUser.role || "User").charAt(0).toUpperCase() + (newUser.role || "User").slice(1),
          status: newUser.status || "active",
          lastLogin: "Never",
          joinDate: new Date().toLocaleDateString(),
          avatar: newUser.firstName.charAt(0).toUpperCase(),
        };

        setUsers([...users, transformedUser]);
        
        // Update stats if provided
        if (data.stats) {
          setUserStats(data.stats);
        }
        
        alert("User added successfully!");
      } else {
        alert(data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user. Check console for details.");
    }
  };

  // ===== Seed Users =====
  const handleSeedUsers = async () => {
    if (!window.confirm("This will create sample users. Are you sure?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/seed`, {
        method: "POST",
        headers: getAdminHeaders(),
      });

      const data = await response.json();

      if (data && data.success) {
        alert(`${data.count || 'Sample'} users created successfully!`);
        loadUsersData();
      } else {
        alert(data.message || "Failed to seed users");
      }
    } catch (error) {
      console.error("Error seeding users:", error);
      alert("Failed to seed users. Check console for details.");
    }
  };

  // ===== Helpers =====
  const getStatusBadgeClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "status-active";
      case "inactive":
        return "status-inactive";
      case "pending":
        return "status-pending";
      case "suspended":
        return "status-suspended";
      default:
        return "status-inactive";
    }
  };

  const getAvatarColor = (name) => {
    const colors = ["#4d7cfe", "#36d389", "#9f7aea", "#e53e3e", "#f6ad55", "#68d391", "#ed64a6", "#667eea"];
    return colors[(name || "U")[0].charCodeAt(0) % colors.length];
  };

  // ===== Get Status Display Text =====
  const getStatusDisplay = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // ===== Check if user needs approval =====
  const needsApproval = (user) => {
    return user.status === "inactive" || user.status === "pending";
  };

  // ===== Render Loading =====
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      {/* Header Section */}
      <div className="users-header">
        <div className="header-left">
          <h1>Users & Roles Management</h1>
          <p>Manage user accounts and permissions</p>
        </div>
        <div className="header-buttons">
          <button className="add-user-btn" onClick={handleAddUser}>
            + Add User
          </button>
          <button className="seed-users-btn" onClick={handleSeedUsers}>
            🔄 Seed Users
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="users-stats-grid">
        <div className="user-stat-card total-users">
          <div className="stat-content">
            <h3>TOTAL USERS</h3>
            <div className="stat-value">{userStats.totalUsers}</div>
          </div>
        </div>

        <div className="user-stat-card active-users">
          <div className="stat-content">
            <h3>ACTIVE USERS</h3>
            <div className="stat-value">{userStats.activeUsers}</div>
          </div>
        </div>

        <div className="user-stat-card admin-users">
          <div className="stat-content">
            <h3>ADMIN USERS</h3>
            <div className="stat-value">{userStats.adminUsers}</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="divider"></div>

      {/* User Management Section */}
      <div className="user-management-section">
        <div className="section-header">
          <h2>User Management</h2>
          <button className="refresh-btn" onClick={loadUsersData}>
            🔄 Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="controls-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="filter-container">
            <div className="filter-group">
              <span className="filter-label">ROLE</span>
              <select 
                value={roleFilter} 
                onChange={handleRoleFilterChange}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">STATUS</span>
              <select 
                value={statusFilter} 
                onChange={handleStatusFilterChange}
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
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>LAST LOGIN</th>
                <th>JOIN DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={user.status === "inactive" ? "user-inactive" : ""}>
                    <td>
                      <div className="user-info">
                        <div 
                          className="user-avatar"
                          style={{ backgroundColor: getAvatarColor(user.name) }}
                        >
                          {user.avatar}
                        </div>
                        <div className="user-details">
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                          {user.status === "inactive" && !user.otpVerified && (
                            <div className="user-note">Needs OTP verification</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <select 
                        className="role-select"
                        value={user.role.toLowerCase()}
                        onChange={(e) => handleUpdateUser(user.id, 'role', e.target.value)}
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
                        {/* Show Approve button for inactive/pending users */}
                        {needsApproval(user) ? (
                          <>
                            <button 
                              className="btn-approve"
                              onClick={() => handleApproveUser(user.id)}
                              title="Approve user access"
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="btn-reject"
                              onClick={() => handleRejectUser(user.id)}
                              title="Reject user access"
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
                              onClick={() => {
                                const newStatus = user.status === 'active' ? 'inactive' : 'active';
                                handleUpdateUser(user.id, 'status', newStatus);
                              }}
                            >
                              {user.status === 'active' ? 'Deactivate' : 'Activate'}
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
            Page 1 of 1
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;