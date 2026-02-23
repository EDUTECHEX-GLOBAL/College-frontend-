// src/controllers/collegeSearchController.js
import University from '../models/University.js';
import College from '../models/College.js';
import UserProfile from '../models/userprofilemodel.js';

// 🔍 SEARCH UNIVERSITIES BASED ON STUDENT PROFILE AND SELECTED UNIVERSITIES
export const searchColleges = async (req, res) => {
  try {
    const { query, program, field, country } = req.query;
    const userId = req.userId; // From auth middleware

    console.log('🔍 College Search Request:', { query, program, field, country, userId });

    // Get student profile if userId exists
    let studentProfile = null;
    let selectedUniversities = [];
    
    if (userId) {
      try {
        studentProfile = await UserProfile.findOne({ userId });
        console.log('📋 Student Profile Found:', studentProfile ? 'Yes' : 'No');
        
        if (studentProfile) {
          console.log('   - Program:', studentProfile.eligibleProgram);
          console.log('   - Field:', studentProfile.education?.field);
          console.log('   - Country:', studentProfile.basicInfo?.residence);
          
          // Get selected universities from profile
          selectedUniversities = studentProfile.selectedUniversities || [];
          console.log(`   - Selected Universities: ${selectedUniversities.length}`);
          
          // Log selected universities with their courses
          selectedUniversities.forEach((uni, index) => {
            const courseCount = uni.selectedCourses?.length || 0;
            console.log(`     ${index + 1}. ${uni.name} - ${courseCount} courses selected`);
            if (courseCount > 0) {
              uni.selectedCourses?.forEach((course, idx) => {
                console.log(`        - Course ${idx + 1}: ${course.title || course.program_name} (${course.level || 'N/A'})`);
              });
            }
          });
        }
      } catch (profileError) {
        console.error("Error fetching student profile:", profileError);
        // Continue without profile
      }
    }

    // If no profile exists, return appropriate message
    if (!studentProfile) {
      return res.status(200).json({
        success: true,
        count: 0,
        colleges: [],
        hasProfile: false,
        message: "Please complete your profile to see university recommendations"
      });
    }

    // If no universities selected in profile, return message
    if (!selectedUniversities || selectedUniversities.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        colleges: [],
        hasProfile: true,
        profileUsed: {
          program: studentProfile.eligibleProgram,
          field: studentProfile.education?.field,
          country: studentProfile.basicInfo?.residence
        },
        message: "No universities selected in your profile. Please select universities in your profile first."
      });
    }

    // Extract all university IDs from selectedUniversities
    const universityIds = selectedUniversities
      .map(u => u.id || u.unitid)
      .filter(id => id !== null && id !== undefined);

    console.log('🔎 Looking for universities with IDs:', universityIds);

    if (universityIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        colleges: [],
        hasProfile: true,
        message: "No valid university IDs found in profile"
      });
    }

    // Build search query to find universities by ID
    const universities = [];
    
    // Try to find each university by its ID
    for (const id of universityIds) {
      try {
        const idStr = String(id).trim();
        let university = null;
        
        // Try to find by UNITID (if it's a number)
        if (!isNaN(idStr) && /^\d+$/.test(idStr)) {
          university = await University.findOne({ UNITID: parseInt(idStr, 10) });
        }
        
        // If not found, try by _id (if it looks like an ObjectId)
        if (!university && idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
          university = await University.findById(idStr);
        }
        
        // If still not found, try by UNITID as string
        if (!university) {
          university = await University.findOne({ UNITID: idStr });
        }
        
        if (university) {
          universities.push(university);
          console.log(`✅ Found university: ${university.INSTNM} for ID: ${idStr}`);
        } else {
          console.log(`❌ No university found for ID: ${idStr}`);
        }
      } catch (err) {
        console.error(`Error finding university for ID ${id}:`, err.message);
      }
    }

    console.log(`📚 Found ${universities.length} universities out of ${universityIds.length} selected`);

    // If no universities found, return debug info
    if (universities.length === 0) {
      // Get sample universities from database for debugging
      const sampleUniversities = await University.find({})
        .select('UNITID INSTNM location')
        .limit(5);
      
      return res.status(200).json({
        success: true,
        count: 0,
        colleges: [],
        hasProfile: true,
        debug: {
          searchedIds: universityIds,
          sampleDbIds: sampleUniversities.map(u => ({
            UNITID: u.UNITID,
            _id: u._id.toString(),
            name: u.INSTNM
          }))
        },
        message: "Selected universities not found in database. Please update your profile and reselect universities."
      });
    }

    // Create a map of selected universities with their courses for quick lookup
    const selectedUniMap = {};
    selectedUniversities.forEach(uni => {
      const id = uni.id || uni.unitid;
      if (id) {
        selectedUniMap[String(id).trim()] = uni;
      }
    });

    // Transform universities to match frontend expected format and include selected courses
    const transformedUniversities = universities.map(uni => {
      const uniObj = uni.toObject ? uni.toObject() : uni;
      const uniId = String(uniObj.UNITID || uniObj._id).trim();
      
      // Get the selected university data from profile
      const selectedUniData = selectedUniMap[uniId] || {};

      // Calculate match percentage based on student profile
      let matchPercentage = 0;
      let matchReasons = [];

      // Check program match (40 points)
      if (studentProfile.eligibleProgram) {
        const programLevel = studentProfile.eligibleProgram;
        const uniProgramLevel = uniObj.metadata?.iclevel;
        
        if ((programLevel === 'Bachelor' && uniProgramLevel === 1) ||
            (programLevel === 'Master' && uniProgramLevel === 3) ||
            (programLevel === 'PhD' && uniProgramLevel === 4)) {
          matchPercentage += 40;
          matchReasons.push('Program level matches your qualification');
        }
      }

      // Check field of study match (30 points)
      if (studentProfile.education?.field && uniObj.metadata?.programs) {
        const fieldMatch = uniObj.metadata.programs.some(p => 
          p.title?.toLowerCase().includes(studentProfile.education.field.toLowerCase())
        );
        if (fieldMatch) {
          matchPercentage += 30;
          matchReasons.push('Programs available in your field of study');
        }
      }

      // Check location preference (20 points)
      if (studentProfile.basicInfo?.residence && uniObj.location?.country) {
        if (studentProfile.basicInfo.residence.toLowerCase().includes(uniObj.location.country.toLowerCase())) {
          matchPercentage += 20;
          matchReasons.push('Located in your preferred country');
        }
      }

      // Check program count (10 points)
      const programCount = uniObj.stats?.totalPrograms || uniObj.metadata?.programs?.length || 0;
      if (programCount > 20) {
        matchPercentage += 10;
        matchReasons.push('Extensive program offerings');
      } else if (programCount > 10) {
        matchPercentage += 7;
        matchReasons.push('Good variety of programs');
      } else if (programCount > 5) {
        matchPercentage += 5;
        matchReasons.push('Multiple programs available');
      }

      // Get programs for this university
      const programs = extractProgramsFromUniversity(uniObj);

      return {
        UNITID: uniObj.UNITID || uniObj._id.toString(),
        _id: uniObj._id.toString(),
        INSTNM: uniObj.INSTNM || 'Unknown University',
        IALIAS: uniObj.IALIAS || '',
        CITY: uniObj.location?.city || uniObj.CITY || '',
        STABBR: uniObj.location?.state || uniObj.STABBR || '',
        COUNTRY: uniObj.location?.country || 'USA',
        WEBADDR: uniObj.contact?.website || uniObj.WEBADDR || '',
        logo: getUniversityLogo(uniObj.INSTNM || 'University'),
        fallbackLogo: '/default-university-logo.png',
        programCount: programCount,
        programs: programs,
        matchPercentage: Math.min(100, matchPercentage),
        matchReasons: matchReasons,
        location: uniObj.location || {},
        contact: uniObj.contact || {},
        stats: uniObj.stats || {},
        metadata: {
          iclevel: uniObj.metadata?.iclevel,
          control: uniObj.metadata?.control,
          sector: uniObj.metadata?.sector
        },
        importedByAdmin: uniObj.importedByAdmin || false,
        
        // IMPORTANT: Include the selected courses from the user's profile
        selectedCourses: selectedUniData.selectedCourses || [],
        isKansas: selectedUniData.isKansas || false,
        selectedUniversityData: selectedUniData
      };
    });

    // Sort by match percentage
    transformedUniversities.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return res.status(200).json({
      success: true,
      count: transformedUniversities.length,
      colleges: transformedUniversities,
      hasProfile: true,
      totalSelected: selectedUniversities.length,
      profileUsed: {
        program: studentProfile.eligibleProgram,
        field: studentProfile.education?.field,
        country: studentProfile.basicInfo?.residence,
        selectedCount: selectedUniversities.length
      },
      // Include summary of selected courses
      selectedCoursesSummary: transformedUniversities.map(uni => ({
        universityName: uni.INSTNM,
        universityId: uni.UNITID,
        courseCount: uni.selectedCourses?.length || 0,
        courses: uni.selectedCourses || []
      })).filter(uni => uni.courseCount > 0)
    });

  } catch (error) {
    console.error("❌ College search error:", error);
    // Return a proper error response without crashing
    return res.status(500).json({
      success: false,
      message: "An error occurred while searching for colleges",
      error: error.message,
      colleges: []
    });
  }
};

