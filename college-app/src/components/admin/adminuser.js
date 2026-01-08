import React, { useState, useEffect } from "react";
import "./adminuser.css";

const AdminUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Initial users data
  const initialUsers = [
    {
      id: 1,
      name: "Mounika",
      email: "mounikatrunnala1901@gmail.com",
      role: "User",
      status: "active",
      lastLogin: "Never",
      joinDate: "07 Jan 2026",
      avatar: "M"
    },
    {
      id: 2,
      name: "aravind",
      email: "bondalagatharavind@gmail.com",
      role: "User",
      status: "active",
      lastLogin: "Never",
      joinDate: "07 Jan 2026",
      avatar: "A"
    },
    {
      id: 3,
      name: "mounika",
      email: "mounika196@gmail.com",
      role: "User",
      status: "active",
      lastLogin: "Never",
      joinDate: "07 Jan 2026",
      avatar: "M"
    },
    {
      id: 4,
      name: "Mounika",
      email: "admin@educourses.com",
      role: "Admin",
      status: "active",
      lastLogin: "Never",
      joinDate: "06 Jan 2026",
      avatar: "M"
    },
    {
      id: 5,
      name: "Mounika",
      email: "tirumalamounika25@gmail.com",
      role: "User",
      status: "active",
      lastLogin: "21 hours ago",
      joinDate: "02 Dec 2025",
      avatar: "M"
    },
    {
      id: 6,
      name: "Aravind",
      email: "aravindbonda2003@gmail.com",
      role: "User",
      status: "active",
      lastLogin: "22 minutes ago",
      joinDate: "06 Nov 2025",
      avatar: "A"
    },
    {
      id: 7,
      name: "Astrth",
      email: "raghavacowdary66666@gmail.com",
      role: "User",
      status: "active",
      lastLogin: "05 Nov 2025",
      joinDate: "05 Nov 2025",
      avatar: "A"
    },
    {
      id: 8,
      name: "uday",
      email: "udaysankar9858@gmail.com",
      role: "User",
      status: "active",
      lastLogin: "04 Nov 2025",
      joinDate: "04 Nov 2025",
      avatar: "U"
    },
    {
      id: 9,
      name: "John Doe",
      email: "john@example.com",
      role: "User",
      status: "inactive",
      lastLogin: "1 month ago",
      joinDate: "15 Oct 2025",
      avatar: "J"
    },
    {
      id: 10,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Admin",
      status: "active",
      lastLogin: "2 days ago",
      joinDate: "20 Sep 2025",
      avatar: "J"
    },
    {
      id: 11,
      name: "Robert Johnson",
      email: "robert@example.com",
      role: "User",
      status: "suspended",
      lastLogin: "3 months ago",
      joinDate: "01 Aug 2025",
      avatar: "R"
    },
    {
      id: 12,
      name: "Sarah Williams",
      email: "sarah@example.com",
      role: "User",
      status: "active",
      lastLogin: "1 week ago",
      joinDate: "10 Jul 2025",
      avatar: "S"
    }
  ];

  // User statistics
  const [userStats, setUserStats] = useState({
    totalUsers: 12,
    activeUsers: 10,
    adminUsers: 2
  });

  // Load initial data
  useEffect(() => {
    loadUsersData();
  }, []);

  // Filter users when search or filters change
  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, statusFilter, users]);

  const loadUsersData = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setUsers(initialUsers);
      
      // Calculate stats
      const totalUsers = initialUsers.length;
      const activeUsers = initialUsers.filter(user => user.status === "active").length;
      const adminUsers = initialUsers.filter(user => user.role === "Admin").length;
      
      setUserStats({
        totalUsers,
        activeUsers,
        adminUsers
      });
      
      setLoading(false);
    }, 500);
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role.toLowerCase() === roleFilter.toLowerCase());
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleUpdateUser = (userId, field, value) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, [field]: value } : user
    ));
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(user => user.id !== userId));
      setUserStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers - 1
      }));
    }
  };

  const handleAddUser = () => {
    const newUser = {
      id: users.length + 1,
      name: "New User",
      email: `newuser${users.length + 1}@example.com`,
      role: "User",
      status: "active",
      lastLogin: "Never",
      joinDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      avatar: "NU"
    };
    
    setUsers([...users, newUser]);
    setUserStats(prev => ({
      ...prev,
      totalUsers: prev.totalUsers + 1
    }));
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'suspended': return 'status-suspended';
      default: return 'status-pending';
    }
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
      '#9b59b6', '#1abc9c', '#d35400', '#c0392b'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

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
        <button className="add-user-btn" onClick={handleAddUser}>
          + Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="users-stats-grid">
        <div className="user-stat-card">
          <div className="stat-icon total-users-icon">
            <span>👥</span>
          </div>
          <div className="stat-content">
            <h3>TOTAL USERS</h3>
            <div className="stat-value">{userStats.totalUsers}</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon active-users-icon">
            <span>✅</span>
          </div>
          <div className="stat-content">
            <h3>ACTIVE USERS</h3>
            <div className="stat-value">{userStats.activeUsers}</div>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon admin-users-icon">
            <span>👑</span>
          </div>
          <div className="stat-content">
            <h3>ADMIN USERS</h3>
            <div className="stat-value">{userStats.adminUsers}</div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="user-management-section">
        <div className="section-header">
          <h2>User Management</h2>
          <div className="controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
              <button className="search-btn">🔍</button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-section">
          <div className="filter-group">
            <label>ROLE</label>
            <select value={roleFilter} onChange={handleRoleFilterChange}>
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>

          <div className="filter-group">
            <label>STATUS</label>
            <select value={statusFilter} onChange={handleStatusFilterChange}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="results-count">
            Showing {filteredUsers.length} of {users.length} users
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
                filteredUsers.map(user => (
                  <tr key={user.id}>
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
                        </div>
                      </div>
                    </td>
                    <td>
                      <select 
                        className="role-select"
                        value={user.role}
                        onChange={(e) => handleUpdateUser(user.id, 'role', e.target.value)}
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Moderator">Moderator</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td>{user.lastLogin}</td>
                    <td>{user.joinDate}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
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
      </div>
    </div>
  );
};

export default AdminUserManagement;