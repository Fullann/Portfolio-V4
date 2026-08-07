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
      `INSERT INTO portfolio_projects (title, category, image, description, repo_link, live_link, filter_category, is_current_work, is_visible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.category,
        data.image,
        data.description,
        data.repoLink,
        data.liveLink,
        data.filterCategory,
        data.isCurrentWork ? 1 : 0,
        data.isVisible !== undefined ? (data.isVisible ? 1 : 0) : 1
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
      filterCategory: "filter_category",
      isCurrentWork: "is_current_work",
      isVisible: "is_visible"
    });
    return portfolioProjectModel.getById(id);
  },
  toggleCurrentWork: async (id, isCurrentWork) => {
    const val = (isCurrentWork === '1' || isCurrentWork === 1 || isCurrentWork === true || isCurrentWork === 'true') ? 1 : 0;
    await pool.execute(
      "UPDATE portfolio_projects SET is_current_work = ? WHERE id = ?",
      [val, Number(id)]
    );
    return portfolioProjectModel.getById(id);
  },
  toggleVisibility: async (id, isVisible) => {
    const val = (isVisible === '1' || isVisible === 1 || isVisible === true || isVisible === 'true') ? 1 : 0;
    await pool.execute(
      "UPDATE portfolio_projects SET is_visible = ? WHERE id = ?",
      [val, Number(id)]
    );
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
