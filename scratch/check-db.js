require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function check() {
  const uri = process.env.MONGO_URI;
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected successfully!');
    
    for (const dbName of ['envision', 'test']) {
      console.log(`\n--- DB: ${dbName} ---`);
      const dbConnection = mongoose.connection.useDb(dbName);
      const admins = await dbConnection.db.collection('admins').find({}).toArray();
      console.log(`Found ${admins.length} admins:`);
      for (const a of admins) {
        console.log(`- ID: ${a._id}, Email: "${a.email}", Name: "${a.name}"`);
      }
    }
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
