const { pool, safeUpdate } = require('../config/dbPool');

const skillModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM skills ORDER BY created_at"
    );
    return rows;
  },
  getById: async (id) => {
    const [rows] = await pool.execute("SELECT * FROM skills WHERE id = ?", [id]);
    return rows[0];
  },
  create: async (data) => {
    const [result] = await pool.execute(
      `INSERT INTO skills (name, percentage)
       VALUES (?, ?)`,
      [data.name, data.percentage]
    );
    return { id: result.insertId, ...data };
  },
  update: async (id, data) => {
    await safeUpdate("skills", id, data, {
      name: "name",
      percentage: "percentage"
    });
    return skillModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute("DELETE FROM skills WHERE id = ?", [id]);
    return result;
  },
  deleteAll: async () => {
    const [result] = await pool.execute("DELETE FROM skills");
    return result;
  }
};

module.exports = skillModel;
