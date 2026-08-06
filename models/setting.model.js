const { pool } = require('../config/dbPool');

const settingModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT setting_key, setting_value FROM settings ORDER BY setting_key"
    );
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });
    return settings;
  },
  get: async (key) => {
    const [rows] = await pool.execute(
      "SELECT setting_value FROM settings WHERE setting_key = ?",
      [key]
    );
    return rows[0]?.setting_value || null;
  },
  set: async (key, value) => {
    await pool.execute(
      `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
      [key, value, value]
    );
  },
  setBulk: async (keyValuePairs) => {
    for (const [key, value] of Object.entries(keyValuePairs)) {
      await pool.execute(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
        [key, value, value]
      );
    }
  }
};

module.exports = settingModel;
