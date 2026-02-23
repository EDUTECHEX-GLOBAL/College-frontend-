// scripts/importToUniversities.js
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://college:12345@college.fdqhrql.mongodb.net';
const DB_NAME = 'test';
const COLLECTION_NAME = 'universities';

async function importToUniversities() {
  console.log('🚀 Starting import to universities collection...');
  console.log('===============================================');
  
  const client = new MongoClient(MONGODB_URI);

  try {
    // Connect to MongoDB
    console.log('1️⃣ Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Check and fix indexes
    console.log('2️⃣ Checking indexes...');
    const indexes = await collection.indexes();
    
    // Find and drop any universityCode index
    for (const index of indexes) {
      if (index.name.includes('universityCode') || index.key.universityCode) {
        console.log(`   Found problematic index: ${index.name}`);
        await collection.dropIndex(index.name);
        console.log(`   ✅ Dropped index: ${index.name}`);
      }
    }
    
    // Create a good index on UNITID instead
    await collection.createIndex({ UNITID: 1 }, { unique: true, name: 'unitid_unique' });
    console.log('   ✅ Created UNITID unique index\n');

    // Read JSON files
    console.log('3️⃣ Reading JSON files...');
    const collegesPath = path.join(__dirname, '../colleges.json');
    const gusPath = path.join(__dirname, '../gus.json');
    
    if (!fs.existsSync(collegesPath)) {
      throw new Error(`colleges.json not found at ${collegesPath}`);
    }
    if (!fs.existsSync(gusPath)) {
      throw new Error(`gus.json not found at ${gusPath}`);
    }

    const collegesData = JSON.parse(fs.readFileSync(collegesPath, 'utf8'));
    const gusData = JSON.parse(fs.readFileSync(gusPath, 'utf8'));
    
    console.log(`   📊 Colleges: ${collegesData.length} records`);
    console.log(`   📊 GUS Universities: ${gusData.length} records\n`);

    // Clear existing data
    console.log('4️⃣ Clearing existing data...');
    await collection.deleteMany({});
    console.log('   ✅ Collection cleared\n');

    // Prepare data for import
    console.log('5️⃣ Preparing data...');
    
    // Add type field to distinguish between regular and GUS
    const allUniversities = [
      ...collegesData.map(college => ({
        ...college,
        type: 'regular',
        importedAt: new Date()
      })),
      ...gusData.map(gus => ({
        ...gus,
        type: 'gus',
        importedAt: new Date()
      }))
    ];

    console.log(`   ✅ Prepared ${allUniversities.length} documents\n`);

    // Import data in batches
    console.log('6️⃣ Importing data...');
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < allUniversities.length; i += batchSize) {
      const batch = allUniversities.slice(i, i + batchSize);
      
      // Use insertMany with ordered: false to continue on errors
      try {
        const result = await collection.insertMany(batch, { ordered: false });
        imported += Object.keys(result.insertedIds).length;
        console.log(`   Progress: ${imported}/${allUniversities.length} documents imported`);
      } catch (batchError) {
        console.log(`   ⚠️ Batch ${i/batchSize + 1} had some errors, but continuing...`);
        // Count actual documents after batch insert
        const count = await collection.countDocuments();
        imported = count;
      }
    }

    // Final count
    const finalCount = await collection.countDocuments();
    console.log(`\n✅ Successfully imported ${finalCount} documents`);

    // Show sample data
    console.log('\n📋 Sample Documents:');
    const samples = await collection.find().limit(2).toArray();
    samples.forEach((sample, idx) => {
      console.log(`\n   Document ${idx + 1}:`);
      console.log(`      UNITID: ${sample.UNITID}`);
      console.log(`      Name: ${sample.INSTNM}`);
      console.log(`      Type: ${sample.type || 'regular'}`);
      if (sample.GUS_DATA) {
        console.log(`      Programs: ${sample.GUS_DATA.programs_data?.length || 0}`);
      }
    });

    // Statistics
    console.log('\n📊 Statistics:');
    const regularCount = await collection.countDocuments({ type: 'regular' });
    const gusCount = await collection.countDocuments({ type: 'gus' });
    console.log(`   Regular Colleges: ${regularCount}`);
    console.log(`   GUS Universities: ${gusCount}`);
    console.log(`   Total: ${finalCount}`);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the import
importToUniversities();