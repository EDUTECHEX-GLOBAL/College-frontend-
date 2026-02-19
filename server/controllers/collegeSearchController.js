// src/controllers/collegeSearchController.js
import University from '../models/University.js';
import College from '../models/College.js';
import UserProfile from '../models/userprofilemodel.js';

// 🔍 SEARCH UNIVERSITIES BASED ON STUDENT PROFILE
export const searchColleges = async (req, res) => {
  try {
    const { query, program, field, country } = req.query;
    const userId = req.userId; // From auth middleware

    console.log('🔍 College Search Request:', { query, program, field, country, userId });

    // Get student profile if userId exists
    let studentProfile = null;
    if (userId) {
      studentProfile = await UserProfile.findOne({ userId });
      console.log('📋 Student Profile Found:', studentProfile ? 'Yes' : 'No');
      if (studentProfile) {
        console.log('   - Program:', studentProfile.eligibleProgram);
        console.log('   - Field:', studentProfile.education?.field);
        console.log('   - Country:', studentProfile.basicInfo?.residence);
      }
    }

    // Build search query for universities
    let searchQuery = { isVisible: true };

    // Text search
    if (query && query.trim()) {
      const searchTerm = query.trim();
      searchQuery.$or = [
        { universityName: { $regex: searchTerm, $options: 'i' } },
        { alias: { $regex: searchTerm, $options: 'i' } },
        { 'location.city': { $regex: searchTerm, $options: 'i' } },
        { 'location.state': { $regex: searchTerm, $options: 'i' } },
        { 'location.country': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Filter by country if specified
    if (country && country !== 'all' && country !== '') {
      searchQuery['location.country'] = country;
    }

    // Filter by program level if provided
    if (program && program !== '') {
      // Map program to iclevel: 1= Bachelor, 3= Master, 4= PhD
      if (program === 'Bachelor') {
        searchQuery['metadata.iclevel'] = 1;
      } else if (program === 'Master') {
        searchQuery['metadata.iclevel'] = 3;
      } else if (program === 'PhD') {
        searchQuery['metadata.iclevel'] = 4;
      }
    }

    console.log('🔎 Database Query:', JSON.stringify(searchQuery));

    // Get universities from database (from admin imported data)
    const universities = await University.find(searchQuery)
      .select('universityName alias location contact metadata stats educationLevels')
      .limit(100);

    console.log(`📚 Found ${universities.length} universities in database`);

    // If no universities found with filters, try a broader search
    if (universities.length === 0 && query) {
      console.log('⚠️ No results with filters, trying broader search...');
      const broadQuery = {
        isVisible: true,
        universityName: { $regex: query, $options: 'i' }
      };
      const broadResults = await University.find(broadQuery)
        .select('universityName alias location contact metadata stats')
        .limit(50);
      
      if (broadResults.length > 0) {
        console.log(`📚 Found ${broadResults.length} universities with broader search`);
        universities.push(...broadResults);
      }
    }

    // Transform universities to match frontend expected format
    const transformedUniversities = universities.map(uni => {
      // Calculate match percentage based on student profile
      let matchPercentage = 0;
      let matchReasons = [];

      if (studentProfile) {
        // Check program match (40 points)
        if (studentProfile.eligibleProgram) {
          const programLevel = studentProfile.eligibleProgram;
          const uniProgramLevel = uni.metadata?.iclevel;
          
          if ((programLevel === 'Bachelor' && uniProgramLevel === 1) ||
              (programLevel === 'Master' && uniProgramLevel === 3) ||
              (programLevel === 'PhD' && uniProgramLevel === 4)) {
            matchPercentage += 40;
            matchReasons.push('Program level matches your qualification');
          }
        }

        // Check field of study match (30 points)
        if (studentProfile.education?.field && uni.metadata?.programs) {
          const fieldMatch = uni.metadata.programs.some(p => 
            p.title?.toLowerCase().includes(studentProfile.education.field.toLowerCase())
          );
          if (fieldMatch) {
            matchPercentage += 30;
            matchReasons.push('Programs available in your field of study');
          }
        }

        // Check location preference (20 points)
        if (studentProfile.basicInfo?.residence && uni.location?.country) {
          if (studentProfile.basicInfo.residence.includes(uni.location.country)) {
            matchPercentage += 20;
            matchReasons.push('Located in your preferred country');
          }
        }

        // Check program count (10 points)
        const programCount = uni.stats?.totalPrograms || uni.metadata?.programs?.length || 0;
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
      }

      // Get program count
      const programCount = uni.stats?.totalPrograms || uni.metadata?.programs?.length || 0;

      return {
        UNITID: uni._id.toString(),
        INSTNM: uni.universityName,
        CITY: uni.location?.city || '',
        STABBR: uni.location?.state || '',
        COUNTRY: uni.location?.country || 'USA',
        WEBADDR: uni.contact?.website || '',
        logo: getUniversityLogo(uni.universityName),
        fallbackLogo: '/default-university-logo.png',
        isGUSUniversity: true,
        programCount: programCount,
        programs: uni.metadata?.programs || [],
        majorAreas: uni.metadata?.majorAreas || [],
        matchPercentage: Math.min(100, matchPercentage),
        matchReasons: matchReasons,
        location: uni.location,
        contact: uni.contact,
        stats: uni.stats,
        metadata: {
          iclevel: uni.metadata?.iclevel,
          control: uni.metadata?.control,
          sector: uni.metadata?.sector
        }
      };
    });

    // Sort by match percentage (if student profile exists)
    if (studentProfile) {
      transformedUniversities.sort((a, b) => b.matchPercentage - a.matchPercentage);
    } else {
      // Sort alphabetically if no profile
      transformedUniversities.sort((a, b) => a.INSTNM.localeCompare(b.INSTNM));
    }

    res.json({
      success: true,
      count: transformedUniversities.length,
      colleges: transformedUniversities,
      hasProfile: !!studentProfile,
      profileUsed: studentProfile ? {
        program: studentProfile.eligibleProgram,
        field: studentProfile.education?.field,
        country: studentProfile.basicInfo?.residence
      } : null
    });

  } catch (error) {
    console.error("❌ College search error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
      colleges: [] // Return empty array on error
    });
  }
};

// 🔍 GET UNIVERSITY BY ID WITH FULL DETAILS
export const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log(`🔍 Fetching university details for ID: ${id}`);

    const university = await University.findById(id);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    // Get student profile for personalized recommendations
    let studentProfile = null;
    if (userId) {
      studentProfile = await UserProfile.findOne({ userId });
    }

    // Get program count
    const programCount = university.stats?.totalPrograms || university.metadata?.programs?.length || 0;

    // Transform university data
    const transformedUniversity = {
      UNITID: university._id.toString(),
      INSTNM: university.universityName,
      CITY: university.location?.city || '',
      STABBR: university.location?.state || '',
      COUNTRY: university.location?.country || 'USA',
      ADDRESS: university.location?.address || '',
      ZIP: university.location?.zip || '',
      WEBADDR: university.contact?.website || '',
      logo: getUniversityLogo(university.universityName),
      fallbackLogo: '/default-university-logo.png',
      programs: university.metadata?.programs || [],
      majorAreas: university.metadata?.majorAreas || [],
      programCount: programCount,
      stats: university.stats,
      location: university.location,
      contact: university.contact,
      metadata: university.metadata,
      
      // Filter programs based on student profile
      recommendedPrograms: university.metadata?.programs?.filter(program => {
        if (!studentProfile) return true;
        
        // Check program level match
        if (studentProfile.eligibleProgram) {
          const programLevel = program.level || '';
          if (!programLevel.includes(studentProfile.eligibleProgram)) {
            return false;
          }
        }
        
        // Check field of study match
        if (studentProfile.education?.field && program.title) {
          return program.title.toLowerCase().includes(
            studentProfile.education.field.toLowerCase()
          );
        }
        
        return true;
      }) || []
    };

    res.json({
      success: true,
      data: transformedUniversity
    });

  } catch (error) {
    console.error("❌ Error fetching university details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university details",
      error: error.message
    });
  }
};

