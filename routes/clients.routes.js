const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clients.controller');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/multer');
const { optimizeUploadedImage } = require('../middleware/imageOptimizer');

router.get('/', clientsController.getAllClients);

router.post('/',
  authenticateToken,
  upload.single('logo'),
  optimizeUploadedImage,
  clientsController.createClient
);

router.put('/:id',
  authenticateToken,
  upload.single('logo'),
  clientsController.updateClient
);

router.delete('/:id',
  authenticateToken,
  clientsController.deleteClient
);

module.exports = router;
