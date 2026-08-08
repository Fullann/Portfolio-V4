const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { dbOperations } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { escapeHtml } = require('../utils/sanitize');

exports.login = catchAsync(async (req, res, next) => {
  // Optionnel: fallback vers login classique
  const { username, password } = req.body;
  const admin = await dbOperations.admin.getByUsername(username);

  if (admin && (await bcrypt.compare(password, admin.password))) {
    const token = jwt.sign(
      { username: admin.username, id: admin.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, message: 'Connexion réussie' });
  } else {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return next(new AppError('Identifiants invalides', 401));
  }
});

exports.nextcloudLogin = catchAsync(async (req, res, next) => {
  const { NEXTCLOUD_URL, NEXTCLOUD_CLIENT_ID } = process.env;
  if (!NEXTCLOUD_URL || !NEXTCLOUD_CLIENT_ID) {
    return next(new AppError('Configuration Nextcloud manquante (URL ou CLIENT_ID)', 500));
  }

  // URL de redirection enregistrée dans Nextcloud
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/nextcloud/callback`;
  
  // URL d'autorisation OAuth2 Nextcloud
  const authUrl = `${NEXTCLOUD_URL}/apps/oauth2/authorize?response_type=code&client_id=${NEXTCLOUD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  res.redirect(authUrl);
});

exports.nextcloudCallback = catchAsync(async (req, res, next) => {
  const { code, error } = req.query;
  const { NEXTCLOUD_URL, NEXTCLOUD_CLIENT_ID, NEXTCLOUD_CLIENT_SECRET, NEXTCLOUD_ADMIN_USER } = process.env;
  
  if (error || !code) {
    return res.redirect('/admin?error=access_denied');
  }

  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/nextcloud/callback`;

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
    
    // 4. Générer le JWT pour le portfolio
    // On associe l'utilisateur Nextcloud à l'id 1 du système (Admin principal)
    const token = jwt.sign(
      { username: nextcloudUserId, id: 1 },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Rediriger vers le dashboard admin avec le token
    res.redirect(`/admin?token=${token}`);
  } catch (err) {
    console.error('Erreur OAuth2 Nextcloud:', err.response ? err.response.data : err.message);
    res.redirect('/admin?error=oauth_failed');
  }
});

exports.sendEmail = catchAsync(async (req, res, next) => {
  const { fullname, email, message } = req.body;
  const transporter = require('../config/nodemailer');

  const adminEmail = (await dbOperations.settings.get('admin_email')) || process.env.EMAIL_USER;

  const mailOptions = {
    from: email,
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

  await transporter.sendMail(mailOptions);
  res.json({ success: true, message: 'Email envoyé avec succès' });
});
