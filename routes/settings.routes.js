const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticateToken } = require('../middleware/auth');

// Routes protégées (admin)
router.get('/', authenticateToken, settingsController.getSettings);
router.put('/', authenticateToken, settingsController.updateSettings);

// Route publique (sitekey hCaptcha pour le frontend)
router.get('/public/hcaptcha-sitekey', settingsController.getHcaptchaSitekey);

module.exports = router;
