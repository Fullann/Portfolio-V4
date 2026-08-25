const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { dbOperations } = require('../config/database');

exports.getLanguages = catchAsync(async (req, res, next) => {
  const languages = await dbOperations.i18n.getActiveLanguages();
  res.json(languages);
});

exports.getAllLanguages = catchAsync(async (req, res, next) => {
  const languages = await dbOperations.i18n.getAllLanguages();
  res.json(languages);
});

exports.addLanguage = catchAsync(async (req, res, next) => {
  const { code, name, flag } = req.body;
  if (!code || !name || !flag) {
    return res.status(400).json({ error: "Code, name and flag are required" });
  }
  await dbOperations.i18n.addLanguage({ code, name, flag });
  res.status(201).json({ success: true });
});

exports.getTranslations = catchAsync(async (req, res, next) => {
  const { lang } = req.params;
  const translations = await dbOperations.i18n.getTranslations(lang);
  res.json(translations);
});

exports.updateTranslations = catchAsync(async (req, res, next) => {
  const { lang } = req.params;
  const translationsObj = req.body;

  if (!translationsObj || typeof translationsObj !== 'object') {
    return next(new AppError('Données de traduction invalides', 400));
  }

  const updated = await dbOperations.i18n.updateTranslations(lang, translationsObj);
  res.json({ success: true, translations: updated });
});

exports.toggleLanguage = catchAsync(async (req, res, next) => {
  const { code, isActive } = req.body;
  if (!code) {
    return next(new AppError('Code langue requis', 400));
  }

  const languages = await dbOperations.i18n.toggleLanguageActive(code, Boolean(isActive));
  res.json({ success: true, languages });
});
