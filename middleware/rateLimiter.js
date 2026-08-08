const rateLimit = require('express-rate-limit');

// Rate limiter strict pour le login (5 tentatives / 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Compter même les tentatives réussies
});

// Rate limiter pour l'envoi d'emails (3 emails / 10 minutes)
const emailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: {
    error: 'Trop d\'emails envoyés. Réessayez dans 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de tentatives d\'envoi d\'email',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter général pour l'API (500 requêtes / 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: (req) => process.env.NODE_ENV === 'test',
  message: {
    error: 'Trop de requêtes. Veuillez ralentir.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  emailLimiter,
  generalLimiter
};
