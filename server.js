require('dotenv').config();
const app = require('./app');
const { initializeDatabase } = require('./mysql-db');

const PORT = process.env.PORT || 3000;

// Démarrage du serveur
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Base de données initialisée');
    


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
