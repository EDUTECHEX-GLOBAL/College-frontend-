import fs from 'fs';
import path from 'path';  // Fix: Import path from 'path', not from 'fs'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to data files - adjust this based on where your JSON files are located
const DATA_DIR = path.join(__dirname, '../data'); // Try this first - files in server/data/
// Alternative paths if the above doesn't work:
// const DATA_DIR = path.join(__dirname, '../../data'); // files in project root/data/
// const DATA_DIR = path.join(process.cwd(), 'data'); // files in current working directory/data

const UNIVERSITIES_FILE = path.join(DATA_DIR, 'universities.json');
const COLLEGES_FILE = path.join(DATA_DIR, 'colleges.json');

// Cache for loaded data
let cachedData = null;

/* ================================
   LOAD UNIVERSITY DATA FROM FILES
================================ */
export const loadUniversityData = () => {
  try {
    console.log('Looking for data files in:', DATA_DIR);
    
    // Check if files exist
    if (!fs.existsSync(UNIVERSITIES_FILE)) {
      console.error(`Universities file not found: ${UNIVERSITIES_FILE}`);
      return { colleges: [], gusUniversities: [] };
    }

    if (!fs.existsSync(COLLEGES_FILE)) {
      console.error(`Colleges file not found: ${COLLEGES_FILE}`);
      return { colleges: [], gusUniversities: [] };
    }

    // Read and parse universities data
    const universitiesRaw = fs.readFileSync(UNIVERSITIES_FILE, 'utf8');
    const universitiesData = JSON.parse(universitiesRaw);

    // Read and parse colleges data
    const collegesRaw = fs.readFileSync(COLLEGES_FILE, 'utf8');
    const collegesData = JSON.parse(collegesRaw);

    // Extract arrays based on your JSON structure
    // Adjust these based on your actual JSON format
    const gusUniversities = Array.isArray(universitiesData) 
      ? universitiesData 
      : universitiesData.data || universitiesData.universities || [];

    const colleges = Array.isArray(collegesData) 
      ? collegesData 
      : collegesData.data || collegesData.colleges || [];

    // Cache the data
    cachedData = {
      gusUniversities,
      colleges,
      stats: {
        totalUniversities: gusUniversities.length,
        totalColleges: colleges.length,
        lastLoaded: new Date().toISOString()
      }
    };

    console.log(`Loaded ${gusUniversities.length} universities and ${colleges.length} colleges from files`);

    return {
      colleges,
      gusUniversities
    };
  } catch (error) {
    console.error('Error loading university data:', error);
    return { colleges: [], gusUniversities: [] };
  }
};

/* ================================
   GET DATA STATS
================================ */
export const getDataStats = () => {
  try {
    // If no cached data, load it
    if (!cachedData) {
      loadUniversityData();
    }

    // Check if files exist for file info
    let universitiesFileExists = false;
    let collegesFileExists = false;
    let universitiesFileSize = 0;
    let universitiesFileModified = null;
    let collegesFileSize = 0;
    let collegesFileModified = null;

    try {
      if (fs.existsSync(UNIVERSITIES_FILE)) {
        universitiesFileExists = true;
        const uniStat = fs.statSync(UNIVERSITIES_FILE);
        universitiesFileSize = uniStat.size;
        universitiesFileModified = uniStat.mtime;
      }

      if (fs.existsSync(COLLEGES_FILE)) {
        collegesFileExists = true;
        const colStat = fs.statSync(COLLEGES_FILE);
        collegesFileSize = colStat.size;
        collegesFileModified = colStat.mtime;
      }
    } catch (err) {
      console.error('Error getting file stats:', err);
    }

    return {
      universities: {
        count: cachedData?.gusUniversities?.length || 0,
        fileExists: universitiesFileExists,
        fileSize: universitiesFileSize,
        lastModified: universitiesFileModified
      },
      colleges: {
        count: cachedData?.colleges?.length || 0,
        fileExists: collegesFileExists,
        fileSize: collegesFileSize,
        lastModified: collegesFileModified
      },
      total: (cachedData?.gusUniversities?.length || 0) + (cachedData?.colleges?.length || 0),
      lastLoaded: cachedData?.stats?.lastLoaded || null
    };
  } catch (error) {
    console.error('Error getting data stats:', error);
    return {
      universities: { count: 0, fileExists: false },
      colleges: { count: 0, fileExists: false },
      total: 0,
      error: error.message
    };
  }
};

