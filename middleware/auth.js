const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { dbOperations } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise';

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Créer l'utilisateur admin au démarrage
async function createAdminUser() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existingAdmin = await dbOperations.admin.getByUsername(adminUsername);

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await dbOperations.admin.create({
        username: adminUsername,
        password: hashedPassword
      });
      console.log(`✅ Utilisateur admin créé: ${adminUsername}`);
    } else {
      console.log(`ℹ️ Utilisateur admin existe déjà: ${adminUsername}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur admin:', error);
  }
}

module.exports = {
  authenticateToken,
  createAdminUser,
  JWT_SECRET
};
