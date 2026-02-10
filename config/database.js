require('dotenv').config();
const { dbOperations, initializeDatabase, pool } = require('../mysql-db');

module.exports = {
  dbOperations,
  initializeDatabase,
  pool
};