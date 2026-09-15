const axios = require('axios');
const { dbOperations } = require('../config/database');

// Middleware de vérification hCaptcha
const verifyHcaptcha = async (req, res, next) => {
  try {
    // Récupérer la clé secrète depuis la base de données ou les variables d'environnement
    const secret = (await dbOperations.settings.get('hcaptcha_secret')) || process.env.HCAPTCHA_SECRET;

    if (!secret) {
      console.warn('⚠️ Clé secrète hCaptcha non configurée, vérification ignorée');
      return next();
    }

    const token = req.body['h-captcha-response'];
    if (!token) {
      return res.status(400).json({
        error: 'CAPTCHA manquant. Veuillez cocher le captcha et réessayer.'
      });
    }

    const response = await axios.post(
      'https://api.hcaptcha.com/siteverify',
      new URLSearchParams({
        secret: secret,
        response: token,
        remoteip: req.ip
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { success, 'error-codes': errorCodes } = response.data;

    if (!success) {
      console.error('Erreur hCaptcha:', errorCodes);
      return res.status(400).json({
        error: 'Vérification CAPTCHA échouée. Veuillez réessayer.'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur lors de la vérification hCaptcha:', error);
    return res.status(500).json({
      error: 'Erreur de vérification CAPTCHA'
    });
  }
};

module.exports = { verifyHcaptcha };
