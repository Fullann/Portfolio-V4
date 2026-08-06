const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');

// Import de tous les routers
const authRoutes = require('./auth.routes');
const projectsRoutes = require('./projects.routes');
const testimonialsRoutes = require('./testimonials.routes');
const portfolioRoutes = require('./portfolio.routes');
const clientsRoutes = require('./clients.routes');
const categoriesRoutes = require('./categories.routes');
const blogsRoutes = require('./blogs.routes');
const personalInfoRoutes = require('./personalInfo.routes');
const socialLinksRoutes = require('./socialLinks.routes');
const educationRoutes = require('./education.routes');
const experienceRoutes = require('./experience.routes');
const skillsRoutes = require('./skills.routes');
const adminRoutes = require('./admin.routes');
const settingsRoutes = require('./settings.routes');
const i18nRoutes = require('./i18n.routes');

// Routes modulaires
router.use('/auth', authRoutes);
router.use('/projects', projectsRoutes);
router.use('/testimonials', testimonialsRoutes);
router.use('/portfolio-projects', portfolioRoutes);
router.use('/clients', clientsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/blogs', blogsRoutes);
router.use('/personal-info', personalInfoRoutes);
router.use('/social-links', socialLinksRoutes);
router.use('/education', educationRoutes);
router.use('/experience', experienceRoutes);
router.use('/skills', skillsRoutes);
router.use('/admin', adminRoutes);
router.use('/settings', settingsRoutes);
router.use('/i18n', i18nRoutes);
router.get('/optimization-stats', authenticateToken, adminController.getOptimizationStats);


module.exports = router;
