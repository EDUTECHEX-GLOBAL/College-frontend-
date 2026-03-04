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
  }, [searchTerm]);

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

      // Search in both APIs
      const [adminResponse, bachelorsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/admin/universities/search`, {
          params: { q: searchTerm },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => ({ data: { success: false, data: [] } })),
        axios.get(`${API_URL}/api/bachelors/universities`, {
          params: { 
            search: searchTerm,
            limit: 50 
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => ({ data: { success: false, data: [] } }))
      ]);

      let combinedResults = [];
      
      if (adminResponse.data.success) {
        const adminUniversities = adminResponse.data.data.map(uni => ({
          ...uni,
          source: 'admin',
          importedByAdmin: true
        }));
        combinedResults = [...combinedResults, ...adminUniversities];
      }
      
      if (bachelorsResponse.data.success) {
        const transformedBachelors = bachelorsResponse.data.data.map(uni => ({
          ...uni,
          INSTNM: uni.universityName,
          UNITID: uni.universityCode,
          CITY: uni.city,
          STABBR: uni.state,
          ADDR: uni.address,
          ZIP: uni.zipCode,
          WEBADDR: uni.website,
          location: {
            city: uni.city,
            state: uni.state,
            country: uni.country
          },
          programs: uni.programs || [],
          programCount: uni.programs?.length || 0,
          importedByAdmin: false,
          lastUpdated: uni.updatedAt || uni.createdAt,
          logo: uni.universityLogo,
          contact: {
            website: uni.website,
            adminEmail: uni.adminEmail,
            adminPhone: uni.adminPhone,
            admissionEmail: uni.admissionEmail,
            admissionPhone: uni.admissionPhone
          },
          source: 'bachelors'
        }));
        combinedResults = [...combinedResults, ...transformedBachelors];
      }

      setSearchResults(combinedResults);
    } catch (err) {
      console.error("Failed to search:", err);
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const fetchAllUniversities = async () => {
    console.log("Fetching all universities from both APIs...");
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      // Fetch from both APIs simultaneously
      const [adminResponse, bachelorsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/admin/universities`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => ({ data: { success: false, data: [] } })),
        axios.get(`${API_URL}/api/bachelors/universities`, {
          params: {
            limit: 100,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => ({ data: { success: false, data: [] } }))
      ]);

      console.log("Admin API Response:", adminResponse.data);
      console.log("Bachelors API Response:", bachelorsResponse.data);
      
      let combinedUniversities = [];
      
      // Add admin/imported universities
      if (adminResponse.data.success) {
        const adminUniversities = adminResponse.data.data.map(uni => ({
          ...uni,
          source: 'admin',
          importedByAdmin: true
        }));
        combinedUniversities = [...combinedUniversities, ...adminUniversities];
      }

      // Add bachelors universities (from your creation form)
      if (bachelorsResponse.data.success) {
        const bachelorsUniversities = bachelorsResponse.data.data.map(uni => ({
          ...uni,
          INSTNM: uni.universityName,
          UNITID: uni.universityCode,
          CITY: uni.city,
          STABBR: uni.state,
          ADDR: uni.address,
          ZIP: uni.zipCode,
          WEBADDR: uni.website,
          location: {
            city: uni.city,
            state: uni.state,
            country: uni.country
          },
          programs: uni.programs || [],
          programCount: uni.programs?.length || 0,
          importedByAdmin: false,
          lastUpdated: uni.updatedAt || uni.createdAt,
          logo: uni.universityLogo,
          contact: {
            website: uni.website,
            adminEmail: uni.adminEmail,
            adminPhone: uni.adminPhone,
            admissionEmail: uni.admissionEmail,
            admissionPhone: uni.admissionPhone
          },
          source: 'bachelors'
        }));
        combinedUniversities = [...combinedUniversities, ...bachelorsUniversities];
      }

      setUniversities(combinedUniversities);
    } catch (err) {
      console.error("Failed to fetch universities:", err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (err.response.status === 404) {
          setError("API endpoint not found. Please check if the server is running.");
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
        fetchAllUniversities();
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
    if (university.GUS_DATA?.major_areas) {
      let count = 0;
      university.GUS_DATA.major_areas.forEach(area => {
        if (area.specific_programs && Array.isArray(area.specific_programs)) {
          count += area.specific_programs.length;
        }
      });
      if (count > 0) return count;
    }
    if (university.metadata?.programs) {
      return university.metadata.programs.length;
    }
    if (university.programStats?.totalPrograms) {
      return university.programStats.totalPrograms;
    }
    return university.programCount || 0;
  };

  // Get programs from various possible locations - FIXED VERSION
  const getPrograms = (university) => {
    // 1. Check programs array (for custom universities like Princeton)
    if (university.programs && Array.isArray(university.programs)) {
      return university.programs;
    }
    
    // 2. Check GUS_DATA.programs_data (for imported universities with programs_data)
    if (university.GUS_DATA?.programs_data && Array.isArray(university.GUS_DATA.programs_data)) {
      return university.GUS_DATA.programs_data;
    }
    
    // 3. Check GUS_DATA.major_areas (for imported universities like Sunderland)
    if (university.GUS_DATA?.major_areas && Array.isArray(university.GUS_DATA.major_areas)) {
      const programs = [];
      university.GUS_DATA.major_areas.forEach(area => {
        if (area.specific_programs && Array.isArray(area.specific_programs)) {
          area.specific_programs.forEach(prog => {
            programs.push({
              id: prog._id || `program-${Date.now()}-${Math.random()}`,
              title: prog.program_name,
              program_name: prog.program_name,
              level: university.GUS_DATA?.level || 'Undergraduate',
              studyMode: 'On Campus',
              duration: '3 years',
              majorArea: area.major_area,
              description: `${prog.program_name} program in ${area.major_area} at ${university.INSTNM || university.universityName}`
            });
          });
        }
      });
      if (programs.length > 0) return programs;
    }
    
    // 4. Check metadata.programs
    if (university.metadata?.programs) {
      return university.metadata.programs;
    }
    
    return [];
  };

  const getLocationString = (university) => {
    const parts = [];
    if (university.city) parts.push(university.city);
    else if (university.location?.city) parts.push(university.location.city);
    else if (university.CITY) parts.push(university.CITY);
    
    if (university.state) parts.push(university.state);
    else if (university.location?.state) parts.push(university.location.state);
    else if (university.STABBR) parts.push(university.STABBR);
    
    if (university.country) parts.push(university.country);
    else if (university.location?.country) parts.push(university.location.country);
    else if (university.GUS_DATA?.country) parts.push(university.GUS_DATA.country);
    else parts.push('USA');
    
    return parts.join(', ') || 'Location not specified';
  };

  const getUniversityCode = (university) => {
    if (university.universityCode) {
      return university.universityCode;
    }
    if (university.IALIAS) {
      return university.IALIAS.split(' ').map(w => w[0]).join('').substring(0, 4).toUpperCase();
    }
    if (university.INSTNM || university.universityName) {
      const name = university.INSTNM || university.universityName;
      const words = name.split(' ');
      if (words.length > 1) {
        return words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
      }
      return name.substring(0, 4).toUpperCase();
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
    if (levelStr.includes('bachelor') || levelStr.includes('undergraduate') || levelStr.includes('ba') || levelStr.includes('bs')) {
      return '#4CAF50'; // Green
    } else if (levelStr.includes('master') || levelStr.includes('graduate') || levelStr.includes('ma') || levelStr.includes('ms')) {
      return '#FF9800'; // Orange
    } else if (levelStr.includes('phd') || levelStr.includes('doctorate')) {
      return '#F44336'; // Red
    } else if (levelStr.includes('diploma')) {
      return '#9C27B0'; // Purple
    } else if (levelStr.includes('certificate')) {
      return '#00BCD4'; // Cyan
    } else if (levelStr.includes('foundation')) {
      return '#FF6B6B'; // Coral
    } else {
      return '#757575'; // Grey
    }
  };

  const handleViewDetails = async (university) => {
    setLoadingPrograms(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found.");
        setLoadingPrograms(false);
        return;
      }

      let details = university;
      
      // If it's a bachelors university (custom created), fetch from bachelors API
      if (university.source === 'bachelors' && university._id) {
        try {
          const response = await axios.get(`${API_URL}/api/bachelors/universities/${university._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data.success) {
            details = response.data.data;
          }
        } catch (err) {
          console.error("Error fetching bachelors university details:", err);
        }
      } 
      // If it's an imported university, fetch from admin API
      else if (university.UNITID) {
        try {
          const response = await axios.get(`${API_URL}/api/admin/universities/${university.UNITID}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data.success) {
            details = response.data.data;
          }
        } catch (err) {
          console.error("Error fetching admin university details:", err);
        }
      }

      setSelectedUniversity(details);
      setSelectedProgram(null);
      setShowDetailsModal(true);
      setShowProgramDetails(false);
    } catch (err) {
      console.error("Error in handleViewDetails:", err);
      setError("Failed to load university details.");
    } finally {
      setLoadingPrograms(false);
    }
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

  const sortUniversities = (data) => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.INSTNM || a.universityName || '';
        const nameB = b.INSTNM || b.universityName || '';
        return nameA.localeCompare(nameB);
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
      return data.filter(uni => uni.source === 'admin');
    }
    if (filterType === 'custom') {
      return data.filter(uni => uni.source === 'bachelors');
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
              <p className="stat-value">{universities.length}</p>
              <p className="stat-sub">
                {universities.filter(u => u.source === 'admin').length} Imported • {universities.filter(u => u.source === 'bachelors').length} Custom
              </p>
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
            onClick={fetchAllUniversities}
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
            <option value="all">All Universities</option>
            <option value="hasPrograms">Has Programs</option>
            <option value="imported">Imported Only</option>
            <option value="custom">Custom Created</option>
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
            placeholder="Search universities by name, location, or program..."
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
          <p>Click the "Import Universities" button to load data or create one in the Bachelors section.</p>
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
            const isCustom = uni.source === 'bachelors';

            return (
              <div key={uni._id || uni.UNITID || index} className="university-item">
                <div className="item-header">
                  <div className="item-logo">
                    {uni.logo || uni.universityLogo ? (
                      <img 
                        src={uni.logo || uni.universityLogo} 
                        alt={uni.INSTNM || uni.universityName}
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
                    <h3 className="item-title">{uni.INSTNM || uni.universityName}</h3>
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
                      {programCount} {programCount === 1 ? 'Program' : 'Programs'}
                    </div>
                  )}
                  
                  {isCustom ? (
                    <span className="item-badge custom">✨ Custom</span>
                  ) : (
                    <span className="item-badge imported">📥 Imported</span>
                  )}
                </div>

                <div className="item-footer">
                  <span className="item-date">
                    {uni.lastUpdated || uni.updatedAt || uni.createdAt ? 
                      new Date(uni.lastUpdated || uni.updatedAt || uni.createdAt).toLocaleDateString('en-US', { 
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
                      {programs.slice(0, 3).map((prog, idx) => {
                        const programName = typeof prog === 'string' ? prog : (prog.title || prog.program_name || `Program ${idx + 1}`);
                        const programLevel = typeof prog === 'string' ? '' : (prog.level || prog.type);
                        
                        return (
                          <span 
                            key={idx} 
                            className="program-tag"
                            style={{
                              background: getLevelColor(programLevel),
                              color: 'white'
                            }}
                          >
                            {programName}
                          </span>
                        );
                      })}
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
                      {selectedUniversity.universityLogo || selectedUniversity.logo ? (
                        <img 
                          src={selectedUniversity.universityLogo || selectedUniversity.logo} 
                          alt={selectedUniversity.universityName || selectedUniversity.INSTNM}
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
                      <h2>{selectedUniversity.universityName || selectedUniversity.INSTNM}</h2>
                      <p className="modal-location">{getLocationString(selectedUniversity)}</p>
                      {selectedUniversity.source && (
                        <span className={`source-badge ${selectedUniversity.source}`}>
                          {selectedUniversity.source === 'bachelors' ? '✨ Custom Created' : '📥 Imported'}
                        </span>
                      )}
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
                          <span className="info-label">Code:</span>
                          <span className="info-value">{selectedUniversity.universityCode || selectedUniversity.UNITID || 'N/A'}</span>
                        </div>
                        {selectedUniversity.establishedYear && (
                          <div className="info-item">
                            <span className="info-label">Established:</span>
                            <span className="info-value">{selectedUniversity.establishedYear}</span>
                          </div>
                        )}
                        {selectedUniversity.universityType && (
                          <div className="info-item">
                            <span className="info-label">Type:</span>
                            <span className="info-value">{selectedUniversity.universityType}</span>
                          </div>
                        )}
                        {selectedUniversity.ranking && (
                          <div className="info-item">
                            <span className="info-label">Ranking:</span>
                            <span className="info-value">{selectedUniversity.ranking}</span>
                          </div>
                        )}
                        {selectedUniversity.website && (
                          <div className="info-item full-width">
                            <span className="info-label">Website:</span>
                            <a href={selectedUniversity.website} target="_blank" rel="noopener noreferrer">
                              {selectedUniversity.website}
                            </a>
                          </div>
                        )}
                        {selectedUniversity.accreditation && (
                          <div className="info-item">
                            <span className="info-label">Accreditation:</span>
                            <span className="info-value">{selectedUniversity.accreditation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    {(selectedUniversity.adminEmail || selectedUniversity.admissionEmail || selectedUniversity.adminPhone) && (
                      <div className="modal-section">
                        <h4>Contact Information</h4>
                        <div className="info-grid">
                          {selectedUniversity.adminEmail && (
                            <div className="info-item">
                              <span className="info-label">Admin Email:</span>
                              <span className="info-value">{selectedUniversity.adminEmail}</span>
                            </div>
                          )}
                          {selectedUniversity.adminPhone && (
                            <div className="info-item">
                              <span className="info-label">Admin Phone:</span>
                              <span className="info-value">{selectedUniversity.adminPhone}</span>
                            </div>
                          )}
                          {selectedUniversity.admissionEmail && (
                            <div className="info-item">
                              <span className="info-label">Admission Email:</span>
                              <span className="info-value">{selectedUniversity.admissionEmail}</span>
                            </div>
                          )}
                          {selectedUniversity.admissionPhone && (
                            <div className="info-item">
                              <span className="info-label">Admission Phone:</span>
                              <span className="info-value">{selectedUniversity.admissionPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tuition Information */}
                    {selectedUniversity.tuitionFees && (
                      <div className="modal-section">
                        <h4>Tuition Fees (Annual)</h4>
                        <div className="info-grid">
                          {selectedUniversity.tuitionFees.inState && (
                            <div className="info-item">
                              <span className="info-label">In-State:</span>
                              <span className="info-value">${selectedUniversity.tuitionFees.inState}</span>
                            </div>
                          )}
                          {selectedUniversity.tuitionFees.outOfState && (
                            <div className="info-item">
                              <span className="info-label">Out-of-State:</span>
                              <span className="info-value">${selectedUniversity.tuitionFees.outOfState}</span>
                            </div>
                          )}
                          {selectedUniversity.tuitionFees.international && (
                            <div className="info-item">
                              <span className="info-label">International:</span>
                              <span className="info-value">${selectedUniversity.tuitionFees.international}</span>
                            </div>
                          )}
                          {selectedUniversity.tuitionFees.roomAndBoard && (
                            <div className="info-item">
                              <span className="info-label">Room & Board:</span>
                              <span className="info-value">${selectedUniversity.tuitionFees.roomAndBoard}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Programs Section */}
                    {getPrograms(selectedUniversity).length > 0 && (
                      <div className="modal-section">
                        <h4>All Programs ({getProgramCount(selectedUniversity)})</h4>
                        <div className="programs-grid">
                          {getPrograms(selectedUniversity).map((program, idx) => {
                            const programName = typeof program === 'string' ? program : (program.title || program.program_name || `Program ${idx + 1}`);
                            const programLevel = typeof program === 'string' ? '' : (program.level || program.type);
                            const programDuration = typeof program === 'string' ? '' : program.duration;
                            
                            return (
                              <div 
                                key={idx} 
                                className="program-card"
                                onClick={() => handleViewProgramDetails(program)}
                                style={{
                                  borderLeft: `4px solid ${getLevelColor(programLevel)}`
                                }}
                              >
                                <h5 className="program-title">{programName}</h5>
                                {programLevel && (
                                  <div className="program-badges">
                                    <span 
                                      className="program-level"
                                      style={{ backgroundColor: getLevelColor(programLevel) }}
                                    >
                                      {programLevel}
                                    </span>
                                    {programDuration && (
                                      <span className="program-duration">
                                        {programDuration}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <button className="view-program-btn">View Details →</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {getPrograms(selectedUniversity).length === 0 && (
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
                              className="detail-value level-badge"
                              style={{ 
                                backgroundColor: getLevelColor(selectedProgram.level),
                              }}
                            >
                              {selectedProgram.level}
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
                        
                        {selectedProgram.studyMode && (
                          <div className="detail-item">
                            <span className="detail-label">Study Mode:</span>
                            <span className="detail-value">{selectedProgram.studyMode}</span>
                          </div>
                        )}
                        
                        {selectedProgram.fees && (
                          <div className="detail-item">
                            <span className="detail-label">Tuition:</span>
                            <span className="detail-value">{selectedProgram.fees}</span>
                          </div>
                        )}
                        
                        {selectedProgram.description && (
                          <div className="detail-item full-width">
                            <span className="detail-label">Description:</span>
                            <p className="detail-value description-text">{selectedProgram.description}</p>
                          </div>
                        )}
                        
                        {selectedProgram.requirements && (
                          <div className="detail-item full-width">
                            <span className="detail-label">Requirements:</span>
                            <p className="detail-value description-text">{selectedProgram.requirements}</p>
                          </div>
                        )}
                      </div>
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