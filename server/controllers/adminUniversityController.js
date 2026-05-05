// controllers/adminUniversityController.js
import University from "../models/University.js";
import College from "../models/College.js";
import {
  loadUniversityData,
  getDataStats,
} from "../services/adminUniversityService.js";

/* ================================
   HELPER: Normalize university doc
   Handles BOTH old schema (INSTNM/UNITID)
   AND new schema (university/location/degree)
================================ */
const normalizeUniversity = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };

  // ── Name ──────────────────────────────────────────
  const universityName =
    obj.universityName ||
    obj.university ||
    obj.INSTNM ||
    obj.name ||
    "Unknown University";

  // ── Code ──────────────────────────────────────────
  const universityCode =
    obj.universityCode ||
    (obj.UNITID ? String(obj.UNITID) : null) ||
    obj._id?.toString() ||
    "";

  // ── Location ──────────────────────────────────────
  let city    = obj.city    || obj.CITY    || obj.location?.city    || "";
  let state   = obj.state   || obj.STABBR  || obj.location?.state   || "";
  let country = obj.country || obj.location?.country || obj.GUS_DATA?.country || "USA";

  // new schema stores location as a string like "Singapore" or "United Kingdom"
  if (!city && !state && typeof obj.location === "string") {
    country = obj.location;
  }

  // ── Degree / Level ────────────────────────────────
  const degree         = obj.degree || "";
  const educationLevel = obj.educationLevel || "";

  // Infer source/level from new schema
  let source = obj.source || "admin";
  if (!obj.source) {
    const d = degree.toLowerCase();
    const e = educationLevel.toLowerCase();
    if (d === "bachelor" || e === "undergraduate") source = "bachelors";
    else if (d === "master" || e === "postgraduate") source = "masters";
    else if (d === "phd" || e === "doctorate") source = "phd";
  }

  // ── Programs ──────────────────────────────────────
  let programs = obj.programs || [];

  // New schema: programs_data at top level or inside GUS_DATA
  if (!programs.length && Array.isArray(obj.programs_data)) {
    programs = obj.programs_data;
  }
  if (!programs.length && Array.isArray(obj.GUS_DATA?.programs_data)) {
    programs = obj.GUS_DATA.programs_data;
  }
  // New schema: major_areas → flatten to programs list
  const majorAreasSource = obj.major_areas || obj.GUS_DATA?.major_areas || [];
  if (!programs.length && Array.isArray(majorAreasSource) && majorAreasSource.length) {
    majorAreasSource.forEach((area) => {
      (area.specific_programs || []).forEach((prog) => {
        programs.push({
          id: `${area.major_area}-${prog.program_name}`.replace(/\s+/g, "-"),
          name: prog.program_name,
          title: prog.program_name,
          program_name: prog.program_name,
          majorArea: area.major_area,
          level:
            degree === "bachelor"
              ? "Bachelor"
              : degree === "master"
              ? "Master"
              : educationLevel || obj.GUS_DATA?.level || "Undergraduate",
          studyMode: "On Campus",
          duration: degree === "master" ? "2 years" : "4 years",
        });
      });
    });
  }

  // ── Website ───────────────────────────────────────
  const website =
    obj.website ||
    obj.WEBADDR ||
    obj.contact?.website ||
    "";

  // ── Logo ──────────────────────────────────────────
  const logo = obj.universityLogo || obj.logo || null;

  // ── Stats ─────────────────────────────────────────
  const stats = obj.stats || obj.GUS_DATA?.stats || null;

  return {
    ...obj,
    // Normalised fields that the frontend expects
    universityName,
    universityCode,
    INSTNM: universityName,   // keep old field so frontend works
    UNITID: obj.UNITID || universityCode,
    city,
    state,
    country,
    location: { city, state, country },
    degree,
    educationLevel,
    source,
    programs,
    programCount: programs.length,
    website,
    logo,
    stats,
    importedByAdmin: true,
    lastUpdated: obj.updatedAt || obj.createdAt,
  };
};

/* ================================
   HELPER: Extract programs from doc
================================ */
const extractPrograms = (university) => {
  // Already normalised
  if (university.programs?.length) return university.programs;

  // Raw doc
  const obj = university.toObject ? university.toObject() : university;
  let programs = [];

  if (Array.isArray(obj.programs_data)) programs = [...obj.programs_data];
  if (!programs.length && Array.isArray(obj.GUS_DATA?.programs_data))
    programs = [...obj.GUS_DATA.programs_data];

  const majorAreas = obj.major_areas || obj.GUS_DATA?.major_areas || [];
  if (Array.isArray(majorAreas)) {
    majorAreas.forEach((area) => {
      (area.specific_programs || []).forEach((prog) => {
        const exists = programs.some(
          (p) =>
            (p.title || "").toLowerCase() === prog.program_name.toLowerCase() ||
            (p.program_name || "").toLowerCase() === prog.program_name.toLowerCase()
        );
        if (!exists) {
          programs.push({
            id: `area-${area.major_area}-${prog.program_name}`.replace(/\s+/g, "-"),
            title: prog.program_name,
            program_name: prog.program_name,
            majorArea: area.major_area,
            level: obj.GUS_DATA?.level || obj.educationLevel || "Undergraduate",
            studyMode: "On Campus",
            description: `${prog.program_name} – ${area.major_area} at ${obj.university || obj.INSTNM}`,
          });
        }
      });
    });
  }

  return programs;
};

