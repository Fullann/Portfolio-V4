const { pool, safeUpdate } = require('../config/dbPool');

const clientModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM clients ORDER BY created_at DESC"
    );
    return rows;
  },
  getById: async (id) => {
    const [rows] = await pool.execute("SELECT * FROM clients WHERE id = ?", [id]);
    return rows[0];
  },
  create: async (data) => {
    const [result] = await pool.execute(
      `INSERT INTO clients (name, logo, website, description)
       VALUES (?, ?, ?, ?)`,
      [data.name, data.logo, data.website, data.description]
    );
    return { id: result.insertId, ...data };
  },
  update: async (id, data) => {
    await safeUpdate("clients", id, data, {
      name: "name",
      logo: "logo",
      website: "website",
      description: "description"
    });
    return clientModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute("DELETE FROM clients WHERE id = ?", [id]);
    return result;
  },
  deleteAll: async () => {
    const [result] = await pool.execute("DELETE FROM clients");
    return result;
  }
};

module.exports = clientModel;
