const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolio.controller');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/multer');
const { optimizeUploadedImage } = require('../middleware/imageOptimizer');

router.get('/', portfolioController.getAllPortfolioProjects);
router.get('/:id/translations', portfolioController.getProjectTranslations);

router.post('/',
  authenticateToken,
  upload.single('image'),
  optimizeUploadedImage,
  portfolioController.createPortfolioProject
);

router.put('/:id',
  authenticateToken,
  upload.single('image'),
  portfolioController.updatePortfolioProject
);

router.post('/:id/toggle-current-work', authenticateToken, portfolioController.toggleCurrentWork);
router.patch('/:id/toggle-visibility', authenticateToken, portfolioController.toggleVisibility);

router.delete('/:id',
  authenticateToken,
  portfolioController.deletePortfolioProject
);

module.exports = router;
