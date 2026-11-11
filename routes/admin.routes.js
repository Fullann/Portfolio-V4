const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken } = require('../middleware/auth');


router.get('/last-update', adminController.getLastUpdate);
router.delete('/delete/all', authenticateToken, adminController.resetAllData);
router.get('/account-info', authenticateToken, adminController.getAccountInfo);
router.get('/backup', authenticateToken, require('../controllers/backup.controller').exportDatabase);
router.post('/backup/restore', authenticateToken, require('../controllers/backup.controller').importDatabase);

module.exports = router;
