const express = require('express');
const router = express.Router();
const personalInfoController = require('../controllers/personalInfo.controller');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/multer');

router.get('/', personalInfoController.getPersonalInfo);

router.put('/',
  authenticateToken,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cv', maxCount: 1 }
  ]),
  personalInfoController.updatePersonalInfo
);

module.exports = router;
