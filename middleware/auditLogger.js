const { dbOperations } = require('../config/database');

const PUBLIC_WRITE_PATHS = [
  '/api/analytics/track',
  '/api/auth/send-email'
];

const auditLogger = async (req, res, next) => {
  const targetUrl = (req.originalUrl || '').split('?')[0];
  if (PUBLIC_WRITE_PATHS.includes(targetUrl)) {
    return next();
  }

  // On ne loggue que les requêtes de modification (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Intercepter la réponse pour savoir si l'action a réussi
    const originalSend = res.send;
    res.send = function (_body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Enregistrer l'action
        const userId = req.user?.id || null;
        const action = req.method;
        const target = req.originalUrl;
        
        // Nettoyer les données sensibles avant de logguer
        const detailsObj = { ...req.body };
        if (detailsObj.password) detailsObj.password = '***';
        if (detailsObj.oldPassword) detailsObj.oldPassword = '***';
        if (detailsObj.newPassword) detailsObj.newPassword = '***';
        if (detailsObj.hcaptcha_secret) detailsObj.hcaptcha_secret = '***';
        
        const details = JSON.stringify(detailsObj);
        const ip = req.ip || req.connection?.remoteAddress;

        dbOperations.auditLogs.log(userId, action, target, details, ip);
      }
      return originalSend.apply(this, arguments);
    };
  }
  next();
};

module.exports = auditLogger;
