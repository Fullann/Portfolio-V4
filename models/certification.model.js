const { pool, safeUpdate } = require('../config/dbPool');

const certificationModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM certifications ORDER BY display_order ASC, id ASC"
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.execute("SELECT * FROM certifications WHERE id = ?", [id]);
    return rows[0];
  },

  getNextDisplayOrder: async () => {
    const [rows] = await pool.execute(
      "SELECT MAX(display_order) as maxOrder FROM certifications"
    );
    return (rows[0].maxOrder || 0) + 1;
  },

  create: async (data) => {
    const nextOrder = await certificationModel.getNextDisplayOrder();
    const [result] = await pool.execute(
      `INSERT INTO certifications (title, issuer, date, logo, credential_url, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.issuer || '',
        data.date || '',
        data.logo || '',
        data.credentialUrl || data.credential_url || '',
        nextOrder
      ]
    );
    return {
      id: result.insertId,
      ...data,
      display_order: nextOrder
    };
  },

  update: async (id, data) => {
    await safeUpdate("certifications", id, data, {
      title: "title",
      issuer: "issuer",
      date: "date",
      logo: "logo",
      credentialUrl: "credential_url",
      credential_url: "credential_url",
      displayOrder: "display_order",
      display_order: "display_order"
    });
    return certificationModel.getById(id);
  },

  delete: async (id) => {
    const [result] = await pool.execute(
      "DELETE FROM certifications WHERE id = ?",
      [id]
    );
    return result;
  },

  moveUp: async (id) => {
    const [current] = await pool.execute(
      "SELECT display_order FROM certifications WHERE id = ?",
      [id]
    );
    if (!current || current.length === 0) return null;

    const currentOrder = current[0].display_order;
    const [above] = await pool.execute(
      "SELECT id, display_order FROM certifications WHERE display_order < ? ORDER BY display_order DESC LIMIT 1",
      [currentOrder]
    );

    if (above && above.length > 0) {
      await pool.execute(
        "UPDATE certifications SET display_order = ? WHERE id = ?",
        [above[0].display_order, id]
      );
      await pool.execute(
        "UPDATE certifications SET display_order = ? WHERE id = ?",
        [currentOrder, above[0].id]
      );
    }
  },

  moveDown: async (id) => {
    const [current] = await pool.execute(
      "SELECT display_order FROM certifications WHERE id = ?",
      [id]
    );
    if (!current || current.length === 0) return null;

    const currentOrder = current[0].display_order;
    const [below] = await pool.execute(
      "SELECT id, display_order FROM certifications WHERE display_order > ? ORDER BY display_order ASC LIMIT 1",
      [currentOrder]
    );

    if (below && below.length > 0) {
      await pool.execute(
        "UPDATE certifications SET display_order = ? WHERE id = ?",
        [below[0].display_order, id]
      );
      await pool.execute(
        "UPDATE certifications SET display_order = ? WHERE id = ?",
        [currentOrder, below[0].id]
      );
    }
  },

  bulkReorder: async (orderedIds) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (let i = 0; i < orderedIds.length; i++) {
        await connection.execute("UPDATE certifications SET display_order = ? WHERE id = ?", [i, orderedIds[i]]);
      }
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  deleteAll: async () => {
    const [result] = await pool.execute("DELETE FROM certifications");
    return result;
  }
};

module.exports = certificationModel;
