const mongoose = require('mongoose');

// Sub-schema for gallery images — each gets its own _id for clean removal
const additionalImageSchema = new mongoose.Schema({
  data:        { type: Buffer, required: true },
  contentType: { type: String, required: true },
});

const blogSchema = new mongoose.Schema(
  {
    title:   { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author:  { type: String, required: true, trim: true },

    // Stores API path: /api/blogs/image/:id
    image: { type: String, required: true },

    // Stores API paths: /api/blogs/image/:blogId/additional/:subId
    additionalImages: { type: [String], default: [] },

    // Raw binary for main image
    imageData:        { type: Buffer },
    imageContentType: { type: String },

    // Raw binary for gallery images (subdocs with auto _id)
    additionalImagesData: { type: [additionalImageSchema], default: [] },

    date:      { type: Date,    default: Date.now },
    slug:      { type: String,  unique: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate slug from title
blogSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') +
      '-' +
      Date.now();
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
