const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginLimiter, emailLimiter } = require('../middleware/rateLimiter');
const { validate, loginSchema, emailSchema } = require('../validation/schemas');
const { verifyHcaptcha } = require('../middleware/hcaptcha');

router.post('/login', loginLimiter, validate(loginSchema), authController.login);

router.post('/send-email', emailLimiter, validate(emailSchema), verifyHcaptcha, authController.sendEmail);

module.exports = router;
