const express = require('express');
const router = express.Router();
const educationController = require('../controllers/education.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', educationController.getAllEducation);
router.post('/', authenticateToken, educationController.createEducation);
router.put('/:id', authenticateToken, educationController.updateEducation);
router.delete('/:id', authenticateToken, educationController.deleteEducation);
router.post('/:id/move-up', authenticateToken, educationController.moveUp);
router.post('/:id/move-down', authenticateToken, educationController.moveDown);
module.exports = router;