// 🔍 SEARCH COLLEGES (for backward compatibility)
export const searchCollegesLegacy = async (req, res) => {
  try {
    const { query } = req.query;
    
    let searchQuery = { isVisible: true };
    
    if (query && query.trim()) {
      const searchTerm = query.trim();
      searchQuery.$or = [
        { collegeName: { $regex: searchTerm, $options: 'i' } },
        { 'location.city': { $regex: searchTerm, $options: 'i' } },
        { 'location.state': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const colleges = await College.find(searchQuery)
      .select('collegeName location contact')
      .limit(50);

    const transformedColleges = colleges.map(col => ({
      UNITID: col._id.toString(),
      INSTNM: col.collegeName,
      CITY: col.location?.city || '',
      STABBR: col.location?.state || '',
      ZIP: col.location?.zip || '',
      logo: getUniversityLogo(col.collegeName),
      fallbackLogo: '/default-college-logo.png',
      isCollege: true
    }));

    res.json({
      success: true,
      count: transformedColleges.length,
      colleges: transformedColleges
    });

  } catch (error) {
    console.error("❌ College search error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
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

    console.log('🎯 Getting recommendations for profile:', {
      program: studentProfile.eligibleProgram,
      field: studentProfile.education?.field,
      country: studentProfile.basicInfo?.residence
    });

    // Build query based on profile
    let query = { isVisible: true };

    // Filter by program level
    if (studentProfile.eligibleProgram) {
      if (studentProfile.eligibleProgram === 'Bachelor') {
        query['metadata.iclevel'] = 1;
      } else if (studentProfile.eligibleProgram === 'Master') {
        query['metadata.iclevel'] = 3;
      } else if (studentProfile.eligibleProgram === 'PhD') {
        query['metadata.iclevel'] = 4;
      }
    }

    // Get universities
    const universities = await University.find(query)
      .select('universityName location contact metadata stats')
      .limit(50);

    console.log(`📚 Found ${universities.length} universities for recommendations`);

    // Calculate match score for each university
    const recommendations = universities.map(uni => {
      let score = 0;
      let reasons = [];

      // Program match (40 points)
      const programMatch = uni.metadata?.programs?.some(p => 
        p.title?.toLowerCase().includes(studentProfile.education?.field?.toLowerCase() || '')
      );
      if (programMatch) {
        score += 40;
        reasons.push('Programs match your field of study');
      }

      // Location match (30 points)
      if (studentProfile.basicInfo?.residence && uni.location?.country) {
        if (studentProfile.basicInfo.residence.includes(uni.location.country)) {
          score += 30;
          reasons.push('Located in your preferred country');
        }
      }

      // Program variety (20 points)
      const programCount = uni.stats?.totalPrograms || uni.metadata?.programs?.length || 0;
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
      if (uni.metadata?.iclevel === 1) {
        score += 5;
        reasons.push('Primarily undergraduate focused');
      } else if (uni.metadata?.iclevel === 3 || uni.metadata?.iclevel === 4) {
        score += 10;
        reasons.push('Strong graduate programs');
      }

      return {
        UNITID: uni._id.toString(),
        INSTNM: uni.universityName,
        CITY: uni.location?.city || '',
        STABBR: uni.location?.state || '',
        COUNTRY: uni.location?.country || 'USA',
        logo: getUniversityLogo(uni.universityName),
        fallbackLogo: '/default-university-logo.png',
        programCount,
        matchScore: Math.min(100, score),
        matchReasons: reasons,
        isRecommended: score > 50
      };
    });

    // Sort by match score (highest first)
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      count: recommendations.length,
      recommendations: recommendations.slice(0, 10), // Top 10
      profile: {
        program: studentProfile.eligibleProgram,
        field: studentProfile.education?.field,
        country: studentProfile.basicInfo?.residence
      }
    });

  } catch (error) {
    console.error("❌ Error getting recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get recommendations",
      error: error.message
    });
  }
};

// Helper function to get university logo
const getUniversityLogo = (universityName) => {
  // Use UI Avatars for consistent placeholder logos
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(universityName)}&background=667eea&color=fff&size=128&length=2&font-size=0.5&rounded=true&bold=true`;
};

// Export all functions
export default {
  searchColleges,
  getUniversityById,
  searchCollegesLegacy,
  getRecommendedUniversities
};