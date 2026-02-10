const express = require('express');
const router = express.Router();
const blogsController = require('../controllers/blogs.controller');
const { authenticateToken } = require('../middleware/auth');
const { validate, blogSchema } = require('../validation/schemas');
const upload = require('../config/multer');
const { optimizeUploadedImage } = require('../middleware/imageOptimizer');

router.get('/', blogsController.getAllBlogs);
router.get('/:slug', blogsController.getBlogBySlug);

router.post('/',
  authenticateToken,
  upload.single('image'),
  optimizeUploadedImage,
  blogsController.createBlog
);

router.put('/:id',
  authenticateToken,
  upload.single('image'),
  blogsController.updateBlog
);

router.delete('/:id',
  authenticateToken,
  blogsController.deleteBlog
);

module.exports = router;
