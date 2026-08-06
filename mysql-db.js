// Pont de compatibilité vers la nouvelle architecture modulaire (config/database.js)
const database = require('./config/database');

module.exports = {
  dbOperations: database.dbOperations,
  initializeDatabase: database.initializeDatabase,
  pool: database.pool,
  safeUpdate: database.safeUpdate
};
