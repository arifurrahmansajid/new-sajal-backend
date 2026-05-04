require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');

// Connect to MongoDB
connectDB();

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true;
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('../routes/auth'));
app.use('/api/blogs', require('../routes/blog'));
app.use('/api/enquiry', require('../routes/enquiry'));
app.use('/api/settings', require('../routes/settings'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🚀 Envision Blog API is running on Vercel.' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack || err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
