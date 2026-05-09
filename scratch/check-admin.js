
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

async function checkAdmin() {
    await connectDB();
    const count = await Admin.countDocuments();
    console.log('Total Admins:', count);
    const admin = await Admin.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
    if (admin) {
        console.log('Admin found with email:', admin.email);
    } else {
        console.log('Admin NOT found with email:', process.env.ADMIN_EMAIL);
    }
    process.exit(0);
}

checkAdmin().catch(err => {
    console.error(err);
    process.exit(1);
});
