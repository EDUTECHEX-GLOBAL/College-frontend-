// scripts/testEnv.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Environment Variables Test');
console.log('================================');
console.log('MONGODB_URI:', process.env.MONGODB_URI || '❌ Not found');
console.log('MONGODB_DB_NAME:', process.env.MONGODB_DB_NAME || '❌ Not found');
console.log('PORT:', process.env.PORT || '❌ Not found');
console.log('CLIENT_URL:', process.env.CLIENT_URL || '❌ Not found');
console.log('================================');

// Test MongoDB connection
import { MongoClient } from 'mongodb';

async function testConnection() {
  if (!process.env.MONGODB_URI) {
    console.log('❌ Cannot test MongoDB: MONGODB_URI not found');
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('\n🔄 Testing MongoDB connection...');
    await client.connect();
    console.log('✅ MongoDB connection successful!');
    
    const db = client.db(process.env.MONGODB_DB_NAME);
    console.log(`✅ Database "${process.env.MONGODB_DB_NAME}" accessible`);
    
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();