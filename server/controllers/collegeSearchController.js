import fs from "fs";
import path from "path";
import { getGoogleFavicon, getFallbackLogo } from "../services/logoService.js";

const dataPath = path.join(process.cwd(), "data", "colleges.json");

// Load + clean data once
let colleges = [];

try {
  let raw = fs.readFileSync(dataPath, "utf8");

  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  const parsed = JSON.parse(raw);

  colleges = parsed.map((item) => {
    const cleaned = {};

    // Clean invisible characters from keys
    for (const key in item) {
      const cleanKey = key.replace(/[^\x20-\x7E]/g, "").trim();
      cleaned[cleanKey] = item[key];
    }

    // Logo (Google Favicon)
    cleaned.logo = getGoogleFavicon(cleaned.WEBADDR);

    // Fallback
    cleaned.fallbackLogo = getFallbackLogo();

    return cleaned;
  });

  console.log(`✅ ${colleges.length} colleges loaded (with Google logo)`);
} catch (err) {
  console.error("❌ Failed to load colleges:", err.message);
}

// Controller Search Function
export const searchColleges = (req, res) => {
  try {
    const { query } = req.query;

    let results = colleges;

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();

      results = colleges.filter((c) =>
        [c.INSTNM, c.CITY, c.STABBR, c.IALIAS]
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
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
