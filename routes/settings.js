const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

const os = require('os');
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir()
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for video
});

// Public route to get a setting
router.get('/:key', settingsController.getSettings);

// Public route to serve video
router.get('/video/:id', settingsController.serveVideo);

// Admin route to update a setting (supports optional file upload)
router.put('/:key', protect, upload.single('video'), settingsController.updateSetting);

module.exports = router;
