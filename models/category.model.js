const { pool, safeUpdate } = require('../config/dbPool');

const categoryModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM categories ORDER BY display_name"
    );
    return rows;
  },
  getById: async (id) => {
    const [rows] = await pool.execute(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );
    return rows[0];
  },
  getByName: async (name) => {
    const [rows] = await pool.execute(
      "SELECT * FROM categories WHERE name = ?",
      [name]
    );
    return rows[0];
  },
  create: async (data) => {
    const [result] = await pool.execute(
      `INSERT INTO categories (name, display_name)
       VALUES (?, ?)`,
      [data.name, data.displayName]
    );
    return { id: result.insertId, ...data };
  },
  update: async (id, data) => {
    await safeUpdate("categories", id, data, {
      name: "name",
      displayName: "display_name"
    });
    return categoryModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute(
      "DELETE FROM categories WHERE id = ?",
      [id]
    );
    return result;
  },
  deleteAll: async () => {
    const [result] = await pool.execute("DELETE FROM categories");
    return result;
  }
};

module.exports = categoryModel;
