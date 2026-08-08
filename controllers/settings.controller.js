const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');

// Liste des clés autorisées (whitelist)
const ALLOWED_KEYS = [
  'site_name',
  'site_description',
  'site_author',
  'base_url',
  'admin_email',
  'hcaptcha_sitekey',
  'hcaptcha_secret',
];

// Clés sensibles masquées dans les réponses GET
const SENSITIVE_KEYS = ['hcaptcha_secret'];

exports.getSettings = catchAsync(async (req, res, next) => {
  const settings = await dbOperations.settings.getAll();

  // Masquer les clés sensibles
  const safeSettings = { ...settings };
  for (const key of SENSITIVE_KEYS) {
    if (safeSettings[key]) {
      safeSettings[key] = '••••••••';
    }
  }

  res.json(safeSettings);
});

exports.updateSettings = catchAsync(async (req, res, next) => {
  const updates = req.body;

  if (!updates || typeof updates !== 'object') {
    return next(new AppError('Données invalides', 400));
  }

  // Filtrer uniquement les clés autorisées
  const filteredUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (ALLOWED_KEYS.includes(key)) {
      // Ne pas écraser un secret si la valeur est le masque
      if (SENSITIVE_KEYS.includes(key) && value === '••••••••') {
        continue;
      }
      filteredUpdates[key] = value;
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return next(new AppError('Aucun paramètre valide à mettre à jour', 400));
  }

  await dbOperations.settings.setBulk(filteredUpdates);

  console.log(`✅ Settings mis à jour: ${Object.keys(filteredUpdates).join(', ')}`);

  res.json({
    success: true,
    message: 'Paramètres mis à jour avec succès',
    updated: Object.keys(filteredUpdates)
  });
});

// Route publique : retourner uniquement la sitekey hCaptcha (pas le secret)
exports.getHcaptchaSitekey = catchAsync(async (req, res, next) => {
  const sitekey = await dbOperations.settings.get('hcaptcha_sitekey');
  res.json({ sitekey: sitekey || '' });
});
