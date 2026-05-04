const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);
