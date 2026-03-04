import React, { useState } from "react";
import "./Masters.css";

const Masters = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [mastersData, setMastersData] = useState([
    { id: 1, name: "MBA", university: "Harvard Business School", duration: "2 years", seats: 80, fee: "$70,000", status: "Active" },
    { id: 2, name: "MS in Computer Science", university: "Stanford", duration: "2 years", seats: 60, fee: "$65,000", status: "Active" },
    { id: 3, name: "Masters in Finance", university: "MIT", duration: "1.5 years", seats: 50, fee: "$68,000", status: "Active" },
    { id: 4, name: "MA in Economics", university: "University of Chicago", duration: "2 years", seats: 45, fee: "$58,000", status: "Active" },
    { id: 5, name: "Masters in Data Science", university: "UC Berkeley", duration: "2 years", seats: 55, fee: "$62,000", status: "Inactive" },
    { id: 6, name: "Masters in Public Health", university: "Johns Hopkins", duration: "2 years", seats: 40, fee: "$55,000", status: "Active" },
    { id: 7, name: "Masters in Engineering", university: "Caltech", duration: "2 years", seats: 35, fee: "$60,000", status: "Active" },
  ]);

  const stats = {
    totalPrograms: 98,
    activePrograms: 85,
    totalUniversities: 62,
    totalStudents: 7800
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const filteredData = mastersData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.university.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
                         (selectedFilter === "active" && item.status === "Active") ||
                         (selectedFilter === "inactive" && item.status === "Inactive");
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="masters-container">
      <div className="masters-header">
        <h2>Masters Programs</h2>
        <p>Manage all master's degree programs across universities</p>
      </div>

      {/* Stats Cards */}
      <div className="masters-stats-grid">
        <div className="masters-stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-details">
            <h3>Total Programs</h3>
            <p className="stat-value">{stats.totalPrograms}</p>
          </div>
        </div>
        <div className="masters-stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-details">
            <h3>Active Programs</h3>
            <p className="stat-value">{stats.activePrograms}</p>
          </div>
        </div>
        <div className="masters-stat-card">
          <div className="stat-icon">🏛️</div>
          <div className="stat-details">
            <h3>Universities</h3>
            <p className="stat-value">{stats.totalUniversities}</p>
          </div>
        </div>
        <div className="masters-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <h3>Enrolled Students</h3>
            <p className="stat-value">{stats.totalStudents.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="masters-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search programs or universities..."
            value={searchQuery}
            onChange={handleSearch}
            className="masters-search"
          />
          <button className="search-button">🔍</button>
        </div>
        
        <div className="filter-section">
          <button 
            className={`filter-btn ${selectedFilter === "all" ? "active" : ""}`}
            onClick={() => handleFilterChange("all")}
          >
            All
          </button>
          <button 
            className={`filter-btn ${selectedFilter === "active" ? "active" : ""}`}
            onClick={() => handleFilterChange("active")}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${selectedFilter === "inactive" ? "active" : ""}`}
            onClick={() => handleFilterChange("inactive")}
          >
            Inactive
          </button>
        </div>

        <button className="add-program-btn">
          + Add New Program
        </button>
      </div>

      {/* Programs Table */}
      <div className="masters-table-container">
        <table className="masters-table">
          <thead>
            <tr>
              <th>Program Name</th>
              <th>University</th>
              <th>Duration</th>
              <th>Available Seats</th>
              <th>Annual Fee</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((program) => (
              <tr key={program.id}>
                <td>{program.name}</td>
                <td>{program.university}</td>
                <td>{program.duration}</td>
                <td>{program.seats}</td>
                <td>{program.fee}</td>
                <td>
                  <span className={`status-badge ${program.status.toLowerCase()}`}>
                    {program.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="edit-btn">✏️</button>
                    <button className="view-btn">👁️</button>
                    <button className="delete-btn">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="pagination-btn">Previous</button>
        <span className="page-info">Page 1 of 4</span>
        <button className="pagination-btn">Next</button>
      </div>
    </div>
  );
};

export default Masters;