require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { execSync } = require('child_process');

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'https://cleint-12-g1yv.vercel.app', 'https://new-sajal-frontend.vercel.app'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs', require('./routes/blog'));
app.use('/api/enquiry', require('./routes/enquiry'));
app.use('/api/settings', require('./routes/settings'));

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🚀 Envision Blog API is running.' });
});

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ── Helper: kill whatever is using a port on Windows ───────
const freePort = (port) => {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = result.trim().split('\n');
    const pids = new Set();
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    });
    pids.forEach(pid => {
      try {
        execSync(`taskkill /F /PID ${pid}`);
        console.log(`🔫 Freed port ${port} by killing PID ${pid}`);
      } catch (_) { }
    });
  } catch (_) {
    // Port was already free
  }
};

// ── Connect to MongoDB & Start Server ──────────────────────
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5001;

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`📦 API Base: http://localhost:${PORT}/api`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️  Port ${PORT} is busy — freeing it and retrying...`);
        freePort(PORT);
        setTimeout(() => {
          server.close();
          app.listen(PORT, () => {
            console.log(`\n🚀 Server running at http://localhost:${PORT}`);
            console.log(`📦 API Base: http://localhost:${PORT}/api`);
          });
        }, 1000);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
