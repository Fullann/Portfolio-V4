const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { dbOperations } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { escapeHtml } = require('../utils/sanitize');

exports.login = async (req, res) => {
  try {
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
      res.status(401).json({ error: 'Identifiants invalides' });
    }
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.sendEmail = async (req, res) => {
  try {
    const { fullname, email, message } = req.body;
    const transporter = require('../config/nodemailer');

    // Récupérer l'email admin depuis les settings DB
    const adminEmail = await dbOperations.settings.get('admin_email') || process.env.EMAIL_USER;

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
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
};
