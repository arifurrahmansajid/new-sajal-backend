const Blog = require('../models/Blog');
const mongoose = require('mongoose');

// ── Image Serving ──────────────────────────────────────────────────────────────

// @desc  Stream the main blog image stored as binary in MongoDB
// @route GET /api/blogs/image/:id
// @access Public
const serveImage = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).select('imageData imageContentType');
    if (!blog || !blog.imageData) {
      return res.status(404).send('Image not found.');
    }
    res.set('Content-Type', blog.imageContentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(blog.imageData);
  } catch {
    res.status(404).send('Image not found.');
  }
};

// @desc  Stream a gallery image subdocument from MongoDB
// @route GET /api/blogs/image/:blogId/additional/:subId
// @access Public
const serveAdditionalImage = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId).select('additionalImagesData');
    if (!blog) return res.status(404).send('Blog not found.');

    const sub = blog.additionalImagesData.id(req.params.subId);
    if (!sub) return res.status(404).send('Image not found.');

    res.set('Content-Type', sub.contentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(sub.data);
  } catch {
    res.status(404).send('Image not found.');
  }
};

// ── Public Blog Routes ─────────────────────────────────────────────────────────

// @route GET /api/blogs
const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .select('-imageData -imageContentType -additionalImagesData')
      .sort({ date: -1, createdAt: -1 });
    res.json({ success: true, count: blogs.length, blogs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch blogs.', error: error.message });
  }
};

// @route GET /api/blogs/admin/all
const getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .select('-imageData -imageContentType -additionalImagesData')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: blogs.length, blogs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch blogs.', error: error.message });
  }
};

// @route GET /api/blogs/:slug
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, published: true })
      .select('-imageData -imageContentType -additionalImagesData');
    if (!blog) return res.status(404).json({ message: 'Blog not found.' });
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch blog.', error: error.message });
  }
};

// @route GET /api/blogs/admin/:id
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .select('-imageData -imageContentType -additionalImagesData');
    if (!blog) return res.status(404).json({ message: 'Blog not found.' });
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch blog.', error: error.message });
  }
};

// ── Admin Blog Mutations ───────────────────────────────────────────────────────

// @route POST /api/blogs
const createBlog = async (req, res) => {
  try {
    const { title, content, author, date, published } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ message: 'Title, content and author are required.' });
    }
    if (!req.files || !req.files['image']) {
      return res.status(400).json({ message: 'Main image is required.' });
    }

    const mainFile = req.files['image'][0];

    // Pre-generate _id so we can embed the image URL before saving
    const blogId = new mongoose.Types.ObjectId();

    // Build gallery subdocs
    const additionalImagesData = (req.files['additionalImages'] || []).map(f => ({
      data: f.buffer,
      contentType: f.mimetype,
    }));

    const blog = await Blog.create({
      _id: blogId,
      title,
      content,
      author,
      date: date ? new Date(date) : new Date(),
      published: published !== undefined ? published === 'true' : true,
      imageData:        mainFile.buffer,
      imageContentType: mainFile.mimetype,
      image:            `/api/blogs/image/${blogId}`,
      additionalImagesData,
    });

    // Build additionalImages paths now that subdoc _ids exist
    if (blog.additionalImagesData.length > 0) {
      blog.additionalImages = blog.additionalImagesData.map(
        sub => `/api/blogs/image/${blog._id}/additional/${sub._id}`
      );
      await blog.save();
    }

    // Return without raw binary data
    const lean = blog.toObject();
    delete lean.imageData;
    delete lean.imageContentType;
    delete lean.additionalImagesData;

    res.status(201).json({ success: true, blog: lean });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ message: 'Failed to create blog.', error: error.message });
  }
};

// @route PUT /api/blogs/:id
const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found.' });

    const { title, content, author, date, published, removeAdditionalImages } = req.body;

    if (title)   blog.title   = title;
    if (content) blog.content = content;
    if (author)  blog.author  = author;
    if (date)    blog.date    = new Date(date);
    if (published !== undefined) blog.published = published === 'true';

    // Replace main image
    if (req.files && req.files['image']) {
      const mainFile = req.files['image'][0];
      blog.imageData        = mainFile.buffer;
      blog.imageContentType = mainFile.mimetype;
      blog.image            = `/api/blogs/image/${blog._id}`;
    }

    let additionalChanged = false;

    // Remove specific gallery images by their API path
    if (removeAdditionalImages) {
      const toRemove = JSON.parse(removeAdditionalImages);
      // Extract the subdoc _id from the tail of each path
      const subIdsToRemove = new Set(toRemove.map(p => p.split('/').pop()));
      blog.additionalImagesData = blog.additionalImagesData.filter(
        sub => !subIdsToRemove.has(sub._id.toString())
      );
      additionalChanged = true;
    }

    // Append new gallery images
    if (req.files && req.files['additionalImages']) {
      for (const file of req.files['additionalImages']) {
        blog.additionalImagesData.push({ data: file.buffer, contentType: file.mimetype });
      }
      additionalChanged = true;
    }

    // Re-sync the paths array whenever the binary array changed
    if (additionalChanged) {
      blog.additionalImages = blog.additionalImagesData.map(
        sub => `/api/blogs/image/${blog._id}/additional/${sub._id}`
      );
    }

    const updated = await blog.save();

    const lean = updated.toObject();
    delete lean.imageData;
    delete lean.imageContentType;
    delete lean.additionalImagesData;

    res.json({ success: true, blog: lean });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ message: 'Failed to update blog.', error: error.message });
  }
};

// @route DELETE /api/blogs/:id
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found.' });
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete blog.', error: error.message });
  }
};

module.exports = {
  getAllBlogs,
  getAllBlogsAdmin,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  serveImage,
  serveAdditionalImage,
};
