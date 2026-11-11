const transporter = require('../config/nodemailer');
const { dbOperations } = require('../config/database');
const { escapeHtml } = require('../utils/sanitize');

async function sendContactEmail(data) {
  const { fullname, email, message } = data;

  // Récupérer l'email admin depuis les settings DB
  const adminEmail = await dbOperations.settings.get('admin_email') || process.env.EMAIL_USER;

  const mailOptions = {
    from: `"${escapeHtml(fullname)}" <${process.env.EMAIL_USER || email}>`,
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

  await transporter.sendMail(mailOptions);
  console.log(`✅ Email envoyé par ${email}`);
}

module.exports = {
  sendContactEmail
};
