const express = require('express');
const router = express.Router();
const skillsController = require('../controllers/skills.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', skillsController.getAllSkills);
router.post('/', authenticateToken, skillsController.createSkill);
router.put('/:id', authenticateToken, skillsController.updateSkill);
router.delete('/:id', authenticateToken, skillsController.deleteSkill);

module.exports = router;
