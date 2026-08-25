const { dbOperations } = require('../config/database');

let cachedMaintenanceMode = null;
let lastCheck = 0;

const checkMaintenanceMode = async (req, res, next) => {
  // Ignorer pour les requêtes admin, api admin, assets statiques, ou logo public
  if (req.path.startsWith('/admin') || req.path.startsWith('/api/admin') || req.path.startsWith('/assets') || req.path === '/madebyfullann.svg') {
    return next();
  }

  const now = Date.now();
  // Vérifier en base toutes les 5 secondes maximum pour éviter de saturer la BDD
  if (now - lastCheck > 5000) {
    try {
      const mode = await dbOperations.settings.get('maintenance_mode');
      cachedMaintenanceMode = (mode === 'true');
      lastCheck = now;
    } catch (error) {
      console.error('Erreur vérification mode maintenance:', error);
    }
  }

  if (cachedMaintenanceMode) {
    res.status(503).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Site en Maintenance</title>
        <style>
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #121212;
            color: #ffffff;
            font-family: sans-serif;
            margin: 0;
            text-align: center;
          }
          .container {
            padding: 40px;
            background: #1e1e1f;
            border-radius: 20px;
            border: 1px solid #383838;
          }
          h1 { color: #ffdb70; font-size: 2.5rem; margin-bottom: 20px; }
          p { color: #d6d6d6; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Site en Maintenance</h1>
          <p>Le site est actuellement en cours de mise à jour.<br>Merci de revenir dans quelques instants.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  next();
};

module.exports = checkMaintenanceMode;
