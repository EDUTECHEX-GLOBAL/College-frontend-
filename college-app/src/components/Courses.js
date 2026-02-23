// src/components/Courses.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Courses.css";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Courses = ({ onCourseSelect }) => {
  const { universityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [university, setUniversity] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMajorArea, setSelectedMajorArea] = useState("All");
  const [selectedStudyMode, setSelectedStudyMode] = useState("All");
  const [majorAreas, setMajorAreas] = useState([]);
  const [studyModes, setStudyModes] = useState([]);
  const [activeTab, setActiveTab] = useState("programs");
  const [savingToBackend, setSavingToBackend] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    loadUniversityData();
  }, [universityId]);

  const loadUniversityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Loading university data for ID:', universityId);
      
      // Try to get university from multiple sources
      let universityData = null;
      let selectedCoursesData = [];
      
      // 1. Check location state
      if (location.state?.university) {
        universityData = location.state.university;
        console.log('✅ Found university in navigation state:', universityData.INSTNM);
      }
      
      // 2. Check location state for selected courses
      if (location.state?.selectedCourses) {
        selectedCoursesData = location.state.selectedCourses;
        console.log('✅ Found selected courses in navigation state:', selectedCoursesData.length);
      }
      
      // 3. Check localStorage
      if (!universityData) {
        const stored = localStorage.getItem(`university_${universityId}`);
        if (stored) {
          try {
            universityData = JSON.parse(stored);
            console.log(`✅ Found university in localStorage:`, universityData.INSTNM);
          } catch (e) {
            console.error('❌ Error parsing localStorage data:', e);
          }
        }
      }
      
      // 4. Check localStorage for selected courses
      if (selectedCoursesData.length === 0) {
        const storedCourses = localStorage.getItem(`university_courses_${universityId}`);
        if (storedCourses) {
          try {
            selectedCoursesData = JSON.parse(storedCourses);
            console.log(`✅ Found selected courses in localStorage:`, selectedCoursesData.length);
          } catch (e) {
            console.error('❌ Error parsing stored courses:', e);
          }
        }
      }
      
      // 5. Check currentUniversity
      if (!universityData) {
        const current = localStorage.getItem('currentUniversity');
        if (current) {
          try {
            const parsed = JSON.parse(current);
            if (parsed.UNITID?.toString() === universityId?.toString()) {
              universityData = parsed;
              console.log('✅ Found university in currentUniversity:', universityData.INSTNM);
            }
          } catch (e) {
            console.error('❌ Error parsing currentUniversity:', e);
          }
        }
      }
      
      setSelectedCourses(selectedCoursesData);
      
      if (universityData) {
        setUniversity(universityData);
        extractProgramsFromUniversity(universityData, selectedCoursesData);
      } else {
        console.log('❌ No university data found, fetching from API...');
        await fetchUniversityFromAPI();
      }
      
    } catch (err) {
      console.error('❌ Error loading university data:', err);
      setError('Failed to load university data. Please go back and try again.');
      setLoading(false);
    }
  };

  const fetchUniversityFromAPI = async () => {
    try {
      console.log('🔍 Fetching university from API with ID:', universityId);
      
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_URL}/api/college-search/university/${universityId}`, { headers });
      
      if (response.data.success) {
        const uniData = response.data.data;
        console.log('✅ Found university in college-search API:', uniData.INSTNM);
        setUniversity(uniData);
        extractProgramsFromUniversity(uniData, []);
      } else {
        setError('University not found. Please go back and select a valid university.');
        setLoading(false);
      }
    } catch (apiError) {
      console.error('❌ API Error:', apiError);
      setError('Unable to load university details. Please try again later.');
      setLoading(false);
    }
  };

  const extractProgramsFromUniversity = (uniData, selectedCoursesData = []) => {
    console.log('🔍 Extracting programs from university data:', uniData.INSTNM);
    console.log('📊 University data keys:', Object.keys(uniData));
    console.log('📚 Selected courses from profile:', selectedCoursesData.length);
    
    let extractedPrograms = [];
    const debug = {
      hasPrograms: !!uniData.programs,
      programsLength: uniData.programs?.length || 0,
      hasProgramsArray: uniData.programs && Array.isArray(uniData.programs),
      hasMetadata: !!uniData.metadata,
      hasGUS_DATA: !!uniData.GUS_DATA,
      firstProgramSample: uniData.programs && uniData.programs.length > 0 ? 
        Object.keys(uniData.programs[0]) : null,
      selectedCoursesCount: selectedCoursesData.length
    };
    
    console.log('📊 Debug info:', debug);
    
    // First, use selected courses from profile if available
    if (selectedCoursesData && selectedCoursesData.length > 0) {
      console.log(`📚 Using ${selectedCoursesData.length} selected courses from profile`);
      extractedPrograms = selectedCoursesData;
    }
    
    // If no selected courses, try to get programs from university data
    else {
      // Check all possible locations for programs
      
      // 1. Check programs field
      if (uniData.programs && Array.isArray(uniData.programs) && uniData.programs.length > 0) {
        console.log(`📚 Found ${uniData.programs.length} programs in uniData.programs`);
        extractedPrograms = uniData.programs;
      }
      
      // 2. Check metadata.programs
      else if (uniData.metadata?.programs && Array.isArray(uniData.metadata.programs) && uniData.metadata.programs.length > 0) {
        console.log(`📚 Found ${uniData.metadata.programs.length} programs in metadata.programs`);
        extractedPrograms = uniData.metadata.programs;
      }
      
      // 3. Check GUS_DATA.programs_data
      else if (uniData.GUS_DATA?.programs_data && Array.isArray(uniData.GUS_DATA.programs_data) && uniData.GUS_DATA.programs_data.length > 0) {
        console.log(`📚 Found ${uniData.GUS_DATA.programs_data.length} programs in GUS_DATA.programs_data`);
        extractedPrograms = uniData.GUS_DATA.programs_data;
      }
      
      // 4. Check if programs are in a nested structure
      else if (uniData.data?.programs && Array.isArray(uniData.data.programs) && uniData.data.programs.length > 0) {
        console.log(`📚 Found ${uniData.data.programs.length} programs in data.programs`);
        extractedPrograms = uniData.data.programs;
      }
    }
    
    if (extractedPrograms.length > 0) {
      processPrograms(extractedPrograms, uniData);
    } else {
      console.log('⚠️ No programs found in any data source');
      setDebugInfo(debug);
      setPrograms([]);
      setFilteredPrograms([]);
      setLoading(false);
    }
  };

  const processPrograms = (programsData, uniData) => {
    const extractedPrograms = [];
    const areas = new Set();
    const modes = new Set();

    console.log('🔄 Processing programs data:', programsData.length);

    programsData.forEach((prog, index) => {
      // Log each program to debug
      console.log(`Program ${index + 1}:`, prog);
      
      // Get title - try multiple fields
      const title = prog.title || prog.program_name || prog.name || 'Program';
      
      // Get level
      let level = prog.level || prog.degree_level || prog.program_level || 'Undergraduate';
      if (typeof level === 'string') {
        level = level.toUpperCase();
      }
      
      // Get study mode
      let studyMode = prog.studyMode || prog.delivery_mode || prog.mode || 'On Campus';
      if (prog.studyModes && Array.isArray(prog.studyModes)) {
        studyMode = prog.studyModes.join(' & ');
      }
      
      // Get locations
      let locations = [];
      if (prog.locations && Array.isArray(prog.locations)) {
        locations = prog.locations;
      } else if (prog.location) {
        locations = [prog.location];
      } else if (uniData.CITY && uniData.STABBR) {
        locations = [`${uniData.CITY}, ${uniData.STABBR}`];
      } else {
        locations = ['Main Campus'];
      }
      
      // Get major area
      const majorArea = prog.majorArea || prog.discipline || prog.field_of_study || 'General';
      if (majorArea !== 'General') areas.add(majorArea);
      
      // Get duration
      const duration = prog.duration || getDurationForLevel(level);
      
      // Get description
      const description = prog.description || prog.overview || `${title} program at ${uniData.INSTNM}`;
      
      // Add study mode to set
      if (studyMode) modes.add(studyMode);

      const program = {
        id: prog.id || prog.programId || prog._id || `prog-${index}-${Date.now()}`,
        title: title,
        level: level,
        studyMode: studyMode,
        locations: locations,
        description: description,
        duration: duration,
        fees: prog.fees || {},
        majorArea: majorArea,
        campus: prog.campus || 'Main Campus'
      };

      extractedPrograms.push(program);
    });

    console.log(`✅ Processed ${extractedPrograms.length} programs`);
    
    // Sort programs by title
    extractedPrograms.sort((a, b) => a.title.localeCompare(b.title));
    
    // Convert sets to arrays and sort
    const areasArray = Array.from(areas).sort();
    const modesArray = ['All', ...Array.from(modes).sort()];

    setPrograms(extractedPrograms);
    setFilteredPrograms(extractedPrograms);
    setMajorAreas(areasArray);
    setStudyModes(modesArray);
    setLoading(false);
    
    console.log('📊 Final stats:', {
      programs: extractedPrograms.length,
      majorAreas: areasArray.length,
      studyModes: modesArray.length - 1
    });
  };

  const getDurationForLevel = (level) => {
    if (!level) return '3-4 years';
    const levelStr = level.toLowerCase();
    if (levelStr.includes('master') || levelStr.includes('mba')) return '1-2 years';
    if (levelStr.includes('phd') || levelStr.includes('doctorate')) return '3-5 years';
    if (levelStr.includes('bachelor') || levelStr.includes('undergraduate')) return '3-4 years';
    if (levelStr.includes('diploma')) return '1-2 years';
    if (levelStr.includes('certificate')) return '6-12 months';
    return '3-4 years';
  };

  useEffect(() => {
    let filtered = programs;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(prog =>
        prog.title.toLowerCase().includes(term) ||
        (prog.description && prog.description.toLowerCase().includes(term))
      );
    }
    
    if (selectedMajorArea !== "All") {
      filtered = filtered.filter(prog => prog.majorArea === selectedMajorArea);
    }
    
    if (selectedStudyMode !== "All") {
      filtered = filtered.filter(prog => prog.studyMode === selectedStudyMode);
    }
    
    setFilteredPrograms(filtered);
  }, [searchTerm, selectedMajorArea, selectedStudyMode, programs]);

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setActiveTab('selected');
  };

  const handleApplyNow = (program) => {
    setSelectedProgram(program);
    navigateToApplicationOverview();
  };

  const navigateToApplicationOverview = () => {
    if (!university || !selectedProgram) {
      alert("Please select a program first");
      return;
    }
    
    setSavingToBackend(true);
    
    try {
      const courseData = {
        universityId: university.UNITID || university._id,
        universityName: university.INSTNM,
        programId: selectedProgram.id,
        programName: selectedProgram.title,
        programDetails: {
          studyMode: selectedProgram.studyMode,
          level: selectedProgram.level,
          duration: selectedProgram.duration,
          fees: selectedProgram.fees,
          locations: selectedProgram.locations,
          description: selectedProgram.description,
          majorArea: selectedProgram.majorArea
        },
        selectedAt: new Date().toISOString()
      };
      
      localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));
      
      const studentType = location.pathname.includes('/transfer/') ? 'transfer' : 'firstyear';
      
      navigate(`/${studentType}/dashboard/application/overview`, {
        state: {
          fromCoursesPage: true,
          courseData: courseData
        }
      });
      
      if (onCourseSelect) {
        onCourseSelect(courseData);
      }
    } catch (error) {
      console.error("❌ Error saving course:", error);
      alert("An error occurred while saving your course selection.");
    } finally {
      setSavingToBackend(false);
    }
  };

  const handleBackToSearch = () => {
    const isFirstYear = location.pathname.includes('/firstyear/');
    navigate(isFirstYear ? '/firstyear/dashboard/college-search' : '/transfer/dashboard/college-search');
  };

  const getInitials = (name) => {
    if (!name) return "UN";
    return name.split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleRetry = () => {
    setLoading(true);
    setDebugInfo(null);
    if (university) {
      // Try to reload with selected courses
      const selectedCoursesData = location.state?.selectedCourses || [];
      extractProgramsFromUniversity(university, selectedCoursesData);
    } else {
      loadUniversityData();
    }
  };

  if (loading) {
    return (
      <div className="courses-loading">
        <div className="loading-spinner"></div>
        <p>Loading university details and programs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courses-error">
        <div className="error-icon">⚠️</div>
        <h3>{error}</h3>
        <button onClick={handleBackToSearch} className="back-button">
          ← Back to Search
        </button>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="courses-error">
        <div className="error-icon">❌</div>
        <h3>University not found</h3>
        <p>The university you're looking for doesn't exist.</p>
        <button onClick={handleBackToSearch} className="back-button">
          ← Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="courses-container">
      {/* Header */}
      <div className="courses-header">
        <div className="header-top">
          <button onClick={handleBackToSearch} className="header-back-button">
            <span className="back-arrow">←</span> Back to Search
          </button>
          {selectedCourses.length > 0 && (
            <div className="selected-courses-badge" style={{
              background: '#28a745',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              📚 {selectedCourses.length} Selected Courses
            </div>
          )}
        </div>
        
        <div className="university-header-card">
          <div className="university-header-content">
            <div className="university-logo-placeholder">
              <div className="university-logo-initials">
                {getInitials(university.INSTNM)}
              </div>
            </div>
            <div className="university-header-info">
              <h1 className="university-title">{university.INSTNM}</h1>
              <div className="university-meta">
                <span className="university-location">
                  <span className="location-icon">📍</span>
                  {university.CITY || university.location?.city || ''}, {university.STABBR || university.location?.state || ''}
                </span>
                <span className="university-country">
                  {university.COUNTRY || university.location?.country || 'USA'}
                </span>
              </div>
              
              <div className="university-stats">
                <div className="stat-box">
                  <span className="stat-number">{programs.length}</span>
                  <span className="stat-label">Programmes</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">{majorAreas.length}</span>
                  <span className="stat-label">Major Areas</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">{studyModes.length > 0 ? studyModes.length - 1 : 0}</span>
                  <span className="stat-label">Study Modes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info - Only show if no programs */}
      {programs.length === 0 && debugInfo && (
        <div className="debug-info" style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          fontSize: '12px'
        }}>
          <h4 style={{ color: '#dc3545' }}>Debug Information - No Programs Found</h4>
          <p><strong>University:</strong> {university.INSTNM}</p>
          <p><strong>Debug Info:</strong></p>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          <p><strong>Note:</strong> This university has no programs in the database. Showing selected courses from your profile instead.</p>
          <button 
            onClick={handleRetry}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Retry Loading Programs
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="courses-content">
        {/* Sidebar with Search and Filters */}
        {programs.length > 0 && (
          <div className="courses-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-header">
                <h3 className="sidebar-title">Search & Filter Programs</h3>
                <div className="results-count">
                  {filteredPrograms.length} of {programs.length} programs
                </div>
              </div>
              
              <div className="sidebar-search">
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search-btn"
                      onClick={() => setSearchTerm("")}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <div className="filters-section">
                <div className="filter-group">
                  <label className="filter-label">MAJOR AREA</label>
                  <select 
                    value={selectedMajorArea}
                    onChange={(e) => setSelectedMajorArea(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">All Major Areas</option>
                    {majorAreas.map((area, index) => (
                      <option key={index} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">STUDY MODE</label>
                  <select 
                    value={selectedStudyMode}
                    onChange={(e) => setSelectedStudyMode(e.target.value)}
                    className="filter-select"
                  >
                    {studyModes.map((mode, index) => (
                      <option key={index} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
                
                {(searchTerm || selectedMajorArea !== "All" || selectedStudyMode !== "All") && (
                  <button 
                    className="reset-filters-btn"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedMajorArea("All");
                      setSelectedStudyMode("All");
                    }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Programs Grid */}
        <div className="programs-content">
          {programs.length === 0 ? (
            <div className="no-programs-found">
              <div className="no-programs-icon">📚</div>
              <h3>No Programs Available in Database</h3>
              <p>This university doesn't have programs in the database yet.</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                You can still view your selected courses from your profile.
              </p>
              {selectedCourses.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4>Your Selected Courses ({selectedCourses.length})</h4>
                  <div className="selected-courses-list" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '15px',
                    marginTop: '15px'
                  }}>
                    {selectedCourses.map((course, idx) => (
                      <div key={idx} className="selected-course-card" style={{
                        background: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'left'
                      }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#2c5282' }}>
                          {course.title || course.program_name}
                        </h5>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {course.level && <div>Level: {course.level}</div>}
                          {course.studyMode && <div>Mode: {course.studyMode}</div>}
                          {course.duration && <div>Duration: {course.duration}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={handleBackToSearch} className="back-button" style={{ marginTop: '30px' }}>
                ← Back to Search
              </button>
            </div>
          ) : filteredPrograms.length > 0 ? (
            <div className="programs-grid">
              {filteredPrograms.map((program) => (
                <div
                  key={program.id}
                  className={`program-card ${selectedProgram?.id === program.id ? 'selected' : ''}`}
                >
                  <div className="program-card-header">
                    <h3 className="program-card-title">{program.title}</h3>
                  </div>
                  
                  <div className="program-card-body">
                    <div className="program-meta">
                      <span className="study-mode-badge">{program.studyMode}</span>
                      <span className="program-level-badge">{program.level}</span>
                    </div>
                    
                    <div className="program-locations">
                      <span className="location-icon">📍</span>
                      <span className="locations-text">
                        {program.locations.join(', ')}
                      </span>
                    </div>
                    
                    {program.duration && (
                      <div className="program-duration">
                        <span className="duration-icon">⏱️</span>
                        <span>{program.duration}</span>
                      </div>
                    )}
                    
                    {program.majorArea && program.majorArea !== 'General' && (
                      <div className="program-major-area">
                        <span className="major-area-tag">{program.majorArea}</span>
                      </div>
                    )}
                    
                    {program.description && (
                      <p className="program-description">
                        {program.description.length > 100 
                          ? `${program.description.substring(0, 100)}...` 
                          : program.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="program-card-footer">
                    <button 
                      className="select-program-btn"
                      onClick={() => handleProgramSelect(program)}
                    >
                      {selectedProgram?.id === program.id ? '✓ Selected' : 'Select Program'}
                    </button>
                    <button 
                      className="apply-now-btn"
                      onClick={() => handleApplyNow(program)}
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-programs-found">
              <p>No programs match your filters.</p>
              <button 
                className="reset-filters-btn"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedMajorArea("All");
                  setSelectedStudyMode("All");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Program Details Panel */}
      {selectedProgram && activeTab === 'selected' && (
        <div className="selected-program-panel">
          <div className="panel-header">
            <h3>Selected Program</h3>
            <button className="close-panel-btn" onClick={() => setActiveTab('programs')}>×</button>
          </div>
          <div className="panel-content">
            <h4>{selectedProgram.title}</h4>
            <div className="panel-details">
              <p><strong>Level:</strong> {selectedProgram.level}</p>
              <p><strong>Study Mode:</strong> {selectedProgram.studyMode}</p>
              <p><strong>Duration:</strong> {selectedProgram.duration}</p>
              <p><strong>Location:</strong> {selectedProgram.locations.join(', ')}</p>
              {selectedProgram.majorArea && (
                <p><strong>Major Area:</strong> {selectedProgram.majorArea}</p>
              )}
            </div>
            <button 
              className="apply-button"
              onClick={navigateToApplicationOverview}
              disabled={savingToBackend}
            >
              {savingToBackend ? 'Saving...' : 'Start Application'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;