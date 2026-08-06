const { pool, safeUpdate } = require('../config/dbPool');

const socialLinkModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM social_links ORDER BY created_at"
    );
    return rows;
  },
  getById: async (id) => {
    const [rows] = await pool.execute(
      "SELECT * FROM social_links WHERE id = ?",
      [id]
    );
    return rows[0];
  },
  create: async (data) => {
    const [result] = await pool.execute(
      `INSERT INTO social_links (name, icon, url)
       VALUES (?, ?, ?)`,
      [data.name, data.icon, data.url]
    );
    return { id: result.insertId, ...data };
  },
  update: async (id, data) => {
    await safeUpdate("social_links", id, data, {
      name: "name",
      icon: "icon",
      url: "url"
    });
    return socialLinkModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute(
      "DELETE FROM social_links WHERE id = ?",
      [id]
    );
    return result;
  },
  deleteAll: async () => {
    const [result] = await pool.execute("DELETE FROM social_links");
    return result;
  }
};

module.exports = socialLinkModel;
