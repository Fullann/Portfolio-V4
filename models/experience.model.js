const { pool, safeUpdate } = require('../config/dbPool');

const experienceModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM experience ORDER BY display_order ASC, id ASC"
    );
    return rows;
  },
  getById: async (id) => {
    const [rows] = await pool.execute(
      "SELECT * FROM experience WHERE id = ?",
      [id]
    );
    return rows[0];
  },
  getNextDisplayOrder: async () => {
    const [rows] = await pool.execute(
      "SELECT MAX(display_order) as maxOrder FROM experience"
    );
    return (rows[0].maxOrder || 0) + 1;
  },
  create: async (data) => {
    const nextOrder = await experienceModel.getNextDisplayOrder();
    const [result] = await pool.execute(
      `INSERT INTO experience (position, period, description, display_order)
       VALUES (?, ?, ?, ?)`,
      [data.position, data.period, data.description, nextOrder]
    );
    return { id: result.insertId, ...data, display_order: nextOrder };
  },
  update: async (id, data) => {
    await safeUpdate("experience", id, data, {
      position: "position",
      period: "period",
      description: "description",
      displayOrder: "display_order",
      display_order: "display_order"
    });
    return experienceModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute(
      "DELETE FROM experience WHERE id = ?",
      [id]
    );
    return result;
  },
  reorder: async (id, direction) => {
    const [current] = await pool.execute(
      "SELECT display_order FROM experience WHERE id = ?",
      [id]
    );
    if (!current || current.length === 0) return null;

    const currentOrder = current[0].display_order;

    if (direction === "up") {
      const [above] = await pool.execute(
        "SELECT id, display_order FROM experience WHERE display_order < ? ORDER BY display_order DESC LIMIT 1",
        [currentOrder]
      );
      if (above && above.length > 0) {
        await pool.execute(
          "UPDATE experience SET display_order = ? WHERE id = ?",
          [above[0].display_order, id]
        );
        await pool.execute(
          "UPDATE experience SET display_order = ? WHERE id = ?",
          [currentOrder, above[0].id]
        );
      }
    } else if (direction === "down") {
      const [below] = await pool.execute(
        "SELECT id, display_order FROM experience WHERE display_order > ? ORDER BY display_order ASC LIMIT 1",
        [currentOrder]
      );
      if (below && below.length > 0) {
        await pool.execute(
          "UPDATE experience SET display_order = ? WHERE id = ?",
          [below[0].display_order, id]
        );
        await pool.execute(
          "UPDATE experience SET display_order = ? WHERE id = ?",
          [currentOrder, below[0].id]
        );
      }
    }
  },
  bulkReorder: async (orderedIds) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (let i = 0; i < orderedIds.length; i++) {
        await connection.execute("UPDATE experience SET display_order = ? WHERE id = ?", [i, orderedIds[i]]);
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
    const [result] = await pool.execute("DELETE FROM experience");
    return result;
  }
};

module.exports = experienceModel;
