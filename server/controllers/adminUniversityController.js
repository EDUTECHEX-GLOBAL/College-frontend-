// controllers/adminUniversityController.js
import fs from "fs";
import path from "path";
import University from "../models/University.js";
import College from "../models/College.js";
import { 
  loadUniversityData, 
  getDataStats,
  searchInstitutions,
  getInstitutionById,
  formatInstitutionData
} from "../services/adminUniversityService.js";

// 📊 GET IMPORT STATS
export const getImportStats = async (req, res) => {
  try {
    // Get counts from database
    const universitiesCount = await University.countDocuments();
    const collegesCount = await College.countDocuments();
    
    // Get stats from JSON files
    const fileStats = getDataStats();
    
    // Get most recent imports
    const latestUniversity = await University.findOne().sort({ createdAt: -1 });
    const latestCollege = await College.findOne().sort({ createdAt: -1 });
    
    const latestTimestamp = latestUniversity?.createdAt || latestCollege?.createdAt || null;

    res.json({
      success: true,
      data: {
        database: {
          universities: universitiesCount,
          colleges: collegesCount,
          total: universitiesCount + collegesCount
        },
        files: {
          universities: fileStats.gusUniversities,
          colleges: fileStats.colleges,
          total: fileStats.total,
          totalPrograms: fileStats.totalPrograms,
          collegesFile: fileStats.collegesFile,
          gusFile: fileStats.gusFile
        },
        lastUpdated: latestTimestamp,
        lastUpdatedFormatted: latestTimestamp ? new Date(latestTimestamp).toLocaleString() : "Never"
      }
    });

  } catch (error) {
    console.error("❌ Get Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch import stats",
      error: error.message
    });
  }
};

