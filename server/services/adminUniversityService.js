// services/adminUniversityService.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to data files
const collegesPath = path.join(process.cwd(), "data", "colleges.json");
const gusPath = path.join(process.cwd(), "data", "gus.json");

// Combined data storage
let universities = [];
let colleges = [];

// Utility to clean JSON keys (removing special characters)
const cleanKeys = (obj) => {
  const cleaned = {};
  for (const key in obj) {
    const cleanKey = key.replace(/[^\x20-\x7E]/g, "").trim();
    cleaned[cleanKey] = obj[key];
  }
  return cleaned;
};

// Load data from JSON files
export const loadUniversityData = () => {
  try {
    // Check if files exist
    if (!fs.existsSync(collegesPath)) {
      console.error(`❌ Colleges file not found at: ${collegesPath}`);
      return { colleges: [], gusUniversities: [] };
    }
    
    if (!fs.existsSync(gusPath)) {
      console.error(`❌ GUS file not found at: ${gusPath}`);
      return { colleges: [], gusUniversities: [] };
    }

    // Read and parse colleges.json
    let collegeRaw = fs.readFileSync(collegesPath, "utf8");
    // Remove BOM if present
    if (collegeRaw.charCodeAt(0) === 0xfeff) collegeRaw = collegeRaw.slice(1);
    const collegeData = JSON.parse(collegeRaw).map(item => cleanKeys(item));

    // Read and parse gus.json
    let gusRaw = fs.readFileSync(gusPath, "utf8");
    if (gusRaw.charCodeAt(0) === 0xfeff) gusRaw = gusRaw.slice(1);
    const gusData = JSON.parse(gusRaw).map(item => cleanKeys(item));

    console.log(`✅ Loaded ${collegeData.length} colleges and ${gusData.length} GUS universities`);

    return {
      colleges: collegeData,
      gusUniversities: gusData
    };
  } catch (err) {
    console.error("❌ Failed to load university data:", err.message);
    return { colleges: [], gusUniversities: [] };
  }
};

// Get combined list of all institutions
export const getAllInstitutions = () => {
  const data = loadUniversityData();
  return [...data.colleges, ...data.gusUniversities];
};

// Get statistics about the data
export const getDataStats = () => {
  const data = loadUniversityData();
  
  // Calculate total programs from GUS data
  let totalPrograms = 0;
  data.gusUniversities.forEach(uni => {
    if (uni.GUS_DATA?.programs_data) {
      totalPrograms += uni.GUS_DATA.programs_data.length;
    }
  });

  return {
    colleges: data.colleges.length,
    gusUniversities: data.gusUniversities.length,
    total: data.colleges.length + data.gusUniversities.length,
    totalPrograms,
    collegesFile: "colleges.json",
    gusFile: "gus.json"
  };
};

// Search through institutions
export const searchInstitutions = (query) => {
  if (!query || !query.trim()) {
    return getAllInstitutions().slice(0, 100);
  }

  const q = query.toLowerCase();
  const allInstitutions = getAllInstitutions();

  return allInstitutions.filter(inst => {
    // Search in various fields
    return (
      (inst.INSTNM && inst.INSTNM.toLowerCase().includes(q)) ||
      (inst.IALIAS && inst.IALIAS.toLowerCase().includes(q)) ||
      (inst.CITY && inst.CITY.toLowerCase().includes(q)) ||
      (inst.STABBR && inst.STABBR.toLowerCase().includes(q)) ||
      (inst.COUNTRY && inst.COUNTRY.toLowerCase().includes(q)) ||
      (inst.GUS_DATA?.country && inst.GUS_DATA.country.toLowerCase().includes(q))
    );
  }).slice(0, 100); // Limit results
};

// Get institution by ID
export const getInstitutionById = (id) => {
  const allInstitutions = getAllInstitutions();
  return allInstitutions.find(inst => inst.UNITID == id);
};

// Format institution data for display
export const formatInstitutionData = (institution) => {
  const isGUS = !!institution.GUS_DATA;
  
  return {
    id: institution.UNITID,
    name: institution.INSTNM || "Unknown",
    alias: institution.IALIAS || "",
    type: isGUS ? "GUS University" : "College",
    address: institution.ADDR || "",
    city: institution.CITY || "",
    state: institution.STABBR || "",
    zip: institution.ZIP || "",
    country: isGUS ? institution.GUS_DATA?.country || "USA" : "USA",
    phone: institution.GENTELE || "",
    website: institution.WEBADDR || "",
    adminUrl: institution.ADMINURL || "",
    faidUrl: institution.FAIDURL || "",
    applUrl: institution.APPLURL || "",
    chancellor: institution.CHFNM || "",
    chancellorTitle: institution.CHFTITLE || "",
    latitude: institution.LATITUDE || null,
    longitude: institution.LONGITUD || null,
    programs: institution.GUS_DATA?.programs_data || [],
    majorAreas: institution.GUS_DATA?.major_areas || [],
    level: institution.GUS_DATA?.level || "Undergraduate",
    metadata: {
      unitId: institution.UNITID,
      fips: institution.FIPS,
      obereg: institution.OBEREG,
      sector: institution.SECTOR,
      iclevel: institution.ICLEVEL,
      control: institution.CONTROL,
      hloffer: institution.HLOFFER,
      ugoffer: institution.UGOFFER,
      groffer: institution.GROFFER,
      deggrant: institution.DEGGRANT,
      locale: institution.LOCALE,
      instsize: institution.INSTSIZE,
      carnegie: institution.CARNEGIE || institution.C15BASIC || institution.C18BASIC || institution.C21BASIC
    }
  };
};