// Helper function to extract programs from university data
const extractProgramsFromUniversity = (uniObj) => {
  let programs = [];
  
  // 1. Try to get from metadata.programs
  if (uniObj.metadata?.programs && Array.isArray(uniObj.metadata.programs)) {
    programs = uniObj.metadata.programs.map((prog, index) => ({
      id: prog.id || `prog-${uniObj.UNITID}-${index + 1}`,
      title: prog.title || 'Unknown Program',
      program_name: prog.program_name || prog.title,
      level: prog.level || (uniObj.metadata?.iclevel === 1 ? 'Undergraduate' : 'Graduate'),
      studyMode: prog.studyMode || 'On Campus',
      locations: prog.locations || [`${uniObj.CITY || ''}, ${uniObj.STABBR || ''}`],
      duration: prog.duration || getDurationForLevel(prog.level),
      description: prog.description || `${prog.title} program at ${uniObj.INSTNM}`,
      majorArea: prog.majorArea || 'General'
    }));
  }
  
  // 2. Try to get from GUS_DATA.programs_data
  else if (uniObj.GUS_DATA?.programs_data && Array.isArray(uniObj.GUS_DATA.programs_data)) {
    programs = uniObj.GUS_DATA.programs_data.map((prog, index) => ({
      id: prog.id || `prog-${uniObj.UNITID}-${index + 1}`,
      title: prog.title || prog.program_name || 'Program',
      program_name: prog.program_name || prog.title,
      level: prog.level || uniObj.GUS_DATA?.level || 'Undergraduate',
      studyMode: prog.studyMode || 'On Campus',
      locations: prog.locations || [`${uniObj.CITY || ''}, ${uniObj.STABBR || ''}`],
      duration: prog.duration || '3-4 years',
      description: prog.description || `${prog.title || prog.program_name} program at ${uniObj.INSTNM}`,
      majorArea: prog.majorArea || 'General'
    }));
  }
  
  // 3. Try to get from GUS_DATA.major_areas
  else if (uniObj.GUS_DATA?.major_areas && Array.isArray(uniObj.GUS_DATA.major_areas)) {
    uniObj.GUS_DATA.major_areas.forEach(area => {
      if (area.specific_programs && Array.isArray(area.specific_programs)) {
        area.specific_programs.forEach(prog => {
          programs.push({
            id: `area-${area.major_area}-${prog.program_name.replace(/\s+/g, '-')}`,
            title: prog.program_name,
            program_name: prog.program_name,
            level: uniObj.GUS_DATA?.level || 'Undergraduate',
            studyMode: 'On Campus',
            locations: [`${uniObj.CITY || ''}, ${uniObj.STABBR || ''}`],
            duration: '3-4 years',
            description: `${prog.program_name} program in ${area.major_area} at ${uniObj.INSTNM}`,
            majorArea: area.major_area
          });
        });
      }
    });
  }
  
  return programs;
};