// 📥 IMPORT UNIVERSITIES & COLLEGES
export const importUniversities = async (req, res) => {
  try {
    console.log("🚀 Starting university import...");
    
    // Load data from JSON files
    const { colleges, gusUniversities } = loadUniversityData();
    
    if (colleges.length === 0 && gusUniversities.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found in JSON files"
      });
    }

    console.log(`📚 Found ${gusUniversities.length} universities and ${colleges.length} colleges to import`);

    // Track import stats
    let importedUniversities = 0;
    let importedColleges = 0;
    let updatedUniversities = 0;
    let updatedColleges = 0;

    // Import GUS Universities
    for (const uni of gusUniversities) {
      try {
        const formattedData = formatInstitutionData(uni);
        
        // Prepare university data for database
        const universityData = {
          universityCode: uni.UNITID?.toString() || `UNI-${Date.now()}-${importedUniversities}`,
          universityName: uni.INSTNM || "Unknown University",
          alias: uni.IALIAS || "",
          educationLevels: uni.GUS_DATA?.level ? [uni.GUS_DATA.level] : ["Undergraduate"],
          isVisible: true,
          importedByAdmin: true,
          location: {
            address: uni.ADDR || "",
            city: uni.CITY || "",
            state: uni.STABBR || "",
            country: uni.GUS_DATA?.country || "USA",
            zip: uni.ZIP || "",
            latitude: uni.LATITUDE,
            longitude: uni.LONGITUD
          },
          contact: {
            phone: uni.GENTELE || "",
            website: uni.WEBADDR || "",
            adminUrl: uni.ADMINURL || "",
            faidUrl: uni.FAIDURL || "",
            applUrl: uni.APPLURL || ""
          },
          metadata: {
            unitId: uni.UNITID,
            alias: uni.IALIAS || "",
            chancellor: uni.CHFNM || "",
            chancellorTitle: uni.CHFTITLE || "",
            fips: uni.FIPS,
            obereg: uni.OBEREG,
            opeid: uni.OPEID,
            opeflag: uni.OPEFLAG,
            sector: uni.SECTOR,
            iclevel: uni.ICLEVEL,
            control: uni.CONTROL,
            hloffer: uni.HLOFFER,
            ugoffer: uni.UGOFFER,
            groffer: uni.GROFFER,
            hdegree: uni.HDEGOFR1,
            deggrant: uni.DEGGRANT,
            hbcu: uni.HBCU,
            hospital: uni.HOSPITAL,
            medical: uni.MEDICAL,
            tribal: uni.TRIBAL,
            locale: uni.LOCALE,
            openpubl: uni.OPENPUBL,
            instsize: uni.INSTSIZE,
            carnegie: uni.CARNEGIE || uni.C15BASIC || uni.C18BASIC || uni.C21BASIC,
            landgrant: uni.LANDGRNT,
            programs: uni.GUS_DATA?.programs_data || [],
            majorAreas: uni.GUS_DATA?.major_areas || []
          },
          stats: {
            totalPrograms: uni.GUS_DATA?.programs_data?.length || 0,
            totalCampuses: 1
          }
        };

        // Check if university exists
        const existing = await University.findOne({ universityCode: universityData.universityCode });
        
        if (existing) {
          await University.findOneAndUpdate(
            { universityCode: universityData.universityCode },
            universityData,
            { new: true }
          );
          updatedUniversities++;
        } else {
          await University.create(universityData);
          importedUniversities++;
        }
      } catch (uniError) {
        console.error(`Error importing university ${uni.INSTNM}:`, uniError.message);
      }
    }

    // Import Colleges
    for (const col of colleges) {
      try {
        const collegeData = {
          collegeCode: col.UNITID?.toString() || `COL-${Date.now()}-${importedColleges}`,
          collegeName: col.INSTNM || "Unknown College",
          alias: col.IALIAS || "",
          universityCode: "MAIN", // You might want to map this properly
          educationLevels: ["Undergraduate"],
          isVisible: true,
          importedByAdmin: true,
          location: {
            address: col.ADDR || "",
            city: col.CITY || "",
            state: col.STABBR || "",
            zip: col.ZIP || "",
            county: col.COUNTYNM || "",
            latitude: col.LATITUDE,
            longitude: col.LONGITUD
          },
          contact: {
            phone: col.GENTELE || "",
            website: col.WEBADDR || "",
            adminUrl: col.ADMINURL || "",
            faidUrl: col.FAIDURL || "",
            applUrl: col.APPLURL || "",
            vetUrl: col.VETURL || "",
            athUrl: col.ATHURL || "",
            disaUrl: col.DISAURL || ""
          },
          metadata: {
            unitId: col.UNITID,
            alias: col.IALIAS || "",
            chancellor: col.CHFNM || "",
            chancellorTitle: col.CHFTITLE || "",
            fips: col.FIPS,
            obereg: col.OBEREG,
            ein: col.EIN,
            ueis: col.UEIS,
            opeid: col.OPEID,
            opeflag: col.OPEFLAG,
            sector: col.SECTOR,
            iclevel: col.ICLEVEL,
            control: col.CONTROL,
            hloffer: col.HLOFFER,
            ugoffer: col.UGOFFER,
            groffer: col.GROFFER,
            hdegree: col.HDEGOFR1,
            deggrant: col.DEGGRANT,
            hbcu: col.HBCU,
            hospital: col.HOSPITAL,
            medical: col.MEDICAL,
            tribal: col.TRIBAL,
            locale: col.LOCALE,
            openpubl: col.OPENPUBL,
            instsize: col.INSTSIZE,
            carnegie: col.CARNEGIE || col.C15BASIC || col.C18BASIC || col.C21BASIC,
            landgrant: col.LANDGRNT,
            cbsa: col.CBSA,
            cbsatype: col.CBSATYPE,
            csa: col.CSA,
            countycd: col.COUNTYCD,
            cngdstcd: col.CNGDSTCD
          }
        };

        // Check if college exists
        const existing = await College.findOne({ collegeCode: collegeData.collegeCode });
        
        if (existing) {
          await College.findOneAndUpdate(
            { collegeCode: collegeData.collegeCode },
            collegeData,
            { new: true }
          );
          updatedColleges++;
        } else {
          await College.create(collegeData);
          importedColleges++;
        }
      } catch (colError) {
        console.error(`Error importing college ${col.INSTNM}:`, colError.message);
      }
    }

    const totalImported = importedUniversities + importedColleges;
    const totalUpdated = updatedUniversities + updatedColleges;

    console.log(`✅ Import complete: ${totalImported} new, ${totalUpdated} updated`);

    res.json({
      success: true,
      message: "University & College data imported successfully",
      data: {
        imported: {
          universities: importedUniversities,
          colleges: importedColleges,
          total: totalImported
        },
        updated: {
          universities: updatedUniversities,
          colleges: updatedColleges,
          total: totalUpdated
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Import Error:", error);
    res.status(500).json({
      success: false,
      message: "Import failed",
      error: error.message
    });
  }
};

// 📋 GET ALL UNIVERSITIES FROM DATABASE
export const getAllUniversities = async (req, res) => {
  try {
    const universities = await University.find().sort({ universityName: 1 });
    
    res.json({
      success: true,
      data: universities,
      count: universities.length
    });
  } catch (error) {
    console.error("❌ Get Universities Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch universities",
      error: error.message
    });
  }
};

// 📋 GET ALL COLLEGES FROM DATABASE
export const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find().sort({ collegeName: 1 });
    
    res.json({
      success: true,
      data: colleges,
      count: colleges.length
    });
  } catch (error) {
    console.error("❌ Get Colleges Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch colleges",
      error: error.message
    });
  }
};

