const express = require('express');
const router = express.Router();
const personalInfoController = require('../controllers/personalInfo.controller');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/multer');
const { optimizeUploadedImage } = require('../middleware/imageOptimizer');

router.get('/', personalInfoController.getPersonalInfo);

router.put('/',
  authenticateToken,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cv', maxCount: 1 }
  ]),
  optimizeUploadedImage,
  personalInfoController.updatePersonalInfo
);

module.exports = router;
