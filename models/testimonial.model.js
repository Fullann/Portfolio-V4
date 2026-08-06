const { pool, safeUpdate } = require('../config/dbPool');

const testimonialModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM testimonials ORDER BY created_at DESC"
    );
    return rows;
  },
  getById: async (id) => {
    const [rows] = await pool.execute("SELECT * FROM testimonials WHERE id = ?", [id]);
    return rows[0];
  },
  create: async (data) => {
    const [result] = await pool.execute(
      `INSERT INTO testimonials (name, text, avatar, date)
       VALUES (?, ?, ?, ?)`,
      [data.name, data.text, data.avatar, data.date]
    );
    return { id: result.insertId, ...data };
  },
  update: async (id, data) => {
    await safeUpdate("testimonials", id, data, {
      name: "name",
      text: "text",
      avatar: "avatar",
      date: "date"
    });
    return testimonialModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute("DELETE FROM testimonials WHERE id = ?", [id]);
    return result;
  },
  deleteAll: async () => {
    const [result] = await pool.execute("DELETE FROM testimonials");
    return result;
  }
};

module.exports = testimonialModel;
