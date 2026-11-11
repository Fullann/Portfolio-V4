const express = require('express');
const router = express.Router();
const blogsController = require('../controllers/blogs.controller');
const { authenticateToken } = require('../middleware/auth');
const { validate, blogSchema, blogUpdateSchema } = require('../validation/schemas');
const upload = require('../config/multer');
const { optimizeUploadedImage } = require('../middleware/imageOptimizer');

router.get('/', blogsController.getAllBlogs);
router.get('/:slug', blogsController.getBlogBySlug);
router.get('/:id/translations', blogsController.getBlogTranslations);

router.post('/',
  authenticateToken,
  upload.single('image'),
  optimizeUploadedImage,
  validate(blogSchema),
  blogsController.createBlog
);

router.put('/:id',
  authenticateToken,
  upload.single('image'),
  optimizeUploadedImage,
  validate(blogUpdateSchema),
  blogsController.updateBlog
);

router.patch('/:id/toggle-published',
  authenticateToken,
  blogsController.togglePublished
);

router.delete('/:id',
  authenticateToken,
  blogsController.deleteBlog
);

module.exports = router;
