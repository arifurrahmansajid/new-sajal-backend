const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function checkAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admins = await Admin.find({});
    console.log("Admins found:");
    admins.forEach(a => console.log(`- Email: ${a.email}, Name: ${a.name}, Role: ${a.role}`));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkAdmins();
