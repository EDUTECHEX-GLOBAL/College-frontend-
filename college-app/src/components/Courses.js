import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Courses.css";

const API_URL = process.env.REACT_APP_API_BASE_URL;

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
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    fetchUniversityAndPrograms();
  }, [universityId, location.state]);

  const fetchUniversityAndPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      setPrograms([]);
      setFilteredPrograms([]);
      setSelectedProgram(null);
      setMajorAreas([]);
      setStudyModes([]);

      let universityData = null;

      if (location.state?.university) {
        console.log("✅ Found university in navigation state:", location.state.university.INSTNM);
        universityData = location.state.university;
      }
      else if (localStorage.getItem(`university_${universityId}`)) {
        console.log("✅ Found university in localStorage");
        universityData = JSON.parse(localStorage.getItem(`university_${universityId}`));
      }
      else {
        console.log("🔍 Fetching university data from API...");
        universityData = await fetchUniversityFromAPI();
      }

      if (universityData) {
        console.log(`🎓 Processing university: ${universityData.INSTNM}`);
        setUniversity(universityData);
        
        // Check if backend is available
        await checkBackendAvailability();
        
        // Process university data (from gus.json)
        processUniversityData(universityData);
      } else {
        setError("University not found. Please go back and select a valid university.");
      }
    } catch (error) {
      console.error("❌ Error fetching university:", error);
      setError("Unable to load university details. Please go back and select the university again.");
    } finally {
      setLoading(false);
    }
  };

  const checkBackendAvailability = async () => {
    try {
      console.log("🔍 Checking backend availability...");
      // Try to access a simple endpoint to check if backend is available
      const response = await axios.get(`${API_URL}/api/courses/university/${universityId}`, {
        timeout: 3000,
        params: { page: 1, limit: 1 }
      });
      
      if (response.status === 200) {
        setBackendAvailable(true);
        console.log("✅ Backend is available");
      }
    } catch (error) {
      console.log("⚠️ Backend not available or endpoint doesn't exist:", error.message);
      setBackendAvailable(false);
    }
  };

  const fetchUniversityFromAPI = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/college-search`, {
        params: { query: "" }
      });
      
      if (response.data.success && response.data.colleges) {
        const foundUniversity = response.data.colleges.find(
          college => college.UNITID.toString() === universityId.toString()
        );
        
        if (foundUniversity) {
          console.log("✅ Found university in API:", foundUniversity.INSTNM);
          localStorage.setItem(`university_${universityId}`, JSON.stringify(foundUniversity));
          return foundUniversity;
        }
      }
      return null;
    } catch (apiError) {
      console.error("API Error:", apiError);
      throw apiError;
    }
  };

  const processUniversityData = (uniData) => {
    if (!uniData) {
      setError("No university data available.");
      return;
    }

    const areas = uniData.GUS_DATA?.major_areas || [];
    setMajorAreas(areas);
    
    if (uniData.GUS_DATA?.programs_data && Array.isArray(uniData.GUS_DATA.programs_data)) {
      const universityPrograms = uniData.GUS_DATA.programs_data;
      console.log(`📚 Found ${universityPrograms.length} actual programs for ${uniData.INSTNM}`);
      
      const filteredUniversityPrograms = universityPrograms.filter(program => {
        return program.title && program.title.length > 0;
      });
      
      if (filteredUniversityPrograms.length > 0) {
        setPrograms(filteredUniversityPrograms);
        setFilteredPrograms(filteredUniversityPrograms);
        const modes = [...new Set(filteredUniversityPrograms.map(prog => prog.studyMode || "On Campus"))];
        setStudyModes(["All", ...modes]);
        return;
      }
    }
    
    if (areas.length > 0) {
      const generatedPrograms = generateProgramsFromMajorAreas(areas, uniData);
      console.log(`📚 Generated ${generatedPrograms.length} programs for ${uniData.INSTNM}`);
      setPrograms(generatedPrograms);
      setFilteredPrograms(generatedPrograms);
      const modes = [...new Set(generatedPrograms.map(prog => prog.studyMode || "On Campus"))];
      setStudyModes(["All", ...modes]);
    } else {
      console.log("⚠️ No programs data available for this university");
    }
  };

  const generateProgramsFromMajorAreas = (areas, uniData) => {
    const generatedPrograms = [];
    let programId = 1;
    
    areas.forEach((area) => {
      area.specific_programs?.forEach((program) => {
        generatedPrograms.push({
          id: `PROG-${uniData.UNITID}-${programId++}`,
          title: program.program_name,
          locations: getDefaultLocations(uniData),
          studyMode: getStudyModeForProgram(program.program_name),
          level: uniData.GUS_DATA?.level || "Undergraduate",
          description: `${program.program_name} program at ${uniData.INSTNM}. This program is part of the ${area.major_area} major area.`,
          duration: getDurationForProgram(program.program_name),
          fees: getFeesForProgram(program.program_name),
          requirements: "High school diploma or equivalent. Additional requirements may apply.",
          majorArea: area.major_area
        });
      });
    });
    
    return generatedPrograms;
  };

  const getDefaultLocations = (uniData) => {
    const locations = [];
    
    if (uniData.CITY && uniData.STABBR) {
      locations.push(`${uniData.CITY}, ${uniData.STABBR}`);
    }
    
    if (uniData.GUS_DATA?.country) {
      locations.push(uniData.GUS_DATA.country);
    }
    
    if (!uniData.INSTNM.toLowerCase().includes('kansas')) {
      locations.push("Berlin, Germany");
      locations.push("Online, Distance Learning");
    }
    
    return locations.length > 0 ? locations : ["Multiple Locations"];
  };

  const getStudyModeForProgram = (programName) => {
    const lowerName = programName.toLowerCase();
    
    if (lowerName.includes("online") || lowerName.includes("distance") || lowerName.includes("remote")) {
      return "Online";
    }
    
    if (lowerName.includes("hybrid") || lowerName.includes("blended")) {
      return "Hybrid";
    }
    
    return "On Campus";
  };

  const getDurationForProgram = (programName) => {
    const lowerName = programName.toLowerCase();
    
    if (lowerName.includes("master") || lowerName.includes("msc") || lowerName.includes("ma") || lowerName.includes("mba")) {
      return "1-2 years";
    }
    
    if (lowerName.includes("phd") || lowerName.includes("doctorate")) {
      return "3-5 years";
    }
    
    if (lowerName.includes("top-up") || lowerName.includes("foundation")) {
      return "1 year";
    }
    
    return "3-4 years";
  };

  const getFeesForProgram = (programName) => {
    const lowerName = programName.toLowerCase();
    
    if (lowerName.includes("mba") || lowerName.includes("executive")) {
      return "€15,000 - €25,000 per year";
    }
    
    if (lowerName.includes("master") || lowerName.includes("msc") || lowerName.includes("ma")) {
      return "€12,000 - €18,000 per year";
    }
    
    return "€10,000 - €15,000 per year";
  };

  // ✅ Save course to backend (with better error handling)
  const saveCourseToBackend = async (courseData) => {
    if (!backendAvailable) {
      console.log("📝 Backend not available, saving locally only");
      return { 
        success: true, 
        message: "Course saved locally (backend not available)" 
      };
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("🔒 User not logged in, saving locally only");
        return { 
          success: true, 
          message: "Course saved locally (login required for database save)" 
        };
      }

      console.log("💾 Preparing to save course to backend...", {
        title: courseData.programName,
        universityId: courseData.universityId
      });
      
      // Prepare course data for backend
      // Make sure we include all required fields from your Course model
      const backendCourseData = {
        title: courseData.programName,
        programId: courseData.programId,
        universityId: courseData.universityId,
        universityName: courseData.universityName,
        universityUnitId: courseData.universityId, // Required field in your model
        description: courseData.programDetails?.description || `${courseData.programName} program at ${courseData.universityName}`,
        level: courseData.programDetails?.level || "Undergraduate",
        studyMode: courseData.programDetails?.studyMode || "On Campus",
        duration: courseData.programDetails?.duration || "3-4 years",
        locations: courseData.programDetails?.locations || [courseData.campus || "Main Campus"],
        fees: {
          amount: 0,
          currency: "USD",
          period: "per year",
          displayText: courseData.programDetails?.fees || "Contact university for fee details"
        },
        majorArea: courseData.programDetails?.majorArea || "General",
        requirements: {
          description: courseData.programDetails?.requirements || "High school diploma or equivalent"
        },
        isActive: true,
        isAvailableForInternational: true
      };

      console.log("📤 Sending to backend:", backendCourseData);

      try {
        const response = await axios.post(
          `${API_URL}/api/courses`,
          backendCourseData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          }
        );
        
        console.log("✅ Backend response:", response.data);
        
        if (response.data.success) {
          return { 
            success: true, 
            message: "Course saved to database successfully",
            backendData: response.data.data
          };
        } else {
          return { 
            success: false, 
            message: response.data.message || "Backend returned error",
            backendResponse: response.data
          };
        }
      } catch (backendError) {
        console.error("❌ Backend API error:", backendError.response?.data || backendError.message);
        
        // Provide more specific error messages
        let errorMessage = "Failed to save to database";
        if (backendError.response?.status === 401) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (backendError.response?.status === 409) {
          errorMessage = "Course already exists in database";
        } else if (backendError.response?.data?.message) {
          errorMessage = backendError.response.data.message;
        } else if (backendError.response?.data?.error) {
          errorMessage = backendError.response.data.error;
        }
        
        return { 
          success: false, 
          message: errorMessage,
          error: backendError.response?.data
        };
      }
    } catch (error) {
      console.error("❌ Error in saveCourseToBackend:", error);
      return { 
        success: false, 
        message: "Unexpected error saving course"
      };
    }
  };

  useEffect(() => {
    let filtered = programs;
    
    if (searchTerm) {
      filtered = filtered.filter(prog =>
        prog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prog.description && prog.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedMajorArea !== "All") {
      filtered = filtered.filter(prog => {
        const area = majorAreas.find(area => area.major_area === selectedMajorArea);
        return area?.specific_programs?.some(sp => 
          prog.title.includes(sp.program_name)
        ) || false;
      });
    }
    
    if (selectedStudyMode !== "All") {
      filtered = filtered.filter(prog => prog.studyMode === selectedStudyMode);
    }
    
    setFilteredPrograms(filtered);
  }, [searchTerm, selectedMajorArea, selectedStudyMode, programs, majorAreas]);

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

  // Navigate to Application Overview when a course is selected
  const navigateToApplicationOverview = async () => {
    if (!university || !selectedProgram) {
      alert("Please select a program first");
      return;
    }
    
    setSavingToBackend(true);
    
    try {
      // Create course data object
      const courseData = {
        universityId: university.UNITID,
        universityName: university.INSTNM,
        universityLogo: university.logo,
        programId: selectedProgram.id,
        programName: selectedProgram.title,
        programDetails: {
          studyMode: selectedProgram.studyMode,
          level: selectedProgram.level,
          duration: selectedProgram.duration,
          fees: selectedProgram.fees,
          locations: selectedProgram.locations,
          requirements: selectedProgram.requirements,
          majorArea: selectedProgram.majorArea,
          description: selectedProgram.description
        },
        intakeMonth: "September",
        intakeYear: new Date().getFullYear() + 1,
        country: university.GUS_DATA?.country || "USA",
        campus: selectedProgram.locations?.[0] || "Main Campus",
        selectedAt: new Date().toISOString()
      };
      
      // 1. Always save to localStorage (main functionality)
      localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));
      
      // Update the GUS application data in localStorage
      const gusAppData = JSON.parse(localStorage.getItem('gusApplicationData') || '{}');
      gusAppData.selectedPrograms = gusAppData.selectedPrograms || [];
      gusAppData.selectedPrograms.push(courseData);
      localStorage.setItem('gusApplicationData', JSON.stringify(gusAppData));
      
      console.log('🎯 Course saved to localStorage:', courseData);
      
      // 2. Try to save to backend (optional - don't block navigation)
      if (backendAvailable) {
        saveCourseToBackend(courseData)
          .then(backendResult => {
            console.log('📊 Backend save completed:', backendResult.message);
            if (!backendResult.success) {
              console.log('⚠️ Backend save failed but course is saved locally');
            }
          })
          .catch(error => {
            console.error('⚠️ Backend save error:', error);
          });
      }
      
      // Determine student type from current path
      const studentType = location.pathname.includes('/transfer/') ? 'transfer' : 'firstyear';
      
      // Navigate to Overview section (don't wait for backend)
      navigate(`/${studentType}/dashboard/application/overview`, {
        state: {
          fromCoursesPage: true,
          courseData: courseData,
          backendAvailable: backendAvailable
        }
      });
      
      // Call the onCourseSelect callback if provided (for Dashboard)
      if (onCourseSelect) {
        onCourseSelect(courseData);
      }
    } catch (error) {
      console.error("❌ Error in navigateToApplicationOverview:", error);
      alert("An error occurred while saving your course selection. Please try again.");
    } finally {
      setSavingToBackend(false);
    }
  };

  // Quick Apply function for program cards
  const handleQuickApply = async (program, e) => {
    e.stopPropagation();
    setSelectedProgram(program);
    setSavingToBackend(true);
    
    try {
      const courseData = {
        universityId: university.UNITID,
        universityName: university.INSTNM,
        programId: program.id,
        programName: program.title,
        programDetails: {
          studyMode: program.studyMode,
          level: program.level,
          duration: program.duration,
          fees: program.fees,
          locations: program.locations,
          majorArea: program.majorArea,
          requirements: program.requirements,
          description: program.description
        },
        selectedAt: new Date().toISOString()
      };
      
      // 1. Save to localStorage (immediate)
      localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));
      
      // Update GUS application data
      const gusAppData = JSON.parse(localStorage.getItem('gusApplicationData') || '{}');
      gusAppData.selectedPrograms = gusAppData.selectedPrograms || [];
      gusAppData.selectedPrograms.push(courseData);
      localStorage.setItem('gusApplicationData', JSON.stringify(gusAppData));
      
      console.log('🎯 Quick Apply - Course saved to localStorage:', courseData);
      
      // 2. Try to save to backend in background (non-blocking)
      if (backendAvailable) {
        saveCourseToBackend(courseData)
          .then(backendResult => {
            console.log('📊 Quick Apply - Backend result:', backendResult.message);
          })
          .catch(error => {
            console.error('⚠️ Quick Apply - Backend error:', error);
          });
      }
      
      // Determine student type from current path
      const studentType = location.pathname.includes('/transfer/') ? 'transfer' : 'firstyear';
      
      // Navigate to Overview immediately
      navigate(`/${studentType}/dashboard/application/overview`, {
        state: {
          fromCoursesPage: true,
          courseData: courseData,
          backendAvailable: backendAvailable
        }
      });
      
      // Call the onCourseSelect callback if provided
      if (onCourseSelect) {
        onCourseSelect(courseData);
      }
    } catch (error) {
      console.error("❌ Error in handleQuickApply:", error);
      alert("An error occurred while saving your course selection. Please try again.");
    } finally {
      setSavingToBackend(false);
    }
  };

  const handleAddToMyColleges = async () => {
    if (!university || !selectedProgram) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Please sign in to add to your colleges");
        navigate('/signin');
        return;
      }
      
      const collegeData = {
        collegeId: university.UNITID,
        collegeData: {
          ...university,
          selectedProgram: {
            programId: selectedProgram.id,
            programName: selectedProgram.title,
            studyMode: selectedProgram.studyMode,
            location: selectedProgram.locations?.[0],
            level: selectedProgram.level
          }
        }
      };
      
      const response = await axios.post(
        `${API_URL}/api/colleges`,
        collegeData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        alert(`Successfully added ${selectedProgram.title} to My Colleges!`);
        navigate('/firstyear/dashboard/colleges');
      }
    } catch (error) {
      console.error("Error adding to colleges:", error);
      alert("Failed to add to your colleges. Please try again.");
    }
  };

  const handleBackToSearch = () => {
    navigate('/firstyear/dashboard/college-search');
  };

  const handleAddUniversityOnly = async () => {
    if (!university) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Please sign in to add to your colleges");
        navigate('/signin');
        return;
      }
      
      const collegeData = {
        collegeId: university.UNITID,
        collegeData: university
      };
      
      const response = await axios.post(
        `${API_URL}/api/colleges`,
        collegeData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        alert(`Successfully added ${university.INSTNM} to My Colleges!`);
        navigate('/firstyear/dashboard/colleges');
      }
    } catch (error) {
      console.error("Error adding university:", error);
      alert("Failed to add university. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="courses-loading">
        <div className="loading-spinner"></div>
        <p>Loading university details...</p>
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
        <p>The university you're looking for doesn't exist or the data is unavailable.</p>
        <button onClick={handleBackToSearch} className="back-button">
          ← Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="courses-container">
      {/* Header with University Info */}
      <div className="courses-header">
        <div className="header-top">
          <button onClick={handleBackToSearch} className="header-back-button">
            <span className="back-arrow">←</span> Back to Search
          </button>
          <div className="header-actions">
            {backendAvailable && (
              <div className="backend-status">
                <span className="backend-icon">🔗</span>
                <span className="backend-text">Database Connected</span>
              </div>
            )}
            <button 
              className="add-university-header-btn"
              onClick={handleAddUniversityOnly}
            >
              <span className="add-icon">+</span> Add University to My Colleges
            </button>
          </div>
        </div>
        
        <div className="university-header-card">
          <div className="university-header-content">
            <div className="university-logo-placeholder">
              <div className="university-logo-initials">
                {university.INSTNM.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2)}
              </div>
            </div>
            <div className="university-header-info">
              <h1 className="university-title">{university.INSTNM}</h1>
              <div className="university-meta">
                <span className="university-location">
                  <span className="location-icon">📍</span>
                  {university.CITY}, {university.STABBR}
                </span>
                <span className="university-country">
                  {university.GUS_DATA?.country || 'USA'}
                </span>
                <span className="university-type">
                  {programs.length} Programs Available
                </span>
              </div>
              <div className="university-stats">
                <div className="stat-item">
                  <span className="stat-value">{programs.length}</span>
                  <span className="stat-label">Programs</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{majorAreas.length}</span>
                  <span className="stat-label">Major Areas</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{studyModes.length - 1}</span>
                  <span className="stat-label">Study Modes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="courses-tabs">
        <button 
          className={`tab-btn ${activeTab === 'programs' ? 'active' : ''}`}
          onClick={() => setActiveTab('programs')}
        >
          <span className="tab-icon">🎓</span>
          Programs ({programs.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'university' ? 'active' : ''}`}
          onClick={() => setActiveTab('university')}
        >
          <span className="tab-icon">🏛️</span>
          University Details
        </button>
      </div>

      {/* Main Content */}
      <div className="courses-content">
        {activeTab === 'programs' ? (
          <>
            {/* Search and Filters Sidebar */}
            <div className="courses-sidebar">
              <div className="sidebar-card">
                <div className="sidebar-header">
                  <h3 className="sidebar-title">Search & Filter Programs</h3>
                  <div className="results-count">
                    {filteredPrograms.length} of {programs.length} programs
                  </div>
                </div>
                
                {/* Search Box */}
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
                
                {/* Filters */}
                <div className="filters-section">
                  <div className="filter-group">
                    <label className="filter-label">Major Area</label>
                    <select 
                      value={selectedMajorArea}
                      onChange={(e) => setSelectedMajorArea(e.target.value)}
                      className="filter-select"
                    >
                      <option value="All">All Major Areas</option>
                      {majorAreas.map((area, index) => (
                        <option key={index} value={area.major_area}>
                          {area.major_area} ({area.specific_programs?.length || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <label className="filter-label">Study Mode</label>
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

              {/* Quick Actions */}
              <div className="quick-actions-card">
                <h4 className="actions-title">Quick Actions</h4>
                <button 
                  className="quick-action-btn"
                  onClick={handleAddUniversityOnly}
                >
                  <span className="action-icon">+</span>
                  Add University to My Colleges
                </button>
                <button 
                  className="quick-action-btn secondary"
                  onClick={() => {
                    if (selectedProgram) {
                      handleAddToMyColleges();
                    } else {
                      alert("Please select a program first");
                    }
                  }}
                >
                  <span className="action-icon">🎓</span>
                  Add Selected Program
                </button>
                <button 
                  className="quick-action-btn apply"
                  onClick={navigateToApplicationOverview}
                  disabled={!selectedProgram || savingToBackend}
                >
                  {savingToBackend ? (
                    <>
                      <span className="action-icon">⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="action-icon">📝</span>
                      Start Application
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Programs Content */}
            <div className="programs-content">
              {filteredPrograms.length > 0 ? (
                <div className="programs-grid">
                  {filteredPrograms.map((program) => (
                    <div
                      key={program.id}
                      className={`program-card ${selectedProgram?.id === program.id ? 'selected' : ''}`}
                      onClick={() => handleProgramSelect(program)}
                    >
                      <div className="program-card-header">
                        <div className="program-title-section">
                          <h4 className="program-card-title">{program.title}</h4>
                          <span className="program-level-badge">{program.level}</span>
                        </div>
                        <div className="program-meta-badges">
                          <span className="study-mode-badge">{program.studyMode}</span>
                          {program.duration && (
                            <span className="duration-badge">{program.duration}</span>
                          )}
                          {program.majorArea && (
                            <span className="major-area-badge">{program.majorArea}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="program-card-body">
                        <div className="program-locations">
                          <span className="locations-icon">📍</span>
                          <span className="locations-text">
                            {program.locations?.slice(0, 2).join(", ")}
                            {program.locations && program.locations.length > 2 && "..."}
                          </span>
                        </div>
                        
                        {program.description && (
                          <p className="program-description">
                            {program.description.substring(0, 120)}...
                          </p>
                        )}
                        
                        {program.fees && (
                          <div className="program-fees">
                            <span className="fees-label">Fees:</span>
                            <span className="fees-value">{program.fees}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="program-card-footer">
                        <button 
                          className="select-program-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProgramSelect(program);
                          }}
                          disabled={savingToBackend}
                        >
                          {selectedProgram?.id === program.id ? '✓ Selected' : 'Select Program'}
                        </button>
                        <button 
                          className="quick-apply-btn"
                          onClick={(e) => handleQuickApply(program, e)}
                          disabled={savingToBackend}
                        >
                          {savingToBackend && selectedProgram?.id === program.id ? (
                            <>
                              <span className="saving-spinner"></span> Saving...
                            </>
                          ) : 'Apply Now'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : programs.length > 0 ? (
                <div className="no-programs-found">
                  <div className="no-programs-icon">🔍</div>
                  <h3>No programs found</h3>
                  <p>Try adjusting your search or filters to find what you're looking for.</p>
                  <button 
                    className="clear-filters-btn"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedMajorArea("All");
                      setSelectedStudyMode("All");
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="no-programs-available">
                  <div className="no-programs-icon">📚</div>
                  <h3>No programs available</h3>
                  <p>This university doesn't have any programs listed yet.</p>
                  <button 
                    className="add-university-btn"
                    onClick={handleAddUniversityOnly}
                  >
                    Add University Anyway
                  </button>
                </div>
              )}
            </div>

            {/* Selected Program Details Panel */}
            {selectedProgram && (
              <div className="program-details-panel">
                <div className="panel-content">
                  <div className="selected-program-header">
                    <h2 className="selected-program-title">{selectedProgram.title}</h2>
                  </div>
                  
                  <div className="selected-program-details">
                    <div className="action-buttons">
                      <button 
                        className="primary-action-btn"
                        onClick={navigateToApplicationOverview}
                        disabled={savingToBackend}
                      >
                        {savingToBackend ? (
                          <>
                            <span className="action-icon">⏳</span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <span className="action-icon">📝</span>
                            Start University Application
                          </>
                        )}
                      </button>
                      <button 
                        className="secondary-action-btn"
                        onClick={handleAddToMyColleges}
                        disabled={savingToBackend}
                      >
                        <span className="action-icon">🎓</span>
                        Add to My Colleges
                      </button>
                    </div>
                    
                    <div className="application-instructions">
                      <h4 className="section-title">How to Apply</h4>
                      <ol className="instructions-list">
                        <li>Click "Start University Application" above</li>
                        <li>Your course selection will be saved {backendAvailable ? 'to our database' : 'locally'}</li>
                        <li>You will be taken to the Application Overview page</li>
                        <li>Review your selected course details</li>
                        <li>Start or continue your application from the overview</li>
                        <li>Complete all required application steps</li>
                        <li>Submit your application</li>
                      </ol>
                      <p className="instruction-note">
                        <strong>Note:</strong> {backendAvailable ? 
                          'Your selection will also be saved to our secure database for future reference.' :
                          'Your selection is saved locally for this session.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* University Details Tab */
          <div className="university-details-content">
            <div className="university-info-card">
              <h3 className="university-info-title">University Information</h3>
              
              <div className="info-sections">
                <div className="info-section">
                  <h4 className="section-title">Contact Details</h4>
                  <div className="contact-grid">
                    <div className="contact-item">
                      <span className="contact-icon">🏛️</span>
                      <div className="contact-content">
                        <h5>Address</h5>
                        <p>{university.ADDR || 'Address not available'}</p>
                        <p>{university.CITY}, {university.STABBR} {university.ZIP || ''}</p>
                      </div>
                    </div>
                    
                    <div className="contact-item">
                      <span className="contact-icon">📞</span>
                      <div className="contact-content">
                        <h5>Phone</h5>
                        <p>{university.GENTELE || 'Phone not available'}</p>
                      </div>
                    </div>
                    
                    <div className="contact-item">
                      <span className="contact-icon">✉️</span>
                      <div className="contact-content">
                        <h5>Website</h5>
                        {university.WEBADDR ? (
                          <a 
                            href={university.WEBADDR} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="contact-link"
                          >
                            Visit Official Website
                          </a>
                        ) : (
                          <p>Website not available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="info-section">
                  <h4 className="section-title">Program Summary</h4>
                  <div className="programs-summary">
                    <div className="summary-stats">
                      <div className="summary-stat">
                        <span className="stat-number">{programs.length}</span>
                        <span className="stat-label">Total Programs</span>
                      </div>
                      <div className="summary-stat">
                        <span className="stat-number">{majorAreas.length}</span>
                        <span className="stat-label">Major Areas</span>
                      </div>
                      <div className="summary-stat">
                        <span className="stat-number">{studyModes.length - 1}</span>
                        <span className="stat-label">Study Modes</span>
                      </div>
                    </div>
                    
                    {majorAreas.length > 0 && (
                      <div className="major-areas-list">
                        <h5>Available Major Areas:</h5>
                        <div className="major-area-tags">
                          {majorAreas.map((area, index) => (
                            <span key={index} className="major-area-tag">
                              {area.major_area} ({area.specific_programs?.length || 0})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="university-actions">
                <button 
                  className="primary-action-btn"
                  onClick={handleAddUniversityOnly}
                >
                  Add University to My Colleges
                </button>
                <button 
                  className="secondary-action-btn"
                  onClick={() => setActiveTab('programs')}
                >
                  Browse Programs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;