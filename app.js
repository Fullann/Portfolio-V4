const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { generalLimiter } = require('./middleware/rateLimiter');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');
const checkMaintenanceMode = require('./middleware/maintenance');

const app = express();

// Trust proxy (nécessaire derrière un reverse proxy pour les rate limiters)
app.set('trust proxy', 1);

// Middleware Maintenance
app.use(checkMaintenanceMode);

// Middleware globaux de sécurité et performance
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://unpkg.com", 
        "https://js.hcaptcha.com", 
        "https://hcaptcha.com", 
        "https://*.hcaptcha.com", 
        "https://newassets.hcaptcha.com", 
        "https://cdn.tailwindcss.com", 
        "https://cdn.jsdelivr.net"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com", 
        "https://hcaptcha.com", 
        "https://*.hcaptcha.com", 
        "https://newassets.hcaptcha.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'", 
        "https://api.hcaptcha.com", 
        "https://hcaptcha.com", 
        "https://*.hcaptcha.com", 
        "https://*.w.hcaptcha.com", 
        "https://newassets.hcaptcha.com", 
        "https://unpkg.com",
        "https://cdn.tailwindcss.com",
        "https://js.hcaptcha.com",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      frameSrc: [
        "'self'", 
        "https://newassets.hcaptcha.com", 
        "https://hcaptcha.com", 
        "https://*.hcaptcha.com", 
        "https://*.w.hcaptcha.com", 
        "https://maps.google.com", 
        "https://www.google.com", 
        "https://*.google.com"
      ],
    }
  },
  crossOriginEmbedderPolicy: false, // nécessaire pour les images externes
  crossOriginResourcePolicy: false, // Permet le chargement depuis les CDN externes comme Tailwind
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || true, // En production, définir CORS_ORIGIN=https://mondomaine.ch
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression());
app.use(cookieParser());

// Servir les fichiers statiques depuis public/ avec headers de cache
// Note : un seul express.static couvre tout (assets, images, css, js…)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.includes('admin.js') || filePath.includes('admin.css')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30j
    }
    if (filePath.endsWith('.jpg') || filePath.endsWith('.png') ||
        filePath.endsWith('.webp') || filePath.endsWith('.svg')) {
      res.setHeader('Cache-Control', 'public, max-age=7776000'); // 90j
    }
  }
}));

// Documents téléchargeables (force le download sans cache agressif)
app.use('/assets/documents', express.static(path.join(__dirname, 'public/assets/documents'), {
  maxAge: '0'
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
  app.get('/rss.xml', seoRoutes.rss);
  app.get('/og-image', seoRoutes.ogImage);
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

// Gestion des 404 :
// - Les ressources statiques manquantes (assets, sw.js…) retournent 404 silencieusement
// - Seules les vraies routes inconnues déclenchent AppError (loggée en dev)
app.use('*', (req, res, next) => {
  const url = req.originalUrl;
  const isStaticAsset = url.startsWith('/assets/') ||
    url.startsWith('/admin/') ||
    url === '/sw.js' ||
    url === '/favicon.ico' ||
    url === '/robots.txt' ||
    url === '/sitemap.xml' ||
    url === '/rss.xml' ||
    url === '/madebyfullann.svg' ||
    url.startsWith('/.well-known/');

  if (isStaticAsset) {
    return res.status(404).send('Not found');
  }

  next(new AppError(`Route non trouvée: ${url}`, 404));
});

// Gestion des erreurs globales
app.use(errorHandler);

module.exports = app;
