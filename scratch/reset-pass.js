require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

const resetPass = async () => {
  try {
    await connectDB();
    const email = 'Saj@myenvisionltd.com';
    const newPassword = 'password123'; // Setting a simple test password

    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log('Admin not found');
      process.exit(1);
    }

    admin.password = newPassword;
    await admin.save(); // This will trigger the pre-save hook to hash the new password

    console.log(`Password reset to: ${newPassword}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetPass();
