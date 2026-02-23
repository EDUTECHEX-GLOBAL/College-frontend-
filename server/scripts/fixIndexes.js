// scripts/fixIndexes.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://college:12345@college.fdqhrql.mongodb.net';
const DB_NAME = 'test'; // Your database name is 'test'

async function fixIndexes() {
  console.log('🔧 Fixing Indexes...');
  console.log('================================');
  
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const collection = db.collection('universities');

    // List all indexes
    console.log('📋 Current Indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`   ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the problematic universityCode_1 index
    console.log('\n🔄 Dropping universityCode_1 index...');
    try {
      await collection.dropIndex('universityCode_1');
      console.log('✅ Successfully dropped universityCode_1 index');
    } catch (err) {
      console.log('⚠️ Index not found or already dropped');
    }

    // Drop any other null indexes
    try {
      await collection.dropIndex('universityCode_1');
    } catch (e) {}

    // Verify indexes after removal
    console.log('\n📋 Remaining Indexes:');
    const remainingIndexes = await collection.indexes();
    remainingIndexes.forEach(index => {
      console.log(`   ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Index cleanup completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected');
  }
}

fixIndexes();