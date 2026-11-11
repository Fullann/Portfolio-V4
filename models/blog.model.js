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
    const isPublished = data.is_published !== undefined ? (data.is_published ? 1 : 0) : 1;
    const [result] = await pool.execute(
      `INSERT INTO blogs (title, category, excerpt, content, image, date, author, slug, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.category,
        data.excerpt,
        data.content,
        data.image,
        data.date,
        data.author,
        data.slug,
        isPublished,
      ]
    );
    return { id: result.insertId, ...data, is_published: isPublished };
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
      slug: "slug",
      isPublished: "is_published",
      is_published: "is_published"
    });
    return blogModel.getById(id);
  },
  togglePublished: async (id, isPublished) => {
    const val = (isPublished === '1' || isPublished === 1 || isPublished === true || isPublished === 'true') ? 1 : 0;
    await pool.execute(
      "UPDATE blogs SET is_published = ? WHERE id = ?",
      [val, Number(id)]
    );
    return blogModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute("DELETE FROM blogs WHERE id = ?", [id]);
    await pool.execute(
      "DELETE FROM translations WHERE translation_key IN (?, ?, ?)",
      [`blog_${id}_title`, `blog_${id}_excerpt`, `blog_${id}_content`]
    );
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
    await pool.execute("DELETE FROM translations WHERE translation_key LIKE 'blog\\_%'");
    return result;
  },
  getTranslations: async (blogId) => {
    const [rows] = await pool.execute(
      "SELECT lang_code, translation_key, translation_value FROM translations WHERE translation_key IN (?, ?, ?)",
      [`blog_${blogId}_title`, `blog_${blogId}_excerpt`, `blog_${blogId}_content`]
    );
    
    // Convert to { en: { title: "...", content: "..." }, es: { ... } }
    const translations = {};
    rows.forEach(r => {
      const field = r.translation_key.split('_').pop(); // title, excerpt, content
      if (!translations[r.lang_code]) translations[r.lang_code] = {};
      translations[r.lang_code][field] = r.translation_value;
    });
    return translations;
  },
  updateTranslations: async (blogId, translationsObj) => {
    // translationsObj format: { en: { title: "...", excerpt: "...", content: "..." }, es: { ... } }
    for (const [lang, fields] of Object.entries(translationsObj)) {
      for (const [field, value] of Object.entries(fields)) {
        if (!value) continue;
        const key = `blog_${blogId}_${field}`;
        await pool.execute(
          `INSERT INTO translations (lang_code, translation_key, translation_value)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE translation_value = VALUES(translation_value)`,
          [lang, key, value]
        );
      }
    }
  }
};

module.exports = blogModel;
