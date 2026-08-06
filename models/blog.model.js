const { pool, safeUpdate } = require('../config/dbPool');

const blogModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM blogs ORDER BY created_at DESC"
    );
    return rows;
  },
  getById: async (id) => {
    const [rows] = await pool.execute("SELECT * FROM blogs WHERE id = ?", [id]);
    return rows[0];
  },
  getBySlug: async (slug) => {
    const [rows] = await pool.execute("SELECT * FROM blogs WHERE slug = ?", [
      slug,
    ]);
    return rows[0];
  },
  create: async (data) => {
    const [result] = await pool.execute(
      `INSERT INTO blogs (title, category, excerpt, content, image, date, author, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.category,
        data.excerpt,
        data.content,
        data.image,
        data.date,
        data.author,
        data.slug,
      ]
    );
    return { id: result.insertId, ...data };
  },
  update: async (id, data) => {
    await safeUpdate("blogs", id, data, {
      title: "title",
      category: "category",
      excerpt: "excerpt",
      content: "content",
      image: "image",
      date: "date",
      author: "author",
      slug: "slug"
    });
    return blogModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute("DELETE FROM blogs WHERE id = ?", [id]);
    return result;
  },
  updateCategoryReferences: async (oldName, newName) => {
    const [result] = await pool.execute(
      `UPDATE blogs SET category = ? WHERE category = ?`,
      [newName, oldName]
    );
    return result;
  },
  deleteAll: async () => {
    const [result] = await pool.execute("DELETE FROM blogs");
    return result;
  }
};

module.exports = blogModel;
