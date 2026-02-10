const express = require('express');
const router = express.Router();
const experienceController = require('../controllers/experience.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', experienceController.getAllExperience);
router.post('/', authenticateToken, experienceController.createExperience);
router.put('/:id', authenticateToken, experienceController.updateExperience);
router.delete('/:id', authenticateToken, experienceController.deleteExperience);
router.post('/:id/move-up', authenticateToken, experienceController.moveUp);
router.post('/:id/move-down', authenticateToken, experienceController.moveDown);
module.exports = router;
