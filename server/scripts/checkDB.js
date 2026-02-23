// scripts/checkDB.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'universityDB';

async function checkDB() {
  console.log('🔍 Database Check');
  console.log('================================');
  
  const client = new MongoClient(MONGODB_URI);

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected\n');

    const db = client.db(DB_NAME);

    // List all collections
    console.log('📚 Collections in database:');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('   No collections found');
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`   📁 ${collection.name}: ${count} documents`);
      }
    }

    // Check colleges collection
    console.log('\n🏛️  Colleges Collection:');
    const collegesCount = await db.collection('colleges').countDocuments();
    console.log(`   Total: ${collegesCount} documents`);
    
    if (collegesCount > 0) {
      const sample = await db.collection('colleges').findOne();
      console.log('   Sample:', {
        UNITID: sample.UNITID,
        INSTNM: sample.INSTNM,
        CITY: sample.CITY,
        STABBR: sample.STABBR
      });
    }

    // Check GUS collection
    console.log('\n🎓 GUS Universities Collection:');
    const gusCount = await db.collection('gusuniversities').countDocuments();
    console.log(`   Total: ${gusCount} documents`);
    
    if (gusCount > 0) {
      const sample = await db.collection('gusuniversities').findOne();
      console.log('   Sample:', {
        UNITID: sample.UNITID,
        INSTNM: sample.INSTNM,
        country: sample.GUS_DATA?.country,
        programs: sample.GUS_DATA?.programs_data?.length || 0
      });
    }

    // Group by country for GUS
    if (gusCount > 0) {
      const countries = await db.collection('gusuniversities').aggregate([
        { $group: { _id: "$GUS_DATA.country", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      console.log('\n🌍 GUS Universities by Country:');
      countries.forEach(c => {
        console.log(`   ${c._id || 'Unknown'}: ${c.count}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected');
  }
}

checkDB();