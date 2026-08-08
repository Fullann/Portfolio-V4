const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

const { generalLimiter } = require('./middleware/rateLimiter');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy (nécessaire derrière un reverse proxy pour les rate limiters)
app.set('trust proxy', 1);

// Middleware globaux de sécurité et performance
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://js.hcaptcha.com", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.hcaptcha.com", "https://unpkg.com"],
      frameSrc: ["https://newassets.hcaptcha.com", "https://*.hcaptcha.com"],
    }
  },
  crossOriginEmbedderPolicy: false, // nécessaire pour les images externes
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || true, // En production, définir CORS_ORIGIN=https://mondomaine.ch
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression());

// Servir les fichiers statiques
app.use(express.static('public'));
app.use('/admin', express.static('admin'));
app.use('/assets/documents', express.static('public/assets/documents'));

// Headers de cache
app.use('/assets', express.static(path.join(__dirname, 'public/assets'), {
  maxAge: '30d',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    }
    if (filePath.endsWith('.jpg') || filePath.endsWith('.png') || filePath.endsWith('.webp')) {
      res.setHeader('Cache-Control', 'public, max-age=7776000');
    }
  }
}));

// Rate limiting global sur l'API
app.use('/api', generalLimiter);

// Chargement conditionnel des modules
try {
  const apiRoutes = require('./routes/index');
  app.use('/api', apiRoutes);
  console.log('✅ Routes API chargées');
} catch (e) {
  console.warn('⚠️ Routes API non trouvées:', e.message);
}

try {
  const seoRoutes = require('./routes/seo.routes');
  app.get('/sitemap.xml', seoRoutes.sitemap);
  app.get('/robots.txt', seoRoutes.robots);
  console.log('✅ Routes SEO chargées');
} catch (e) {
  console.warn('⚠️ Routes SEO non trouvées');
  
  // Fallback pour SEO
  app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://localhost:3000/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
</urlset>`);
  });
  
  app.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send('User-agent: *\nAllow: /\nDisallow: /admin/');
  });
}

try {
  const blogsController = require('./controllers/blogs.controller');
  app.get('/blog/:slug', blogsController.renderBlogPage);
  console.log('✅ Routes blogs chargées');
} catch (e) {
  console.warn('⚠️ Controllers blogs non trouvés');
}

try {
  const personalInfoController = require('./controllers/personalInfo.controller');
  app.get('/download-cv', personalInfoController.downloadCV);
  console.log('✅ Route CV chargée');
} catch (e) {
  console.warn('⚠️ Controller personalInfo non trouvé');
}

// Gestion des erreurs 404 avec AppError
app.use('*', (req, res, next) => {
  next(new AppError(`Route non trouvée: ${req.originalUrl}`, 404));
});

// Gestion des erreurs globales
app.use(errorHandler);

module.exports = app;
