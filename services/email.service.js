const transporter = require('../config/nodemailer');

async function sendContactEmail(data) {
  const { fullname, email, message, recaptchaScore } = data;

  const mailOptions = {
    from: email,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `Nouveau message de ${fullname}`,
    html: `
      <h2>Nouveau message depuis le portfolio</h2>
      <p><strong>Nom:</strong> ${fullname}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <hr>
      <p><small>Score reCAPTCHA: ${recaptchaScore || 'N/A'}</small></p>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Email envoyé par ${email}`);
}

module.exports = {
  sendContactEmail
};
