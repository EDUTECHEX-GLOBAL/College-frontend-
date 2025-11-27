import fs from "fs";
import path from "path";

// ✅ FIXED: Correct path (only one "server" folder)
const dataPath = path.join(process.cwd(), "data", "colleges.json");
const cleanPath = path.join(process.cwd(), "data", "colleges_clean.json");

try {
  console.log("🧹 Cleaning JSON file...");

  let raw = fs.readFileSync(dataPath, "utf8");

  // Remove BOM if present
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }

  const data = JSON.parse(raw);

  // Clean all keys
  const cleaned = data.map((item) => {
    const cleanItem = {};
    for (const key in item) {
      const cleanKey = key.replace(/[^\x20-\x7E]/g, "").trim(); // remove hidden BOM/non-printables
      cleanItem[cleanKey] = item[key];
    }
    return cleanItem;
  });

  fs.writeFileSync(cleanPath, JSON.stringify(cleaned, null, 2));
  console.log(`✅ Cleaned ${cleaned.length} records.`);
  console.log(`📁 Saved as: ${cleanPath}`);
  console.log(`🧭 Example keys: ${Object.keys(cleaned[0]).slice(0, 5).join(", ")}`);
} catch (err) {
  console.error("❌ Cleaning failed:", err);
}
