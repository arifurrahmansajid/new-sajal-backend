const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { protect } = require('../middleware/auth');
const {
  getAllBlogs,
  getAllBlogsAdmin,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  serveImage,
  serveAdditionalImage,
} = require('../controllers/blogController');

// ── Multer: memory storage (no filesystem — Vercel compatible) ─────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp).'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const uploadFields = upload.fields([
  { name: 'image',            maxCount: 1  },
  { name: 'additionalImages', maxCount: 10 },
]);

// ── Image serving (public) ─────────────────────────────────────────────────────
// Must be declared BEFORE /:slug to avoid route conflicts
router.get('/image/:id',                          serveImage);
router.get('/image/:blogId/additional/:subId',    serveAdditionalImage);

// ── Public routes ──────────────────────────────────────────────────────────────
router.get('/',      getAllBlogs);

// ── Admin routes (protected) ───────────────────────────────────────────────────
router.get('/admin/all',    protect, getAllBlogsAdmin);
router.get('/admin/:id',    protect, getBlogById);
router.post('/',            protect, uploadFields, createBlog);
router.put('/:id',          protect, uploadFields, updateBlog);
router.delete('/:id',       protect, deleteBlog);

// ── Slug route last (catch-all single-segment) ─────────────────────────────────
router.get('/:slug', getBlogBySlug);

module.exports = router;
