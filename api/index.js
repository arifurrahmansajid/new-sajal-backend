require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');

// Connect to MongoDB
connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://cleint-12-g1yv.vercel.app',
  'https://new-sajal-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const routes = express.Router();
routes.use('/auth', require('../routes/auth'));
routes.use('/blogs', require('../routes/blog'));
routes.use('/enquiry', require('../routes/enquiry'));
routes.use('/settings', require('../routes/settings'));

app.use('/api', routes);
app.use('/', routes);


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
