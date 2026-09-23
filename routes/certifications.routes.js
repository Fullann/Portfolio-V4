const express = require('express');
const router = express.Router();
const certificationsController = require('../controllers/certifications.controller');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/multer');
const { optimizeUploadedImage } = require('../middleware/imageOptimizer');

router.get('/', certificationsController.getAllCertifications);
router.get('/:id', certificationsController.getCertificationById);

router.post('/',
  authenticateToken,
  upload.single('logo'),
  optimizeUploadedImage,
  certificationsController.createCertification
);

router.put('/:id',
  authenticateToken,
  upload.single('logo'),
  optimizeUploadedImage,
  certificationsController.updateCertification
);

router.delete('/:id',
  authenticateToken,
  certificationsController.deleteCertification
);

router.post('/reorder',
  authenticateToken,
  certificationsController.bulkReorder
);

router.post('/:id/move-up',
  authenticateToken,
  certificationsController.moveUp
);

router.post('/:id/move-down',
  authenticateToken,
  certificationsController.moveDown
);

module.exports = router;
