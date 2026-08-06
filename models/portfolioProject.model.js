const { pool, safeUpdate } = require('../config/dbPool');

const portfolioProjectModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM portfolio_projects ORDER BY created_at DESC"
    );
    return rows;
  },
  getById: async (id) => {
    const [rows] = await pool.execute(
      "SELECT * FROM portfolio_projects WHERE id = ?",
      [id]
    );
    return rows[0];
  },
  create: async (data) => {
    const [result] = await pool.execute(
      `INSERT INTO portfolio_projects (title, category, image, description, repo_link, live_link, filter_category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.category,
        data.image,
        data.description,
        data.repoLink,
        data.liveLink,
        data.filterCategory,
      ]
    );
    return { id: result.insertId, ...data };
  },
  update: async (id, data) => {
    await safeUpdate("portfolio_projects", id, data, {
      title: "title",
      category: "category",
      image: "image",
      description: "description",
      repoLink: "repo_link",
      liveLink: "live_link",
      filterCategory: "filter_category"
    });
    return portfolioProjectModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute(
      "DELETE FROM portfolio_projects WHERE id = ?",
      [id]
    );
    return result;
  },
  updateCategoryReferences: async (oldName, newName, newDisplayName) => {
    const [result] = await pool.execute(
      `UPDATE portfolio_projects 
       SET filter_category = ?, category = ?
       WHERE filter_category = ?`,
      [newName, newDisplayName, oldName]
    );
    return result;
  },
  deleteAll: async () => {
    const [result] = await pool.execute("DELETE FROM portfolio_projects");
    return result;
  }
};

module.exports = portfolioProjectModel;