/* ================================
   GET IMPORT STATS
================================ */
export const getImportStats = async (req, res) => {
  try {
    const universitiesCount = await University.countDocuments();
    const collegesCount     = await College.countDocuments();
    const fileStats         = getDataStats();

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
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================
   IMPORT UNIVERSITIES & COLLEGES
================================ */
export const importUniversities = async (req, res) => {
  try {
    const { colleges, gusUniversities } = loadUniversityData();

    let importedUniversities = 0;
    let updatedUniversities  = 0;
    let importedColleges     = 0;
    let updatedColleges      = 0;

    // -------- Universities --------
    for (const uni of gusUniversities) {
      const data = {
        UNITID: uni.UNITID,
        INSTNM: uni.INSTNM,
        IALIAS: uni.IALIAS || "",
        ADDR:   uni.ADDR   || "",
        CITY:   uni.CITY   || "",
        STABBR: uni.STABBR || "",
        ZIP:    uni.ZIP    || "",
        FIPS:      uni.FIPS,
        OBEREG:    uni.OBEREG,
        CHFNM:     uni.CHFNM     || "",
        CHFTITLE:  uni.CHFTITLE  || "",
        GENTELE:   uni.GENTELE   || "",
        WEBADDR:   uni.WEBADDR   || "",
        ADMINURL:  uni.ADMINURL  || "",
        FAIDURL:   uni.FAIDURL   || "",
        APPLURL:   uni.APPLURL   || "",
        SECTOR:    uni.SECTOR,
        ICLEVEL:   uni.ICLEVEL,
        CONTROL:   uni.CONTROL,
        HLOFFER:   uni.HLOFFER,
        UGOFFER:   uni.UGOFFER,
        GROFFER:   uni.GROFFER,
        DEGGRANT:  uni.DEGGRANT,
        HBCU:      uni.HBCU,
        LOCALE:    uni.LOCALE,
        OPENPUBL:  uni.OPENPUBL,
        CYACTIVE:  uni.CYACTIVE,
        POSTSEC:   uni.POSTSEC,
        INSTCAT:   uni.INSTCAT,
        LANDGRNT:  uni.LANDGRNT,
        INSTSIZE:  uni.INSTSIZE,
        LONGITUD:  uni.LONGITUD,
        LATITUDE:  uni.LATITUDE,
        isVisible:      true,
        importedByAdmin: true,
        location: {
          address:   uni.ADDR   || "",
          city:      uni.CITY   || "",
          state:     uni.STABBR || "",
          zip:       uni.ZIP    || "",
          latitude:  uni.LATITUDE,
          longitude: uni.LONGITUD,
        },
        contact: {
          phone:    uni.GENTELE  || "",
          website:  uni.WEBADDR  || "",
          adminUrl: uni.ADMINURL || "",
          faidUrl:  uni.FAIDURL  || "",
          applUrl:  uni.APPLURL  || "",
        },
        metadata: {
          chancellor:      uni.CHFNM    || "",
          chancellorTitle: uni.CHFTITLE || "",
          opeid:   uni.OPEID,
          sector:  uni.SECTOR,
          iclevel: uni.ICLEVEL,
          control: uni.CONTROL,
        },
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
      try {
        const parentUniversity = await University.findOne({ UNITID: col.UNITID });
        const data = {
          collegeName:    col.INSTNM || col.collegeName || "",
          collegeCode:    col.IALIAS || col.collegeCode || `COL-${col.UNITID || Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          universityCode: col.UNITID ? col.UNITID.toString() : (parentUniversity?.UNITID?.toString() || ""),
          universityName: parentUniversity?.INSTNM || col.universityName || "",
          description:    col.description || "",
          establishedYear: col.establishedYear || "",
          website:        col.WEBADDR || col.website || "",
          address:        col.ADDR    || col.address  || "",
          city:           col.CITY    || col.city     || "",
          state:          col.STABBR  || col.state    || "",
          country:        col.country || "USA",
          contactEmail:   col.contactEmail || col.adminEmail || "",
          contactPhone:   col.GENTELE || col.contactPhone   || "",
          programs:       col.programs || [],
          UNITID: col.UNITID,
          INSTNM: col.INSTNM,
          IALIAS: col.IALIAS || "",
          ADDR:   col.ADDR   || "",
          CITY:   col.CITY   || "",
          STABBR: col.STABBR || "",
          ZIP:    col.ZIP    || "",
          isVisible:       true,
          importedByAdmin: true,
          location: {
            address:   col.ADDR   || "",
            city:      col.CITY   || "",
            state:     col.STABBR || "",
            zip:       col.ZIP    || "",
            latitude:  col.LATITUDE,
            longitude: col.LONGITUD,
          },
          contact: {
            phone:   col.GENTELE || "",
            website: col.WEBADDR || "",
          },
        };

        const existing = await College.findOne({
          $or: [{ UNITID: col.UNITID }, { collegeCode: data.collegeCode }],
        });
        if (existing) {
          await College.updateOne({ _id: existing._id }, data);
          updatedColleges++;
        } else {
          await College.create(data);
          importedColleges++;
        }
      } catch (colError) {
        console.error(`Error processing college: ${col.INSTNM || "Unknown"}`, colError.message);
        continue;
      }
    }

    res.json({
      success: true,
      message: "Import completed",
      data: { importedUniversities, updatedUniversities, importedColleges, updatedColleges },
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================
   GET ALL UNIVERSITIES
   Supports new schema (university/location/degree)
   AND old schema (INSTNM/UNITID)
================================ */
export const getAllUniversities = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
 const limit = Math.min(5000, parseInt(req.query.limit) || 100);
    const skip  = (page - 1) * limit;

    // Optional: filter by degree level from query param
    const levelFilter = {};
    if (req.query.level) {
      const l = req.query.level.toLowerCase();
      if (l === "bachelor" || l === "bachelors" || l === "ug") {
        levelFilter.$or = [
          { degree: { $in: ["bachelor", "Bachelor", "bachelors"] } },
          { educationLevel: { $in: ["Undergraduate", "undergraduate"] } },
          { UGOFFER: 1 },
        ];
      } else if (l === "master" || l === "masters" || l === "pg") {
        levelFilter.$or = [
          { degree: { $in: ["master", "Master", "masters"] } },
          { educationLevel: { $in: ["Postgraduate", "postgraduate", "Graduate", "graduate"] } },
          { GROFFER: 1 },
        ];
      }
    }

    const [rawUniversities, total] = await Promise.all([
      University.find(levelFilter)
        .sort({ university: 1, INSTNM: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      University.countDocuments(levelFilter),
    ]);

    // Normalise every document
    const universities = rawUniversities.map(normalizeUniversity);

    res.json({
      success: true,
      data: universities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================
   SEARCH UNIVERSITIES
   Handles both old and new field names
================================ */
export const searchUniversities = async (req, res) => {
  const { q } = req.query;
  if (!q) return getAllUniversities(req, res);

  try {
    const rawUniversities = await University.find({
      $or: [
        // New schema fields
        { university:   { $regex: q, $options: "i" } },
        { location:     { $regex: q, $options: "i" } },
        { degree:       { $regex: q, $options: "i" } },
        // Old schema fields
        { INSTNM:       { $regex: q, $options: "i" } },
        { IALIAS:       { $regex: q, $options: "i" } },
        { "location.city":  { $regex: q, $options: "i" } },
        // Programs
        { "programs_data.title":                       { $regex: q, $options: "i" } },
        { "major_areas.major_area":                    { $regex: q, $options: "i" } },
        { "GUS_DATA.programs_data.title":              { $regex: q, $options: "i" } },
        { "GUS_DATA.major_areas.major_area":           { $regex: q, $options: "i" } },
        { "major_areas.specific_programs.program_name": { $regex: q, $options: "i" } },
      ],
    }).lean();

    const universities = rawUniversities.map(normalizeUniversity);
    res.json({ success: true, data: universities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
        { INSTNM:         { $regex: q, $options: "i" } },
        { IALIAS:         { $regex: q, $options: "i" } },
        { "location.city": { $regex: q, $options: "i" } },
        { collegeName:    { $regex: q, $options: "i" } },
      ],
    });
    res.json({ success: true, data: colleges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================
   GET UNIVERSITY BY ID
   Works with _id, UNITID (number), 
   and new schema documents
================================ */
export const getUniversityById = async (req, res) => {
  const { id } = req.params;

  try {
    let university;

    // 1. Try UNITID as number
    if (!isNaN(id)) {
      university = await University.findOne({ UNITID: Number(id) });
    }
    // 2. Try _id
    if (!university) {
      university = await University.findById(id).catch(() => null);
    }
    // 3. Fallback
    if (!university) {
      university = await University.findOne({
        $or: [{ UNITID: id }, { UNITID: Number(id) }],
      });
    }

    if (!university) {
      return res.status(404).json({ success: false, message: "University not found" });
    }

    const programs = extractPrograms(university);

    // Group by major area
    const programsByMajorArea = {};
    programs.forEach((prog) => {
      const area = prog.majorArea || prog.major_area || "Other";
      if (!programsByMajorArea[area]) programsByMajorArea[area] = [];
      programsByMajorArea[area].push(prog);
    });

    const programStats = {
      totalPrograms:    programs.length,
      totalMajorAreas:  Object.keys(programsByMajorArea).length,
      programsByLevel:  {},
      programsByStudyMode: {},
    };
    programs.forEach((prog) => {
      const level = prog.level || "Unknown";
      const mode  = prog.studyMode || "Unknown";
      programStats.programsByLevel[level]     = (programStats.programsByLevel[level]     || 0) + 1;
      programStats.programsByStudyMode[mode]  = (programStats.programsByStudyMode[mode]  || 0) + 1;
    });

    const normalized = normalizeUniversity(university);
    const universityObj = {
      ...normalized,
      programs,
      programsByMajorArea,
      programStats,
      programCount: programs.length,
    };

    res.json({ success: true, data: universityObj });
  } catch (error) {
    console.error("Error in getUniversityById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university details",
      error: error.message,
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

    const programs = extractPrograms(university);

    const programsByMajorArea = {};
    programs.forEach((prog) => {
      const area = prog.majorArea || "Other";
      if (!programsByMajorArea[area]) programsByMajorArea[area] = [];
      programsByMajorArea[area].push(prog);
    });

    const stats = {
      totalPrograms:   programs.length,
      totalMajorAreas: Object.keys(programsByMajorArea).length,
      programsByLevel: {},
      programsByStudyMode: {},
    };
    programs.forEach((prog) => {
      const level = prog.level || "Unknown";
      const mode  = prog.studyMode || "Unknown";
      stats.programsByLevel[level]    = (stats.programsByLevel[level]    || 0) + 1;
      stats.programsByStudyMode[mode] = (stats.programsByStudyMode[mode] || 0) + 1;
    });

    const normalized = normalizeUniversity(university);

    res.json({
      success: true,
      data: {
        universityId:   university.UNITID || university._id,
        universityName: normalized.universityName,
        programs,
        programsByMajorArea,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================
   SEARCH UNIVERSITY PROGRAMS
================================ */
export const searchUniversityPrograms = async (req, res) => {
  const { id } = req.params;
  const { q }  = req.query;
  if (!q) return getUniversityPrograms(req, res);

  try {
    const university = await University.findOne({
      $or: [{ _id: id }, { UNITID: Number(id) }],
    });

    if (!university) {
      return res.status(404).json({ success: false, message: "University not found" });
    }

    const allPrograms  = extractPrograms(university);
    const term         = q.toLowerCase();
    const programs     = allPrograms.filter(
      (prog) =>
        (prog.title        && prog.title.toLowerCase().includes(term))        ||
        (prog.program_name && prog.program_name.toLowerCase().includes(term)) ||
        (prog.majorArea    && prog.majorArea.toLowerCase().includes(term))
    );

    const normalized = normalizeUniversity(university);

    res.json({
      success: true,
      data: {
        universityId:   university.UNITID || university._id,
        universityName: normalized.universityName,
        searchTerm: q,
        programs,
        count: programs.length,
      },
    });
  } catch (error) {
    console.error("Error searching programs:", error);
    res.status(500).json({ success: false, message: error.message });
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

    const allPrograms = extractPrograms(university);
    const program     = allPrograms.find(
      (p) =>
        p.id === programId ||
        (p.program_name || "").replace(/\s+/g, "-") === programId
    );

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    const normalized = normalizeUniversity(university);

    res.json({
      success: true,
      data: {
        universityId:   university.UNITID || university._id,
        universityName: normalized.universityName,
        program,
      },
    });
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================
   TEST ENDPOINT
================================ */
export const testUniversityData = async (req, res) => {
  const { id } = req.params;

  try {
    let university;
    if (!isNaN(id)) {
      university = await University.findOne({ UNITID: Number(id) });
    } else {
      university = await University.findById(id);
    }

    if (!university) {
      return res.status(404).json({ success: false, message: "University not found" });
    }

    const programs  = extractPrograms(university);
    const normalized = normalizeUniversity(university);

    res.json({
      success: true,
      data: {
        id:              university.UNITID || university._id,
        rawFields:       Object.keys(university.toObject()),
        normalizedName:  normalized.universityName,
        source:          normalized.source,
        degree:          normalized.degree,
        educationLevel:  normalized.educationLevel,
        location:        normalized.location,
        hasPrograms:     programs.length > 0,
        programsCount:   programs.length,
        sampleProgram:   programs[0] || null,
        hasMajorAreas:   !!(university.major_areas?.length || university.GUS_DATA?.major_areas?.length),
      },
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};