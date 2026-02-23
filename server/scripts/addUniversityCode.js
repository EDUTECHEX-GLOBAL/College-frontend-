// scripts/addUniversityCode.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateUniversityCode(unitid, instnm) {
  // Generate a unique code from UNITID and INSTNM
  const prefix = instnm.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 4);
  return `${prefix}_${unitid}`;
}

async function addUniversityCode() {
  console.log('🔧 Adding universityCode to JSON files...');
  
  // Process colleges.json
  const collegesPath = path.join(__dirname, '../colleges.json');
  const collegesData = JSON.parse(fs.readFileSync(collegesPath, 'utf8'));
  
  const updatedColleges = collegesData.map(college => ({
    ...college,
    universityCode: generateUniversityCode(college.UNITID, college.INSTNM)
  }));
  
  fs.writeFileSync(collegesPath, JSON.stringify(updatedColleges, null, 2));
  console.log(`✅ Updated ${updatedColleges.length} colleges with universityCode`);
  
  // Process gus.json
  const gusPath = path.join(__dirname, '../gus.json');
  const gusData = JSON.parse(fs.readFileSync(gusPath, 'utf8'));
  
  const updatedGus = gusData.map(gus => ({
    ...gus,
    universityCode: generateUniversityCode(gus.UNITID, gus.INSTNM)
  }));
  
  fs.writeFileSync(gusPath, JSON.stringify(updatedGus, null, 2));
  console.log(`✅ Updated ${updatedGus.length} GUS universities with universityCode`);
}

addUniversityCode();