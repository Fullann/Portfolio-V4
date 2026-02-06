const axios = require('axios');

// Middleware de vérification reCAPTCHA
const verifyRecaptcha = async (req, res, next) => {
  const token = req.body['g-recaptcha-response'];
  
  if (!token) {
    return res.status(400).json({
      error: 'CAPTCHA manquant. Veuillez réessayer.'
    });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
          remoteip: req.ip
        }
      }
    );

    const { success, score, 'error-codes': errorCodes } = response.data;

    // reCAPTCHA v3 retourne un score entre 0.0 et 1.0
    // 0.0 = très probablement un bot, 1.0 = très probablement humain
    const MINIMUM_SCORE = 0.5;

    if (!success) {
      console.error('Erreur reCAPTCHA:', errorCodes);
      return res.status(400).json({
        error: 'Vérification CAPTCHA échouée. Veuillez réessayer.'
      });
    }

    if (score < MINIMUM_SCORE) {
      console.warn(`Score reCAPTCHA trop bas: ${score} (IP: ${req.ip})`);
      return res.status(403).json({
        error: 'Activité suspecte détectée. Veuillez réessayer plus tard.'
      });
    }

    // Ajouter le score au req pour logging
    req.recaptchaScore = score;
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification reCAPTCHA:', error);
    return res.status(500).json({
      error: 'Erreur de vérification CAPTCHA'
    });
  }
};

module.exports = { verifyRecaptcha };
