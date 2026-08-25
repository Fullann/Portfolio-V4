const jwt = require('jsonwebtoken');
const { dbOperations } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  process.exit(1);
}

// Middleware d'authentification
// Accepte le JWT depuis :
//   1. Le cookie HttpOnly `admin_token` (flux OAuth2 Nextcloud)
//   2. L'entête Authorization: Bearer <token> (appels API admin.js)
const authenticateToken = (req, res, next) => {
  // Priorité au cookie HttpOnly (plus sécurisé)
  const tokenFromCookie = req.cookies && req.cookies['admin_token'];
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken,
  JWT_SECRET
};
