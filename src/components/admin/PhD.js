import React, { useState } from "react";
import "./PhD.css";

const PhD = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [phdData, setPhdData] = useState([
    { id: 1, name: "PhD in Computer Science", university: "MIT", duration: "5 years", supervisors: 8, researchAreas: "AI, ML, Robotics", status: "Active" },
    { id: 2, name: "PhD in Physics", university: "Caltech", duration: "5 years", supervisors: 6, researchAreas: "Quantum Physics, Astrophysics", status: "Active" },
    { id: 3, name: "PhD in Economics", university: "University of Chicago", duration: "5 years", supervisors: 5, researchAreas: "Behavioral Economics, Macroeconomics", status: "Active" },
    { id: 4, name: "PhD in Biology", university: "Johns Hopkins", duration: "5 years", supervisors: 7, researchAreas: "Molecular Biology, Genetics", status: "Active" },
    { id: 5, name: "PhD in Psychology", university: "Stanford", duration: "5 years", supervisors: 6, researchAreas: "Clinical Psychology, Neuroscience", status: "Inactive" },
    { id: 6, name: "PhD in Chemistry", university: "UC Berkeley", duration: "5 years", supervisors: 8, researchAreas: "Organic Chemistry, Biochemistry", status: "Active" },
    { id: 7, name: "PhD in Mathematics", university: "Princeton", duration: "5 years", supervisors: 5, researchAreas: "Pure Mathematics, Applied Mathematics", status: "Active" },
  ]);

  const stats = {
    totalPrograms: 45,
    activePrograms: 42,
    totalUniversities: 28,
    totalResearchers: 890,
    completedTheses: 156
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const filteredData = phdData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.researchAreas.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
                         (selectedFilter === "active" && item.status === "Active") ||
                         (selectedFilter === "inactive" && item.status === "Inactive");
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="phd-container">
      <div className="phd-header">
        <h2>PhD Programs</h2>
        <p>Manage all doctoral programs across universities</p>
      </div>

      {/* Stats Cards */}
      <div className="phd-stats-grid">
        <div className="phd-stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-details">
            <h3>Total Programs</h3>
            <p className="stat-value">{stats.totalPrograms}</p>
          </div>
        </div>
        <div className="phd-stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-details">
            <h3>Active Programs</h3>
            <p className="stat-value">{stats.activePrograms}</p>
          </div>
        </div>
        <div className="phd-stat-card">
          <div className="stat-icon">🏛️</div>
          <div className="stat-details">
            <h3>Universities</h3>
            <p className="stat-value">{stats.totalUniversities}</p>
          </div>
        </div>
        <div className="phd-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <h3>Researchers</h3>
            <p className="stat-value">{stats.totalResearchers}</p>
          </div>
        </div>
        <div className="phd-stat-card">
          <div className="stat-icon">📜</div>
          <div className="stat-details">
            <h3>Completed Theses</h3>
            <p className="stat-value">{stats.completedTheses}</p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="phd-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search programs, universities, or research areas..."
            value={searchQuery}
            onChange={handleSearch}
            className="phd-search"
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
      <div className="phd-table-container">
        <table className="phd-table">
          <thead>
            <tr>
              <th>Program Name</th>
              <th>University</th>
              <th>Duration</th>
              <th>Supervisors</th>
              <th>Research Areas</th>
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
                <td>{program.supervisors}</td>
                <td>{program.researchAreas}</td>
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
        <span className="page-info">Page 1 of 3</span>
        <button className="pagination-btn">Next</button>
      </div>
    </div>
  );
};

export default PhD;