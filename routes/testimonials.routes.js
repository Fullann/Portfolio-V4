const express = require('express');
const router = express.Router();
const testimonialsController = require('../controllers/testimonials.controller');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/multer');
const { optimizeUploadedImage } = require('../middleware/imageOptimizer');

router.get('/', testimonialsController.getAllTestimonials);

router.post('/',
  authenticateToken,
  upload.single('avatar'),
  optimizeUploadedImage,
  testimonialsController.createTestimonial
);

router.put('/:id',
  authenticateToken,
  upload.single('avatar'),
  testimonialsController.updateTestimonial
);

router.delete('/:id',
  authenticateToken,
  testimonialsController.deleteTestimonial
);

module.exports = router;
