const transporter = require('../config/nodemailer');
const { dbOperations } = require('../config/database');

async function sendContactEmail(data) {
  const { fullname, email, message } = data;

  // Récupérer l'email admin depuis les settings DB
  const adminEmail = await dbOperations.settings.get('admin_email') || process.env.EMAIL_USER;

  const mailOptions = {
    from: email,
    to: adminEmail,
    subject: `Nouveau message de ${fullname}`,
    html: `
      <h2>Nouveau message depuis le portfolio</h2>
      <p><strong>Nom:</strong> ${fullname}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Email envoyé par ${email}`);
}

module.exports = {
  sendContactEmail
};
