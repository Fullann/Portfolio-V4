const { pool, safeUpdate } = require('../config/dbPool');

const projectModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );
    return rows;
  },
  getById: async (id) => {
    const [rows] = await pool.execute("SELECT * FROM projects WHERE id = ?", [id]);
    return rows[0];
  },
  create: async (data) => {
    const [result] = await pool.execute(
      `INSERT INTO projects (title, category, image, description)
       VALUES (?, ?, ?, ?)`,
      [data.title, data.category, data.image, data.description]
    );
    return { id: result.insertId, ...data };
  },
  update: async (id, data) => {
    await safeUpdate("projects", id, data, {
      title: "title",
      category: "category",
      image: "image",
      description: "description"
    });
    return projectModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute("DELETE FROM projects WHERE id = ?", [id]);
    return result;
  },
  deleteAll: async () => {
    const [result] = await pool.execute("DELETE FROM projects");
    return result;
  }
};

module.exports = projectModel;
