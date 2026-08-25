const { dbOperations } = require('../config/database');

const auditLogger = async (req, res, next) => {
  // On ne loggue que les requêtes de modification (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Intercepter la réponse pour savoir si l'action a réussi
    const originalSend = res.send;
    res.send = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Enregistrer l'action
        const userId = req.user?.id || null; // Supposant que req.user est set par le middleware d'auth
        const action = req.method;
        const target = req.originalUrl;
        
        // Nettoyer les données sensibles (comme les mots de passe) avant de logguer
        const detailsObj = { ...req.body };
        if (detailsObj.password) detailsObj.password = '***';
        if (detailsObj.oldPassword) detailsObj.oldPassword = '***';
        if (detailsObj.newPassword) detailsObj.newPassword = '***';
        
        const details = JSON.stringify(detailsObj);
        const ip = req.ip || req.connection.remoteAddress;

        dbOperations.auditLogs.log(userId, action, target, details, ip);
      }
      return originalSend.apply(this, arguments);
    };
  }
  next();
};

module.exports = auditLogger;
