const express = require('express');
const router = express.Router();
const socialLinksController = require('../controllers/socialLinks.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', socialLinksController.getAllSocialLinks);
router.post('/', authenticateToken, socialLinksController.createSocialLink);
router.put('/:id', authenticateToken, socialLinksController.updateSocialLink);
router.delete('/:id', authenticateToken, socialLinksController.deleteSocialLink);

module.exports = router;
