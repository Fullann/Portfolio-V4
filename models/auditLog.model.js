const { pool } = require('../config/dbPool');

const auditLogModel = {
  getAll: async (limit = 100, offset = 0) => {
    const [rows] = await pool.execute(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit.toString(), offset.toString()]
    );
    return rows;
  },

  log: async (userId, action, target, details, ipAddress) => {
    try {
      const safeUserId = userId || null;
      const safeAction = action || 'UNKNOWN_ACTION';
      const safeTarget = target || 'UNKNOWN_TARGET';
      const safeDetails = typeof details === 'string' ? details : JSON.stringify(details);
      const safeIp = ipAddress || 'UNKNOWN_IP';

      const [result] = await pool.execute(
        `INSERT INTO audit_logs (user_id, action, target, details, ip_address) VALUES (?, ?, ?, ?, ?)`,
        [safeUserId, safeAction, safeTarget, safeDetails, safeIp]
      );
      return result.insertId;
    } catch (err) {
      console.error('Erreur lors de la journalisation (Audit Log):', err);
      // On ne throw pas l'erreur pour ne pas bloquer l'action principale
    }
  },
  
  clearOldLogs: async (daysToKeep = 30) => {
    try {
      await pool.execute(
        `DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysToKeep.toString()]
      );
    } catch (err) {
      console.error('Erreur nettoyage des logs:', err);
    }
  }
};

module.exports = auditLogModel;