const getDurationForLevel = (level) => {
  if (!level) return '3-4 years';
  const levelStr = level.toLowerCase();
  if (levelStr.includes('master')) return '1-2 years';
  if (levelStr.includes('phd')) return '3-5 years';
  if (levelStr.includes('bachelor')) return '3-4 years';
  return '3-4 years';
};

// 🔍 GET UNIVERSITY BY ID WITH FULL DETAILS AND PROGRAMS
export const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log(`🔍 Fetching university details for ID: ${id}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "University ID is required"
      });
    }

    // Try to find by UNITID or _id
    let university;
    const idStr = id.toString();
    
    // Check if id is a number (UNITID)
    if (!isNaN(idStr) && idStr.match(/^\d+$/)) {
      university = await University.findOne({ UNITID: Number(idStr) });
    } 
    
    // If not found and id looks like an ObjectId
    if (!university && idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
      university = await University.findById(idStr);
    }
    
    // Try as string UNITID
    if (!university) {
      university = await University.findOne({ UNITID: idStr });
    }

    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    // Get student profile for personalized recommendations and selected courses
    let studentProfile = null;
    let selectedUniversityData = null;
    
    if (userId) {
      try {
        studentProfile = await UserProfile.findOne({ userId });
        
        // Find if this university is in the user's selected universities
        if (studentProfile && studentProfile.selectedUniversities) {
          selectedUniversityData = studentProfile.selectedUniversities.find(u => 
            u.id === idStr || u.unitid?.toString() === idStr || u._id?.toString() === idStr
          );
        }
      } catch (profileError) {
        console.error("Error fetching student profile:", profileError);
      }
    }

    const uniObj = university.toObject ? university.toObject() : university;
    
    // Extract programs
    const programs = extractProgramsFromUniversity(uniObj);
    const programCount = programs.length;

    // Transform university data
    const transformedUniversity = {
      UNITID: uniObj.UNITID || uniObj._id.toString(),
      _id: uniObj._id.toString(),
      INSTNM: uniObj.INSTNM || 'Unknown University',
      IALIAS: uniObj.IALIAS || '',
      CITY: uniObj.location?.city || uniObj.CITY || '',
      STABBR: uniObj.location?.state || uniObj.STABBR || '',
      COUNTRY: uniObj.location?.country || 'USA',
      ADDRESS: uniObj.location?.address || uniObj.ADDR || '',
      ZIP: uniObj.location?.zip || uniObj.ZIP || '',
      WEBADDR: uniObj.contact?.website || uniObj.WEBADDR || '',
      logo: getUniversityLogo(uniObj.INSTNM || 'University'),
      fallbackLogo: '/default-university-logo.png',
      programs: programs,
      programCount: programCount,
      stats: uniObj.stats || {},
      location: uniObj.location || {},
      contact: uniObj.contact || {},
      metadata: uniObj.metadata || {},
      GUS_DATA: uniObj.GUS_DATA || {},
      importedByAdmin: uniObj.importedByAdmin || false,
      
      // Include selected courses from user's profile if available
      selectedCourses: selectedUniversityData?.selectedCourses || [],
      isKansas: selectedUniversityData?.isKansas || false,
      selectedUniversityData: selectedUniversityData
    };

    return res.status(200).json({
      success: true,
      data: transformedUniversity
    });

  } catch (error) {
    console.error("❌ Error fetching university details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch university details",
      error: error.message
    });
  }
};

// 🎯 GET RECOMMENDED UNIVERSITIES BASED ON STUDENT PROFILE
export const getRecommendedUniversities = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // Get student profile
    const studentProfile = await UserProfile.findOne({ userId });

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found. Please complete your profile first."
      });
    }

    // Get selected universities from profile
    const selectedUniversities = studentProfile.selectedUniversities || [];
    
    if (!selectedUniversities || selectedUniversities.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        recommendations: [],
        profile: {
          program: studentProfile.eligibleProgram,
          field: studentProfile.education?.field,
          country: studentProfile.basicInfo?.residence
        },
        message: "No universities selected in your profile. Please select universities in your profile first."
      });
    }

    // Get the IDs of selected universities
    const universityIds = selectedUniversities
      .map(u => u.id || u.unitid)
      .filter(id => id !== null && id !== undefined);

    // Create a map of selected universities with their courses
    const selectedUniMap = {};
    selectedUniversities.forEach(uni => {
      const id = uni.id || uni.unitid;
      if (id) {
        selectedUniMap[String(id).trim()] = uni;
      }
    });

    // Find universities by their IDs
    const universities = [];
    
    for (const id of universityIds) {
      try {
        const idStr = String(id).trim();
        let university = null;
        
        if (!isNaN(idStr) && /^\d+$/.test(idStr)) {
          university = await University.findOne({ UNITID: parseInt(idStr, 10) });
        }
        
        if (!university && idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
          university = await University.findById(idStr);
        }
        
        if (!university) {
          university = await University.findOne({ UNITID: idStr });
        }
        
        if (university) {
          universities.push(university);
        }
      } catch (err) {
        console.error(`Error finding university for ID ${id}:`, err.message);
      }
    }

    // Calculate match score for each university
    const recommendations = universities.map(uni => {
      const uniObj = uni.toObject ? uni.toObject() : uni;
      const uniId = String(uniObj.UNITID || uniObj._id).trim();
      const selectedUniData = selectedUniMap[uniId] || {};
      
      let score = 0;
      let reasons = [];

      // Program match (40 points)
      const programMatch = uniObj.metadata?.programs?.some(p => 
        p.title?.toLowerCase().includes(studentProfile.education?.field?.toLowerCase() || '')
      );
      if (programMatch) {
        score += 40;
        reasons.push('Programs match your field of study');
      }

      // Location match (30 points)
      if (studentProfile.basicInfo?.residence && uniObj.location?.country) {
        if (studentProfile.basicInfo.residence.toLowerCase().includes(uniObj.location.country.toLowerCase())) {
          score += 30;
          reasons.push('Located in your preferred country');
        }
      }

      // Program variety (20 points)
      const programCount = uniObj.stats?.totalPrograms || uniObj.metadata?.programs?.length || 0;
      if (programCount > 20) {
        score += 20;
        reasons.push('Extensive program offerings');
      } else if (programCount > 10) {
        score += 15;
        reasons.push('Good variety of programs');
      } else if (programCount > 5) {
        score += 10;
        reasons.push('Multiple programs available');
      }

      // Institution type (10 points)
      if (uniObj.metadata?.iclevel === 1) {
        score += 5;
        reasons.push('Primarily undergraduate focused');
      } else if (uniObj.metadata?.iclevel === 3 || uniObj.metadata?.iclevel === 4) {
        score += 10;
        reasons.push('Strong graduate programs');
      }

      return {
        UNITID: uniObj.UNITID || uniObj._id.toString(),
        _id: uniObj._id.toString(),
        INSTNM: uniObj.INSTNM || 'Unknown University',
        IALIAS: uniObj.IALIAS || '',
        CITY: uniObj.location?.city || uniObj.CITY || '',
        STABBR: uniObj.location?.state || uniObj.STABBR || '',
        COUNTRY: uniObj.location?.country || 'USA',
        logo: getUniversityLogo(uniObj.INSTNM || 'University'),
        fallbackLogo: '/default-university-logo.png',
        programCount: programCount,
        matchScore: Math.min(100, score),
        matchReasons: reasons,
        isRecommended: score > 50,
        importedByAdmin: uniObj.importedByAdmin || false,
        
        // Include selected courses from profile
        selectedCourses: selectedUniData.selectedCourses || [],
        isKansas: selectedUniData.isKansas || false
      };
    });

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations: recommendations,
      profile: {
        program: studentProfile.eligibleProgram,
        field: studentProfile.education?.field,
        country: studentProfile.basicInfo?.residence,
        selectedCount: selectedUniversities.length
      }
    });

  } catch (error) {
    console.error("❌ Error getting recommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get recommendations",
      error: error.message
    });
  }
};

// 🔍 GET UNIVERSITY PROGRAMS
export const getUniversityPrograms = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Fetching programs for university ID: ${id}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "University ID is required"
      });
    }

    // Try to find by UNITID or _id
    let university;
    const idStr = id.toString();
    
    if (!isNaN(idStr) && /^\d+$/.test(idStr)) {
      university = await University.findOne({ UNITID: Number(idStr) });
    }
    
    if (!university && idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
      university = await University.findById(idStr);
    }
    
    if (!university) {
      university = await University.findOne({ UNITID: idStr });
    }

    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    const uniObj = university.toObject ? university.toObject() : university;
    const programs = extractProgramsFromUniversity(uniObj);

    // Get unique major areas
    const majorAreas = [];
    const majorAreaSet = new Set();
    programs.forEach(p => {
      if (p.majorArea && !majorAreaSet.has(p.majorArea)) {
        majorAreaSet.add(p.majorArea);
        majorAreas.push({ major_area: p.majorArea });
      }
    });

    // Get unique study modes
    const studyModes = ['All', ...new Set(programs.map(p => p.studyMode).filter(Boolean))];

    return res.status(200).json({
      success: true,
      data: {
        universityId: uniObj.UNITID || uniObj._id.toString(),
        universityName: uniObj.INSTNM,
        programs: programs,
        majorAreas: majorAreas,
        studyModes: studyModes,
        programCount: programs.length
      }
    });

  } catch (error) {
    console.error("❌ Error fetching university programs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch university programs",
      error: error.message
    });
  }
};

// 🔍 SEARCH COLLEGES (legacy endpoint)
export const searchCollegesLegacy = async (req, res) => {
  try {
    const { query } = req.query;
    
    let searchQuery = { isVisible: true };
    
    if (query && query.trim()) {
      const searchTerm = query.trim();
      searchQuery.$or = [
        { INSTNM: { $regex: searchTerm, $options: 'i' } },
        { 'location.city': { $regex: searchTerm, $options: 'i' } },
        { 'location.state': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const colleges = await College.find(searchQuery)
      .select('UNITID INSTNM IALIAS location contact importedByAdmin')
      .limit(50);

    const transformedColleges = colleges.map(col => {
      const colObj = col.toObject ? col.toObject() : col;
      return {
        UNITID: colObj.UNITID || colObj._id.toString(),
        _id: colObj._id.toString(),
        INSTNM: colObj.INSTNM || 'Unknown College',
        IALIAS: colObj.IALIAS || '',
        CITY: colObj.location?.city || colObj.CITY || '',
        STABBR: colObj.location?.state || colObj.STABBR || '',
        ZIP: colObj.location?.zip || colObj.ZIP || '',
        COUNTRY: colObj.location?.country || 'USA',
        logo: getUniversityLogo(colObj.INSTNM || 'College'),
        fallbackLogo: '/default-college-logo.png',
        isCollege: true,
        importedByAdmin: colObj.importedByAdmin || false
      };
    });

    return res.status(200).json({
      success: true,
      count: transformedColleges.length,
      colleges: transformedColleges
    });

  } catch (error) {
    console.error("❌ College search error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// Helper function to get university logo
const getUniversityLogo = (universityName) => {
  if (!universityName) return '/default-university-logo.png';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(universityName)}&background=667eea&color=fff&size=128&length=2&font-size=0.5&rounded=true&bold=true`;
};