// 🔍 SEARCH UNIVERSITIES IN DATABASE
export const searchUniversities = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return getAllUniversities(req, res);
    }

    const query = q.toLowerCase();
    
    const universities = await University.find({
      $or: [
        { universityName: { $regex: query, $options: 'i' } },
        { alias: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.state': { $regex: query, $options: 'i' } },
        { 'location.country': { $regex: query, $options: 'i' } },
        { universityCode: { $regex: query, $options: 'i' } }
      ]
    }).sort({ universityName: 1 });

    res.json({
      success: true,
      data: universities,
      count: universities.length,
      query: q
    });
  } catch (error) {
    console.error("❌ Search Universities Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search universities",
      error: error.message
    });
  }
};

// 🔍 SEARCH COLLEGES IN DATABASE
export const searchColleges = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return getAllColleges(req, res);
    }

    const query = q.toLowerCase();
    
    const colleges = await College.find({
      $or: [
        { collegeName: { $regex: query, $options: 'i' } },
        { alias: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.state': { $regex: query, $options: 'i' } },
        { 'location.zip': { $regex: query, $options: 'i' } },
        { collegeCode: { $regex: query, $options: 'i' } }
      ]
    }).sort({ collegeName: 1 });

    res.json({
      success: true,
      data: colleges,
      count: colleges.length,
      query: q
    });
  } catch (error) {
    console.error("❌ Search Colleges Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search colleges",
      error: error.message
    });
  }
};

// 📄 GET UNIVERSITY BY ID
export const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const university = await University.findOne({
      $or: [
        { _id: id },
        { universityCode: id }
      ]
    });

    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    res.json({
      success: true,
      data: university
    });
  } catch (error) {
    console.error("❌ Get University Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university",
      error: error.message
    });
  }
};

// 📄 GET COLLEGE BY ID
export const getCollegeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const college = await College.findOne({
      $or: [
        { _id: id },
        { collegeCode: id }
      ]
    });

    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found"
      });
    }

    res.json({
      success: true,
      data: college
    });
  } catch (error) {
    console.error("❌ Get College Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch college",
      error: error.message
    });
  }
};

// 🔄 REFRESH DATA (reload from files)
export const refreshData = async (req, res) => {
  try {
    // Just reload the data and return stats
    const fileStats = getDataStats();
    
    res.json({
      success: true,
      message: "Data refreshed successfully",
      data: fileStats
    });
  } catch (error) {
    console.error("❌ Refresh Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh data",
      error: error.message
    });
  }
};