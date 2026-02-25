// src/components/UserProfile.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserProfile.css";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const UserProfile = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Get user email and token from localStorage
  const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('studentType') || 'firstyear';

  // Profile image state
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Error state
  const [error, setError] = useState('');

  // Step 1: Basic Student Information
  const [basicInfo, setBasicInfo] = useState({
    fullName: "",
    email: userEmail,
    mobile: "",
    dob: "",
    gender: "",
    nationality: "",
    residence: "",
  });

  // Step 2: Education Background
  const [education, setEducation] = useState({
    qualification: "",
    institution: "",
    field: "",
    year: "",
    cgpa: "",
  });

  // Step 3: Program Eligibility
  const [eligibleProgram, setEligibleProgram] = useState("");
  
  // Step 3: Selected Universities with Courses
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  
  // All universities from MongoDB
  const [universities, setUniversities] = useState([]);
  const [filteredUniversities, setFilteredUniversities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Course selection states
  const [universityCourses, setUniversityCourses] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Modal states for course selection
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [currentUniversity, setCurrentUniversity] = useState(null);
  const [currentUniversityCourses, setCurrentUniversityCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [tempSelectedCourses, setTempSelectedCourses] = useState([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState({
    level: "",
    studyMode: "",
    majorArea: ""
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Success animation state
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file");
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        // Show success animation
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch existing profile on component mount
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!token) {
        console.log('No token found, skipping profile fetch');
        setFetchingProfile(false);
        return;
      }

      try {
        setFetchingProfile(true);
        
        console.log('📡 Fetching profile from:', `${API_URL}/api/user/profile`);
        
        const response = await axios.get(`${API_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('📥 Profile response:', response.data);

        if (response.data.success && response.data.data) {
          const profile = response.data.data;
          
          // Populate form with existing data
          setBasicInfo(profile.basicInfo || {
            fullName: "",
            email: userEmail,
            mobile: "",
            dob: "",
            gender: "",
            nationality: "",
            residence: "",
          });

          setEducation(profile.education || {
            qualification: "",
            institution: "",
            field: "",
            year: "",
            cgpa: "",
          });

          setEligibleProgram(profile.eligibleProgram || "");
          
          // Load selected universities with their courses
          if (profile.selectedUniversities && profile.selectedUniversities.length > 0) {
            console.log("✅ Loading selected universities with courses:", profile.selectedUniversities);
            setSelectedUniversities(profile.selectedUniversities);
          } else {
            setSelectedUniversities([]);
          }
          
          if (profile.profileImage) {
            setImagePreview(profile.profileImage);
          }

          console.log("✅ Existing profile loaded");
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log("ℹ️ No existing profile found - user will create new profile");
          setError('');
        } else {
          console.error("❌ Error in checkExistingProfile:", error);
          
          if (error.response?.status === 401) {
            setError('Authentication failed. Please log in again.');
          } else {
            setError(`Server error: ${error.response?.status}`);
          }
        }
      } finally {
        setFetchingProfile(false);
      }
    };

    checkExistingProfile();
  }, [token, userEmail]);

  // Check if user has already completed profile
  useEffect(() => {
    const profileCompleted = localStorage.getItem('profileCompleted') === 'true';
    
    if (profileCompleted && !fetchingProfile && selectedUniversities.length > 0) {
      console.log("Profile already completed - redirecting to dashboard");
      navigateToDashboard();
    }
  }, [fetchingProfile, selectedUniversities]);

  // Fetch all universities from MongoDB on component mount
  useEffect(() => {
    fetchUniversitiesFromMongoDB();
  }, []);

  // Filter universities when eligible program or search term changes
  useEffect(() => {
    if (universities.length > 0) {
      filterUniversities();
    }
  }, [eligibleProgram, searchTerm, universities]);

  // Filter courses when search term or filters change
  useEffect(() => {
    if (currentUniversityCourses.length > 0) {
      filterCourses();
    }
  }, [courseSearchTerm, courseFilter, currentUniversityCourses]);

  // Fetch universities from MongoDB
  const fetchUniversitiesFromMongoDB = async () => {
    if (!token) {
      console.log("No token available for fetching universities");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log("Fetching universities from MongoDB...");
      
      const response = await axios.get(`${API_URL}/api/admin/universities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log(`✅ Loaded ${response.data.data.length} universities from MongoDB`);
        setUniversities(response.data.data || []);
        
        // Pre-fetch courses for all universities
        for (const uni of response.data.data) {
          await fetchUniversityCourses(uni);
        }
      } else {
        setError(response.data.message || "Failed to load universities");
      }
    } catch (error) {
      console.error("Error fetching universities:", error);
      
      if (error.response?.status === 401) {
        setError("Your session has expired. Please login again.");
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.code === 'ERR_NETWORK') {
        setError("Cannot connect to server. Please make sure the server is running.");
      } else {
        setError(error.response?.data?.message || "Failed to load universities. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses for a specific university
  const fetchUniversityCourses = async (university) => {
    try {
      const uniId = university.UNITID || university._id;
      
      // Skip Kansas universities (they don't have courses)
      if (university.INSTNM?.toLowerCase().includes('kansas')) {
        return;
      }
      
      console.log(`🔍 Fetching courses for ${university.INSTNM}`);
      
      let courses = [];
      
      // Try multiple possible locations for course data
      
      // 1. Check if programs are already in the university object
      if (university.programs && Array.isArray(university.programs)) {
        console.log(`📚 Found ${university.programs.length} programs in university.programs`);
        courses = university.programs.map(prog => ({
          id: prog.id || prog.programId || `prog-${Date.now()}-${Math.random()}`,
          title: prog.title || prog.program_name || 'Program',
          program_name: prog.program_name || prog.title,
          level: prog.level || 'Undergraduate',
          studyMode: prog.studyMode || 'On Campus',
          locations: prog.locations || [`${university.CITY || ''}, ${university.STABBR || ''}`],
          duration: prog.duration || '3-4 years',
          description: prog.description || `${prog.title} program at ${university.INSTNM}`,
          majorArea: prog.majorArea || 'General'
        }));
      }
      
      // 2. Check GUS_DATA.programs_data
      else if (university.GUS_DATA?.programs_data) {
        console.log(`📚 Found ${university.GUS_DATA.programs_data.length} programs in GUS_DATA.programs_data`);
        courses = university.GUS_DATA.programs_data.map(prog => ({
          id: prog.id || `prog-${Date.now()}-${Math.random()}`,
          title: prog.title || prog.program_name || 'Program',
          program_name: prog.program_name || prog.title,
          level: prog.level || university.GUS_DATA?.level || 'Undergraduate',
          studyMode: prog.studyMode || 'On Campus',
          locations: prog.locations || [`${university.CITY || ''}, ${university.STABBR || ''}`],
          duration: prog.duration || '3-4 years',
          description: prog.description || `${prog.title} program at ${university.INSTNM}`,
          majorArea: prog.majorArea || 'General'
        }));
      }
      
      // 3. Check GUS_DATA.major_areas
      else if (university.GUS_DATA?.major_areas) {
        console.log(`📚 Found major areas in GUS_DATA.major_areas`);
        university.GUS_DATA.major_areas.forEach(area => {
          if (area.specific_programs) {
            area.specific_programs.forEach(prog => {
              courses.push({
                id: `area-${area.major_area}-${prog.program_name.replace(/\s+/g, '-')}`,
                title: prog.program_name,
                program_name: prog.program_name,
                level: university.GUS_DATA?.level || 'Undergraduate',
                studyMode: 'On Campus',
                locations: [`${university.CITY || ''}, ${university.STABBR || ''}`],
                majorArea: area.major_area,
                duration: '3-4 years',
                description: `${prog.program_name} program in ${area.major_area} at ${university.INSTNM}`
              });
            });
          }
        });
      }
      
      // 4. Check metadata.programs
      else if (university.metadata?.programs) {
        console.log(`📚 Found ${university.metadata.programs.length} programs in metadata.programs`);
        courses = university.metadata.programs.map(prog => ({
          id: prog.id || `prog-${Date.now()}-${Math.random()}`,
          title: prog.title || prog.program_name || 'Program',
          program_name: prog.program_name || prog.title,
          level: prog.level || 'Undergraduate',
          studyMode: prog.studyMode || 'On Campus',
          locations: prog.locations || [`${university.CITY || ''}, ${university.STABBR || ''}`],
          duration: prog.duration || '3-4 years',
          description: prog.description || `${prog.title} program at ${university.INSTNM}`,
          majorArea: prog.majorArea || 'General'
        }));
      }
      
      console.log(`✅ Found ${courses.length} courses for ${university.INSTNM}`);
      
      setUniversityCourses(prev => ({
        ...prev,
        [uniId]: courses
      }));
      
    } catch (error) {
      console.error(`Error fetching courses for ${university.INSTNM}:`, error);
    }
  };

  // Filter courses based on search and filters
  const filterCourses = () => {
    let filtered = [...currentUniversityCourses];
    
    // Apply search filter
    if (courseSearchTerm.trim()) {
      const term = courseSearchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        (course.title || course.program_name || '').toLowerCase().includes(term) ||
        (course.majorArea || '').toLowerCase().includes(term) ||
        (course.level || '').toLowerCase().includes(term) ||
        (course.description || '').toLowerCase().includes(term)
      );
    }
    
    // Apply level filter
    if (courseFilter.level) {
      filtered = filtered.filter(course => 
        (course.level || '').toLowerCase() === courseFilter.level.toLowerCase()
      );
    }
    
    // Apply study mode filter
    if (courseFilter.studyMode) {
      filtered = filtered.filter(course => 
        (course.studyMode || '').toLowerCase().includes(courseFilter.studyMode.toLowerCase())
      );
    }
    
    // Apply major area filter
    if (courseFilter.majorArea) {
      filtered = filtered.filter(course => 
        (course.majorArea || '').toLowerCase().includes(courseFilter.majorArea.toLowerCase())
      );
    }
    
    setFilteredCourses(filtered);
  };

  // Detect eligible program based on qualification
  const detectProgram = (qualification) => {
    if (qualification === "12th" || qualification === "High School") return "Bachelor";
    if (qualification === "Bachelor" || qualification === "Bachelor's Degree") return "Master";
    if (qualification === "Master" || qualification === "Master's Degree") return "PhD";
    return "";
  };

  // Handle education change
  const handleEducationChange = (e) => {
    const value = e.target.value;
    setEducation({ ...education, qualification: value });
    const program = detectProgram(value);
    setEligibleProgram(program);
    
    // Show success animation
    if (program) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }
  };

  // Filter universities based on eligible program and search
  const filterUniversities = () => {
    let filtered = [...universities];
    
    // Filter by eligible program
    if (eligibleProgram) {
      if (eligibleProgram === "Bachelor") {
        filtered = filtered;
      } else if (eligibleProgram === "Master") {
        filtered = filtered.filter(u => 
          u.metadata?.programs?.length > 0 || 
          u.metadata?.majorAreas?.length > 0 ||
          u.GUS_DATA?.programs_data?.length > 0 ||
          u.GUS_DATA?.major_areas?.length > 0
        );
      } else if (eligibleProgram === "PhD") {
        filtered = filtered.filter(u => 
          u.INSTNM?.toLowerCase().includes('university') && 
          (u.metadata?.iclevel === 1 || u.metadata?.programs?.length > 10)
        );
      }
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => {
        const instnm = (u.INSTNM || '').toLowerCase();
        const city = (u.location?.city || u.CITY || '').toLowerCase();
        const state = (u.location?.state || u.STABBR || '').toLowerCase();
        const alias = (u.IALIAS || '').toLowerCase();
        
        return instnm.includes(term) || 
               city.includes(term) || 
               state.includes(term) || 
               alias.includes(term);
      });
    }
    
    setFilteredUniversities(filtered);
  };

  // Open course selection modal
  const openCourseModal = (university) => {
    const uniId = university.UNITID || university._id;
    const isKansas = university.INSTNM?.toLowerCase().includes('kansas');
    
    if (isKansas) {
      // Show animated alert
      setError("Kansas universities don't have course selection. They will be added directly.");
      setTimeout(() => setError(''), 3000);
      toggleUniversity(university);
      return;
    }
    
    setCurrentUniversity(university);
    
    // Get courses for this university
    const courses = universityCourses[uniId] || [];
    setCurrentUniversityCourses(courses);
    setFilteredCourses(courses); // Initialize filtered courses
    
    // Reset filters and search
    setCourseSearchTerm("");
    setCourseFilter({ level: "", studyMode: "", majorArea: "" });
    
    // Get already selected courses for this university from selectedUniversities
    const existingUni = selectedUniversities.find(u => 
      u.UNITID === university.UNITID || u._id === university._id
    );
    const existingSelected = existingUni?.selectedCourses || [];
    setTempSelectedCourses([...existingSelected]);
    
    setShowCourseModal(true);
    
    // Animation for modal opening
    document.body.style.overflow = 'hidden';
  };

  // Toggle course selection in modal
  const toggleTempCourse = (course) => {
    setTempSelectedCourses(prev => {
      const isSelected = prev.some(c => c.id === course.id);
      
      if (isSelected) {
        // Remove course
        return prev.filter(c => c.id !== course.id);
      } else if (prev.length < 2) {
        // Add course (max 2)
        return [...prev, course];
      } else {
        // Show animated alert
        setError('You can select maximum 2 courses per university');
        setTimeout(() => setError(''), 2000);
        return prev;
      }
    });
  };

  // Save course selection from modal
  const saveCourseSelection = () => {
    if (!currentUniversity) return;
    
    const uniId = currentUniversity.UNITID || currentUniversity._id;
    
    // Check if university is already selected
    const isUniSelected = selectedUniversities.some(u => {
      if (u.UNITID && currentUniversity.UNITID && u.UNITID === currentUniversity.UNITID) return true;
      if (u._id && currentUniversity._id && u._id.toString() === currentUniversity._id.toString()) return true;
      return false;
    });
    
    // Format the university data with selected courses
    const universityWithCourses = {
      UNITID: currentUniversity.UNITID,
      _id: currentUniversity._id,
      INSTNM: currentUniversity.INSTNM,
      CITY: currentUniversity.CITY,
      STABBR: currentUniversity.STABBR,
      COUNTRY: currentUniversity.COUNTRY || 'USA',
      location: currentUniversity.location || {},
      selectedCourses: tempSelectedCourses.map(course => ({
        id: course.id,
        title: course.title,
        program_name: course.program_name,
        level: course.level,
        studyMode: course.studyMode,
        duration: course.duration,
        locations: course.locations,
        majorArea: course.majorArea,
        description: course.description
      }))
    };
    
    if (isUniSelected) {
      // Update existing university's courses
      const updatedUniversities = selectedUniversities.map(u => {
        if (u.UNITID === currentUniversity.UNITID || u._id === currentUniversity._id) {
          return universityWithCourses;
        }
        return u;
      });
      setSelectedUniversities(updatedUniversities);
      console.log("✅ Updated university courses:", universityWithCourses);
    } else if (selectedUniversities.length < 5) {
      // Add new university with selected courses
      setSelectedUniversities([...selectedUniversities, universityWithCourses]);
      console.log("✅ Added university with courses:", universityWithCourses);
    }
    
    setShowCourseModal(false);
    setCurrentUniversity(null);
    setTempSelectedCourses([]);
    
    // Restore scrolling
    document.body.style.overflow = 'auto';
    
    // Show success animation
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  // Close course modal
  const closeCourseModal = () => {
    setShowCourseModal(false);
    setCurrentUniversity(null);
    setTempSelectedCourses([]);
    setCourseSearchTerm("");
    setCourseFilter({ level: "", studyMode: "", majorArea: "" });
    
    // Restore scrolling
    document.body.style.overflow = 'auto';
  };

  // Toggle university selection
  const toggleUniversity = (university) => {
    if (!university) return;
    
    const isKansas = university.INSTNM?.toLowerCase().includes('kansas');
    
    const isSelected = selectedUniversities.some(u => {
      if (u.UNITID && university.UNITID && u.UNITID === university.UNITID) return true;
      if (u._id && university._id && u._id.toString() === university._id.toString()) return true;
      return false;
    });
    
    if (isSelected) {
      // Remove university
      setSelectedUniversities(selectedUniversities.filter(u => {
        if (u.UNITID && university.UNITID && u.UNITID === university.UNITID) return false;
        if (u._id && university._id && u._id.toString() === university._id.toString()) return false;
        return true;
      }));
      console.log("❌ Removed university:", university.INSTNM);
      
    } else if (selectedUniversities.length < 5) {
      if (isKansas) {
        // Kansas universities can be added directly
        const kansasUniversity = {
          UNITID: university.UNITID,
          _id: university._id,
          INSTNM: university.INSTNM,
          CITY: university.CITY,
          STABBR: university.STABBR,
          COUNTRY: university.COUNTRY || 'USA',
          location: university.location || {},
          selectedCourses: [],
          isKansas: true
        };
        setSelectedUniversities([...selectedUniversities, kansasUniversity]);
        console.log("✅ Added Kansas university:", kansasUniversity);
        
        // Show success animation
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      } else {
        // Non-Kansas universities open course modal
        openCourseModal(university);
      }
    } else {
      // Show error if max selected
      setError("You can select maximum 5 universities");
      setTimeout(() => setError(''), 2000);
    }
  };

  // Remove university from selection
  const removeUniversity = (university) => {
    setSelectedUniversities(selectedUniversities.filter(u => {
      if (u.UNITID && university.UNITID && u.UNITID === university.UNITID) return false;
      if (u._id && university._id && u._id.toString() === university._id.toString()) return false;
      return true;
    }));
    
    // Show removal animation
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1000);
  };

  // Validate step 1 fields
  const validateStep1 = () => {
    const errors = {};
    if (!basicInfo.fullName) errors.fullName = "Full name is required";
    if (!basicInfo.mobile) errors.mobile = "Mobile number is required";
    if (!basicInfo.dob) errors.dob = "Date of birth is required";
    if (!basicInfo.gender) errors.gender = "Gender is required";
    if (!basicInfo.nationality) errors.nationality = "Nationality is required";
    if (!basicInfo.residence) errors.residence = "Country of residence is required";
    
    // Mobile number validation
    if (basicInfo.mobile && !/^[0-9+\-\s()]{10,15}$/.test(basicInfo.mobile)) {
      errors.mobile = "Please enter a valid mobile number";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate step 2 fields
  const validateStep2 = () => {
    const errors = {};
    if (!education.qualification) errors.qualification = "Qualification is required";
    if (!education.institution) errors.institution = "Institution is required";
    if (!education.field) errors.field = "Field of study is required";
    if (!education.year) errors.year = "Year of passing is required";
    if (!education.cgpa) errors.cgpa = "CGPA/Percentage is required";
    
    // Year validation
    if (education.year && !/^\d{4}$/.test(education.year)) {
      errors.year = "Please enter a valid year (YYYY)";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate step 3 (universities and courses)
  const validateStep3 = () => {
    if (selectedUniversities.length < 3) {
      setError('Please select at least 3 universities');
      setTimeout(() => setError(''), 3000);
      return false;
    }
    
    // Check if all non-Kansas universities have at least one course selected
    for (const uni of selectedUniversities) {
      const isKansas = uni.INSTNM?.toLowerCase().includes('kansas') || uni.isKansas;
      
      if (!isKansas) {
        const courses = uni.selectedCourses || [];
        if (courses.length === 0) {
          setError(`Please select at least one course for ${uni.INSTNM}`);
          setTimeout(() => setError(''), 3000);
          return false;
        }
      }
    }
    
    return true;
  };

  // Check if step 1 is valid
  const isStep1Valid = () => {
    return basicInfo.fullName && basicInfo.mobile && basicInfo.dob && 
           basicInfo.gender && basicInfo.nationality && basicInfo.residence;
  };

  // Check if step 2 is valid
  const isStep2Valid = () => {
    return education.qualification && education.institution && 
           education.field && education.year && education.cgpa;
  };

  // Check if step 3 is valid
  const isStep3Valid = () => {
    if (selectedUniversities.length < 3) return false;
    
    // Check course selection for non-Kansas universities
    for (const uni of selectedUniversities) {
      const isKansas = uni.INSTNM?.toLowerCase().includes('kansas') || uni.isKansas;
      
      if (!isKansas) {
        const courses = uni.selectedCourses || [];
        if (courses.length === 0) return false;
      }
    }
    
    return true;
  };

  // Navigate to dashboard based on user type
  const navigateToDashboard = () => {
    if (userType === 'transfer') {
      navigate('/transfer/dashboard');
    } else {
      navigate('/firstyear/dashboard');
    }
  };

  // Handle profile image upload to server
  const uploadProfileImage = async () => {
    if (!profileImage || !token) return null;

    try {
      const response = await axios.patch(`${API_URL}/api/user/profile/image`, 
        { profileImage: imagePreview },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log("✅ Profile image updated");
        return response.data.data;
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
    }
    return null;
  };

  // Handle final submit to backend
  const handleSubmitProfile = async () => {
    if (!token) {
      setError("You must be logged in to submit your profile");
      return;
    }

    if (!validateStep3()) {
      return;
    }

    setSaving(true);
    setError('');

    let formattedUniversities = [];

    try {
      if (profileImage) {
        await uploadProfileImage();
      }

      // Format universities with selected courses
      formattedUniversities = selectedUniversities.map(u => {
        const isKansas = u.INSTNM?.toLowerCase().includes('kansas') || u.isKansas;
        const city = u.CITY || u.location?.city || '';
        const state = u.STABBR || u.location?.state || '';
        const locationStr = city + (city && state ? ', ' : '') + state;
        
        const courses = u.selectedCourses || [];
        
        console.log(`Formatting university ${u.INSTNM} with ${courses.length} courses:`, courses);
        
        return {
          id: u.UNITID?.toString() || u._id?.toString(),
          unitid: u.UNITID,
          name: u.INSTNM || 'Unknown University',
          location: locationStr || 'Location not specified',
          city: city,
          state: state,
          country: u.COUNTRY || u.location?.country || 'USA',
          isKansas: isKansas,
          selectedCourses: courses.map(c => ({
            id: c.id,
            title: c.title,
            program_name: c.program_name,
            level: c.level,
            studyMode: c.studyMode,
            duration: c.duration,
            locations: c.locations,
            majorArea: c.majorArea,
            description: c.description
          })),
          fullData: u
        };
      });

      const profileData = {
        profileImage: imagePreview,
        basicInfo,
        education,
        eligibleProgram,
        selectedUniversities: formattedUniversities,
        profileCompleted: true,
        completedAt: new Date().toISOString()
      };

      console.log("📤 Submitting profile data with courses:", JSON.stringify(profileData.selectedUniversities.map(u => ({
        name: u.name,
        courseCount: u.selectedCourses.length,
        courses: u.selectedCourses
      })), null, 2));

      const response = await axios.post(`${API_URL}/api/user/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        localStorage.setItem('profileCompleted', 'true');
        
        console.log("✅ Profile saved to backend successfully with courses");
        
        // Show success animation
        setShowSuccess(true);
        
        // Redirect after animation
        setTimeout(() => {
          alert("Profile submitted successfully! Redirecting to dashboard...");
          navigateToDashboard();
        }, 1500);
      } else {
        setError(response.data.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      
      let errorMessage = "Failed to save profile. Please try again.";
      
      if (error.response) {
        console.error("Server response:", error.response.data);
        
        if (error.response.status === 401) {
          errorMessage = "Your session has expired. Please login again.";
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || "Invalid profile data";
          if (error.response.data.errors) {
            errorMessage = error.response.data.errors.join(', ');
          }
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Cannot connect to server. Saving locally only.";
      }
      
      setError(errorMessage);
      
      // Fallback to localStorage
      const profileData = {
        profileImage: imagePreview,
        basicInfo,
        education,
        eligibleProgram,
        selectedUniversities: formattedUniversities,
        completedAt: new Date().toISOString(),
        profileCompleted: true
      };
      
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      localStorage.setItem('profileCompleted', 'true');
      
      console.log("⚠️ Saved profile to localStorage as fallback with courses:", 
        formattedUniversities.map(u => ({ name: u.name, courseCount: u.selectedCourses.length }))
      );
      
      // Show success animation anyway
      setShowSuccess(true);
      
      setTimeout(() => {
        alert("Profile saved locally! Redirecting to dashboard...");
        navigateToDashboard();
      }, 1500);
    } finally {
      setSaving(false);
    }
  };

  // Handle save progress
  const handleSaveProgress = (nextStep) => {
    if (step === 1 && !validateStep1()) {
      return;
    }
    if (step === 2 && !validateStep2()) {
      return;
    }
    if (step === 3 && nextStep === 4 && !validateStep3()) {
      return;
    }
    
    setStep(nextStep);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle cancel
  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Your progress will be lost.")) {
      navigateToDashboard();
    }
  };

  // Get university initials for logo
  const getInitials = (name) => {
    if (!name) return "UNI";
    return name.split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Get program count from university
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
    return 0;
  };

  // Get user initials for default avatar
  const getUserInitials = () => {
    if (basicInfo.fullName) {
      return basicInfo.fullName.split(' ')
        .map(name => name[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return userEmail ? userEmail.charAt(0).toUpperCase() : 'U';
  };

  // Handle retry when loading fails
  const handleRetry = () => {
    fetchUniversitiesFromMongoDB();
  };

  // Get color based on program level
  const getLevelColor = (level) => {
    const levelStr = level?.toLowerCase() || '';
    if (levelStr.includes('bachelor') || levelStr.includes('undergraduate')) return '#4CAF50';
    if (levelStr.includes('master') || levelStr.includes('graduate')) return '#FF9800';
    if (levelStr.includes('phd') || levelStr.includes('doctorate')) return '#F44336';
    if (levelStr.includes('diploma')) return '#9C27B0';
    if (levelStr.includes('certificate')) return '#00BCD4';
    return '#757575';
  };

  // Get color based on study mode
  const getStudyModeColor = (mode) => {
    const modeStr = mode?.toLowerCase() || '';
    if (modeStr.includes('online')) return '#2196F3';
    if (modeStr.includes('campus') || modeStr.includes('on campus')) return '#FFC107';
    if (modeStr.includes('hybrid') || modeStr.includes('blended')) return '#9C27B0';
    if (modeStr.includes('distance')) return '#00BCD4';
    return '#757575';
  };

  // Get unique filter options from courses
  const getUniqueLevels = () => {
    const levels = new Set();
    currentUniversityCourses.forEach(course => {
      if (course.level) levels.add(course.level);
    });
    return Array.from(levels);
  };

  const getUniqueStudyModes = () => {
    const modes = new Set();
    currentUniversityCourses.forEach(course => {
      if (course.studyMode) modes.add(course.studyMode);
    });
    return Array.from(modes);
  };

  const getUniqueMajorAreas = () => {
    const areas = new Set();
    currentUniversityCourses.forEach(course => {
      if (course.majorArea) areas.add(course.majorArea);
    });
    return Array.from(areas);
  };

  // Show loading state
  if (fetchingProfile) {
    return (
      <div className="profile-wrapper">
        <div className="loading-screen">
          <div className="loading-spinner-large"></div>
          <p>Loading your profile...</p>
          <div className="confetti-piece" style={{ left: '10%', animationDelay: '0s' }}></div>
          <div className="confetti-piece" style={{ left: '30%', animationDelay: '0.3s' }}></div>
          <div className="confetti-piece" style={{ left: '50%', animationDelay: '0.6s' }}></div>
          <div className="confetti-piece" style={{ left: '70%', animationDelay: '0.9s' }}></div>
          <div className="confetti-piece" style={{ left: '90%', animationDelay: '1.2s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="success-animation-overlay">
          <div className="success-animation">
            <div className="checkmark-circle">
              <div className="checkmark"></div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="userprofile-profile-header">
        <div className="header-container">
          <div className="profile-image-wrapper">
            <div className="profile-image-container">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="profile-image" />
              ) : (
                <div className="profile-image-placeholder">
                  <span className="placeholder-initials">{getUserInitials()}</span>
                </div>
              )}
              <label htmlFor="profile-upload" className="image-upload-label">
                <input
                  type="file"
                  id="profile-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-upload-input"
                />
                <span className="upload-icon">+</span>
              </label>
            </div>
          </div>
          
          <div className="header-title-section">
            <h1 className="header-title">Complete Your Profile</h1>
            <p className="header-email">{basicInfo.email}</p>
          </div>

          <button className="header-cancel-btn ripple-effect" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>

      <div className="userprofile-profile-content">
        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            {error.includes("Cannot connect") && (
              <button className="retry-btn ripple-effect" onClick={handleRetry}>
                Retry
              </button>
            )}
          </div>
        )}

        {/* Progress Steps */}
        <div className="userprofile-progress-container">
          <div className="progress-steps-horizontal">
            <div className={`step-horizontal ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="step-number-horizontal">1</span>
              <span className="step-label-horizontal">Basic Info</span>
            </div>
            <div className={`step-horizontal ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="step-number-horizontal">2</span>
              <span className="step-label-horizontal">Education</span>
            </div>
            <div className={`step-horizontal ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <span className="step-number-horizontal">3</span>
              <span className="step-label-horizontal">Universities & Courses</span>
            </div>
            <div className={`step-horizontal ${step === 4 ? 'active' : ''}`}>
              <span className="step-number-horizontal">4</span>
              <span className="step-label-horizontal">Review</span>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Personal Information</h2>
              <p>Tell us about yourself</p>
            </div>

            <div className="form-fields">
              {/* Full Name */}
              <div className="form-row">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={basicInfo.fullName}
                  onChange={(e) => {
                    setBasicInfo({ ...basicInfo, fullName: e.target.value });
                    if (validationErrors.fullName) {
                      setValidationErrors({ ...validationErrors, fullName: null });
                    }
                  }}
                  className={validationErrors.fullName ? 'error' : ''}
                />
                {validationErrors.fullName && (
                  <span className="field-error">{validationErrors.fullName}</span>
                )}
              </div>

              {/* Email ID */}
              <div className="form-row">
                <label>Email ID</label>
                <div className="email-field">
                  <input
                    type="email"
                    value={basicInfo.email}
                    disabled
                    className="disabled-input"
                  />
                  <span className="email-note">Auto-filled from your account</span>
                </div>
              </div>

              {/* Mobile Number */}
              <div className="form-row">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+1 9876543210"
                  value={basicInfo.mobile}
                  onChange={(e) => {
                    setBasicInfo({ ...basicInfo, mobile: e.target.value });
                    if (validationErrors.mobile) {
                      setValidationErrors({ ...validationErrors, mobile: null });
                    }
                  }}
                  className={validationErrors.mobile ? 'error' : ''}
                />
                {validationErrors.mobile && (
                  <span className="field-error">{validationErrors.mobile}</span>
                )}
              </div>

              {/* Date of Birth */}
              <div className="form-row">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={basicInfo.dob}
                  onChange={(e) => {
                    setBasicInfo({ ...basicInfo, dob: e.target.value });
                    if (validationErrors.dob) {
                      setValidationErrors({ ...validationErrors, dob: null });
                    }
                  }}
                  className={validationErrors.dob ? 'error' : ''}
                />
                {validationErrors.dob && (
                  <span className="field-error">{validationErrors.dob}</span>
                )}
              </div>

              {/* Gender */}
              <div className="form-row">
                <label>Gender</label>
                <select
                  value={basicInfo.gender}
                  onChange={(e) => {
                    setBasicInfo({ ...basicInfo, gender: e.target.value });
                    if (validationErrors.gender) {
                      setValidationErrors({ ...validationErrors, gender: null });
                    }
                  }}
                  className={validationErrors.gender ? 'error' : ''}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {validationErrors.gender && (
                  <span className="field-error">{validationErrors.gender}</span>
                )}
              </div>

              {/* Nationality */}
              <div className="form-row">
                <label>Nationality</label>
                <input
                  type="text"
                  placeholder="e.g., Indian, American"
                  value={basicInfo.nationality}
                  onChange={(e) => {
                    setBasicInfo({ ...basicInfo, nationality: e.target.value });
                    if (validationErrors.nationality) {
                      setValidationErrors({ ...validationErrors, nationality: null });
                    }
                  }}
                  className={validationErrors.nationality ? 'error' : ''}
                />
                {validationErrors.nationality && (
                  <span className="field-error">{validationErrors.nationality}</span>
                )}
              </div>

              {/* Country of Residence */}
              <div className="form-row">
                <label>Country of Residence</label>
                <input
                  type="text"
                  placeholder="e.g., India, USA, UK"
                  value={basicInfo.residence}
                  onChange={(e) => {
                    setBasicInfo({ ...basicInfo, residence: e.target.value });
                    if (validationErrors.residence) {
                      setValidationErrors({ ...validationErrors, residence: null });
                    }
                  }}
                  className={validationErrors.residence ? 'error' : ''}
                />
                {validationErrors.residence && (
                  <span className="field-error">{validationErrors.residence}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="continue-btn ripple-effect"
                onClick={() => handleSaveProgress(2)}
                disabled={!isStep1Valid()}
              >
                Continue to Education →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Education Background */}
        {step === 2 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Education Background</h2>
              <p>Tell us about your academic journey</p>
            </div>

            <div className="form-fields">
              {/* Highest Qualification */}
              <div className="form-row">
                <label>Highest Qualification Completed</label>
                <select
                  value={education.qualification}
                  onChange={handleEducationChange}
                  className={validationErrors.qualification ? 'error' : ''}
                >
                  <option value="">Select Qualification</option>
                  <option value="12th">12th / High School</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="Master">Master's Degree</option>
                </select>
                {validationErrors.qualification && (
                  <span className="field-error">{validationErrors.qualification}</span>
                )}
              </div>

              {/* Institution Name */}
              <div className="form-row">
                <label>University / School Name</label>
                <input
                  type="text"
                  placeholder="Enter institution name"
                  value={education.institution}
                  onChange={(e) => {
                    setEducation({ ...education, institution: e.target.value });
                    if (validationErrors.institution) {
                      setValidationErrors({ ...validationErrors, institution: null });
                    }
                  }}
                  className={validationErrors.institution ? 'error' : ''}
                />
                {validationErrors.institution && (
                  <span className="field-error">{validationErrors.institution}</span>
                )}
              </div>

              {/* Field of Study */}
              <div className="form-row">
                <label>Field of Study</label>
                <input
                  type="text"
                  placeholder="e.g., Computer Science, Business"
                  value={education.field}
                  onChange={(e) => {
                    setEducation({ ...education, field: e.target.value });
                    if (validationErrors.field) {
                      setValidationErrors({ ...validationErrors, field: null });
                    }
                  }}
                  className={validationErrors.field ? 'error' : ''}
                />
                {validationErrors.field && (
                  <span className="field-error">{validationErrors.field}</span>
                )}
              </div>

              {/* Year of Passing */}
              <div className="form-row">
                <label>Year of Passing</label>
                <input
                  type="text"
                  placeholder="e.g., 2023"
                  value={education.year}
                  onChange={(e) => {
                    setEducation({ ...education, year: e.target.value });
                    if (validationErrors.year) {
                      setValidationErrors({ ...validationErrors, year: null });
                    }
                  }}
                  className={validationErrors.year ? 'error' : ''}
                />
                {validationErrors.year && (
                  <span className="field-error">{validationErrors.year}</span>
                )}
              </div>

              {/* Percentage / CGPA */}
              <div className="form-row">
                <label>Percentage / CGPA</label>
                <input
                  type="text"
                  placeholder="e.g., 85% or 8.5"
                  value={education.cgpa}
                  onChange={(e) => {
                    setEducation({ ...education, cgpa: e.target.value });
                    if (validationErrors.cgpa) {
                      setValidationErrors({ ...validationErrors, cgpa: null });
                    }
                  }}
                  className={validationErrors.cgpa ? 'error' : ''}
                />
                {validationErrors.cgpa && (
                  <span className="field-error">{validationErrors.cgpa}</span>
                )}
              </div>
            </div>

            {eligibleProgram && (
              <div className="eligibility-badge">
                <span className="badge-icon">🎓</span>
                <span>You are eligible for: <strong>{eligibleProgram} Programs</strong></span>
              </div>
            )}

            <div className="form-actions">
              <button className="back-btn ripple-effect" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button 
                className="continue-btn ripple-effect"
                onClick={() => handleSaveProgress(3)}
                disabled={!isStep2Valid()}
              >
                Continue to Universities & Courses →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Universities and Courses */}
        {step === 3 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Select Universities & Courses</h2>
              <p>Choose at least 3 universities and select up to 2 courses for each</p>
            </div>

            {eligibleProgram && (
              <div className="program-indicator">
                <span>Showing universities for: <strong>{eligibleProgram} Program</strong></span>
              </div>
            )}

            <div className="university-controls">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search universities by name, city, country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="selection-counter">
                <span className="counter-number">{selectedUniversities.length}</span>
                <span>/5 selected</span>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading universities from database...</p>
                <button className="retry-small-btn ripple-effect" onClick={handleRetry}>
                  Retry
                </button>
              </div>
            ) : (
              <div className="universities-grid">
                {filteredUniversities.length > 0 ? (
                  filteredUniversities.map((uni) => {
                    const uniId = uni.UNITID || uni._id;
                    const isKansas = uni.INSTNM?.toLowerCase().includes('kansas');
                    const isSelected = selectedUniversities.some(u => {
                      if (u.UNITID && uni.UNITID && u.UNITID === uni.UNITID) return true;
                      if (u._id && uni._id && u._id.toString() === uni._id.toString()) return true;
                      return false;
                    });
                    
                    const programCount = getProgramCount(uni);
                    const location = uni.CITY || uni.location?.city || '';
                    const state = uni.STABBR || uni.location?.state || '';
                    
                    // Get selected courses for this university
                    const selectedUni = selectedUniversities.find(u => 
                      u.UNITID === uni.UNITID || u._id === uni._id
                    );
                    const selectedCoursesForUni = selectedUni?.selectedCourses || [];
                    
                    return (
                      <div key={uniId?.toString() || Math.random()} className="university-card-wrapper">
                        <div 
                          className={`university-card ${isSelected ? 'selected' : ''} ${isKansas ? 'kansas' : ''}`}
                          onClick={() => toggleUniversity(uni)}
                        >
                          <div className="university-logo">{getInitials(uni.INSTNM)}</div>
                          <div className="university-details">
                            <h4>{uni.INSTNM || 'Unknown University'}</h4>
                            <p>{location}{location && state ? ', ' : ''}{state}</p>
                            {programCount > 0 && !isKansas && (
                              <span className="program-badge">{programCount} courses available</span>
                            )}
                            {isKansas && (
                              <span className="kansas-badge">Direct Apply Only</span>
                            )}
                          </div>
                          {isSelected && <span className="check-mark">✓</span>}
                        </div>
                        
                        {/* Show selected courses preview */}
                        {isSelected && !isKansas && selectedCoursesForUni.length > 0 && (
                          <div className="selected-courses-preview">
                            <span className="preview-label">Selected courses:</span>
                            <div className="preview-courses">
                              {selectedCoursesForUni.map((course, idx) => (
                                <span key={idx} className="preview-course-tag">
                                  {course.title || course.program_name}
                                </span>
                              ))}
                            </div>
                            <button 
                              className="edit-courses-btn ripple-effect"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCourseModal(uni);
                              }}
                            >
                              Edit Courses
                            </button>
                          </div>
                        )}
                        
                        {isSelected && !isKansas && selectedCoursesForUni.length === 0 && (
                          <div className="selected-courses-preview warning">
                            <span className="preview-label">⚠️ No courses selected</span>
                            <button 
                              className="edit-courses-btn ripple-effect"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCourseModal(uni);
                              }}
                            >
                              Select Courses
                            </button>
                          </div>
                        )}
                        
                        {isSelected && isKansas && (
                          <div className="kansas-note">
                            <span>Kansas University - Direct Apply</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="no-results">
                    <p>No universities found.</p>
                    {universities.length === 0 && (
                      <button className="retry-btn ripple-effect" onClick={handleRetry}>
                        Refresh Universities
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button className="back-btn ripple-effect" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button 
                className="continue-btn ripple-effect"
                onClick={() => handleSaveProgress(4)}
                disabled={!isStep3Valid()}
              >
                Continue to Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Review Your Profile</h2>
              <p>Please verify your information before submitting</p>
            </div>

            <div className="review-section">
              <h3>Personal Information</h3>
              <div className="review-grid">
                <p><strong>Full Name:</strong> {basicInfo.fullName || 'Not provided'}</p>
                <p><strong>Email:</strong> {basicInfo.email || 'Not provided'}</p>
                <p><strong>Mobile:</strong> {basicInfo.mobile || 'Not provided'}</p>
                <p><strong>Date of Birth:</strong> {basicInfo.dob || 'Not provided'}</p>
                <p><strong>Gender:</strong> {basicInfo.gender || 'Not provided'}</p>
                <p><strong>Nationality:</strong> {basicInfo.nationality || 'Not provided'}</p>
                <p><strong>Residence:</strong> {basicInfo.residence || 'Not provided'}</p>
              </div>
            </div>

            <div className="review-section">
              <h3>Education Background</h3>
              <div className="review-grid">
                <p><strong>Qualification:</strong> {education.qualification || 'Not provided'}</p>
                <p><strong>Institution:</strong> {education.institution || 'Not provided'}</p>
                <p><strong>Field:</strong> {education.field || 'Not provided'}</p>
                <p><strong>Year:</strong> {education.year || 'Not provided'}</p>
                <p><strong>CGPA:</strong> {education.cgpa || 'Not provided'}</p>
              </div>
            </div>

            <div className="review-section">
              <h3>Selected Universities & Courses ({selectedUniversities.length})</h3>
              <div className="universities-list">
                {selectedUniversities.length > 0 ? (
                  selectedUniversities.map((uni, index) => {
                    const isKansas = uni.INSTNM?.toLowerCase().includes('kansas') || uni.isKansas;
                    const courses = uni.selectedCourses || [];
                    
                    return (
                      <div key={uni.UNITID || uni._id} className="review-university-item">
                        <p className="review-university-name">
                          <strong>{index + 1}. {uni.INSTNM || 'Unknown University'}</strong>
                          {isKansas && <span className="kansas-tag"> (Direct Apply)</span>}
                        </p>
                        {!isKansas && courses.length > 0 && (
                          <div className="review-courses-list">
                            <p className="courses-label">Selected Courses ({courses.length}):</p>
                            <ul>
                              {courses.map((course, idx) => (
                                <li key={idx}>
                                  {course.title || course.program_name} 
                                  {course.level && <span className="course-level"> - {course.level}</span>}
                                  {course.studyMode && <span className="course-mode"> ({course.studyMode})</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {!isKansas && courses.length === 0 && (
                          <p className="warning-text">⚠️ No courses selected for this university</p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p>No universities selected</p>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button className="back-btn ripple-effect" onClick={() => setStep(3)}>
                ← Back
              </button>
              <button 
                className="submit-btn ripple-effect" 
                onClick={handleSubmitProfile}
                disabled={saving || !isStep3Valid()}
              >
                {saving ? 'Submitting...' : 'Submit Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Progress Steps */}
        <div className="bottom-progress">
          <div className="progress-steps-horizontal">
            <div className={`step-horizontal ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="step-number-horizontal">1</span>
              <span className="step-label-horizontal">Basic Info</span>
            </div>
            <div className={`step-horizontal ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="step-number-horizontal">2</span>
              <span className="step-label-horizontal">Education</span>
            </div>
            <div className={`step-horizontal ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <span className="step-number-horizontal">3</span>
              <span className="step-label-horizontal">Universities & Courses</span>
            </div>
            <div className={`step-horizontal ${step === 4 ? 'active' : ''}`}>
              <span className="step-number-horizontal">4</span>
              <span className="step-label-horizontal">Review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Selection Modal with Search */}
      {showCourseModal && currentUniversity && (
        <div className="modal-overlay" onClick={closeCourseModal}>
          <div className="modal-content course-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Courses for {currentUniversity.INSTNM}</h3>
              <button className="modal-close-btn ripple-effect" onClick={closeCourseModal}>×</button>
            </div>
            
            <div className="modal-body">
              <p className="course-selection-info">
                Select up to 2 courses that interest you
              </p>
              
              <div className="selected-count">
                Selected: {tempSelectedCourses.length}/2
              </div>
              
              {/* Course Search and Filters */}
              <div className="course-search-section">
                <div className="course-search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="course-search-input"
                    placeholder="Search courses by name, major, level..."
                    value={courseSearchTerm}
                    onChange={(e) => setCourseSearchTerm(e.target.value)}
                  />
                  {courseSearchTerm && (
                    <button 
                      className="clear-search-btn"
                      onClick={() => setCourseSearchTerm("")}
                    >
                      ×
                    </button>
                  )}
                </div>
                
                <div className="filter-badges">
                  {/* {getUniqueLevels().length > 0 && (
                    <select 
                      className="filter-select"
                      value={courseFilter.level}
                      onChange={(e) => setCourseFilter({...courseFilter, level: e.target.value})}
                    >
                      <option value="">All Levels</option>
                      {getUniqueLevels().map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  )} */}
                  
                  {/* {getUniqueStudyModes().length > 0 && (
                    <select 
                      className="filter-select"
                      value={courseFilter.studyMode}
                      onChange={(e) => setCourseFilter({...courseFilter, studyMode: e.target.value})}
                    >
                      <option value="">All Study Modes</option>
                      {getUniqueStudyModes().map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  )} */}
                  
                  {/* {getUniqueMajorAreas().length > 0 && (
                    <select 
                      className="filter-select"
                      value={courseFilter.majorArea}
                      onChange={(e) => setCourseFilter({...courseFilter, majorArea: e.target.value})}
                    >
                      <option value="">All Majors</option>
                      {getUniqueMajorAreas().map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  )} */}
                </div>
                
                {(courseSearchTerm || courseFilter.level || courseFilter.studyMode || courseFilter.majorArea) && (
                  <div className="active-filters">
                    <span className="filter-label">Active filters:</span>
                    {courseSearchTerm && (
                      <span className="filter-tag">
                        Search: "{courseSearchTerm}"
                        <button onClick={() => setCourseSearchTerm("")}>×</button>
                      </span>
                    )}
                    {courseFilter.level && (
                      <span className="filter-tag">
                        Level: {courseFilter.level}
                        <button onClick={() => setCourseFilter({...courseFilter, level: ""})}>×</button>
                      </span>
                    )}
                    {courseFilter.studyMode && (
                      <span className="filter-tag">
                        Mode: {courseFilter.studyMode}
                        <button onClick={() => setCourseFilter({...courseFilter, studyMode: ""})}>×</button>
                      </span>
                    )}
                    {courseFilter.majorArea && (
                      <span className="filter-tag">
                        Major: {courseFilter.majorArea}
                        <button onClick={() => setCourseFilter({...courseFilter, majorArea: ""})}>×</button>
                      </span>
                    )}
                    <button 
                      className="clear-all-filters"
                      onClick={() => {
                        setCourseSearchTerm("");
                        setCourseFilter({ level: "", studyMode: "", majorArea: "" });
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
              
              {loadingCourses ? (
                <div className="courses-loading">
                  <div className="spinner-small"></div>
                  <p>Loading courses...</p>
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="courses-grid">
                  {filteredCourses.map((course, idx) => {
                    const isSelected = tempSelectedCourses.some(c => c.id === course.id);
                    
                    return (
                      <div
                        key={course.id || idx}
                        className={`course-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleTempCourse(course)}
                      >
                        <h4 className="course-title">{course.title || course.program_name}</h4>
                        <div className="course-badges">
                          {course.level && (
                            <span 
                              className="course-level-badge"
                              style={{ backgroundColor: getLevelColor(course.level) }}
                            >
                              {course.level}
                            </span>
                          )}
                          {course.studyMode && (
                            <span 
                              className="course-mode-badge"
                              style={{ backgroundColor: getStudyModeColor(course.studyMode) }}
                            >
                              {course.studyMode}
                            </span>
                          )}
                        </div>
                        {course.duration && (
                          <span className="course-duration">{course.duration}</span>
                        )}
                        {course.majorArea && (
                          <span className="course-major">{course.majorArea}</span>
                        )}
                        {isSelected && (
                          <span className="course-selected-check">✓ Selected</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-courses">
                  <p>No courses match your search criteria.</p>
                  <button 
                    className="clear-filters-btn"
                    onClick={() => {
                      setCourseSearchTerm("");
                      setCourseFilter({ level: "", studyMode: "", majorArea: "" });
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn ripple-effect" onClick={closeCourseModal}>
                Cancel
              </button>
              <button 
                className="save-btn ripple-effect" 
                onClick={saveCourseSelection}
                disabled={tempSelectedCourses.length === 0}
              >
                Save Selection ({tempSelectedCourses.length}/2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for course search */}
      <style jsx>{`
        .success-animation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }

        .success-animation {
          width: 100px;
          height: 100px;
        }

        .checkmark-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2, #FF6B6B, #4ECDC4);
          animation: rotate 0.5s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkmark {
          width: 50px;
          height: 30px;
          border-left: 5px solid white;
          border-bottom: 5px solid white;
          transform: rotate(-45deg) translate(5px, -5px);
          animation: draw 0.3s ease-out 0.3s both;
        }

        @keyframes rotate {
          from {
            transform: scale(0) rotate(0deg);
          }
          to {
            transform: scale(1) rotate(360deg);
          }
        }

        @keyframes draw {
          from {
            width: 0;
            height: 0;
            opacity: 0;
          }
          to {
            width: 50px;
            height: 30px;
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .field-error {
          color: #dc3545;
          font-size: 0.8rem;
          margin-top: 0.2rem;
          animation: slideIn 0.3s ease;
        }

        /* Course Search Styles */
        .course-search-section {
          margin-bottom: 1.5rem;
        }

        .course-search-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }

        .course-search-input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 2.5rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .course-search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: 1rem;
        }

        .clear-search-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #999;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.2rem 0.5rem;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .clear-search-btn:hover {
          background: #f0f0f0;
          color: #666;
        }

        .filter-badges {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 0.5rem 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          background: white;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 120px;
        }

        .filter-select:hover {
          border-color: #667eea;
        }

        .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .active-filters {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
          margin-top: 0.5rem;
        }

        .filter-label {
          color: #666;
          font-size: 0.9rem;
        }

        .filter-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          background: #e3f2fd;
          border-radius: 16px;
          font-size: 0.85rem;
          color: #1976d2;
        }

        .filter-tag button {
          background: none;
          border: none;
          color: #1976d2;
          cursor: pointer;
          font-size: 1rem;
          padding: 0 0.25rem;
          border-radius: 50%;
        }

        .filter-tag button:hover {
          background: rgba(25, 118, 210, 0.1);
        }

        .clear-all-filters {
          background: none;
          border: none;
          color: #667eea;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          text-decoration: underline;
        }

        .clear-all-filters:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .clear-filters-btn {
          padding: 0.5rem 1rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          margin-top: 1rem;
          transition: all 0.2s ease;
        }

        .clear-filters-btn:hover {
          background: #5a67d8;
          transform: translateY(-2px);
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          max-height: 400px;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .course-card {
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .course-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #667eea;
        }

        .course-card.selected {
          border-color: #4CAF50;
          background: rgba(76, 175, 80, 0.05);
        }

        .course-title {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: #333;
          line-height: 1.4;
        }

        .course-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .course-level-badge,
        .course-mode-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          color: white;
          font-weight: 500;
        }

        .course-duration,
        .course-major {
          display: block;
          font-size: 0.8rem;
          color: #666;
          margin-top: 0.25rem;
        }

        .course-selected-check {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: #4CAF50;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }

        .no-courses {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default UserProfile;