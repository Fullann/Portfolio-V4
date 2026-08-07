require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');

const helmet = require('helmet');

const { initializeDatabase } = require('./mysql-db');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware globaux de sécurité et performance
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
let authMiddleware, apiRoutes, seoRoutes, blogsController, personalInfoController;

try {
  authMiddleware = require('./middleware/auth');
  console.log('✅ Auth middleware chargé');
} catch (e) {
  console.warn('⚠️ Auth middleware non trouvé');
}

try {
  apiRoutes = require('./routes/index');
  app.use('/api', apiRoutes);
  console.log('✅ Routes API chargées');
} catch (e) {
  console.warn('⚠️ Routes API non trouvées:', e.message);
}

try {
  seoRoutes = require('./routes/seo.routes');
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
  blogsController = require('./controllers/blogs.controller');
  app.get('/blog/:slug', blogsController.renderBlogPage);
  console.log('✅ Routes blogs chargées');
} catch (e) {
  console.warn('⚠️ Controllers blogs non trouvés');
}

try {
  personalInfoController = require('./controllers/personalInfo.controller');
  app.get('/download-cv', personalInfoController.downloadCV);
  console.log('✅ Route CV chargée');
} catch (e) {
  console.warn('⚠️ Controller personalInfo non trouvé');
}

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ 
    error: 'Erreur serveur', 
    details: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Démarrage du serveur
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Base de données initialisée');
    
    if (authMiddleware?.createAdminUser) {
      await authMiddleware.createAdminUser();
      console.log('✅ Utilisateur admin vérifié');
    }

    // Régénérer le HTML public depuis la DB au démarrage
    // Garantit que les données de production (nom, contacts, projets...)
    // sont toujours à jour même après un redéploiement FTP
    try {
      const { updateHtmlFile } = require('./services/htmlGenerator.service');
      await updateHtmlFile();
      console.log('✅ Fichier public/index.html régénéré depuis la DB');
    } catch (htmlError) {
      console.warn('⚠️ Impossible de régénérer le HTML au démarrage:', htmlError.message);
    }

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║   🚀 Serveur démarré                          ║
║   📡 Port: ${PORT}                               ║
║   🌐 http://localhost:${PORT}                    ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

startServer();
