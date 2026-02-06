import fs from "fs";
import path from "path";
import { getGoogleFavicon, getFallbackLogo } from "../services/logoService.js";

// Paths
const collegesPath = path.join(process.cwd(), "data", "colleges.json");
const gusPath = path.join(process.cwd(), "data", "gus.json");

// Combined colleges list
let colleges = [];

// Utility loader
const loadData = (filePath) => {
  let raw = fs.readFileSync(filePath, "utf8");

  // Remove BOM if present
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  const parsed = JSON.parse(raw);

  return parsed.map((item) => {
    const cleaned = {};

    // Clean keys
    for (const key in item) {
      const cleanKey = key.replace(/[^\x20-\x7E]/g, "").trim();
      cleaned[cleanKey] = item[key];
    }

    // Attach logos
    cleaned.logo = getGoogleFavicon(cleaned.WEBADDR || cleaned.WEBSITE);
    cleaned.fallbackLogo = getFallbackLogo();

    return cleaned;
  });
};

// Load data once on server start
try {
  const collegeData = loadData(collegesPath);
  const gusData = loadData(gusPath);

  colleges = [...collegeData, ...gusData];

  console.log(
    `✅ Loaded ${collegeData.length} colleges + ${gusData.length} GUS universities`
  );
} catch (err) {
  console.error("❌ Failed to load college data:", err.message);
}

// 🔍 SEARCH API
export const searchColleges = (req, res) => {
  try {
    const { query } = req.query;
    let results = colleges;

    if (query && query.trim()) {
      const q = query.toLowerCase();

      results = colleges.filter((c) =>
        [c.INSTNM, c.CITY, c.STABBR]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: results.length,
      colleges: results.slice(0, 100),
    });
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
