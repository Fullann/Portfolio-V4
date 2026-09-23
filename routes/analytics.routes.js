const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middleware/auth');

// Endpoint public pour le tracking discret et anonyme
router.post('/track', analyticsController.trackEvent);

// Endpoint protégé pour le dashboard administrateur
router.get('/dashboard', authenticateToken, analyticsController.getDashboardStats);

module.exports = router;
