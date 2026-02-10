const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/multer');
const { optimizeUploadedImage } = require('../middleware/imageOptimizer');

router.get('/', projectsController.getAllProjects);

router.post('/',
  authenticateToken,
  upload.single('image'),
  optimizeUploadedImage,
  projectsController.createProject
);

router.put('/:id',
  authenticateToken,
  upload.single('image'),
  projectsController.updateProject
);

router.delete('/:id',
  authenticateToken,
  projectsController.deleteProject
);

module.exports = router;
