const express = require('express');
const router = express.Router();
const i18nController = require('../controllers/i18n.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/languages', i18nController.getLanguages);
router.get('/languages/all', authenticateToken, i18nController.getAllLanguages);
router.get('/translations/:lang', i18nController.getTranslations);

router.put('/translations/:lang', authenticateToken, i18nController.updateTranslations);
router.post('/languages/toggle', authenticateToken, i18nController.toggleLanguage);

module.exports = router;
