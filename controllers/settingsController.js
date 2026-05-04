const Settings = require('../models/Settings');
const mongoose = require('mongoose');
const fs = require('fs');

exports.getSettings = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Settings.findOne({ key });
    if (!setting) {
      return res.json({ key, value: '' });
    }

    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    let { value } = req.body;

    if (key === 'homeVideo') {
      const oldSetting = await Settings.findOne({ key });
      
      // If uploading new file or clearing, delete old GridFS file
      if (req.file || !value) {
        if (oldSetting && oldSetting.value && oldSetting.value.includes('/api/settings/video/')) {
          const oldVideoId = oldSetting.value.split('/').pop();
          try {
            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
              bucketName: 'videos'
            });
            await bucket.delete(new mongoose.Types.ObjectId(oldVideoId));
          } catch (err) {
            console.error('Error deleting old GridFS video:', err);
          }
        }
      }

      if (req.file) {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
          bucketName: 'videos'
        });

        const uploadStream = bucket.openUploadStream(req.file.originalname, {
          contentType: req.file.mimetype
        });

        // Use a Promise to handle the stream upload
        const fileId = await new Promise((resolve, reject) => {
          uploadStream.on('error', reject);
          uploadStream.on('finish', () => resolve(uploadStream.id));
          fs.createReadStream(req.file.path).pipe(uploadStream);
        });

        // Delete the temporary file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete temp video file:', err);
        });

        value = `/api/settings/video/${fileId}`;
      }
    }

    let setting = await Settings.findOne({ key });
    if (setting) {
      setting.value = value || '';
      await setting.save();
    } else {
      setting = new Settings({ key, value: value || '' });
      await setting.save();
    }

    res.json(setting);
  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.serveVideo = async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'videos'
    });

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).send('Video not found');
    }

    const file = files[0];
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.contentType || 'video/mp4',
        'Cache-Control': 'public, max-age=31536000, immutable'
      });

      const downloadStream = bucket.openDownloadStream(fileId, {
        start,
        end: end + 1
      });
      downloadStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': file.length,
        'Content-Type': file.contentType || 'video/mp4',
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      const downloadStream = bucket.openDownloadStream(fileId);
      downloadStream.pipe(res);
    }
  } catch (err) {
    console.error('Serve video error:', err);
    res.status(404).send('Video not found');
  }
};
