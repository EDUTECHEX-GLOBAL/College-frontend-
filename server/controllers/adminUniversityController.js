// controllers/adminuniversitycontroller.js
import University from "../models/University.js";
import College from "../models/College.js";
import {
  loadUniversityData,
  getDataStats,
} from "../services/adminUniversityService.js";

/* ================================
   GET IMPORT STATS
================================ */
export const getImportStats = async (req, res) => {
  try {
    const universitiesCount = await University.countDocuments();
    const collegesCount = await College.countDocuments();

    const fileStats = getDataStats();

    res.json({
      success: true,
      data: {
        database: {
          universities: universitiesCount,
          colleges: collegesCount,
          total: universitiesCount + collegesCount,
        },
        files: fileStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   IMPORT UNIVERSITIES & COLLEGES
================================ */
export const importUniversities = async (req, res) => {
  try {
    const { colleges, gusUniversities } = loadUniversityData();

    let importedUniversities = 0;
    let updatedUniversities = 0;
    let importedColleges = 0;
    let updatedColleges = 0;

    // -------- Universities --------
    for (const uni of gusUniversities) {
      const data = {
        UNITID: uni.UNITID,
        INSTNM: uni.INSTNM,
        IALIAS: uni.IALIAS || "",
        ADDR: uni.ADDR || "",
        CITY: uni.CITY || "",
        STABBR: uni.STABBR || "",
        ZIP: uni.ZIP || "",
        FIPS: uni.FIPS,
        OBEREG: uni.OBEREG,
        CHFNM: uni.CHFNM || "",
        CHFTITLE: uni.CHFTITLE || "",
        GENTELE: uni.GENTELE || "",
        WEBADDR: uni.WEBADDR || "",
        ADMINURL: uni.ADMINURL || "",
        FAIDURL: uni.FAIDURL || "",
        APPLURL: uni.APPLURL || "",
        SECTOR: uni.SECTOR,
        ICLEVEL: uni.ICLEVEL,
        CONTROL: uni.CONTROL,
        HLOFFER: uni.HLOFFER,
        UGOFFER: uni.UGOFFER,
        GROFFER: uni.GROFFER,
        DEGGRANT: uni.DEGGRANT,
        HBCU: uni.HBCU,
        LOCALE: uni.LOCALE,
        OPENPUBL: uni.OPENPUBL,
        CYACTIVE: uni.CYACTIVE,
        POSTSEC: uni.POSTSEC,
        INSTCAT: uni.INSTCAT,
        LANDGRNT: uni.LANDGRNT,
        INSTSIZE: uni.INSTSIZE,
        LONGITUD: uni.LONGITUD,
        LATITUDE: uni.LATITUDE,
        isVisible: true,
        importedByAdmin: true,
        location: {
          address: uni.ADDR || "",
          city: uni.CITY || "",
          state: uni.STABBR || "",
          zip: uni.ZIP || "",
          latitude: uni.LATITUDE,
          longitude: uni.LONGITUD,
        },
        contact: {
          phone: uni.GENTELE || "",
          website: uni.WEBADDR || "",
          adminUrl: uni.ADMINURL || "",
          faidUrl: uni.FAIDURL || "",
          applUrl: uni.APPLURL || "",
        },
        metadata: {
          chancellor: uni.CHFNM || "",
          chancellorTitle: uni.CHFTITLE || "",
          opeid: uni.OPEID,
          sector: uni.SECTOR,
          iclevel: uni.ICLEVEL,
          control: uni.CONTROL,
        },
        // Store GUS_DATA if available
        GUS_DATA: uni.GUS_DATA || {},
      };

      const existing = await University.findOne({ UNITID: uni.UNITID });

      if (existing) {
        await University.updateOne({ UNITID: uni.UNITID }, data);
        updatedUniversities++;
      } else {
        await University.create(data);
        importedUniversities++;
      }
    }

    // -------- Colleges --------
    for (const col of colleges) {
      const data = {
        UNITID: col.UNITID,
        INSTNM: col.INSTNM,
        IALIAS: col.IALIAS || "",
        ADDR: col.ADDR || "",
        CITY: col.CITY || "",
        STABBR: col.STABBR || "",
        ZIP: col.ZIP || "",
        isVisible: true,
        importedByAdmin: true,
        location: {
          address: col.ADDR || "",
          city: col.CITY || "",
          state: col.STABBR || "",
          zip: col.ZIP || "",
          latitude: col.LATITUDE,
          longitude: col.LONGITUD,
        },
        contact: {
          phone: col.GENTELE || "",
          website: col.WEBADDR || "",
        },
      };

      const existing = await College.findOne({ UNITID: col.UNITID });

      if (existing) {
        await College.updateOne({ UNITID: col.UNITID }, data);
        updatedColleges++;
      } else {
        await College.create(data);
        importedColleges++;
      }
    }

    res.json({
      success: true,
      message: "Import completed",
      data: {
        importedUniversities,
        updatedUniversities,
        importedColleges,
        updatedColleges,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   GET ALL UNIVERSITIES
================================ */
export const getAllUniversities = async (req, res) => {
  try {
    const universities = await University.find().sort({ INSTNM: 1 });
    res.json({ success: true, data: universities });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   GET ALL COLLEGES
================================ */
export const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find().sort({ INSTNM: 1 });
    res.json({ success: true, data: colleges });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   SEARCH UNIVERSITIES
================================ */
export const searchUniversities = async (req, res) => {
  const { q } = req.query;
  if (!q) return getAllUniversities(req, res);

  try {
    const universities = await University.find({
      $or: [
        { INSTNM: { $regex: q, $options: "i" } },
        { IALIAS: { $regex: q, $options: "i" } },
        { "location.city": { $regex: q, $options: "i" } },
        { "GUS_DATA.programs_data.title": { $regex: q, $options: "i" } },
        { "GUS_DATA.major_areas.major_area": { $regex: q, $options: "i" } },
      ],
    });

    res.json({ success: true, data: universities });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   SEARCH COLLEGES
================================ */
export const searchColleges = async (req, res) => {
  const { q } = req.query;
  if (!q) return getAllColleges(req, res);

  try {
    const colleges = await College.find({
      $or: [
        { INSTNM: { $regex: q, $options: "i" } },
        { IALIAS: { $regex: q, $options: "i" } },
        { "location.city": { $regex: q, $options: "i" } },
      ],
    });

    res.json({ success: true, data: colleges });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   GET UNIVERSITY BY ID - FIXED VERSION
================================ */
export const getUniversityById = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`🔍 Fetching university with ID: ${id}`);

    // Try to find by UNITID (number) or _id (string)
    let university;
    
    // Check if id is a number
    if (!isNaN(id)) {
      console.log(`   - Searching by UNITID: ${Number(id)}`);
      university = await University.findOne({ UNITID: Number(id) });
    }
    
    // If not found by UNITID, try by _id
    if (!university) {
      console.log(`   - Searching by _id: ${id}`);
      university = await University.findById(id);
    }

    // If still not found, try with string conversion
    if (!university) {
      console.log(`   - Not found, trying alternative search`);
      university = await University.findOne({
        $or: [
          { UNITID: id }, // Try as string
          { UNITID: Number(id) }, // Try as number again
          { _id: id }
        ]
      });
    }

    if (!university) {
      console.log(`❌ University not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: "University not found" 
      });
    }

    console.log(`✅ University found: ${university.INSTNM}`);

    // Convert to object
    const universityObj = university.toObject();
    
    // Extract programs from GUS_DATA
    let programs = [];
    let programsByMajorArea = {};
    
    // 1. Get programs from GUS_DATA.programs_data
    if (university.GUS_DATA?.programs_data && Array.isArray(university.GUS_DATA.programs_data)) {
      console.log(`📚 Found ${university.GUS_DATA.programs_data.length} programs in GUS_DATA.programs_data`);
      programs = [...university.GUS_DATA.programs_data];
    }
    
    // 2. Also get programs from major_areas and add them if not duplicates
    if (university.GUS_DATA?.major_areas && Array.isArray(university.GUS_DATA.major_areas)) {
      console.log(`📚 Found ${university.GUS_DATA.major_areas.length} major areas`);
      
      university.GUS_DATA.major_areas.forEach(area => {
        if (area.specific_programs && Array.isArray(area.specific_programs)) {
          area.specific_programs.forEach(prog => {
            // Check if this program already exists in programs array
            const exists = programs.some(p => 
              (p.title && p.title.toLowerCase().includes(prog.program_name.toLowerCase())) ||
              (p.program_name && p.program_name.toLowerCase().includes(prog.program_name.toLowerCase()))
            );
            
            if (!exists) {
              programs.push({
                id: `area-${area.major_area}-${prog.program_name.replace(/\s+/g, '-')}`,
                title: prog.program_name,
                program_name: prog.program_name,
                majorArea: area.major_area,
                level: university.GUS_DATA?.level || 'Undergraduate',
                studyMode: 'On Campus',
                locations: [`${university.CITY || ''}, ${university.STABBR || ''}`].filter(Boolean),
                description: `${prog.program_name} program in ${area.major_area} at ${university.INSTNM}`,
              });
            }
          });
        }
      });
    }
    
    // 3. Group programs by major area
    programs.forEach(prog => {
      const area = prog.majorArea || prog.major_area || 'Other';
      if (!programsByMajorArea[area]) {
        programsByMajorArea[area] = [];
      }
      programsByMajorArea[area].push(prog);
    });

    // Calculate statistics
    const programStats = {
      totalPrograms: programs.length,
      totalMajorAreas: Object.keys(programsByMajorArea).length,
      programsByLevel: {},
      programsByStudyMode: {},
    };
    
    programs.forEach(prog => {
      // Count by level
      const level = prog.level || 'Unknown';
      programStats.programsByLevel[level] = (programStats.programsByLevel[level] || 0) + 1;
      
      // Count by study mode
      const mode = prog.studyMode || 'Unknown';
      programStats.programsByStudyMode[mode] = (programStats.programsByStudyMode[mode] || 0) + 1;
    });

    // Add program data to the response
    universityObj.programs = programs;
    universityObj.programsByMajorArea = programsByMajorArea;
    universityObj.programStats = programStats;
    universityObj.programCount = programs.length;

    console.log(`✅ Returning university data with ${programs.length} programs`);

    res.json({ 
      success: true, 
      data: universityObj 
    });
    
  } catch (error) {
    console.error("❌ Error in getUniversityById:", error);
    console.error("   - Error message:", error.message);
    console.error("   - Error stack:", error.stack);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch university details",
      error: error.message
    });
  }
};

/* ================================
   GET UNIVERSITY PROGRAMS
================================ */
export const getUniversityPrograms = async (req, res) => {
  const { id } = req.params;

  try {
    const university = await University.findOne({
      $or: [{ _id: id }, { UNITID: Number(id) }],
    });

    if (!university) {
      return res.status(404).json({ success: false, message: "University not found" });
    }

    // Extract programs from GUS_DATA
    let programs = [];
    
    if (university.GUS_DATA?.programs_data) {
      programs = university.GUS_DATA.programs_data;
    }
    
    // Also get from major_areas
    if (university.GUS_DATA?.major_areas) {
      university.GUS_DATA.major_areas.forEach(area => {
        if (area.specific_programs) {
          area.specific_programs.forEach(prog => {
            const exists = programs.some(p => 
              p.title?.includes(prog.program_name) || 
              p.program_name?.includes(prog.program_name)
            );
            
            if (!exists) {
              programs.push({
                id: `area-${area.major_area}-${prog.program_name.replace(/\s+/g, '-')}`,
                title: prog.program_name,
                program_name: prog.program_name,
                majorArea: area.major_area,
                level: university.GUS_DATA?.level || 'Undergraduate',
                studyMode: 'On Campus',
                locations: [`${university.CITY || ''}, ${university.STABBR || ''}`].filter(Boolean),
              });
            }
          });
        }
      });
    }

    // Get programs by major area
    const programsByMajorArea = {};
    programs.forEach(prog => {
      const area = prog.majorArea || 'Other';
      if (!programsByMajorArea[area]) {
        programsByMajorArea[area] = [];
      }
      programsByMajorArea[area].push(prog);
    });

    // Get statistics
    const stats = {
      totalPrograms: programs.length,
      totalMajorAreas: Object.keys(programsByMajorArea).length,
      programsByLevel: {},
      programsByStudyMode: {},
    };

    programs.forEach(prog => {
      const level = prog.level || 'Unknown';
      stats.programsByLevel[level] = (stats.programsByLevel[level] || 0) + 1;

      const mode = prog.studyMode || 'Unknown';
      stats.programsByStudyMode[mode] = (stats.programsByStudyMode[mode] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        universityId: university.UNITID || university._id,
        universityName: university.INSTNM,
        programs,
        programsByMajorArea,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   SEARCH UNIVERSITY PROGRAMS
================================ */
export const searchUniversityPrograms = async (req, res) => {
  const { id } = req.params;
  const { q } = req.query;

  if (!q) {
    return getUniversityPrograms(req, res);
  }

  try {
    const university = await University.findOne({
      $or: [{ _id: id }, { UNITID: Number(id) }],
    });

    if (!university) {
      return res.status(404).json({ success: false, message: "University not found" });
    }

    // Get all programs first
    let allPrograms = [];
    
    if (university.GUS_DATA?.programs_data) {
      allPrograms = university.GUS_DATA.programs_data;
    }
    
    if (university.GUS_DATA?.major_areas) {
      university.GUS_DATA.major_areas.forEach(area => {
        if (area.specific_programs) {
          area.specific_programs.forEach(prog => {
            const exists = allPrograms.some(p => 
              p.title?.includes(prog.program_name) || 
              p.program_name?.includes(prog.program_name)
            );
            
            if (!exists) {
              allPrograms.push({
                id: `area-${area.major_area}-${prog.program_name.replace(/\s+/g, '-')}`,
                title: prog.program_name,
                program_name: prog.program_name,
                majorArea: area.major_area,
                level: university.GUS_DATA?.level || 'Undergraduate',
                studyMode: 'On Campus',
                locations: [`${university.CITY || ''}, ${university.STABBR || ''}`].filter(Boolean),
              });
            }
          });
        }
      });
    }

    // Search programs
    const searchTerm = q.toLowerCase();
    const programs = allPrograms.filter(prog => 
      (prog.title && prog.title.toLowerCase().includes(searchTerm)) ||
      (prog.program_name && prog.program_name.toLowerCase().includes(searchTerm)) ||
      (prog.majorArea && prog.majorArea.toLowerCase().includes(searchTerm))
    );

    res.json({
      success: true,
      data: {
        universityId: university.UNITID || university._id,
        universityName: university.INSTNM,
        searchTerm: q,
        programs,
        count: programs.length,
      },
    });
  } catch (error) {
    console.error("Error searching programs:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   GET PROGRAM BY ID
================================ */
export const getProgramById = async (req, res) => {
  const { universityId, programId } = req.params;

  try {
    const university = await University.findOne({
      $or: [{ _id: universityId }, { UNITID: Number(universityId) }],
    });

    if (!university) {
      return res.status(404).json({ success: false, message: "University not found" });
    }

    // Find program in GUS_DATA.programs_data
    let program = null;
    if (university.GUS_DATA?.programs_data) {
      program = university.GUS_DATA.programs_data.find(p => p.id === programId);
    }

    // If not found, check in major_areas
    if (!program && university.GUS_DATA?.major_areas) {
      for (const area of university.GUS_DATA.major_areas) {
        if (area.specific_programs) {
          const found = area.specific_programs.find(p => 
            p.program_name.replace(/\s+/g, '-') === programId || 
            `${area.major_area}-${p.program_name.replace(/\s+/g, '-')}` === programId
          );
          if (found) {
            program = {
              id: programId,
              title: found.program_name,
              program_name: found.program_name,
              majorArea: area.major_area,
              level: university.GUS_DATA?.level || 'Undergraduate',
              studyMode: 'On Campus',
              locations: [`${university.CITY || ''}, ${university.STABBR || ''}`].filter(Boolean),
              description: `${found.program_name} program in ${area.major_area} at ${university.INSTNM}`,
            };
            break;
          }
        }
      }
    }

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    res.json({
      success: true,
      data: {
        universityId: university.UNITID || university._id,
        universityName: university.INSTNM,
        program,
      },
    });
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   GET COLLEGE BY ID
================================ */
export const getCollegeById = async (req, res) => {
  const { id } = req.params;

  try {
    const college = await College.findOne({
      $or: [{ _id: id }, { UNITID: Number(id) }],
    });

    if (!college) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.json({ success: true, data: college });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   REFRESH DATA
================================ */
export const refreshData = async (req, res) => {
  try {
    const stats = getDataStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================
   TEST ENDPOINT - HELPER FOR DEBUGGING
================================ */
export const testUniversityData = async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`🔍 Testing university data for ID: ${id}`);
    
    let university;
    
    if (!isNaN(id)) {
      university = await University.findOne({ UNITID: Number(id) });
    } else {
      university = await University.findById(id);
    }
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    // Return diagnostic information
    res.json({
      success: true,
      data: {
        id: university.UNITID || university._id,
        name: university.INSTNM,
        hasGUS_DATA: !!university.GUS_DATA,
        gusDataKeys: university.GUS_DATA ? Object.keys(university.GUS_DATA) : [],
        hasProgramsData: !!(university.GUS_DATA?.programs_data),
        programsCount: university.GUS_DATA?.programs_data?.length || 0,
        hasMajorAreas: !!(university.GUS_DATA?.major_areas),
        majorAreasCount: university.GUS_DATA?.major_areas?.length || 0,
        sampleProgram: university.GUS_DATA?.programs_data?.[0] || null,
      }
    });
    
  } catch (error) {
    console.error("Error in test endpoint:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

