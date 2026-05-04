require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'Saj@myenvisionltd.com';
  const password = process.env.ADMIN_PASSWORD || 'qmZU^xf00v^b8hxP';
  const name = 'Super Admin';

  const exists = await Admin.findOne({ email });
  if (exists) {
    console.log(`⚠️  Admin already exists: ${email}`);
    console.log('   To reset, delete the admin from MongoDB and re-run seed.');
    process.exit(0);
  }

  await Admin.create({ email, password, name, role: 'superadmin' });
  console.log(`\n✅ Super Admin created!`);
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log(`\n🔑 Change your password after first login!\n`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
