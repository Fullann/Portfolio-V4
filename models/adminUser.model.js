const { pool, safeUpdate } = require('../config/dbPool');

const adminUserModel = {
  getAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM admin_users ORDER BY created_at DESC"
    );
    return rows;
  },
  getById: async (id) => {
    const [rows] = await pool.execute(
      "SELECT * FROM admin_users WHERE id = ?",
      [id]
    );
    return rows[0];
  },
  getByUsername: async (username) => {
    const [rows] = await pool.execute(
      "SELECT * FROM admin_users WHERE username = ?",
      [username]
    );
    return rows[0];
  },
  create: async (data) => {
    const [result] = await pool.execute(
      `INSERT INTO admin_users (username, password)
       VALUES (?, ?)`,
      [data.username, data.password]
    );
    return { id: result.insertId, username: data.username };
  },
  update: async (id, data) => {
    await safeUpdate("admin_users", id, data, {
      username: "username",
      password: "password"
    });
    return adminUserModel.getById(id);
  },
  delete: async (id) => {
    const [result] = await pool.execute(
      "DELETE FROM admin_users WHERE id = ?",
      [id]
    );
    return result;
  },
  updatePassword: async (username, newPassword) => {
    const [result] = await pool.execute(
      `UPDATE admin_users SET password = ? WHERE username = ?`,
      [newPassword, username]
    );
    return result;
  }
};

module.exports = adminUserModel;
