const { pool } = require('../config/database');

exports.exportDatabase = async (req, res, _next) => {
  try {
    const connection = await pool.getConnection();
    const backupData = {};

    // Liste complète des tables du portfolio (sans les secrets bruts ni les hash d'admin)
    const tables = [
      'projects', 'testimonials', 'portfolio_projects', 'clients', 'categories',
      'blogs', 'personal_info', 'social_links', 'education', 'experience',
      'certifications', 'skills', 'settings', 'languages', 'translations',
      'analytics_events', 'audit_logs'
    ];

    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT * FROM ${table}`);
        if (table === 'settings') {
          backupData[table] = rows.map(row =>
            row.setting_key === 'hcaptcha_secret'
              ? { ...row, setting_value: '***REDACTED***' }
              : row
          );
        } else {
          backupData[table] = rows;
        }
      } catch {
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

const RESTORABLE_TABLES = [
  'categories', 'projects', 'testimonials', 'portfolio_projects', 'clients',
  'blogs', 'personal_info', 'social_links', 'education', 'experience',
  'certifications', 'skills', 'settings', 'languages', 'translations'
];

exports.importDatabase = async (req, res, _next) => {
  const backupData = req.body;
  if (!backupData || typeof backupData !== 'object' || Array.isArray(backupData)) {
    return res.status(400).json({ error: 'Format de sauvegarde JSON invalide' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let restoredTables = 0;
    for (const table of RESTORABLE_TABLES) {
      const rows = backupData[table];
      if (!Array.isArray(rows)) continue;

      if (table === 'settings') {
        for (const row of rows) {
          if (!row.setting_key || row.setting_value === '***REDACTED***') continue;
          await connection.execute(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
            [row.setting_key, row.setting_value]
          );
        }
        restoredTables++;
        continue;
      }

      await connection.execute(`DELETE FROM ${table}`);
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const cols = Object.keys(row).filter(c => /^[a-zA-Z0-9_]+$/.test(c));
        if (cols.length === 0) continue;
        const placeholders = cols.map(() => '?').join(', ');
        const values = cols.map(c => row[c]);
        await connection.execute(
          `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
          values
        );
      }
      restoredTables++;
    }

    await connection.commit();

    try {
      const { updateHtmlFile } = require('../services/htmlGenerator.service');
      await updateHtmlFile();
    } catch (htmlErr) {
      console.warn('⚠️ Impossible de régénérer le HTML après restauration:', htmlErr.message);
    }

    res.json({
      success: true,
      message: `Sauvegarde restaurée avec succès (${restoredTables} tables mises à jour)`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la restauration JSON:', error);
    res.status(500).json({ error: 'Erreur lors de la restauration de la sauvegarde: ' + error.message });
  } finally {
    connection.release();
  }
};
