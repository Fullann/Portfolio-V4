const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken } = require('../middleware/auth');


router.get('/last-update', adminController.getLastUpdate);
router.delete('/delete/all', authenticateToken, adminController.resetAllData);
router.get('/account-info', authenticateToken, adminController.getAccountInfo);
router.put('/update-account', authenticateToken, adminController.updateAccount);
router.put('/change-password', authenticateToken, adminController.changePassword);

module.exports = router;
