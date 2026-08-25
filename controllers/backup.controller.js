const { pool } = require('../config/database');

exports.exportDatabase = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    const backupData = {};

    // Liste manuelle ou récupération dynamique des tables
    const tables = [
      'projects', 'testimonials', 'portfolio_projects', 'clients', 'categories',
      'blogs', 'personal_info', 'social_links', 'education', 'experience',
      'skills', 'admin_users', 'settings', 'languages', 'translations', 'audit_logs'
    ];

    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT * FROM ${table}`);
        backupData[table] = rows;
      } catch (e) {
        // Ignorer si une table n'existe pas
      }
    }

    connection.release();

    const jsonBackup = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-disposition', `attachment; filename=backup-portfolio-${dateStr}.json`);
    res.setHeader('Content-type', 'application/json');
    res.send(jsonBackup);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde JSON:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde de la base de données' });
  }
};
