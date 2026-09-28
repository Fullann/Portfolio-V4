const crypto = require('crypto');
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { dbOperations } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { escapeHtml } = require('../utils/sanitize');

exports.nextcloudLogin = catchAsync(async (req, res, next) => {
  const { NEXTCLOUD_URL, NEXTCLOUD_CLIENT_ID } = process.env;
  if (!NEXTCLOUD_URL || !NEXTCLOUD_CLIENT_ID) {
    return next(new AppError('Configuration Nextcloud manquante (URL ou CLIENT_ID)', 500));
  }

  // Forcer HTTPS en production (contourne les soucis de reverse proxy cPanel)
  const protocol = (req.hostname === 'localhost' || req.hostname === '127.0.0.1') ? 'http' : 'https';
  const base = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : `${protocol}://${req.get('host')}`;
  const redirectUri = `${base}/api/auth/nextcloud/callback`;

  // Générer un state CSRF aléatoire (obligatoire dans l'application OAuth2 Nextcloud)
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: protocol === 'https',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  // URL d'autorisation OAuth2 Nextcloud avec paramètre state
  const authUrl = `${NEXTCLOUD_URL}/apps/oauth2/authorize?response_type=code&client_id=${NEXTCLOUD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  res.redirect(authUrl);
});

exports.nextcloudCallback = catchAsync(async (req, res, next) => {
  const { code, state, error } = req.query;
  const { NEXTCLOUD_URL, NEXTCLOUD_CLIENT_ID, NEXTCLOUD_CLIENT_SECRET, NEXTCLOUD_ADMIN_USER } = process.env;
  
  const savedState = req.cookies ? req.cookies.oauth_state : null;
  res.clearCookie('oauth_state');

  if (error || !code || (savedState && state !== savedState)) {
    return res.redirect('/admin?error=access_denied');
  }

  const protocol = (req.hostname === 'localhost' || req.hostname === '127.0.0.1') ? 'http' : 'https';
  const base = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : `${protocol}://${req.get('host')}`;
  const redirectUri = `${base}/api/auth/nextcloud/callback`;

  try {
    // 1. Échanger le code contre un token d'accès
    const tokenResponse = await axios.post(`${NEXTCLOUD_URL}/apps/oauth2/api/v1/token`, {
      grant_type: 'authorization_code',
      code,
      client_id: NEXTCLOUD_CLIENT_ID,
      client_secret: NEXTCLOUD_CLIENT_SECRET,
      redirect_uri: redirectUri
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    // 2. Récupérer les informations de l'utilisateur
    const userResponse = await axios.get(`${NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'OCS-APIRequest': 'true'
      }
    });
    
    const nextcloudUserId = userResponse.data.ocs.data.id;
    
    // 3. Vérifier l'autorisation
    if (NEXTCLOUD_ADMIN_USER && nextcloudUserId !== NEXTCLOUD_ADMIN_USER) {
      return res.redirect('/admin?error=unauthorized_user');
    }
    
    // Générer le JWT pour le portfolio
    // On associe l'utilisateur Nextcloud à l'id 1 du système (Admin principal)
    const token = jwt.sign(
      { username: nextcloudUserId, id: 1 },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Stocker le JWT dans un cookie HttpOnly (jamais exposé dans l'URL)
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: protocol === 'https',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24h
    });

    // Rediriger vers le dashboard admin (sans token dans l'URL)
    res.redirect('/admin');
  } catch (err) {
    console.error('Erreur OAuth2 Nextcloud:', err.response ? err.response.data : err.message);
    res.redirect('/admin?error=oauth_failed');
  }
});

exports.sendEmail = catchAsync(async (req, res, _next) => {
  const { fullname, email, message } = req.body;

  const settingsEmail = await dbOperations.settings.get('admin_email');
  const personalInfo = await dbOperations.personalInfo.get();
  const adminEmail = (settingsEmail && settingsEmail.trim()) || process.env.EMAIL_USER || (personalInfo && personalInfo.email) || 'contact@fullann.ch';

  const hasSmtpConfig = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  if (!hasSmtpConfig) {
    console.log('📧 [MODE SANS SMTP / DEV] Nouveau message reçu depuis le formulaire :');
    console.log(`   De          : ${fullname} <${email}>`);
    console.log(`   Destinataire : ${adminEmail}`);
    console.log(`   Message     : ${message}`);

    return res.json({
      success: true,
      message: 'Message reçu avec succès ! (Note : configurez EMAIL_USER et EMAIL_PASS dans .env pour l\'envoi SMTP réel en production)'
    });
  }

  const transporter = require('../config/nodemailer');
  const mailOptions = {
    from: `"${escapeHtml(fullname)}" <${process.env.EMAIL_USER}>`,
    replyTo: email,
    to: adminEmail,
    subject: `Nouveau message de ${escapeHtml(fullname)}`,
    html: `
      <h2>Nouveau message depuis le portfolio</h2>
      <p><strong>Nom:</strong> ${escapeHtml(fullname)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message)}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: 'Email envoyé avec succès' });
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'email SMTP:', err);
    return res.status(500).json({
      error: 'Échec de l\'envoi de l\'email via le serveur SMTP',
      details: err.message
    });
  }
});