/* ================================
   REFRESH DATA CACHE
================================ */
export const refreshDataCache = () => {
  cachedData = null;
  return loadUniversityData();
};

/* ================================
   GET UNIVERSITIES BY FILTER
================================ */
export const getUniversitiesByFilter = (filter = {}) => {
  const { gusUniversities } = loadUniversityData();
  
  if (!gusUniversities || gusUniversities.length === 0) {
    return [];
  }

  return gusUniversities.filter(uni => {
    for (const [key, value] of Object.entries(filter)) {
      if (uni[key] !== value) {
        return false;
      }
    }
    return true;
  });
};

/* ================================
   GET COLLEGES BY FILTER
================================ */
export const getCollegesByFilter = (filter = {}) => {
  const { colleges } = loadUniversityData();
  
  if (!colleges || colleges.length === 0) {
    return [];
  }

  return colleges.filter(col => {
    for (const [key, value] of Object.entries(filter)) {
      if (col[key] !== value) {
        return false;
      }
    }
    return true;
  });
};

/* ================================
   SEARCH UNIVERSITIES IN FILE
================================ */
export const searchUniversitiesInFile = (searchTerm) => {
  const { gusUniversities } = loadUniversityData();
  
  if (!gusUniversities || gusUniversities.length === 0 || !searchTerm) {
    return [];
  }

  const term = searchTerm.toLowerCase();
  
  return gusUniversities.filter(uni => {
    return (
      (uni.INSTNM && uni.INSTNM.toLowerCase().includes(term)) ||
      (uni.IALIAS && uni.IALIAS.toLowerCase().includes(term)) ||
      (uni.CITY && uni.CITY.toLowerCase().includes(term)) ||
      (uni.STABBR && uni.STABBR.toLowerCase().includes(term))
    );
  });
};

/* ================================
   SEARCH COLLEGES IN FILE
================================ */
export const searchCollegesInFile = (searchTerm) => {
  const { colleges } = loadUniversityData();
  
  if (!colleges || colleges.length === 0 || !searchTerm) {
    return [];
  }

  const term = searchTerm.toLowerCase();
  
  return colleges.filter(col => {
    return (
      (col.INSTNM && col.INSTNM.toLowerCase().includes(term)) ||
      (col.IALIAS && col.IALIAS.toLowerCase().includes(term)) ||
      (col.CITY && col.CITY.toLowerCase().includes(term)) ||
      (col.STABBR && col.STABBR.toLowerCase().includes(term))
    );
  });
};

/* ================================
   GET UNIVERSITY BY UNITID
================================ */
export const getUniversityByUnitId = (unitId) => {
  const { gusUniversities } = loadUniversityData();
  
  if (!gusUniversities || gusUniversities.length === 0) {
    return null;
  }

  return gusUniversities.find(uni => uni.UNITID == unitId) || null;
};

/* ================================
   GET COLLEGE BY UNITID
================================ */
export const getCollegeByUnitId = (unitId) => {
  const { colleges } = loadUniversityData();
  
  if (!colleges || colleges.length === 0) {
    return null;
  }

  return colleges.find(col => col.UNITID == unitId) || null;
};

/* ================================
   VALIDATE DATA FILES
================================ */
export const validateDataFiles = () => {
  const issues = [];

  try {
    // Check if directories exist
    if (!fs.existsSync(DATA_DIR)) {
      issues.push(`Data directory does not exist: ${DATA_DIR}`);
      return { valid: false, issues };
    }

    // Check universities file
    if (!fs.existsSync(UNIVERSITIES_FILE)) {
      issues.push(`Universities file not found: ${UNIVERSITIES_FILE}`);
    } else {
      try {
        const content = fs.readFileSync(UNIVERSITIES_FILE, 'utf8');
        JSON.parse(content);
      } catch (err) {
        issues.push(`Universities file contains invalid JSON: ${err.message}`);
      }
    }

    // Check colleges file
    if (!fs.existsSync(COLLEGES_FILE)) {
      issues.push(`Colleges file not found: ${COLLEGES_FILE}`);
    } else {
      try {
        const content = fs.readFileSync(COLLEGES_FILE, 'utf8');
        JSON.parse(content);
      } catch (err) {
        issues.push(`Colleges file contains invalid JSON: ${err.message}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  } catch (error) {
    return {
      valid: false,
      issues: [`Validation error: ${error.message}`]
    };
  }
};