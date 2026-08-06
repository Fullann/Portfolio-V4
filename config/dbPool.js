const mysql = require("mysql2/promise");
require("dotenv").config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "portfolio",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Pool de connexions
const pool = mysql.createPool(dbConfig);

// Helper universel pour sécuriser les requêtes UPDATE dynamiques (liste blanche)
async function safeUpdate(tableName, id, data, allowedFieldsMap, idColumn = "id") {
  if (id === undefined || id === null || id === "undefined" || id === "null") return;
  const fields = [];
  const values = [];

  for (const [jsKey, dbColumn] of Object.entries(allowedFieldsMap)) {
    if (data[jsKey] !== undefined) {
      fields.push(`${dbColumn} = ?`);
      values.push(data[jsKey]);
    }
  }

  if (fields.length === 0) return;

  values.push(id);
  await pool.execute(
    `UPDATE ${tableName} SET ${fields.join(", ")} WHERE ${idColumn} = ?`,
    values
  );
}

module.exports = { pool, safeUpdate };
