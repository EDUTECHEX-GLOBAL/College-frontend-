// src/pages/University/University.js
import React, { useState, useEffect } from "react";
import "./University.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const University = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('universities');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showProgramDetails, setShowProgramDetails] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  useEffect(() => {
    console.log("University component mounted");
    fetchAllUniversities();
    fetchImportStats();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      searchUniversities();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, activeTab]);

  const fetchImportStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/admin/import-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setImportStats(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch import stats:", err);
    }
  };

  const importUniversities = async () => {
    setImporting(true);
    setError(null);
    setImportSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setImporting(false);
        return;
      }

      const response = await axios.post(`${API_URL}/api/admin/import-universities`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { importedUniversities, updatedUniversities, importedColleges, updatedColleges } = response.data.data;
        setImportSuccess(
          `Import completed: ${importedUniversities} new universities, ${updatedUniversities} updated, ` +
          `${importedColleges} new colleges, ${updatedColleges} updated`
        );
        setImportStats(response.data.data);
        fetchAllUniversities();
      } else {
        setError(response.data.message || "Import failed");
      }
    } catch (err) {
      console.error("Failed to import universities:", err);
      setError(err.response?.data?.message || "Failed to import universities. Make sure the server is running and data files exist.");
    } finally {
      setImporting(false);
    }
  };

  const searchUniversities = async () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found.");
        setSearching(false);
        return;
      }

      const endpoint = activeTab === 'universities' 
        ? `${API_URL}/api/admin/universities/search`
        : `${API_URL}/api/admin/colleges/search`;

      const response = await axios.get(endpoint, {
        params: { q: searchTerm },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSearchResults(response.data.data);
      } else {
        setError(response.data.message || "Search failed");
      }
    } catch (err) {
      console.error("Failed to search:", err);
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const fetchAllUniversities = async () => {
    console.log("Fetching all universities...");
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/admin/universities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("API Response:", response.data);
      
      if (response.data.success) {
        setUniversities(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to load universities");
      }
    } catch (err) {
      console.error("Failed to fetch universities:", err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (err.response.status === 404) {
          setError("Admin API endpoint not found. Please check if the server is running.");
        } else {
          setError(`Server error: ${err.response.data.message || err.response.statusText}`);
        }
      } else if (err.request) {
        setError("Cannot connect to server. Please make sure the server is running.");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.post(`${API_URL}/api/admin/refresh`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setImportStats(response.data.data);
      }
    } catch (err) {
      console.error("Failed to refresh stats:", err);
    }
  };

  // Get program count from various possible locations
  const getProgramCount = (university) => {
    if (university.programs && Array.isArray(university.programs)) {
      return university.programs.length;
    }
    if (university.GUS_DATA?.programs_data) {
      return university.GUS_DATA.programs_data.length;
    }
    if (university.metadata?.programs) {
      return university.metadata.programs.length;
    }
    if (university.programStats?.totalPrograms) {
      return university.programStats.totalPrograms;
    }
    return 0;
  };

  // Get programs from various possible locations
  const getPrograms = (university) => {
    if (university.programs && Array.isArray(university.programs)) {
      return university.programs;
    }
    if (university.GUS_DATA?.programs_data) {
      return university.GUS_DATA.programs_data;
    }
    if (university.metadata?.programs) {
      return university.metadata.programs;
    }
    return [];
  };

  // Get programs by major area
  const getProgramsByMajorArea = (university) => {
    if (university.programsByMajorArea) {
      return university.programsByMajorArea;
    }
    return {};
  };

  const getLocationString = (university) => {
    const parts = [];
    if (university.location?.city) parts.push(university.location.city);
    else if (university.CITY) parts.push(university.CITY);
    
    if (university.location?.state) parts.push(university.location.state);
    else if (university.STABBR) parts.push(university.STABBR);
    
    if (university.location?.country) parts.push(university.location.country);
    else if (university.GUS_DATA?.country) parts.push(university.GUS_DATA.country);
    else parts.push('USA');
    
    return parts.join(', ') || 'Location not specified';
  };

  const getUniversityCode = (university) => {
    if (university.IALIAS) {
      return university.IALIAS.split(' ').map(w => w[0]).join('').substring(0, 4).toUpperCase();
    }
    if (university.INSTNM) {
      const words = university.INSTNM.split(' ');
      if (words.length > 1) {
        return words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
      }
      return university.INSTNM.substring(0, 4).toUpperCase();
    }
    return 'UNI';
  };

  const getSalary = (university) => {
    const programCount = getProgramCount(university);
    if (programCount === 0) return null;
    
    const baseMin = 7.5;
    const baseMax = 12.5;
    const multiplier = Math.min(programCount / 10, 1.5);
    const min = (baseMin * (1 + multiplier)).toFixed(1);
    const max = (baseMax * (1 + multiplier)).toFixed(1);
    return `${min} - ${max}k USD`;
  };

  const hasPrograms = (university) => {
    return getProgramCount(university) > 0;
  };

  // Get color based on program level
  const getLevelColor = (level) => {
    const levelStr = level?.toLowerCase() || '';
    if (levelStr.includes('bachelor') || levelStr.includes('undergraduate')) {
      return '#4CAF50'; // Green
    } else if (levelStr.includes('master') || levelStr.includes('graduate')) {
      return '#FF9800'; // Orange
    } else if (levelStr.includes('phd') || levelStr.includes('doctorate')) {
      return '#F44336'; // Red
    } else if (levelStr.includes('diploma')) {
      return '#9C27B0'; // Purple
    } else if (levelStr.includes('certificate')) {
      return '#00BCD4'; // Cyan
    } else {
      return '#757575'; // Grey
    }
  };

  // Get color based on study mode
  const getStudyModeColor = (mode) => {
    const modeStr = mode?.toLowerCase() || '';
    if (modeStr.includes('online')) {
      return '#2196F3'; // Blue
    } else if (modeStr.includes('campus') || modeStr.includes('on campus')) {
      return '#FFC107'; // Amber
    } else if (modeStr.includes('hybrid') || modeStr.includes('blended')) {
      return '#9C27B0'; // Purple
    } else if (modeStr.includes('distance')) {
      return '#00BCD4'; // Cyan
    } else {
      return '#757575'; // Grey
    }
  };

  // Get gradient based on major area
  const getMajorAreaGradient = (majorArea) => {
    const area = majorArea?.toLowerCase() || '';
    
    if (area.includes('business') || area.includes('accounting') || area.includes('marketing')) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; // Purple
    } else if (area.includes('health') || area.includes('nursing') || area.includes('medical')) {
      return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'; // Pink/Red
    } else if (area.includes('computer') || area.includes('science') || area.includes('engineering')) {
      return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'; // Blue
    } else if (area.includes('psychology') || area.includes('counseling')) {
      return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'; // Pink/Yellow
    } else if (area.includes('social') || area.includes('communication')) {
      return 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)'; // Orange/Purple
    } else if (area.includes('science') || area.includes('biology') || area.includes('chemistry')) {
      return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'; // Mint/Pink
    } else if (area.includes('art') || area.includes('design') || area.includes('creative')) {
      return 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'; // Pink
    } else {
      return 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'; // Light Blue
    }
  };

  const handleViewDetails = async (university) => {
    if (!university.programs && university.UNITID) {
      try {
        setLoadingPrograms(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/admin/universities/${university.UNITID}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          setSelectedUniversity(response.data.data);
        } else {
          setSelectedUniversity(university);
        }
      } catch (err) {
        console.error("Error fetching university details:", err);
        setSelectedUniversity(university);
      } finally {
        setLoadingPrograms(false);
      }
    } else {
      setSelectedUniversity(university);
    }
    
    setSelectedProgram(null);
    setShowDetailsModal(true);
    setShowProgramDetails(false);
  };

  const handleViewProgramDetails = (program) => {
    setSelectedProgram(program);
    setShowProgramDetails(true);
  };

  const handleBackToUniversity = () => {
    setShowProgramDetails(false);
    setSelectedProgram(null);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedUniversity(null);
    setSelectedProgram(null);
    setShowProgramDetails(false);
  };

  const checkAuthStatus = () => {
    console.log("=== Auth Debug Info ===");
    console.log("Token in localStorage:", localStorage.getItem('token'));
    console.log("API URL:", API_URL);
    console.log("Active Tab:", activeTab);
    console.log("Universities count:", universities.length);
    console.log("Import Stats:", importStats);
    console.log("======================");
  };

  const sortUniversities = (data) => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.INSTNM || '').localeCompare(b.INSTNM || '');
      } else if (sortBy === 'location') {
        return (getLocationString(a) || '').localeCompare(getLocationString(b) || '');
      } else if (sortBy === 'programs') {
        return getProgramCount(b) - getProgramCount(a);
      }
      return 0;
    });
  };

  const filterUniversities = (data) => {
    if (!data) return [];
    if (filterType === 'all') return data;
    if (filterType === 'hasPrograms') {
      return data.filter(uni => hasPrograms(uni));
    }
    if (filterType === 'imported') {
      return data.filter(uni => uni.importedByAdmin);
    }
    return data;
  };

  let displayData = searchTerm.trim() && searchResults.length > 0 ? searchResults : universities;
  displayData = filterUniversities(displayData);
  displayData = sortUniversities(displayData);

  return (
    <div className="university-container">
      {/* Header Section */}
      <div className="university-header">
        <div className="header-top">
          <div className="header-left">
            <h1 className="university-title">University Directory</h1>
            <p className="university-subtitle">Search by university name, location, or program keywords</p>
          </div>
          <div className="header-right">
            <div className="stat-badge">
              <span className="stat-number">{displayData.length}</span>
              <span className="stat-label">Universities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tags */}
      <div className="category-tags">
        <button 
          className={`category-tag ${activeTab === 'universities' ? 'active' : ''}`}
          onClick={() => setActiveTab('universities')}
        >
          Universities
        </button>
        <button 
          className={`category-tag ${activeTab === 'colleges' ? 'active' : ''}`}
          onClick={() => setActiveTab('colleges')}
        >
          Colleges
        </button>
        <button className="category-tag">Research</button>
        <button className="category-tag">Technical</button>
      </div>

      {/* Stats Cards */}
      {importStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏛️</div>
            <div className="stat-details">
              <h3>Universities</h3>
              <p className="stat-value">{importStats.database?.universities || 0}</p>
              {importStats.files && (
                <p className="stat-sub">File: {importStats.files.universities?.count || 0}</p>
              )}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-details">
              <h3>Colleges</h3>
              <p className="stat-value">{importStats.database?.colleges || 0}</p>
              {importStats.files && (
                <p className="stat-sub">File: {importStats.files.colleges?.count || 0}</p>
              )}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-details">
              <h3>Total Programs</h3>
              <p className="stat-value">
                {universities.reduce((sum, uni) => sum + getProgramCount(uni), 0) || 0}
              </p>
              {importStats.files && (
                <p className="stat-sub">File: {importStats.files.programs || 0}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-left">
          <button 
            className="btn-import"
            onClick={importUniversities}
            disabled={importing}
          >
            {importing ? (
              <>
                <span className="spinner-small"></span>
                Importing...
              </>
            ) : (
              <>
                <span className="btn-icon">📥</span>
                Import Universities
              </>
            )}
          </button>
          
          <button 
            className="btn-refresh"
            onClick={refreshStats}
          >
            <span className="btn-icon">🔄</span>
            Refresh
          </button>
        </div>

        <div className="action-right">
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="location">Sort by Location</option>
            <option value="programs">Sort by Programs</option>
          </select>

          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Items</option>
            <option value="hasPrograms">Has Programs</option>
            <option value="imported">Imported</option>
          </select>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ▦
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {importSuccess && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <span>{importSuccess}</span>
          <button className="alert-close" onClick={() => setImportSuccess(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={`Search ${activeTab} by name, location, or program...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searching && <div className="search-spinner"></div>}
          {searchTerm && (
            <button 
              className="search-clear"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && searchResults.length > 0 && (
          <div className="search-results-count">
            Found {searchResults.length} results
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading universities...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayData.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🏛️</div>
          <h3>No universities found</h3>
          <p>Click the "Import Universities" button to load data</p>
          <button 
            className="btn-import"
            onClick={importUniversities}
            disabled={importing}
          >
            Import Now
          </button>
        </div>
      )}

      {/* University Grid/List */}
      {!loading && displayData.length > 0 && (
        <div className={`university-items ${viewMode}`}>
          {displayData.map((uni, index) => {
            const programCount = getProgramCount(uni);
            const location = getLocationString(uni);
            const uniCode = getUniversityCode(uni);
            const salary = getSalary(uni);
            const programs = getPrograms(uni);

            return (
              <div key={uni._id || uni.UNITID || index} className="university-item">
                <div className="item-header">
                  <div className="item-logo">
                    {uni.logo ? (
                      <img 
                        src={uni.logo} 
                        alt={uni.INSTNM}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `<span class="logo-fallback">${uniCode}</span>`;
                        }}
                      />
                    ) : (
                      <span className="logo-fallback">{uniCode}</span>
                    )}
                  </div>
                  
                  <div className="item-info">
                    <h3 className="item-title">{uni.INSTNM}</h3>
                    <p className="item-location">
                      <span className="location-icon">📍</span> {location}
                    </p>
                  </div>
                </div>

                <div className="item-body">
                  {salary && (
                    <div className="item-salary-badge">
                      {salary}
                    </div>
                  )}
                  
                  {programCount > 0 && (
                    <div className="item-program-badge">
                      {programCount} Programs
                    </div>
                  )}
                  
                  {uni.importedByAdmin && (
                    <span className="item-badge">Imported</span>
                  )}
                </div>

                <div className="item-footer">
                  <span className="item-date">
                    {uni.lastUpdated ? new Date(uni.lastUpdated).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Recently updated'}
                  </span>
                  <button 
                    className="item-view-btn"
                    onClick={() => handleViewDetails(uni)}
                  >
                    View Details →
                  </button>
                </div>

                {/* Show program preview if available */}
                {programs.length > 0 && (
                  <div className="program-preview">
                    <h4>Top Programs:</h4>
                    <div className="program-tags">
                      {programs.slice(0, 3).map((prog, idx) => (
                        <span 
                          key={idx} 
                          className="program-tag"
                          style={{
                            background: getLevelColor(prog.level),
                            color: 'white'
                          }}
                        >
                          {prog.title || prog.program_name || `Program ${idx + 1}`}
                        </span>
                      ))}
                      {programs.length > 3 && (
                        <span className="program-tag more">+{programs.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedUniversity && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {loadingPrograms ? (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>Loading university details...</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <div className="modal-header-left">
                    <div className="modal-logo">
                      {selectedUniversity.logo ? (
                        <img 
                          src={selectedUniversity.logo} 
                          alt={selectedUniversity.INSTNM}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = `<span class="logo-fallback">${getUniversityCode(selectedUniversity)}</span>`;
                          }}
                        />
                      ) : (
                        <span className="logo-fallback">{getUniversityCode(selectedUniversity)}</span>
                      )}
                    </div>
                    <div>
                      <h2>{selectedUniversity.INSTNM}</h2>
                      <p className="modal-location">{getLocationString(selectedUniversity)}</p>
                    </div>
                  </div>
                  <button className="modal-close-btn" onClick={closeModal}>×</button>
                </div>
                
                {!showProgramDetails ? (
                  <div className="modal-body">
                    {/* University Information */}
                    <div className="modal-section">
                      <h4>University Information</h4>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">UNITID:</span>
                          <span className="info-value">{selectedUniversity.UNITID}</span>
                        </div>
                        {selectedUniversity.ZIP && (
                          <div className="info-item">
                            <span className="info-label">ZIP:</span>
                            <span className="info-value">{selectedUniversity.ZIP}</span>
                          </div>
                        )}
                        {selectedUniversity.ADDR && (
                          <div className="info-item full-width">
                            <span className="info-label">Address:</span>
                            <span className="info-value">{selectedUniversity.ADDR}</span>
                          </div>
                        )}
                        {(selectedUniversity.WEBADDR || selectedUniversity.contact?.website) && (
                          <div className="info-item full-width">
                            <span className="info-label">Website:</span>
                            <a href={selectedUniversity.WEBADDR || selectedUniversity.contact?.website} target="_blank" rel="noopener noreferrer">
                              {selectedUniversity.WEBADDR || selectedUniversity.contact?.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedUniversity.metadata && (
                      <div className="modal-section">
                        <h4>Additional Information</h4>
                        <div className="info-grid">
                          {selectedUniversity.metadata.opeid && (
                            <div className="info-item">
                              <span className="info-label">OPEID:</span>
                              <span className="info-value">{selectedUniversity.metadata.opeid}</span>
                            </div>
                          )}
                          {selectedUniversity.metadata.sector && (
                            <div className="info-item">
                              <span className="info-label">Sector:</span>
                              <span className="info-value">{selectedUniversity.metadata.sector}</span>
                            </div>
                          )}
                          {selectedUniversity.metadata.iclevel && (
                            <div className="info-item">
                              <span className="info-label">Level:</span>
                              <span className="info-value">
                                {selectedUniversity.metadata.iclevel === 1 ? '4-year' : 
                                 selectedUniversity.metadata.iclevel === 2 ? '2-year' : 
                                 selectedUniversity.metadata.iclevel === 3 ? 'Graduate' : 'Unknown'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Programs Section */}
                    {hasPrograms(selectedUniversity) && (
                      <div className="modal-section">
                        <h4>All Programs ({getProgramCount(selectedUniversity)})</h4>
                        
                        {/* Display by major area if available */}
                        {selectedUniversity.programsByMajorArea && Object.keys(selectedUniversity.programsByMajorArea).length > 0 ? (
                          Object.entries(selectedUniversity.programsByMajorArea).map(([majorArea, progs]) => (
                            <div key={majorArea} className="major-area-section">
                              <h5 className="major-area-title" style={{ background: getMajorAreaGradient(majorArea) }}>
                                {majorArea}
                              </h5>
                              <div className="programs-grid">
                                {progs.map((program, idx) => (
                                  <div 
                                    key={idx} 
                                    className="program-card"
                                    onClick={() => handleViewProgramDetails(program)}
                                    style={{
                                      borderLeft: `4px solid ${getLevelColor(program.level)}`
                                    }}
                                  >
                                    <h5 className="program-title">
                                      {program.title || program.program_name}
                                    </h5>
                                    <div className="program-badges">
                                      {program.level && (
                                        <span 
                                          className="program-level"
                                          style={{ backgroundColor: getLevelColor(program.level) }}
                                        >
                                          {program.level}
                                        </span>
                                      )}
                                      {program.studyMode && (
                                        <span 
                                          className="program-mode"
                                          style={{ backgroundColor: getStudyModeColor(program.studyMode) }}
                                        >
                                          {program.studyMode}
                                        </span>
                                      )}
                                      {program.duration && (
                                        <span className="program-duration">
                                          {program.duration}
                                        </span>
                                      )}
                                    </div>
                                    <button className="view-program-btn">View Details →</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          /* Fallback to simple list */
                          <div className="programs-grid">
                            {getPrograms(selectedUniversity).map((program, idx) => (
                              <div 
                                key={idx} 
                                className="program-card"
                                onClick={() => handleViewProgramDetails(program)}
                                style={{
                                  borderLeft: `4px solid ${getLevelColor(program.level)}`
                                }}
                              >
                                <h5 className="program-title">
                                  {program.title || program.program_name || `Program ${idx + 1}`}
                                </h5>
                                <div className="program-badges">
                                  {program.level && (
                                    <span 
                                      className="program-level"
                                      style={{ backgroundColor: getLevelColor(program.level) }}
                                    >
                                      {program.level}
                                    </span>
                                  )}
                                  {program.studyMode && (
                                    <span 
                                      className="program-mode"
                                      style={{ backgroundColor: getStudyModeColor(program.studyMode) }}
                                    >
                                      {program.studyMode}
                                    </span>
                                  )}
                                  {program.duration && (
                                    <span className="program-duration">
                                      {program.duration}
                                    </span>
                                  )}
                                </div>
                                <button className="view-program-btn">View Details →</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {!hasPrograms(selectedUniversity) && (
                      <div className="modal-section">
                        <p className="no-programs-message">No programs available for this university.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Program Details View */
                  <div className="modal-body">
                    <button className="back-to-university" onClick={handleBackToUniversity}>
                      ← Back to University
                    </button>
                    
                    <div className="program-details">
                      <h3 className="program-details-title">
                        {selectedProgram.title || selectedProgram.program_name || 'Program Details'}
                      </h3>
                      
                      <div className="program-details-grid">
                        {selectedProgram.level && (
                          <div className="detail-item">
                            <span className="detail-label">Level:</span>
                            <span 
                              className="detail-value"
                              style={{ 
                                backgroundColor: getLevelColor(selectedProgram.level),
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              {selectedProgram.level}
                            </span>
                          </div>
                        )}
                        
                        {selectedProgram.studyMode && (
                          <div className="detail-item">
                            <span className="detail-label">Study Mode:</span>
                            <span 
                              className="detail-value"
                              style={{ 
                                backgroundColor: getStudyModeColor(selectedProgram.studyMode),
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              {selectedProgram.studyMode}
                            </span>
                          </div>
                        )}
                        
                        {selectedProgram.duration && (
                          <div className="detail-item">
                            <span className="detail-label">Duration:</span>
                            <span className="detail-value">{selectedProgram.duration}</span>
                          </div>
                        )}
                        
                        {selectedProgram.credits && (
                          <div className="detail-item">
                            <span className="detail-label">Credits:</span>
                            <span className="detail-value">{selectedProgram.credits}</span>
                          </div>
                        )}
                        
                        {selectedProgram.fees && (
                          <div className="detail-item">
                            <span className="detail-label">Tuition Fees:</span>
                            <span className="detail-value">{selectedProgram.fees}</span>
                          </div>
                        )}
                        
                        {selectedProgram.majorArea && (
                          <div className="detail-item full-width">
                            <span className="detail-label">Major Area:</span>
                            <span className="detail-value">{selectedProgram.majorArea}</span>
                          </div>
                        )}
                        
                        {selectedProgram.locations && selectedProgram.locations.length > 0 && (
                          <div className="detail-item full-width">
                            <span className="detail-label">Locations:</span>
                            <div className="location-tags">
                              {selectedProgram.locations.map((loc, idx) => (
                                <span key={idx} className="location-tag">{loc}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {selectedProgram.description && (
                        <div className="program-description">
                          <h4>Description</h4>
                          <p>{selectedProgram.description}</p>
                        </div>
                      )}
                      
                      {selectedProgram.requirements && (
                        <div className="program-requirements">
                          <h4>Requirements</h4>
                          <p>{selectedProgram.requirements}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default University;